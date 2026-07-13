import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthAuditEvent } from '../entities/auth-audit-event.entity.js';
import { AuthEventType } from '../entities/auth.enums.js';

export interface AuditContext {
  userId?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown> | null;
}

/**
 * Append-only security event log. Best-effort: a failed audit write must never
 * break the auth flow, so errors are swallowed (and logged). Metadata must
 * never contain raw session IDs (ADR 0001).
 */
@Injectable()
export class AuthAuditService {
  private readonly logger = new Logger(AuthAuditService.name);

  constructor(
    @InjectRepository(AuthAuditEvent)
    private readonly events: Repository<AuthAuditEvent>,
  ) {}

  async record(
    eventType: AuthEventType,
    ctx: AuditContext = {},
  ): Promise<void> {
    try {
      await this.events.insert({
        eventType,
        userId: ctx.userId ?? null,
        ip: ctx.ip ?? null,
        userAgent: ctx.userAgent ?? null,
        // jsonb column — cast past TypeORM's deep-partial recursion.
        metadata: (ctx.metadata ?? null) as unknown as undefined,
      });
    } catch (err) {
      this.logger.warn(
        `Failed to write audit event ${eventType}: ${(err as Error).message}`,
      );
    }
  }
}
