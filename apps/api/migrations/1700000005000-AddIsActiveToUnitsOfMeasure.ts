import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIsActiveToUnitsOfMeasure1700000005000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "units_of_measure"
        ADD COLUMN IF NOT EXISTS "is_active" boolean NOT NULL DEFAULT true
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "units_of_measure" DROP COLUMN IF EXISTS "is_active"
    `);
  }
}
