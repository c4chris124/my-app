import {
  Global,
  Inject,
  Module,
  type OnApplicationShutdown,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';
import type { AuthConfig } from '../config/auth.config.js';
import { REDIS_CLIENT } from './redis.constants.js';
import type { SessionRedis } from './redis.types.js';
import {
  CREATE_SESSION,
  VALIDATE_AND_TOUCH,
  REVOKE_ONE,
  REVOKE_OTHERS,
  REVOKE_ALL,
} from './lua/session-scripts.js';

/**
 * Registers the session Lua scripts on a fresh ioredis client. Each becomes a
 * method on the client instance (see `SessionRedis`).
 */
function defineSessionCommands(client: Redis): void {
  client.defineCommand('createSession', {
    numberOfKeys: 2,
    lua: CREATE_SESSION,
  });
  client.defineCommand('validateAndTouch', {
    numberOfKeys: 1,
    lua: VALIDATE_AND_TOUCH,
  });
  client.defineCommand('revokeOne', { numberOfKeys: 2, lua: REVOKE_ONE });
  client.defineCommand('revokeOthers', { numberOfKeys: 1, lua: REVOKE_OTHERS });
  client.defineCommand('revokeAll', { numberOfKeys: 1, lua: REVOKE_ALL });
}

/**
 * Global Redis provider: a single shared ioredis connection with the session
 * Lua commands registered. Exposed via the `REDIS_CLIENT` token (typed as
 * `SessionRedis`). Closed on application shutdown.
 */
@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService): SessionRedis => {
        const logger = new Logger('RedisModule');
        const auth = config.getOrThrow<AuthConfig>('auth');
        const client = new Redis(auth.redis.url, {
          lazyConnect: false,
          maxRetriesPerRequest: 3,
          enableReadyCheck: true,
        });
        client.on('error', (err) =>
          logger.error(`Redis error: ${err.message}`),
        );
        client.on('connect', () => logger.log('Redis connected'));
        defineSessionCommands(client);
        return client as SessionRedis;
      },
    },
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule implements OnApplicationShutdown {
  constructor(@Inject(REDIS_CLIENT) private readonly client: SessionRedis) {}

  async onApplicationShutdown(): Promise<void> {
    await this.client.quit();
  }
}
