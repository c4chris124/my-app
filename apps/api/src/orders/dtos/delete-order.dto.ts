import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CancelOrderDto {
  @ApiPropertyOptional({ example: 'Customer requested cancellation' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

// Cancellation is a status transition to CANCELLED, never a row delete.
export class DeleteOrderDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ example: 'ORD-2041' })
  orderNumber: string;

  @ApiProperty({ example: 'Order cancelled successfully' })
  message: string;

  @ApiProperty()
  cancelledAt: Date;
}
