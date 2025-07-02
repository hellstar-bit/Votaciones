// 📁 backend/src/database/seeds/run-seeds.ts - VERSIÓN CORREGIDA
import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';
import { seedRoles } from './roles.seed';
import { seedTiposEleccion } from './tipos-eleccion.seed';
import { seedEstructuraOrganizacional } from './estructura-organizacional.seed'; // ✅ CORRECTO
import { seedAdminUser } from './admin-user.seed';
import { seedDashboardUser } from './dashboard-user.seed'; // ✅ NUEVO
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

    // Ejecutar seeds en orden correcto
    await seedRoles(dataSource);
    await seedTiposEleccion(dataSource);
    await seedEstructuraOrganizacional(dataSource); // ✅ ESTE ES EL CORRECTO
    await seedAdminUser(dataSource);
    await seedDashboardUser(dataSource); // ✅ NUEVO: Usuario dashboard
    await seedTestUsers(dataSource);

    console.log('\n✅ Seeds ejecutados exitosamente');
    console.log('\n🚀 Sistema listo para probar:');
    console.log('   📊 Admin: admin / Admin123!');
    console.log('   📈 Dashboard: dashboard / Dashboard123!'); // ✅ NUEVO
    console.log('   🗳️  Mesa: mesa_votacion / Mesa123!');
    console.log('\n📝 Pasos siguientes:');
    console.log('   1. Crear elecciones como admin');
    console.log('   2. Agregar candidatos');
    console.log('   3. Activar elección');
    console.log('   4. Abrir dashboard en tiempo real');
    console.log('   5. Votar y ver actualizaciones en vivo');

  } catch (error) {
    console.error('❌ Error ejecutando seeds:', error);
    console.error('Detalles:', error.message);
  } finally {
    await dataSource.destroy();
    console.log('🔒 Conexión cerrada');
  }
}

runSeeds();