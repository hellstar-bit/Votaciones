// 📁 src/database/seeds/roles.seed.ts
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
    const existingRole = await roleRepository.findOne({
      where: { nombre_rol: roleData.nombre_rol },
    });

    if (!existingRole) {
      const role = roleRepository.create(roleData);
      await roleRepository.save(role);
      console.log(`✅ Rol creado: ${roleData.nombre_rol}`);
    } else {
      console.log(`⚠️  Rol ya existe: ${roleData.nombre_rol}`);
    }
  }
}