import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('POSTGRES_HOST', 'localhost'),
        port: config.get<number>('POSTGRES_PORT', 5432),
        database: config.get<string>('POSTGRES_DB', 'appdb'),
        username: config.get<string>('POSTGRES_USER', 'appuser'),
        password: config.get<string>('POSTGRES_PASSWORD', ''),
        synchronize: false,
        migrations: ['dist/apps/api/migrations/*{.ts,.js}'],
        entities: ['dist/apps/api/src/**/*.entity{.ts,.js}'],
        migrationsRun: false,
        logging: config.get<string>('NODE_ENV') === 'development',
      }),
    }),
  ],
})
export class DatabaseModule {}
