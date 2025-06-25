// 📁 src/database/migrations/001-initial-indexes.ts
// ====================================================================
import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialIndexes1234567890123 implements MigrationInterface {
  name = 'InitialIndexes1234567890123';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Índices para tabla personas
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_personas_documento 
      ON personas(numero_documento)
    `);
    
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_personas_centro_sede_ficha 
      ON personas(id_centro, id_sede, id_ficha)
    `);
    
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_personas_centro_activos 
      ON personas(id_centro, estado)
    `);

    // Índices para tabla elecciones
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_elecciones_fechas 
      ON elecciones(fecha_inicio, fecha_fin)
    `);
    
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_elecciones_estado 
      ON elecciones(estado)
    `);
    
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_elecciones_nivel 
      ON elecciones(id_centro, id_sede, id_ficha)
    `);

    // Índices para tabla candidatos
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_candidato_eleccion 
      ON candidatos(id_eleccion)
    `);
    
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_candidato_estado 
      ON candidatos(estado)
    `);
    
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_candidatos_eleccion_validados 
      ON candidatos(id_eleccion, estado, validado)
    `);

    // Índices para tabla votos
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_voto_eleccion 
      ON votos(id_eleccion)
    `);
    
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_voto_candidato 
      ON votos(id_candidato)
    `);
    
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_voto_timestamp 
      ON votos(timestamp_voto)
    `);

    // Índices para tabla votantes_habilitados
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_votante_eleccion 
      ON votantes_habilitados(id_eleccion)
    `);
    
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_votante_estado 
      ON votantes_habilitados(ha_votado)
    `);
    
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_votantes_pendientes 
      ON votantes_habilitados(id_eleccion, ha_votado)
    `);

    // Índices para auditoría
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_audit_tabla 
      ON audit_logs(tabla_afectada)
    `);
    
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_audit_usuario 
      ON audit_logs(id_usuario)
    `);
    
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_audit_timestamp 
      ON audit_logs(timestamp_operacion)
    `);

    // Índices para sesiones de mesa de votación
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_sesion_eleccion 
      ON sesiones_mesa_votacion(id_eleccion)
    `);
    
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_sesion_mesa 
      ON sesiones_mesa_votacion(id_usuario_mesa)
    `);
    
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_sesion_token 
      ON sesiones_mesa_votacion(token_sesion)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Eliminar índices en orden inverso
    await queryRunner.query(`DROP INDEX IF EXISTS idx_sesion_token ON sesiones_mesa_votacion`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_sesion_mesa ON sesiones_mesa_votacion`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_sesion_eleccion ON sesiones_mesa_votacion`);
    
    await queryRunner.query(`DROP INDEX IF EXISTS idx_audit_timestamp ON audit_logs`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_audit_usuario ON audit_logs`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_audit_tabla ON audit_logs`);
    
    await queryRunner.query(`DROP INDEX IF EXISTS idx_votantes_pendientes ON votantes_habilitados`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_votante_estado ON votantes_habilitados`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_votante_eleccion ON votantes_habilitados`);
    
    await queryRunner.query(`DROP INDEX IF EXISTS idx_voto_timestamp ON votos`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_voto_candidato ON votos`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_voto_eleccion ON votos`);
    
    await queryRunner.query(`DROP INDEX IF EXISTS idx_candidatos_eleccion_validados ON candidatos`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_candidato_estado ON candidatos`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_candidato_eleccion ON candidatos`);
    
    await queryRunner.query(`DROP INDEX IF EXISTS idx_elecciones_nivel ON elecciones`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_elecciones_estado ON elecciones`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_elecciones_fechas ON elecciones`);
    
    await queryRunner.query(`DROP INDEX IF EXISTS idx_personas_centro_activos ON personas`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_personas_centro_sede_ficha ON personas`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_personas_documento ON personas`);
  }
}