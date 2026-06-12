import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PromoCodeRedemption } from '../entities/promo-code-redemption.entity.js';

export class RedemptionResponseDto {
  @ApiProperty({ example: 'e5f6a7b8-c9d0-1234-efab-345678901234' })
  id: string;

  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  promoCodeId: string;

  @ApiPropertyOptional({ example: 'SPRING26', nullable: true })
  code: string | null;

  @ApiPropertyOptional({ nullable: true })
  orderId: string | null;

  @ApiPropertyOptional({ example: 'ORD-2041', nullable: true })
  orderNumber: string | null;

  @ApiPropertyOptional({ nullable: true })
  customerId: string | null;

  @ApiPropertyOptional({ example: 'Grupo Sabores', nullable: true })
  customerName: string | null;

  @ApiProperty({ example: 184 })
  discountAmount: number;

  @ApiProperty({ example: false })
  isFreeDelivery: boolean;

  @ApiProperty()
  appliedAt: Date;

  static fromEntity(redemption: PromoCodeRedemption): RedemptionResponseDto {
    const redemptionResponse = new RedemptionResponseDto();
    redemptionResponse.id = redemption.id;
    redemptionResponse.promoCodeId = redemption.promoCodeId;
    redemptionResponse.code = redemption.promoCode?.code ?? null;
    redemptionResponse.orderId = redemption.orderId;
    redemptionResponse.orderNumber = redemption.order?.orderNumber ?? null;
    redemptionResponse.customerId = redemption.customerId;
    redemptionResponse.customerName = redemption.customer?.name ?? null;
    redemptionResponse.discountAmount = Number(redemption.discountAmount);
    redemptionResponse.isFreeDelivery = redemption.isFreeDelivery;
    redemptionResponse.appliedAt = redemption.appliedAt;
    return redemptionResponse;
  }
}
