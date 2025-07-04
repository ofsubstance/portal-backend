import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveSessionIdColumn1717300000000 implements MigrationInterface {
  name = 'RemoveSessionIdColumn1717300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user_session" DROP COLUMN "sessionId"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user_session" ADD COLUMN "sessionId" character varying NOT NULL`);
  }
} 