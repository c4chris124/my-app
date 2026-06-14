import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PromoCodeRedemption } from './entities/promo-code-redemption.entity.js';
import { RedemptionsFindRepository } from './repository/redemptions-find.repository.js';
import { RedemptionsCreateRepository } from './repository/redemptions-create.repository.js';
import { RedemptionsService } from './redemptions.service.js';
import { RedemptionsController } from './redemptions.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([PromoCodeRedemption])],
  controllers: [RedemptionsController],
  providers: [
    RedemptionsFindRepository,
    RedemptionsCreateRepository,
    RedemptionsService,
  ],
  // Both repositories are consumed by the pricing engine at checkout.
  exports: [RedemptionsFindRepository, RedemptionsCreateRepository],
})
export class RedemptionsModule {}
