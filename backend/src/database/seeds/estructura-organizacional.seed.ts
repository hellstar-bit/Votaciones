// 📁 src/database/seeds/estructura-organizacional.seed.ts
// ====================================================================
import { DataSource } from 'typeorm';
import { Regional } from '../../users/entities/regional.entity';
import { Centro } from '../../users/entities/centro.entity';
import { Sede } from '../../users/entities/sede.entity';
import { Ficha } from '../../users/entities/ficha.entity';

export async function seedEstructuraOrganizacional(dataSource: DataSource) {
  const regionalRepository = dataSource.getRepository(Regional);
  const centroRepository = dataSource.getRepository(Centro);
  const sedeRepository = dataSource.getRepository(Sede);
  const fichaRepository = dataSource.getRepository(Ficha);

  // Crear Regional Atlántico
  let regional = await regionalRepository.findOne({
    where: { codigo_regional: '8' },
  });

  if (!regional) {
    regional = regionalRepository.create({
      codigo_regional: '8',
      nombre_regional: 'ATLANTICO',
    });
    await regionalRepository.save(regional);
    console.log('✅ Regional Atlántico creada');
  }

  // Crear Centro Colombo Alemán
  let centro = await centroRepository.findOne({
    where: { codigo_centro: '9207' },
  });

  if (!centro) {
    centro = centroRepository.create({
      id_regional: regional.id_regional,
      codigo_centro: '9207',
      nombre_centro: 'CENTRO NACIONAL COLOMBO ALEMAN',
    });
    await centroRepository.save(centro);
    console.log('✅ Centro Colombo Alemán creado');
  }

  // Crear Sedes
  const sedesData = [
    {
      codigo_sede: 'PRINCIPAL',
      nombre_sede: 'Sede Principal',
      direccion: 'Calle 30 #3E-164, Barranquilla',
    },
    {
      codigo_sede: 'TIC',
      nombre_sede: 'Sede TIC',
      direccion: 'Carrera 54 #68-80, El Prado, Barranquilla',
    },
    {
      codigo_sede: 'ENERGIA',
      nombre_sede: 'Sede Energía',
      direccion: 'Calle 28 #23-18, Montes, Barranquilla',
    },
  ];

  const sedes = [];
  for (const sedeData of sedesData) {
    let sede = await sedeRepository.findOne({
      where: { codigo_sede: sedeData.codigo_sede, id_centro: centro.id_centro },
    });

    if (!sede) {
      sede = sedeRepository.create({
        id_centro: centro.id_centro,
        ...sedeData,
      });
      await sedeRepository.save(sede);
      console.log(`✅ Sede creada: ${sedeData.nombre_sede}`);
    }
    sedes.push(sede);
  }

  // Crear Fichas de ejemplo
  const fichasData = [
    {
      numero_ficha: '3037689',
      nombre_programa: 'SERVICIOS COMERCIALES Y FINANCIEROS',
      jornada: 'mixta',
      fecha_inicio: new Date('2024-07-08'),
      fecha_fin: new Date('2025-10-08'),
      sede: sedes[0], // Sede Principal
    },
    {
      numero_ficha: '3037399',
      nombre_programa: 'OPERACIONES COMERCIALES',
      jornada: 'nocturna',
      fecha_inicio: new Date('2024-07-08'),
      fecha_fin: new Date('2025-07-07'),
      sede: sedes[0], // Sede Principal
    },
    {
      numero_ficha: '3070126',
      nombre_programa: 'ANÁLISIS Y DESARROLLO DE SOFTWARE',
      jornada: 'madrugada',
      fecha_inicio: new Date('2024-09-16'),
      fecha_fin: new Date('2026-12-15'),
      sede: sedes[1], // Sede TIC
    },
  ];

  for (const fichaData of fichasData) {
    const existingFicha = await fichaRepository.findOne({
      where: { numero_ficha: fichaData.numero_ficha },
    });

    if (!existingFicha) {
      const ficha = fichaRepository.create({
        numero_ficha: fichaData.numero_ficha,
        nombre_programa: fichaData.nombre_programa,
        jornada: fichaData.jornada as any,
        fecha_inicio: fichaData.fecha_inicio,
        fecha_fin: fichaData.fecha_fin,
        id_centro: centro.id_centro,
        id_sede: fichaData.sede.id_sede,
      });
      await fichaRepository.save(ficha);
      console.log(`✅ Ficha creada: ${fichaData.numero_ficha}`);
    }
  }
}