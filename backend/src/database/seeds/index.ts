// 📁 backend/src/database/seeds/index.ts - ACTUALIZADO para incluir nuevo seed
import { DataSource } from 'typeorm';
import { seedRoles } from './roles.seed';
import { seedAdminUser } from './admin-user.seed';
import { seedDashboardUser } from './dashboard-user.seed'; // ✅ NUEVO
import { seedTiposEleccion } from './tipos-eleccion.seed';
import { seedEstructuraOrganizacional } from './estructura-organizacional.seed'; // ✅ CORRECTO


export async function runSeeds(dataSource: DataSource) {
  console.log('🌱 Iniciando seeds...');

  try {
    // 1. Roles (debe ir primero)
    await seedRoles(dataSource);
    
    // 2. Tipos de elección
    await seedTiposEleccion(dataSource);
    
    // 3. Centros y sedes
    await seedEstructuraOrganizacional(dataSource);
    
    // 4. Usuario administrador
    await seedAdminUser(dataSource);
    
    // 5. ✅ NUEVO: Usuario dashboard
    await seedDashboardUser(dataSource);

    console.log('✅ Seeds completados exitosamente');
  } catch (error) {
    console.error('❌ Error ejecutando seeds:', error);
    throw error;
  }
}