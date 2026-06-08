import { DefaultNamingStrategy, type NamingStrategyInterface } from 'typeorm';

/**
 * Maps camelCase entity properties to snake_case database identifiers.
 *
 * Required because TypeORM 1.0's DefaultNamingStrategy still emits column names
 * verbatim (camelCase), whereas every migration in this project is snake_case.
 * Registering this globally also reconciles the pre-existing catalog/pricing
 * entities (bare camelCase `@Column`s) with their snake_case migration columns.
 *
 * Self-contained on purpose: `typeorm-naming-strategies` peers `~0.3.0` and lags
 * the installed `typeorm@1.0`, so the small amount of logic is inlined here.
 */
function snakeCase(input: string): string {
  return input
    .replace(/([A-Z])([A-Z][a-z])/g, '$1_$2')
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/[\s.-]+/g, '_')
    .toLowerCase();
}

export class SnakeNamingStrategy
  extends DefaultNamingStrategy
  implements NamingStrategyInterface
{
  tableName(className: string, customName?: string): string {
    return customName ? customName : snakeCase(className);
  }

  columnName(
    propertyName: string,
    customName: string,
    embeddedPrefixes: string[],
  ): string {
    return snakeCase(
      embeddedPrefixes.concat(customName ? customName : propertyName).join('_'),
    );
  }

  relationName(propertyName: string): string {
    return snakeCase(propertyName);
  }

  joinColumnName(relationName: string, referencedColumnName: string): string {
    return snakeCase(`${relationName}_${referencedColumnName}`);
  }

  joinTableName(
    firstTableName: string,
    secondTableName: string,
    firstPropertyName: string,
  ): string {
    return snakeCase(
      `${firstTableName}_${firstPropertyName.replace(/\./g, '_')}_${secondTableName}`,
    );
  }

  joinTableColumnName(
    tableName: string,
    propertyName: string,
    columnName?: string,
  ): string {
    return snakeCase(`${tableName}_${columnName ? columnName : propertyName}`);
  }

  classTableInheritanceParentColumnName(
    parentTableName: string,
    parentTableIdPropertyName: string,
  ): string {
    return snakeCase(`${parentTableName}_${parentTableIdPropertyName}`);
  }
}
