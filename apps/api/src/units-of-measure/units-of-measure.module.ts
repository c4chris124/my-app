import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UnitOfMeasure } from './entities/unit-of-measure.entity.js';
import { UnitsMeasureFindRepository } from './repository/units-mesure-find.repository.js';
import { UnitsMeasureCreateRepository } from './repository/units-mesure-create.repository.js';
import { UnitsMeasureUpdateRepository } from './repository/units-mesure-update.repository.js';
import { UnitsMeasureDeleteRepository } from './repository/units-mesure-delete.repository.js';
import { UnitsOfMeasureService } from './units-of-measure.service.js';
import { UnitsOfMeasureController } from './units-of-measure.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([UnitOfMeasure])],
  controllers: [UnitsOfMeasureController],
  providers: [
    UnitsMeasureFindRepository,
    UnitsMeasureCreateRepository,
    UnitsMeasureUpdateRepository,
    UnitsMeasureDeleteRepository,
    UnitsOfMeasureService,
  ],
  exports: [UnitsOfMeasureService, UnitsMeasureFindRepository],
})
export class UnitsOfMeasureModule {}
