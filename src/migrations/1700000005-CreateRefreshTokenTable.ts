import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateRefreshTokenTable1700000005 implements MigrationInterface {
  name = 'CreateRefreshTokenTable1700000005';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'refresh_tokens',
        columns: [
          {
            name: 'token_id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
            comment: 'ID único del refresh token',
          },
          {
            name: 'token',
            type: 'varchar',
            length: '255',
            isUnique: true,
            comment: 'Token único para renovar acceso',
          },
          {
            name: 'user_id',
            type: 'int',
            comment: 'ID del usuario propietario del token',
          },
          {
            name: 'expires_at',
            type: 'datetime',
            comment: 'Fecha y hora de expiración del token',
          },
          {
            name: 'is_revoked',
            type: 'boolean',
            default: false,
            comment: 'Indica si el token ha sido revocado',
          },
          {
            name: 'ip_address',
            type: 'varchar',
            length: '45',
            isNullable: true,
            comment: 'Dirección IP desde donde se creó el token',
          },
          {
            name: 'user_agent',
            type: 'text',
            isNullable: true,
            comment: 'Información del navegador/dispositivo',
          },
          {
            name: 'created_at',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
            comment: 'Fecha y hora de creación del token',
          },
        ],
      }),
      true,
    );

    // Create indexes for better performance
    await queryRunner.createIndex(
      'refresh_tokens',
      new TableIndex({
        name: 'IDX_refresh_tokens_user_id',
        columnNames: ['user_id'],
      }),
    );

    await queryRunner.createIndex(
      'refresh_tokens',
      new TableIndex({
        name: 'IDX_refresh_tokens_token',
        columnNames: ['token'],
        isUnique: true,
      }),
    );

    await queryRunner.createIndex(
      'refresh_tokens',
      new TableIndex({
        name: 'IDX_refresh_tokens_expires_at',
        columnNames: ['expires_at'],
      }),
    );

    await queryRunner.createIndex(
      'refresh_tokens',
      new TableIndex({
        name: 'IDX_refresh_tokens_is_revoked',
        columnNames: ['is_revoked'],
      }),
    );

    // Add foreign key constraint
    await queryRunner.query(`
      ALTER TABLE refresh_tokens 
      ADD CONSTRAINT FK_refresh_tokens_user_id 
      FOREIGN KEY (user_id) REFERENCES usuarios(usuario_id) 
      ON DELETE CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('refresh_tokens');
  }
}
