import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createHash } from 'node:crypto';
import { UAParser } from 'ua-parser-js';
import { UserKnownDevice } from '../entities/user-known-device.entity.js';

export interface DeviceInfo {
  /** sha256(normalized UA + platform) — stable per browser/OS. */
  deviceHash: string;
  /** Human label, e.g. "Chrome on macOS". */
  label: string;
}

/**
 * Derives a stable-ish device fingerprint from the User-Agent and maintains the
 * durable `user_known_devices` registry (kept in Postgres so a Redis flush can
 * never produce false "new device" alerts — ADR 0001).
 */
@Injectable()
export class DeviceService {
  constructor(
    @InjectRepository(UserKnownDevice)
    private readonly devices: Repository<UserKnownDevice>,
  ) {}

  describe(userAgent: string | null | undefined): DeviceInfo {
    const ua = (userAgent ?? '').slice(0, 512);
    const parsed = new UAParser(ua).getResult();
    const browser = parsed.browser.name ?? 'Unknown browser';
    const os = parsed.os.name ?? 'Unknown OS';
    const label = `${browser} on ${os}`.slice(0, 120);
    const deviceHash = createHash('sha256')
      .update(`${ua}|${browser}|${os}`)
      .digest('hex');
    return { deviceHash, label };
  }

  /**
   * Upsert the device for this user. Returns `isNew=true` the first time a
   * device hash is seen (drives the new-device security alert).
   */
  async touchKnownDevice(
    userId: string,
    info: DeviceInfo,
  ): Promise<{ isNew: boolean }> {
    const existing = await this.devices.findOne({
      where: { userId, deviceHash: info.deviceHash },
    });
    const now = new Date();
    if (existing) {
      await this.devices.update(
        { id: existing.id },
        { lastSeenAt: now, label: info.label },
      );
      return { isNew: false };
    }
    await this.devices.insert({
      userId,
      deviceHash: info.deviceHash,
      label: info.label,
      firstSeenAt: now,
      lastSeenAt: now,
      trusted: false,
    });
    return { isNew: true };
  }
}
