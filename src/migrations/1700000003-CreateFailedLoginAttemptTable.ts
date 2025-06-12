import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateFailedLoginAttemptTable1700000003
  implements MigrationInterface
{
  name = 'CreateFailedLoginAttemptTable1700000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'failed_login_attempts',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'email',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'ipAddress',
            type: 'varchar',
            length: '45',
          },
          {
            name: 'attemptCount',
            type: 'integer',
            default: 1,
          },
          {
            name: 'lastAttempt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'blockedUntil',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'userAgent',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
        indices: [
          {
            name: 'IDX_FAILED_LOGIN_EMAIL',
            columnNames: ['email'],
          },
          {
            name: 'IDX_FAILED_LOGIN_IP_ADDRESS',
            columnNames: ['ipAddress'],
          },
          {
            name: 'IDX_FAILED_LOGIN_BLOCKED_UNTIL',
            columnNames: ['blockedUntil'],
          },
          {
            name: 'IDX_FAILED_LOGIN_LAST_ATTEMPT',
            columnNames: ['lastAttempt'],
          },
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('failed_login_attempts');
  }
}
