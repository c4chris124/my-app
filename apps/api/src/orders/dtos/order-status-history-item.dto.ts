import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OrderStatusKind } from '@myapp/shared';
import { OrderStatusHistory } from '../entities/order-status-history.entity.js';

export class OrderStatusHistoryItemDto {
  @ApiProperty({ example: 'e5f6a7b8-c9d0-1234-efab-345678901234' })
  id: string;

  @ApiProperty({ enum: OrderStatusKind })
  statusKind: OrderStatusKind;

  @ApiPropertyOptional({
    nullable: true,
    example: null,
    description: 'Null on the initial entry written at checkout',
  })
  fromStatus: string | null;

  @ApiProperty({ example: 'PENDING' })
  toStatus: string;

  @ApiPropertyOptional({ nullable: true })
  note: string | null;

  @ApiPropertyOptional({
    nullable: true,
    description: 'Staff user who made the change; null for system entries',
  })
  changedById: string | null;

  @ApiProperty()
  changedAt: Date;

  static fromEntity(entry: OrderStatusHistory): OrderStatusHistoryItemDto {
    const historyItem = new OrderStatusHistoryItemDto();
    historyItem.id = entry.id;
    historyItem.statusKind = entry.statusKind;
    historyItem.fromStatus = entry.fromStatus;
    historyItem.toStatus = entry.toStatus;
    historyItem.note = entry.note;
    historyItem.changedById = entry.changedById;
    historyItem.changedAt = entry.changedAt;
    return historyItem;
  }
}
