import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveGuestSessionsColumn1717100000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if column exists before attempting to drop it
    const hasColumn = await queryRunner.hasColumn(
      'user_session',
      'isGuestSession',
    );

    if (hasColumn) {
      // First, delete all guest sessions
      await queryRunner.query(
        `DELETE FROM "user_session" WHERE "isGuestSession" = true`,
      );

      // Then drop the column
      await queryRunner.query(
        `ALTER TABLE "user_session" DROP COLUMN "isGuestSession"`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Check if column doesn't exist before adding it back
    const hasColumn = await queryRunner.hasColumn(
      'user_session',
      'isGuestSession',
    );

    if (!hasColumn) {
      await queryRunner.query(
        `ALTER TABLE "user_session" ADD "isGuestSession" boolean NOT NULL DEFAULT false`,
      );
    }
  }
}
