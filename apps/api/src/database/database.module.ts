import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SnakeNamingStrategy } from './snake-naming.strategy.js';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('POSTGRES_HOST', 'localhost'),
        port: config.get<number>('POSTGRES_PORT', 5432),
        database: config.get<string>('POSTGRES_DB', 'appdb'),
        username: config.get<string>('POSTGRES_USER', 'appuser'),
        password: config.get<string>('POSTGRES_PASSWORD', ''),
        synchronize: false,
        namingStrategy: new SnakeNamingStrategy(),
        migrations: ['dist/apps/api/migrations/*{.ts,.js}'],
        // Auto-register entities from each module's TypeOrmModule.forFeature()
        // instead of a dist glob. This keeps a single entity-class identity
        // (the glob would load a second copy from dist), which is what lets the
        // app run identically under `node dist` and under ts-jest in tests.
        autoLoadEntities: true,
        migrationsRun: false,
        logging: config.get<string>('NODE_ENV') === 'development',
      }),
    }),
  ],
})
export class DatabaseModule {}
