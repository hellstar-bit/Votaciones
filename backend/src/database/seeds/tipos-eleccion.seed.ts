// 📁 src/database/seeds/tipos-eleccion.seed.ts
// ====================================================================
import { DataSource } from 'typeorm';
import { TipoEleccion } from '../../elections/entities/tipo-eleccion.entity';

export async function seedTiposEleccion(dataSource: DataSource) {
  const tipoEleccionRepository = dataSource.getRepository(TipoEleccion);

  const tiposEleccion = [
    {
      nombre_tipo: 'REPRESENTANTE_CENTRO',
      descripcion: 'Representante de Centro por Jornada (3 representantes: mixta, nocturna, madrugada)',
      nivel_aplicacion: 'centro',
      max_candidatos_por_jornada: 1,
      requiere_jornada: true,
    },
    {
      nombre_tipo: 'VOCERO_FICHA',
      descripcion: 'Vocero de Ficha (1 vocero por ficha/grupo)',
      nivel_aplicacion: 'ficha',
      max_candidatos_por_jornada: 1,
      requiere_jornada: false,
    },
  ];

  for (const tipoData of tiposEleccion) {
    const existingTipo = await tipoEleccionRepository.findOne({
      where: { nombre_tipo: tipoData.nombre_tipo },
    });

    if (!existingTipo) {
      const tipo = tipoEleccionRepository.create(tipoData);
      await tipoEleccionRepository.save(tipo);
      console.log(`✅ Tipo de elección creado: ${tipoData.nombre_tipo}`);
    } else {
      console.log(`⚠️  Tipo de elección ya existe: ${tipoData.nombre_tipo}`);
    }
  }
}