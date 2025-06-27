// run-seeds.ts - REEMPLAZAR CONTENIDO COMPLETO
import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';
import { seedRoles } from './roles.seed';
import { seedTiposEleccion } from './tipos-eleccion.seed';
import { seedEstructuraOrganizacional } from './estructura-organizacional.seed';
import { seedAdminUser } from './admin-user.seed';
import { seedTestUsers } from './test-users.seed';

// Cargar variables de entorno
config();

async function runSeeds() {
  const configService = new ConfigService();

  const dataSource = new DataSource({
    type: 'mysql',
    host: configService.get('DB_HOST'),
    port: +configService.get('DB_PORT'),
    username: configService.get('DB_USERNAME'),
    password: configService.get('DB_PASSWORD'),
    database: configService.get('DB_DATABASE'),
    entities: [__dirname + '/../../**/*.entity{.ts,.js}'],
    synchronize: false,
  });

  try {
    await dataSource.initialize();
    console.log('🔗 Conexión a base de datos establecida');

    console.log('\n🌱 Ejecutando seeds...\n');

    // Ejecutar seeds en orden
    await seedRoles(dataSource);
    await seedTiposEleccion(dataSource);
    await seedEstructuraOrganizacional(dataSource);
    await seedAdminUser(dataSource);
    await seedTestUsers(dataSource); // ← NUEVO SEED

    console.log('\n✅ Seeds ejecutados exitosamente');
    console.log('\n🚀 Sistema listo para probar:');
    console.log('   1. Crear elecciones como admin');
    console.log('   2. Agregar aspirantes como candidatos');
    console.log('   3. Votar desde mesa de votación');

  } catch (error) {
    console.error('❌ Error ejecutando seeds:', error);
  } finally {
    await dataSource.destroy();
    console.log('🔒 Conexión cerrada');
  }
}

runSeeds();