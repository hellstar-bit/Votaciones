// 📁 src/database/seeds/admin-user.seed.ts
// ====================================================================
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { Persona } from '../../users/entities/persona.entity';
import { Usuario } from '../../users/entities/usuario.entity';
import { Rol } from '../../users/entities/rol.entity';

export async function seedAdminUser(dataSource: DataSource) {
  const personaRepository = dataSource.getRepository(Persona);
  const usuarioRepository = dataSource.getRepository(Usuario);
  const rolRepository = dataSource.getRepository(Rol);

  // Buscar rol de administrador
  const adminRole = await rolRepository.findOne({
    where: { nombre_rol: 'ADMIN' },
  });

  if (!adminRole) {
    console.error('❌ Rol ADMIN no encontrado. Ejecutar seed de roles primero.');
    return;
  }

  // Verificar si ya existe
  const existingAdmin = await usuarioRepository.findOne({
    where: { username: 'admin' },
  });

  if (existingAdmin) {
    console.log('⚠️  Usuario administrador ya existe');
    return;
  }

  // Crear persona administrador
  const adminPersona = personaRepository.create({
    numero_documento: '12345678',
    tipo_documento: 'CC',
    nombres: 'Administrador',
    apellidos: 'Sistema',
    email: 'admin@sena.edu.co',
    telefono: '3001234567',
  });

  const savedPersona = await personaRepository.save(adminPersona);

  // Crear usuario administrador
  const hashedPassword = await bcrypt.hash('Admin123!', 12);
  const adminUser = usuarioRepository.create({
    id_persona: savedPersona.id_persona,
    id_rol: adminRole.id_rol,
    username: 'admin',
    password_hash: hashedPassword,
  });

  await usuarioRepository.save(adminUser);

  console.log('✅ Usuario administrador creado:');
  console.log('   Username: admin');
  console.log('   Password: Admin123!');
  console.log('   ⚠️  CAMBIAR PASSWORD EN PRODUCCIÓN');
}