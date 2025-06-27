// test-users.seed.ts
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { Persona } from '../../users/entities/persona.entity';
import { Usuario } from '../../users/entities/usuario.entity';
import { Rol } from '../../users/entities/rol.entity';
import { Centro } from '../../users/entities/centro.entity';
import { Sede } from '../../users/entities/sede.entity';
import { Ficha } from '../../users/entities/ficha.entity';

export async function seedTestUsers(dataSource: DataSource) {
  const personaRepository = dataSource.getRepository(Persona);
  const usuarioRepository = dataSource.getRepository(Usuario);
  const rolRepository = dataSource.getRepository(Rol);
  const centroRepository = dataSource.getRepository(Centro);
  const sedeRepository = dataSource.getRepository(Sede);
  const fichaRepository = dataSource.getRepository(Ficha);

  console.log('🧪 Creando usuarios de prueba...');

  // Obtener entidades necesarias
  const adminRole = await rolRepository.findOne({ where: { nombre_rol: 'ADMIN' } });
  const mesaRole = await rolRepository.findOne({ where: { nombre_rol: 'MESA_VOTACION' } });
  const aprendizRole = await rolRepository.findOne({ where: { nombre_rol: 'APRENDIZ' } });
  
  const centro = await centroRepository.findOne({ where: { codigo_centro: '9207' } });
  const sedePrincipal = await sedeRepository.findOne({ where: { codigo_sede: 'PRINCIPAL' } });
  const sedeTIC = await sedeRepository.findOne({ where: { codigo_sede: 'TIC' } });
  
  const ficha1 = await fichaRepository.findOne({ where: { numero_ficha: '3037689' } });
  const ficha2 = await fichaRepository.findOne({ where: { numero_ficha: '3037399' } });
  const ficha3 = await fichaRepository.findOne({ where: { numero_ficha: '3070126' } });

  if (!adminRole || !mesaRole || !aprendizRole || !centro) {
    console.error('❌ Faltan roles o estructuras básicas. Ejecutar seeds base primero.');
    return;
  }

  // 1. Usuario Mesa de Votación
  const mesaUserData = {
    numero_documento: '87654321',
    tipo_documento: 'CC',
    nombres: 'Mesa',
    apellidos: 'Votación',
    email: 'mesa@sena.edu.co',
    telefono: '3007654321',
    id_centro: centro.id_centro,
    id_sede: sedePrincipal?.id_sede,
    jornada: 'mixta'
  };

  let mesaPersona = await personaRepository.findOne({ 
    where: { numero_documento: mesaUserData.numero_documento } 
  });

  if (!mesaPersona) {
    mesaPersona = await personaRepository.save(personaRepository.create(mesaUserData));
    
    const hashedPassword = await bcrypt.hash('Mesa123!', 12);
    await usuarioRepository.save(usuarioRepository.create({
      id_persona: mesaPersona.id_persona,
      id_rol: mesaRole.id_rol,
      username: 'mesa_votacion',
      password_hash: hashedPassword,
    }));

    console.log('✅ Usuario Mesa de Votación creado:');
    console.log('   Username: mesa_votacion');
    console.log('   Password: Mesa123!');
  }

  // 2. Aspirantes/Candidatos de Prueba
  const aspirantes = [
    {
      numero_documento: '1001234567',
      nombres: 'Juan Carlos',
      apellidos: 'Pérez García',
      email: 'juan.perez@sena.edu.co',
      telefono: '3011234567',
      ficha: ficha1, // Servicios Comerciales - Mixta
      sede: sedePrincipal
    },
    {
      numero_documento: '1002345678',
      nombres: 'María José',
      apellidos: 'González López',
      email: 'maria.gonzalez@sena.edu.co',
      telefono: '3012345678',
      ficha: ficha1, // Servicios Comerciales - Mixta
      sede: sedePrincipal
    },
    {
      numero_documento: '1003456789',
      nombres: 'Carlos Andrés',
      apellidos: 'Rodríguez Martínez',
      email: 'carlos.rodriguez@sena.edu.co',
      telefono: '3013456789',
      ficha: ficha2, // Operaciones Comerciales - Nocturna
      sede: sedePrincipal
    },
    {
      numero_documento: '1004567890',
      nombres: 'Ana Sofía',
      apellidos: 'Ramírez Torres',
      email: 'ana.ramirez@sena.edu.co',
      telefono: '3014567890',
      ficha: ficha2, // Operaciones Comerciales - Nocturna
      sede: sedePrincipal
    },
    {
      numero_documento: '1005678901',
      nombres: 'Luis Fernando',
      apellidos: 'Herrera Silva',
      email: 'luis.herrera@sena.edu.co',
      telefono: '3015678901',
      ficha: ficha3, // Análisis y Desarrollo - Madrugada
      sede: sedeTIC
    },
    {
      numero_documento: '1006789012',
      nombres: 'Diana Patricia',
      apellidos: 'Castro Morales',
      email: 'diana.castro@sena.edu.co',
      telefono: '3016789012',
      ficha: ficha3, // Análisis y Desarrollo - Madrugada
      sede: sedeTIC
    },
    {
      numero_documento: '1007890123',
      nombres: 'Miguel Ángel',
      apellidos: 'Vargas Jiménez',
      email: 'miguel.vargas@sena.edu.co',
      telefono: '3017890123',
      ficha: ficha1, // Servicios Comerciales - Mixta
      sede: sedePrincipal
    },
    {
      numero_documento: '1008901234',
      nombres: 'Claudia Marcela',
      apellidos: 'Ortiz Ruiz',
      email: 'claudia.ortiz@sena.edu.co',
      telefono: '3018901234',
      ficha: ficha2, // Operaciones Comerciales - Nocturna
      sede: sedePrincipal
    }
  ];

  for (const aspiranteData of aspirantes) {
    let persona = await personaRepository.findOne({ 
      where: { numero_documento: aspiranteData.numero_documento } 
    });

    if (!persona) {
      const personaCreate = {
        numero_documento: aspiranteData.numero_documento,
        tipo_documento: 'CC',
        nombres: aspiranteData.nombres,
        apellidos: aspiranteData.apellidos,
        email: aspiranteData.email,
        telefono: aspiranteData.telefono,
        id_centro: centro.id_centro,
        id_sede: aspiranteData.sede?.id_sede,
        id_ficha: aspiranteData.ficha?.id_ficha,
        jornada: aspiranteData.ficha?.jornada || 'mixta'
      };

      persona = await personaRepository.save(personaRepository.create(personaCreate));
      
      // Crear usuario con password basado en el nombre
      const username = `${aspiranteData.nombres.split(' ')[0].toLowerCase()}.${aspiranteData.apellidos.split(' ')[0].toLowerCase()}`;
      const password = `${aspiranteData.nombres.split(' ')[0]}123!`;
      const hashedPassword = await bcrypt.hash(password, 12);

      await usuarioRepository.save(usuarioRepository.create({
        id_persona: persona.id_persona,
        id_rol: aprendizRole.id_rol,
        username: username,
        password_hash: hashedPassword,
      }));

      console.log(`✅ Aspirante creado: ${aspiranteData.nombres} ${aspiranteData.apellidos}`);
      console.log(`   Username: ${username}`);
      console.log(`   Password: ${password}`);
      console.log(`   Ficha: ${aspiranteData.ficha?.numero_ficha || 'N/A'} (${aspiranteData.ficha?.jornada || 'N/A'})`);
    }
  }

  // 3. Algunos votantes adicionales
  const votantes = [
    {
      numero_documento: '1010111213',
      nombres: 'Andrea',
      apellidos: 'Sánchez Gómez',
      ficha: ficha1
    },
    {
      numero_documento: '1011121314',
      nombres: 'David',
      apellidos: 'Torres Vásquez',
      ficha: ficha1
    },
    {
      numero_documento: '1012131415',
      nombres: 'Paola',
      apellidos: 'Mejía Delgado',
      ficha: ficha2
    },
    {
      numero_documento: '1013141516',
      nombres: 'Ricardo',
      apellidos: 'Aguilar Cruz',
      ficha: ficha2
    },
    {
      numero_documento: '1014151617',
      nombres: 'Valentina',
      apellidos: 'Moreno Peña',
      ficha: ficha3
    }
  ];

  for (const votanteData of votantes) {
    let persona = await personaRepository.findOne({ 
      where: { numero_documento: votanteData.numero_documento } 
    });

    if (!persona) {
      const personaCreate = {
        numero_documento: votanteData.numero_documento,
        tipo_documento: 'CC',
        nombres: votanteData.nombres,
        apellidos: votanteData.apellidos,
        email: `${votanteData.nombres.toLowerCase()}.${votanteData.apellidos.split(' ')[0].toLowerCase()}@sena.edu.co`,
        telefono: `301${votanteData.numero_documento.slice(-7)}`,
        id_centro: centro.id_centro,
        id_sede: votanteData.ficha?.numero_ficha === '3070126' ? sedeTIC?.id_sede : sedePrincipal?.id_sede,
        id_ficha: votanteData.ficha?.id_ficha,
        jornada: votanteData.ficha?.jornada || 'mixta'
      };

      persona = await personaRepository.save(personaRepository.create(personaCreate));
      console.log(`✅ Votante creado: ${votanteData.nombres} ${votanteData.apellidos} (${votanteData.ficha?.numero_ficha})`);
    }
  }

  console.log('\n🎯 Resumen de usuarios de prueba creados:');
  console.log('📋 CREDENCIALES DE ACCESO:');
  console.log('');
  console.log('👤 ADMIN:');
  console.log('   Username: admin');
  console.log('   Password: Admin123!');
  console.log('');
  console.log('🗳️ MESA DE VOTACIÓN:');
  console.log('   Username: mesa_votacion');
  console.log('   Password: Mesa123!');
  console.log('');
  console.log('🎓 ASPIRANTES (algunos ejemplos):');
  console.log('   Username: juan.perez    | Password: Juan123!    | Ficha: 3037689 (Mixta)');
  console.log('   Username: maria.gonzalez| Password: María123!   | Ficha: 3037689 (Mixta)');
  console.log('   Username: carlos.rodriguez| Password: Carlos123! | Ficha: 3037399 (Nocturna)');
  console.log('   Username: luis.herrera  | Password: Luis123!    | Ficha: 3070126 (Madrugada)');
  console.log('');
  console.log('📝 Para QR de prueba usar:');
  console.log('   {"numero_documento": "1001234567", "nombre": "Juan Carlos Pérez"}');
  console.log('   {"numero_documento": "1002345678", "nombre": "María José González"}');
  console.log('   O simplemente el número: 1001234567');
}