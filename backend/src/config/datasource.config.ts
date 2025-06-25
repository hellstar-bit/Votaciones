// 📁 src/config/datasource.config.ts
// ====================================================================
import { DataSource } from 'typeorm';
import { config } from 'dotenv';

// Cargar variables de entorno
config();

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 3306,
  username: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'sena_voting_system',
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/../database/migrations/*{.ts,.js}'],
  synchronize: false, // NUNCA en producción
  logging: process.env.NODE_ENV === 'development',
  timezone: 'Z',
});