// 📁 backend/src/config/database.config.ts
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

export const getDatabaseConfig = (configService: ConfigService): TypeOrmModuleOptions => ({
  type: 'postgres', // 🔧 CAMBIO: De 'mysql' a 'postgres'
  host: configService.get('DB_HOST'),
  port: +configService.get('DB_PORT'),
  username: configService.get('DB_USERNAME'),
  password: configService.get('DB_PASSWORD'),
  database: configService.get('DB_DATABASE'),
  
  // 🔧 CONFIGURACIONES ESPECÍFICAS PARA POSTGRESQL
  ssl: configService.get('NODE_ENV') === 'production' ? {
    rejectUnauthorized: false // Para Supabase
  } : false,
  
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/../database/migrations/*{.ts,.js}'],
  
  // 🔧 AQUÍ PUEDES CAMBIAR EL SYNCHRONIZE
  synchronize: false, // Solo en desarrollo

  // 🔧 SI QUIERES FORZAR SYNCHRONIZE EN PRODUCCIÓN (NO RECOMENDADO):
  // synchronize: true, // ⚠️ PELIGROSO EN PRODUCCIÓN
  
  // 🔧 SI QUIERES DESACTIVAR SYNCHRONIZE EN DESARROLLO:
  // synchronize: false, // Para usar solo migraciones
  
  logging: configService.get('NODE_ENV') === 'development',
  
  // 🔧 CONFIGURACIONES ADICIONALES PARA POSTGRESQL
  extra: {
    connectionLimit: 10,
    acquireConnectionTimeout: 60000,
    timeout: 60000,
    keepAlive: true,
  },
});