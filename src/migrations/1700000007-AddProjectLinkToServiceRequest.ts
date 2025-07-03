import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProjectLinkToServiceRequest1700000007
  implements MigrationInterface
{
  name = 'AddProjectLinkToServiceRequest1700000007';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE service_requests ADD COLUMN projectLink VARCHAR(500) NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE service_requests DROP COLUMN projectLink`,
    );
  }
}
