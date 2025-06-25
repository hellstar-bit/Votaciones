// 📁 src/main.ts
// ====================================================================
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import * as compression from 'compression';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Configuración global
  const configService = app.get(ConfigService);
  
  // Seguridad
  app.use(helmet());
  app.use(compression());
  
  // CORS
  app.enableCors({
    origin: configService.get('CORS_ORIGIN'),
    credentials: true,
  });
  
  // Validación global
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));
  
  // Prefijo global para APIs
  app.setGlobalPrefix('api/v1');
  
  const port = configService.get('PORT') || 3000;
  await app.listen(port);
  
  console.log(`🚀 Backend corriendo en: http://localhost:${port}`);
  console.log(`📖 Documentación: http://localhost:${port}/api/v1`);
}

bootstrap();