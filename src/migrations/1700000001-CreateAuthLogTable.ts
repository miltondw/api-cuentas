import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateAuthLogTable1700000001 implements MigrationInterface {
  name = 'CreateAuthLogTable1700000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'auth_logs',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'userId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'event',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'ipAddress',
            type: 'varchar',
            length: '45',
          },
          {
            name: 'userAgent',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'success',
            type: 'boolean',
            default: false,
          },
          {
            name: 'errorMessage',
            type: 'varchar',
            length: '255',
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
        ],
        foreignKeys: [
          {
            columnNames: ['userId'],
            referencedTableName: 'user',
            referencedColumnNames: ['id'],
            onDelete: 'SET NULL',
          },
        ],
        indices: [
          {
            name: 'IDX_AUTH_LOGS_USER_ID',
            columnNames: ['userId'],
          },
          {
            name: 'IDX_AUTH_LOGS_EVENT',
            columnNames: ['event'],
          },
          {
            name: 'IDX_AUTH_LOGS_IP_ADDRESS',
            columnNames: ['ipAddress'],
          },
          {
            name: 'IDX_AUTH_LOGS_CREATED_AT',
            columnNames: ['createdAt'],
          },
          {
            name: 'IDX_AUTH_LOGS_SUCCESS',
            columnNames: ['success'],
          },
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('auth_logs');
  }
}
