import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddSecurityFieldsToUser1700000004 implements MigrationInterface {
  name = 'AddSecurityFieldsToUser1700000004';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Agregar nuevos campos de seguridad a la tabla user
    await queryRunner.addColumns('user', [
      new TableColumn({
        name: 'lastLogin',
        type: 'timestamp',
        isNullable: true,
      }),
      new TableColumn({
        name: 'lastLoginIp',
        type: 'varchar',
        length: '45',
        isNullable: true,
      }),
      new TableColumn({
        name: 'loginCount',
        type: 'integer',
        default: 0,
      }),
      new TableColumn({
        name: 'failedAttempts',
        type: 'integer',
        default: 0,
      }),
      new TableColumn({
        name: 'lastFailedAttempt',
        type: 'timestamp',
        isNullable: true,
      }),
      new TableColumn({
        name: 'accountLockedUntil',
        type: 'timestamp',
        isNullable: true,
      }),
      new TableColumn({
        name: 'twoFactorEnabled',
        type: 'boolean',
        default: false,
      }),
      new TableColumn({
        name: 'twoFactorSecret',
        type: 'varchar',
        length: '255',
        isNullable: true,
      }),
      new TableColumn({
        name: 'lastPasswordChange',
        type: 'timestamp',
        isNullable: true,
      }),
      new TableColumn({
        name: 'isActive',
        type: 'boolean',
        default: true,
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Eliminar columnas
    await queryRunner.dropColumns('user', [
      'lastLogin',
      'lastLoginIp',
      'loginCount',
      'failedAttempts',
      'lastFailedAttempt',
      'accountLockedUntil',
      'twoFactorEnabled',
      'twoFactorSecret',
      'lastPasswordChange',
      'isActive',
    ]);
  }
}
