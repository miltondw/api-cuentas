import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateUserSessionTable1700000002 implements MigrationInterface {
  name = 'CreateUserSessionTable1700000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'user_sessions',
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
          },
          {
            name: 'sessionToken',
            type: 'varchar',
            length: '255',
            isUnique: true,
          },
          {
            name: 'refreshToken',
            type: 'varchar',
            length: '255',
            isUnique: true,
            isNullable: true,
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
            name: 'deviceInfo',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'isActive',
            type: 'boolean',
            default: true,
          },
          {
            name: 'lastActivity',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'expiresAt',
            type: 'timestamp',
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'revokedAt',
            type: 'timestamp',
            isNullable: true,
          },
        ],
        foreignKeys: [
          {
            columnNames: ['userId'],
            referencedTableName: 'user',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
        indices: [
          {
            name: 'IDX_USER_SESSIONS_USER_ID',
            columnNames: ['userId'],
          },
          {
            name: 'IDX_USER_SESSIONS_TOKEN',
            columnNames: ['sessionToken'],
          },
          {
            name: 'IDX_USER_SESSIONS_REFRESH_TOKEN',
            columnNames: ['refreshToken'],
          },
          {
            name: 'IDX_USER_SESSIONS_ACTIVE',
            columnNames: ['isActive'],
          },
          {
            name: 'IDX_USER_SESSIONS_EXPIRES_AT',
            columnNames: ['expiresAt'],
          },
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('user_sessions');
  }
}
