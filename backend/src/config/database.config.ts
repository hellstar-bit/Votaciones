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
  synchronize: false, // Solo en desarrollo
  logging: configService.get('NODE_ENV') === 'development',
  
  // 🔧 TIMEZONE PARA POSTGRESQL  
  // 🔧 CONFIGURACIONES ADICIONALES PARA POSTGRESQL
  extra: {
    connectionLimit: 10,
    acquireConnectionTimeout: 60000,
    timeout: 60000,
    keepAlive: true,
  },
});