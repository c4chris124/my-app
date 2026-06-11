import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity.js';
import { SessionRevokeReason } from './auth.enums.js';

/**
 * Durable audit/history mirror of a session. Redis remains authoritative for
 * liveness; this row is the public handle (`id`) and the publicId ↔ Redis
 * (`sessionIdHash`) mapping used by the device-management endpoints.
 */
@Entity('user_sessions')
@Index('idx_user_sessions_active', ['userId'], {
  where: '"revoked_at" IS NULL',
})
export class UserSession {
  /** Public, opaque handle exposed to the device API — never the secret. */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** sha256(rawSessionId) — links this row to the Redis `sess:{h}` key. */
  @Index('idx_user_sessions_sid_hash', { unique: true })
  @Column({ type: 'char', length: 64 })
  sessionIdHash: string;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, (u) => u.sessions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  /** `users.session_version` snapshot at creation time. */
  @Column({ type: 'int' })
  sessionVersion: number;

  /** Originating storefront: 'ecommerce' | 'crm'. */
  @Column({ type: 'varchar', length: 20 })
  domain: string;

  @Column({ type: 'inet', nullable: true })
  ipCreated: string | null;

  @Column({ type: 'inet', nullable: true })
  ipLastSeen: string | null;

  @Column({ type: 'varchar', length: 512, nullable: true })
  userAgent: string | null;

  @Column({ type: 'char', length: 64, nullable: true })
  deviceHash: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  deviceLabel: string | null;

  @Column({ type: 'timestamptz' })
  createdAt: Date;

  /** Throttled write-back from Redis (≥ SESSION_TOUCH_INTERVAL). */
  @Column({ type: 'timestamptz' })
  lastSeenAt: Date;

  @Column({ type: 'timestamptz' })
  absoluteExpiresAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  revokedAt: Date | null;

  @Column({ type: 'enum', enum: SessionRevokeReason, nullable: true })
  revokeReason: SessionRevokeReason | null;
}
