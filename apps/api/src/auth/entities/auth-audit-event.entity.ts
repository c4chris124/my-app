import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { AuthEventType } from './auth.enums.js';

/**
 * Append-only security event log. `userId` is nullable (failed logins on an
 * unknown email) and FK-set-null on user deletion so history is retained.
 */
@Entity('auth_audit_events')
@Index('idx_audit_user_time', ['userId', 'createdAt'])
export class AuthAuditEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  userId: string | null;

  @Column({ type: 'varchar', length: 40 })
  eventType: AuthEventType;

  @Column({ type: 'inet', nullable: true })
  ip: string | null;

  @Column({ type: 'varchar', length: 512, nullable: true })
  userAgent: string | null;

  /** Structured context — must never contain raw session IDs. */
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  @CreateDateColumn()
  createdAt: Date;
}
