import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity.js';

/**
 * Durable known-device registry for new-device detection. Kept in Postgres so a
 * Redis flush never triggers false "new device" alerts.
 */
@Entity('user_known_devices')
@Index('idx_known_device_unique', ['userId', 'deviceHash'], { unique: true })
export class UserKnownDevice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, (u) => u.knownDevices, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  /** sha256(normalized UA + platform [+ device cookie]). */
  @Column({ type: 'char', length: 64 })
  deviceHash: string;

  @Column({ type: 'varchar', length: 120, nullable: true })
  label: string | null;

  @Column({ type: 'timestamptz' })
  firstSeenAt: Date;

  @Column({ type: 'timestamptz' })
  lastSeenAt: Date;

  @Column({ type: 'boolean', default: false })
  trusted: boolean;
}
