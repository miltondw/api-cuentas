import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCompositeIndexes1700000006 implements MigrationInterface {
  name = 'AddCompositeIndexes1700000006';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Índices compuestos para la tabla usuarios
    await queryRunner.query(`
      CREATE INDEX IDX_usuarios_email_active 
      ON usuarios(email, is_active)
    `);

    await queryRunner.query(`
      CREATE INDEX IDX_usuarios_role_active 
      ON usuarios(role, is_active)
    `);

    await queryRunner.query(`
      CREATE INDEX IDX_usuarios_created_role 
      ON usuarios(created_at, role)
    `);

    // Índices compuestos para la tabla user_sessions
    await queryRunner.query(`
      CREATE INDEX IDX_user_sessions_user_active 
      ON user_sessions(user_id, is_active)
    `);

    await queryRunner.query(`
      CREATE INDEX IDX_user_sessions_created_active 
      ON user_sessions(created_at, is_active)
    `);

    // Índices compuestos para la tabla auth_logs
    await queryRunner.query(`
      CREATE INDEX IDX_auth_logs_user_event_time 
      ON auth_logs(user_id, event_type, created_at)
    `);

    await queryRunner.query(`
      CREATE INDEX IDX_auth_logs_ip_event_time 
      ON auth_logs(ip_address, event_type, created_at)
    `);

    await queryRunner.query(`
      CREATE INDEX IDX_auth_logs_success_time 
      ON auth_logs(success, created_at)
    `);

    // Índices compuestos para la tabla failed_login_attempts
    await queryRunner.query(`
      CREATE INDEX IDX_failed_attempts_ip_time 
      ON failed_login_attempts(ip_address, attempted_at)
    `);

    await queryRunner.query(`
      CREATE INDEX IDX_failed_attempts_email_time 
      ON failed_login_attempts(email, attempted_at)
    `);

    // Índices compuestos para la tabla refresh_tokens
    await queryRunner.query(`
      CREATE INDEX IDX_refresh_tokens_user_active 
      ON refresh_tokens(user_id, is_revoked, expires_at)
    `);

    await queryRunner.query(`
      CREATE INDEX IDX_refresh_tokens_expires_revoked 
      ON refresh_tokens(expires_at, is_revoked)
    `);

    // Índices para consultas de proyectos y servicios (si existen)
    // Nota: Estos índices se aplicarán solo si las tablas existen
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS IDX_projects_status_created 
      ON projects(status, created_at)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS IDX_projects_client_status 
      ON projects(client_id, status)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS IDX_services_status_type 
      ON services(status, service_type)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Eliminar índices compuestos para usuarios
    await queryRunner.query(`DROP INDEX IDX_usuarios_email_active ON usuarios`);
    await queryRunner.query(`DROP INDEX IDX_usuarios_role_active ON usuarios`);
    await queryRunner.query(`DROP INDEX IDX_usuarios_created_role ON usuarios`);

    // Eliminar índices compuestos para user_sessions
    await queryRunner.query(
      `DROP INDEX IDX_user_sessions_user_active ON user_sessions`,
    );
    await queryRunner.query(
      `DROP INDEX IDX_user_sessions_created_active ON user_sessions`,
    );

    // Eliminar índices compuestos para auth_logs
    await queryRunner.query(
      `DROP INDEX IDX_auth_logs_user_event_time ON auth_logs`,
    );
    await queryRunner.query(
      `DROP INDEX IDX_auth_logs_ip_event_time ON auth_logs`,
    );
    await queryRunner.query(
      `DROP INDEX IDX_auth_logs_success_time ON auth_logs`,
    );

    // Eliminar índices compuestos para failed_login_attempts
    await queryRunner.query(
      `DROP INDEX IDX_failed_attempts_ip_time ON failed_login_attempts`,
    );
    await queryRunner.query(
      `DROP INDEX IDX_failed_attempts_email_time ON failed_login_attempts`,
    );

    // Eliminar índices compuestos para refresh_tokens
    await queryRunner.query(
      `DROP INDEX IDX_refresh_tokens_user_active ON refresh_tokens`,
    );
    await queryRunner.query(
      `DROP INDEX IDX_refresh_tokens_expires_revoked ON refresh_tokens`,
    );

    // Eliminar índices de proyectos y servicios
    await queryRunner.query(
      `DROP INDEX IF EXISTS IDX_projects_status_created ON projects`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS IDX_projects_client_status ON projects`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS IDX_services_status_type ON services`,
    );
  }
}
