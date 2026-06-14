import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAuthSchema1700000004000 implements MigrationInterface {
  name = 'CreateAuthSchema1700000004000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    await queryRunner.query(`
      CREATE TYPE "public"."users_role_enum" AS ENUM('customer','admin','manager')
    `);
    await queryRunner.query(`
      CREATE TYPE "public"."users_status_enum" AS ENUM('active','disabled','locked')
    `);
    await queryRunner.query(`
      CREATE TYPE "public"."user_sessions_revoke_reason_enum" AS ENUM(
        'user_logout','logout_others','global_signout','password_change',
        'admin','expired','hijack','lru_evicted'
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "users" (
        "id"                  uuid NOT NULL DEFAULT uuid_generate_v4(),
        "email"               varchar(255) NOT NULL,
        "password_hash"       varchar(255),
        "google_id"           varchar(255),
        "name"                varchar(150) NOT NULL,
        "avatar_url"          varchar(500),
        "role"                "public"."users_role_enum" NOT NULL DEFAULT 'customer',
        "status"              "public"."users_status_enum" NOT NULL DEFAULT 'active',
        "session_version"     int NOT NULL DEFAULT 0,
        "password_changed_at" TIMESTAMP WITH TIME ZONE,
        "email_verified_at"   TIMESTAMP WITH TIME ZONE,
        "last_login_at"       TIMESTAMP WITH TIME ZONE,
        "created_at"          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at"          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_users" PRIMARY KEY ("id"),
        CONSTRAINT "chk_users_has_credential"
          CHECK ("password_hash" IS NOT NULL OR "google_id" IS NOT NULL)
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "idx_users_email" ON "users" ("email")
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "idx_users_google_id" ON "users" ("google_id")
        WHERE "google_id" IS NOT NULL
    `);

    await queryRunner.query(`
      CREATE TABLE "user_sessions" (
        "id"                  uuid NOT NULL DEFAULT uuid_generate_v4(),
        "session_id_hash"     char(64) NOT NULL,
        "user_id"             uuid NOT NULL,
        "session_version"     int NOT NULL,
        "domain"              varchar(20) NOT NULL,
        "ip_created"          inet,
        "ip_last_seen"        inet,
        "user_agent"          varchar(512),
        "device_hash"         char(64),
        "device_label"        varchar(120),
        "created_at"          TIMESTAMP WITH TIME ZONE NOT NULL,
        "last_seen_at"        TIMESTAMP WITH TIME ZONE NOT NULL,
        "absolute_expires_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "revoked_at"          TIMESTAMP WITH TIME ZONE,
        "revoke_reason"       "public"."user_sessions_revoke_reason_enum",
        CONSTRAINT "PK_user_sessions" PRIMARY KEY ("id"),
        CONSTRAINT "FK_user_sessions_user" FOREIGN KEY ("user_id")
          REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "idx_user_sessions_sid_hash"
        ON "user_sessions" ("session_id_hash")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_user_sessions_active"
        ON "user_sessions" ("user_id") WHERE "revoked_at" IS NULL
    `);

    await queryRunner.query(`
      CREATE TABLE "user_known_devices" (
        "id"            uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id"       uuid NOT NULL,
        "device_hash"   char(64) NOT NULL,
        "label"         varchar(120),
        "first_seen_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "last_seen_at"  TIMESTAMP WITH TIME ZONE NOT NULL,
        "trusted"       boolean NOT NULL DEFAULT false,
        CONSTRAINT "PK_user_known_devices" PRIMARY KEY ("id"),
        CONSTRAINT "FK_user_known_devices_user" FOREIGN KEY ("user_id")
          REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "idx_known_device_unique"
        ON "user_known_devices" ("user_id", "device_hash")
    `);

    await queryRunner.query(`
      CREATE TABLE "auth_audit_events" (
        "id"         uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id"    uuid,
        "event_type" varchar(40) NOT NULL,
        "ip"         inet,
        "user_agent" varchar(512),
        "metadata"   jsonb,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_auth_audit_events" PRIMARY KEY ("id"),
        CONSTRAINT "FK_auth_audit_events_user" FOREIGN KEY ("user_id")
          REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_audit_user_time"
        ON "auth_audit_events" ("user_id", "created_at")
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "auth_audit_events"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "user_known_devices"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "user_sessions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);
    await queryRunner.query(
      `DROP TYPE IF EXISTS "public"."user_sessions_revoke_reason_enum"`,
    );
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."users_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."users_role_enum"`);
  }
}
