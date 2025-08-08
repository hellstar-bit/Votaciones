// 📁 backend/src/database/seeds/run-seeds.ts
// ====================================================================
// 🔧 SEEDS ACTUALIZADOS PARA POSTGRESQL
// ====================================================================
import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';
import { seedRoles } from './roles.seed';
import { seedTiposEleccion } from './tipos-eleccion.seed';
import { seedEstructuraOrganizacional } from './estructura-organizacional.seed';
import { seedAdminUser } from './admin-user.seed';
import { seedDashboardUser } from './dashboard-user.seed';
import { seedTestUsers } from './test-users.seed';

// Cargar variables de entorno
config();

async function runSeeds() {
  const configService = new ConfigService();

  const dataSource = new DataSource({
    type: 'postgres', // 🔧 CAMBIO: De 'mysql' a 'postgres'
    host: configService.get('DB_HOST'),
    port: +configService.get('DB_PORT'),
    username: configService.get('DB_USERNAME'),
    password: configService.get('DB_PASSWORD'),
    database: configService.get('DB_DATABASE'),
    
    // 🔧 SSL PARA SUPABASE
    ssl: {
      rejectUnauthorized: false
    },
    
    entities: [__dirname + '/../../**/*.entity{.ts,.js}'],
    synchronize: false,
  });

  try {
    await dataSource.initialize();
    console.log('🔗 Conexión a Supabase PostgreSQL establecida');
    console.log('🌐 Base de datos:', configService.get('DB_DATABASE'));
    console.log('🔌 Host:', configService.get('DB_HOST'));

    console.log('\n🌱 Ejecutando seeds...\n');

    // Ejecutar seeds en orden correcto
    await seedRoles(dataSource);
    await seedTiposEleccion(dataSource);
    await seedEstructuraOrganizacional(dataSource);
    await seedAdminUser(dataSource);
    await seedDashboardUser(dataSource);
    await seedTestUsers(dataSource);

    console.log('\n✅ Seeds ejecutados exitosamente en Supabase');
    console.log('\n🚀 Sistema listo para probar:');
    console.log('   📊 Admin: admin / Admin123!');
    console.log('   📈 Dashboard: dashboard / Dashboard123!');
    console.log('   🗳️  Mesa: mesa_votacion / Mesa123!');
    console.log('\n📝 Pasos siguientes:');
    console.log('   1. Verificar tablas en Supabase Dashboard');
    console.log('   2. Crear elecciones como admin');
    console.log('   3. Agregar candidatos');
    console.log('   4. Activar elección y votar');

  } catch (error) {
    console.error('❌ Error ejecutando seeds en Supabase:', error);
    console.error('Detalles:', error.message);
    
    // 🔧 AYUDA ESPECÍFICA PARA ERRORES COMUNES DE SUPABASE
    if (error.message.includes('password authentication failed')) {
      console.error('🔑 Verificar credenciales de Supabase');
    }
    if (error.message.includes('connection')) {
      console.error('🌐 Verificar URL y configuración de red');
    }
  } finally {
    await dataSource.destroy();
    console.log('🔒 Conexión cerrada');
  }
}

runSeeds();