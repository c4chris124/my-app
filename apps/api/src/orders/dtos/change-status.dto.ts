import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { FulfillmentStatus, PaymentStatus } from '@myapp/shared';

export class ChangeFulfillmentStatusDto {
  @ApiProperty({ enum: FulfillmentStatus, example: 'PROCESSING' })
  @IsEnum(FulfillmentStatus)
  status: FulfillmentStatus;

  @ApiPropertyOptional({ example: 'Picking started in warehouse 2' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

export class ChangePaymentStatusDto {
  @ApiProperty({ enum: PaymentStatus, example: 'PAID' })
  @IsEnum(PaymentStatus)
  status: PaymentStatus;

  @ApiPropertyOptional({ example: 'Wire transfer confirmed' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
