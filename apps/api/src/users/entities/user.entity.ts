import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserRole, UserStatus } from '@myapp/shared';
import { UserSession } from '../../auth/entities/user-session.entity.js';
import { UserKnownDevice } from '../../auth/entities/user-known-device.entity.js';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Stored lowercased by the application; unique. */
  @Index('idx_users_email', { unique: true })
  @Column({ type: 'varchar', length: 255 })
  email: string;

  /** Nullable for social-only accounts; never selected by default. */
  @Column({ type: 'varchar', length: 255, nullable: true, select: false })
  passwordHash: string | null;

  /** Google subject id; sparse-unique (partial index in the migration). */
  @Index('idx_users_google_id', {
    unique: true,
    where: '"google_id" IS NOT NULL',
  })
  @Column({ type: 'varchar', length: 255, nullable: true })
  googleId: string | null;

  @Column({ type: 'varchar', length: 150 })
  name: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  avatarUrl: string | null;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.CUSTOMER })
  role: UserRole;

  @Column({ type: 'enum', enum: UserStatus, default: UserStatus.ACTIVE })
  status: UserStatus;

  // ── Session versioning (global invalidation lever) ──
  @Column({ type: 'int', default: 0 })
  sessionVersion: number;

  @Column({ type: 'timestamptz', nullable: true })
  passwordChangedAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  emailVerifiedAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  lastLoginAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => UserSession, (s) => s.user)
  sessions: UserSession[];

  @OneToMany(() => UserKnownDevice, (d) => d.user)
  knownDevices: UserKnownDevice[];
}
