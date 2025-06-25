import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialIndexes1234567890123 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Índices compuestos para consultas frecuentes
    await queryRunner.query(`
      CREATE INDEX idx_personas_centro_activos 
      ON personas(id_centro, estado)
    `);
    
    await queryRunner.query(`
      CREATE INDEX idx_elecciones_activas 
      ON elecciones(estado, fecha_inicio, fecha_fin)
    `);
    
    await queryRunner.query(`
      CREATE INDEX idx_candidatos_eleccion_validados 
      ON candidatos(id_eleccion, estado, validado)
    `);
    
    await queryRunner.query(`
      CREATE INDEX idx_votantes_pendientes 
      ON votantes_habilitados(id_eleccion, ha_votado)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX idx_personas_centro_activos ON personas`);
    await queryRunner.query(`DROP INDEX idx_elecciones_activas ON elecciones`);
    await queryRunner.query(`DROP INDEX idx_candidatos_eleccion_validados ON candidatos`);
    await queryRunner.query(`DROP INDEX idx_votantes_pendientes ON votantes_habilitados`);
  }
}
*/: Date;

  @OneToMany(() => Centro, centro => centro.regional)
  centros: Centro[];
}