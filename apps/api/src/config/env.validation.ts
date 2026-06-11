import { plainToInstance } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
  validateSync,
} from 'class-validator';

export enum NodeEnv {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

/**
 * Schema validated at ConfigModule bootstrap (wired in step 5).
 *
 * Google OAuth variables are optional here; presence-when-enabled is enforced
 * at AuthModule bootstrap so the API can run without social login configured.
 * Note: enabling this validation requires SESSION_SECRET in the active `.env`
 * (template provided in the monorepo-root `.env.example`).
 */
export class EnvironmentVariables {
  @IsOptional()
  @IsEnum(NodeEnv)
  NODE_ENV?: NodeEnv;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(65535)
  PORT?: number;

  // ── Database ──
  @IsString()
  @IsNotEmpty()
  POSTGRES_PASSWORD!: string;

  @IsOptional()
  @IsString()
  POSTGRES_HOST?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(65535)
  POSTGRES_PORT?: number;

  @IsOptional()
  @IsString()
  POSTGRES_DB?: string;

  @IsOptional()
  @IsString()
  POSTGRES_USER?: string;

  // ── Redis ──
  @IsOptional()
  @IsString()
  REDIS_URL?: string;

  // ── Session / cookies (required by the auth subsystem) ──
  @IsString()
  @MinLength(32, { message: 'SESSION_SECRET must be at least 32 characters' })
  SESSION_SECRET!: string;

  @IsOptional()
  @IsInt()
  @Min(60)
  SESSION_IDLE_TTL?: number;

  @IsOptional()
  @IsInt()
  @Min(300)
  SESSION_ABSOLUTE_TTL?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  SESSION_MAX_PER_USER?: number;

  // ── Google OAuth (optional; enforced when GOOGLE_OAUTH_ENABLED is truthy) ──
  @IsOptional()
  @IsString()
  GOOGLE_OAUTH_ENABLED?: string;

  @IsOptional()
  @IsString()
  GOOGLE_CLIENT_ID?: string;

  @IsOptional()
  @IsString()
  GOOGLE_CLIENT_SECRET?: string;

  @IsOptional()
  @IsString()
  GOOGLE_CALLBACK_URL?: string;
}

export function validateEnv(
  config: Record<string, unknown>,
): EnvironmentVariables {
  const validated = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validated, { skipMissingProperties: false });
  if (errors.length > 0) {
    const details = errors
      .map((e) => Object.values(e.constraints ?? {}).join(', '))
      .join('\n  - ');
    throw new Error(`Invalid environment configuration:\n  - ${details}`);
  }
  return validated;
}
