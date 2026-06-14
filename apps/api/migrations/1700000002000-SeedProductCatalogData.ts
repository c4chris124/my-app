import { MigrationInterface, QueryRunner } from 'typeorm';

const TOP_LEVEL_CATEGORIES = [
  ['Amasadoras', 'amasadoras'],
  ['Batidoras', 'batidoras'],
  ['Vitrinas Refrigeradas', 'vitrinas-refrigeradas'],
  ['Laminadoras', 'laminadoras'],
  ['Hornos', 'hornos'],
  ['Máquinas para Paninis', 'maquinas-para-paninis'],
  ['Máquinas para Granizadas', 'maquinas-para-granizadas'],
  ['Chafing / Mantenedores', 'chafing-mantenedores'],
  ['Licuadoras', 'licuadoras'],
  ['Termos y Cafeteras', 'termos-y-cafeteras'],
  ['Molinos', 'molinos'],
  ['Trompos para Tacos', 'trompos-para-tacos'],
  ['Máquinas de Helados', 'maquinas-de-helados'],
  ['Planchas Eléctricas', 'planchas-electricas'],
  ['Embutidoras', 'embutidoras'],
  ['Selladoras', 'selladoras'],
  ['Máquinas para Churros', 'maquinas-para-churros'],
  ['Freidoras', 'freidoras'],
  ['Refrigeradores y Congeladores', 'refrigeradores-y-congeladores'],
  ['Mesas de Trabajo', 'mesas-de-trabajo'],
  ['Estufas e Inducción', 'estufas-e-induccion'],
  ['Parrillas', 'parrillas'],
  ['Café Especialidad', 'cafe-especialidad'],
  ['Mobiliario', 'mobiliario'],
  ['Equipos de Limpieza', 'equipos-de-limpieza'],
  ['Otras Máquinas', 'otras-maquinas'],
];

const CRM_SUBCATEGORIES: Array<[string, string, string]> = [
  ['Ranges & Cooktops', 'ranges-cooktops', 'Estufas e Inducción'],
  ['Ovens', 'ovens', 'Hornos'],
  ['Reach-In Units', 'reach-in-units', 'Refrigeradores y Congeladores'],
  ['Mixers', 'mixers', 'Batidoras'],
];

const UNITS = [
  ['LIBRAS', 'lbs', 'weight'],
  ['KG', 'kg', 'weight'],
  ['ONZAS', 'oz', 'weight'],
  ['LITROS', 'L', 'volume'],
  ['ML', 'ml', 'volume'],
  ['UNIDADES', 'u', 'count'],
  ['PULGADAS', 'in', 'length'],
  ['CM', 'cm', 'length'],
  ['MTS', 'm', 'length'],
];

export class SeedProductCatalogData1700000002000 implements MigrationInterface {
  name = 'SeedProductCatalogData1700000002000';

  async up(queryRunner: QueryRunner): Promise<void> {
    // Units of measure
    for (const [name, abbreviation, type] of UNITS) {
      await queryRunner.query(`
        INSERT INTO units_of_measure (name, abbreviation, type)
        VALUES ($1, $2, $3)
        ON CONFLICT (name) DO NOTHING
      `, [name, abbreviation, type]);
    }

    // Top-level categories
    for (const [name, slug] of TOP_LEVEL_CATEGORIES) {
      await queryRunner.query(`
        INSERT INTO categories (name, slug, parent_id)
        VALUES ($1, $2, NULL)
        ON CONFLICT (name) DO NOTHING
      `, [name, slug]);
    }

    // CRM subcategories
    for (const [name, slug, parentName] of CRM_SUBCATEGORIES) {
      await queryRunner.query(`
        INSERT INTO categories (name, slug, parent_id)
        SELECT $1, $2, id FROM categories WHERE name = $3
        ON CONFLICT (name) DO NOTHING
      `, [name, slug, parentName]);
    }

    // Supplier: TECNOPAN
    await queryRunner.query(`
      INSERT INTO suppliers (name, slug)
      VALUES ('TECNOPAN', 'tecnopan')
      ON CONFLICT (name) DO NOTHING
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM suppliers WHERE name = 'TECNOPAN'`);
    for (const [name] of CRM_SUBCATEGORIES) {
      await queryRunner.query(`DELETE FROM categories WHERE name = $1`, [name]);
    }
    for (const [name] of TOP_LEVEL_CATEGORIES) {
      await queryRunner.query(`DELETE FROM categories WHERE name = $1`, [name]);
    }
    for (const [name] of UNITS) {
      await queryRunner.query(`DELETE FROM units_of_measure WHERE name = $1`, [name]);
    }
  }
}
