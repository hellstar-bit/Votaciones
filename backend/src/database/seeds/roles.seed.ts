// 📁 backend/src/database/seeds/roles.seed.ts - VERSIÓN FINAL
import { DataSource } from 'typeorm';
import { Rol } from '../../users/entities/rol.entity';

export async function seedRoles(dataSource: DataSource) {
  const roleRepository = dataSource.getRepository(Rol);

  const roles = [
    {
      nombre_rol: 'ADMIN',
      descripcion: 'Administrador del sistema con acceso completo',
      permisos: {
        all: true,
        manage_elections: true,
        manage_candidates: true,
        view_results: true,
        manage_users: true,
        real_time_dashboard: true, // ✅ AGREGADO
      },
    },
    {
      nombre_rol: 'DASHBOARD', // ✅ NUEVO ROL
      descripcion: 'Usuario con acceso exclusivo al dashboard de votaciones en tiempo real',
      permisos: {
        real_time_dashboard: true,
        view_results: true,
        view_election_data: true,
        view_statistics: true,
        monitor_voting: true,
      },
    },
    {
      nombre_rol: 'MESA_VOTACION',
      descripcion: 'Operador de mesa de votación',
      permisos: {
        voting: true,
        scan_qr: true,
        view_election_data: true,
      },
    },
    {
      nombre_rol: 'APRENDIZ',
      descripcion: 'Aprendiz habilitado para votar',
      permisos: {
        vote: true,
        view_results: true,
      },
    },
    {
      nombre_rol: 'INSTRUCTOR',
      descripcion: 'Instructor que maneja votaciones de ficha',
      permisos: {
        manage_ficha_voting: true,
        scan_qr: true,
        view_ficha_results: true,
      },
    },
  ];

  for (const roleData of roles) {
    try {
      const existingRole = await roleRepository.findOne({
        where: { nombre_rol: roleData.nombre_rol },
      });

      if (!existingRole) {
        // ✅ CREAR usando queryBuilder para evitar problemas de tipos
        await roleRepository
          .createQueryBuilder()
          .insert()
          .into(Rol)
          .values({
            nombre_rol: roleData.nombre_rol,
            descripcion: roleData.descripcion,
            permisos: roleData.permisos as any, // ✅ Forzar el tipo
          })
          .execute();
        
        console.log(`✅ Rol creado: ${roleData.nombre_rol}`);
      } else {
        // ✅ ACTUALIZAR usando queryBuilder
        await roleRepository
          .createQueryBuilder()
          .update(Rol)
          .set({
            descripcion: roleData.descripcion,
            permisos: roleData.permisos as any, // ✅ Forzar el tipo
          })
          .where('nombre_rol = :nombre', { nombre: roleData.nombre_rol })
          .execute();
        
        console.log(`🔄 Rol actualizado: ${roleData.nombre_rol}`);
      }
    } catch (error) {
      console.error(`❌ Error procesando rol ${roleData.nombre_rol}:`, error);
    }
  }
}