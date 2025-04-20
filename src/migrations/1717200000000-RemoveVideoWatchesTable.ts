import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveVideoWatchesTable1717200000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if table exists before dropping it
    const tableExists = await queryRunner.hasTable('video_watches');

    if (tableExists) {
      await queryRunner.query(`DROP TABLE "video_watches"`);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // We won't recreate the table structure in the down migration
    // as we've removed the entity from the codebase.
    // If needed, the table structure would need to be recreated manually
    // or by reverting to a previous version of the codebase.
    console.log(
      'Cannot automatically recreate video_watches table as the entity has been removed',
    );
  }
}
