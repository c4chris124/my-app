import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

// customerId comes from the auth context (x-customer-id stub), not the body.
export class CheckoutDto {
  @ApiPropertyOptional({
    example: 'VERANO25',
    description:
      'Promo code to apply — validated by the Redemptions module (inert for now)',
  })
  @IsOptional()
  @IsString()
  promoCode?: string;

  @ApiPropertyOptional({ example: 'Entregar en bodega 3' })
  @IsOptional()
  @IsString()
  notes?: string;
}
