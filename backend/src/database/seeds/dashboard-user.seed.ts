// 📁 backend/src/database/seeds/dashboard-user.seed.ts - CREAR NUEVO ARCHIVO
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { Persona } from '../../users/entities/persona.entity';
import { Usuario } from '../../users/entities/usuario.entity';
import { Rol } from '../../users/entities/rol.entity';

export async function seedDashboardUser(dataSource: DataSource) {
  const personaRepository = dataSource.getRepository(Persona);
  const usuarioRepository = dataSource.getRepository(Usuario);
  const rolRepository = dataSource.getRepository(Rol);

  // Buscar rol de dashboard
  const dashboardRole = await rolRepository.findOne({
    where: { nombre_rol: 'DASHBOARD' },
  });

  if (!dashboardRole) {
    console.error('❌ Rol DASHBOARD no encontrado. Ejecutar seed de roles primero.');
    return;
  }

  // Verificar si ya existe
  const existingDashboard = await usuarioRepository.findOne({
    where: { username: 'dashboard' },
  });

  if (existingDashboard) {
    console.log('⚠️  Usuario dashboard ya existe');
    return;
  }

  // Crear persona dashboard
  const dashboardPersona = personaRepository.create({
    numero_documento: '98765432', // ✅ CAMBIO: Documento diferente
    tipo_documento: 'CC',
    nombres: 'Dashboard',
    apellidos: 'Electoral',
    email: 'dashboard@sena.edu.co',
    telefono: '3009876543', // ✅ CAMBIO: Teléfono diferente también
  });

  const savedPersona = await personaRepository.save(dashboardPersona);

  // Crear usuario dashboard
  const hashedPassword = await bcrypt.hash('Dashboard123!', 12);
  const dashboardUser = usuarioRepository.create({
    id_persona: savedPersona.id_persona,
    id_rol: dashboardRole.id_rol,
    username: 'dashboard',
    password_hash: hashedPassword,
  });

  await usuarioRepository.save(dashboardUser);

  console.log('✅ Usuario dashboard creado:');
  console.log('   Username: dashboard');
  console.log('   Password: Dashboard123!');
  console.log('   Rol: DASHBOARD');
  console.log('   ⚠️  CAMBIAR PASSWORD EN PRODUCCIÓN');
}