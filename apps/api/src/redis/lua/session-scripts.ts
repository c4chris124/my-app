/**
 * Atomic session Lua scripts (registered via `client.defineCommand`).
 *
 * Each runs as a single isolated Redis execution, eliminating the check-then-act
 * windows described in ADR 0001 (concurrent login vs. cap, touch vs. revoke,
 * etc.). The key prefixes `sess:` / `usess:` / `uver:` are duplicated here as
 * Lua string literals and MUST match `redis.constants.ts#KEY` — sibling keys are
 * reconstructed in-script from the userId/member, which is single-node only.
 */

/**
 * createSession — HSET payload, set sliding TTL, ZADD to the user index, then
 * LRU-evict any sessions over the per-user cap.
 *
 *   KEYS[1] = sess:{h}
 *   KEYS[2] = usess:{userId}
 *   ARGV[1] = now (ms)
 *   ARGV[2] = sessPexpire (ms)  — min(idleTtl, absExp-now)
 *   ARGV[3] = idxPexpire (ms)   — absolute window (keeps the index self-cleaning)
 *   ARGV[4] = maxPerUser
 *   ARGV[5] = member ({h})
 *   ARGV[6..] = hash field/value pairs
 *
 * Returns: array of evicted member hashes (possibly empty).
 */
export const CREATE_SESSION = `
local sessKey = KEYS[1]
local idxKey = KEYS[2]
local now = tonumber(ARGV[1])
local sessPexpire = tonumber(ARGV[2])
local idxPexpire = tonumber(ARGV[3])
local maxPerUser = tonumber(ARGV[4])
local member = ARGV[5]

local fields = {}
for i = 6, #ARGV do
  fields[#fields + 1] = ARGV[i]
end
redis.call('HSET', sessKey, unpack(fields))
if sessPexpire > 0 then
  redis.call('PEXPIRE', sessKey, sessPexpire)
end

redis.call('ZADD', idxKey, now, member)
if idxPexpire > 0 then
  redis.call('PEXPIRE', idxKey, idxPexpire)
end

local evicted = {}
local count = redis.call('ZCARD', idxKey)
if count > maxPerUser then
  local overflow = count - maxPerUser
  local victims = redis.call('ZRANGE', idxKey, 0, overflow - 1)
  for _, v in ipairs(victims) do
    redis.call('DEL', 'sess:' .. v)
    redis.call('ZREM', idxKey, v)
    evicted[#evicted + 1] = v
  end
end
return evicted
`;

/**
 * validateAndTouch — read the session, enforce absolute expiry + the version
 * gate, then throttled-touch (last-seen + sliding TTL) atomically.
 *
 *   KEYS[1] = sess:{h}
 *   ARGV[1] = now (ms)
 *   ARGV[2] = touchIntervalMs
 *   ARGV[3] = idlePexpire (ms)  — sliding TTL applied on every valid hit
 *   ARGV[4] = idxPexpire (ms)   — absolute window for the index
 *   ARGV[5] = member ({h})
 *   ARGV[6] = currentIp (may be '')
 *
 * Returns (first element is the status):
 *   {'NOT_FOUND'}
 *   {'EXPIRED'}
 *   {'REVOKED'}
 *   {'VERSION_UNKNOWN', userId, sver}   — caller reloads PG + repopulates uver
 *   {'VALID', touchedFlag, k1,v1, k2,v2, ...}  — flat hash payload
 */
export const VALIDATE_AND_TOUCH = `
local sessKey = KEYS[1]
local now = tonumber(ARGV[1])
local touchInterval = tonumber(ARGV[2])
local idlePexpire = tonumber(ARGV[3])
local idxPexpire = tonumber(ARGV[4])
local member = ARGV[5]
local currentIp = ARGV[6]

local data = redis.call('HGETALL', sessKey)
if #data == 0 then
  return { 'NOT_FOUND' }
end

local h = {}
for i = 1, #data, 2 do
  h[data[i]] = data[i + 1]
end

local userId = h['userId']
local idxKey = 'usess:' .. userId
local uverKey = 'uver:' .. userId

local absExp = tonumber(h['absExpAt'])
if absExp and now >= absExp then
  redis.call('DEL', sessKey)
  redis.call('ZREM', idxKey, member)
  return { 'EXPIRED' }
end

local uver = redis.call('GET', uverKey)
if not uver then
  return { 'VERSION_UNKNOWN', userId, h['sver'] }
end
if tonumber(h['sver']) ~= tonumber(uver) then
  redis.call('DEL', sessKey)
  redis.call('ZREM', idxKey, member)
  return { 'REVOKED' }
end

local lastSeen = tonumber(h['lastSeenAt']) or 0
local touched = '0'
if (now - lastSeen) >= touchInterval then
  if currentIp ~= nil and currentIp ~= '' then
    redis.call('HSET', sessKey, 'lastSeenAt', now, 'ipLast', currentIp)
  else
    redis.call('HSET', sessKey, 'lastSeenAt', now)
  end
  redis.call('ZADD', idxKey, now, member)
  touched = '1'
end

local ttl = idlePexpire
if absExp then
  local remaining = absExp - now
  if remaining < ttl then ttl = remaining end
end
if ttl > 0 then
  redis.call('PEXPIRE', sessKey, ttl)
end
if idxPexpire > 0 then
  redis.call('PEXPIRE', idxKey, idxPexpire)
end

local result = { 'VALID', touched }
for i = 1, #data, 2 do
  result[#result + 1] = data[i]
  result[#result + 1] = data[i + 1]
end
return result
`;

/**
 * revokeOne — kill a single session.
 *   KEYS[1] = sess:{h}
 *   KEYS[2] = usess:{userId}
 *   ARGV[1] = member ({h})
 * Returns: 1 if the session existed, else 0.
 */
export const REVOKE_ONE = `
local existed = redis.call('DEL', KEYS[1])
redis.call('ZREM', KEYS[2], ARGV[1])
return existed
`;

/**
 * revokeOthers — kill every session for the user except the one to keep.
 *   KEYS[1] = usess:{userId}
 *   ARGV[1] = keepMember ({h})
 * Returns: array of revoked member hashes.
 */
export const REVOKE_OTHERS = `
local idxKey = KEYS[1]
local keep = ARGV[1]
local members = redis.call('ZRANGE', idxKey, 0, -1)
local revoked = {}
for _, m in ipairs(members) do
  if m ~= keep then
    redis.call('DEL', 'sess:' .. m)
    redis.call('ZREM', idxKey, m)
    revoked[#revoked + 1] = m
  end
end
return revoked
`;

/**
 * revokeAll — kill every session for the user and drop the index.
 *   KEYS[1] = usess:{userId}
 * Returns: array of revoked member hashes.
 */
export const REVOKE_ALL = `
local idxKey = KEYS[1]
local members = redis.call('ZRANGE', idxKey, 0, -1)
for _, m in ipairs(members) do
  redis.call('DEL', 'sess:' .. m)
end
redis.call('DEL', idxKey)
return members
`;
