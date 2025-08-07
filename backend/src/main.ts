import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import * as compression from 'compression';
import { join } from 'path';
import * as fs from 'fs';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  const configService = app.get(ConfigService);
  
  // 🆕 Crear carpetas de uploads si no existen
  const uploadsPath = join(process.cwd(), 'uploads');
  const candidatesPath = join(uploadsPath, 'candidates');
  
  if (!fs.existsSync(uploadsPath)) {
    fs.mkdirSync(uploadsPath, { recursive: true });
    console.log('📁 Carpeta uploads creada');
  }
  
  if (!fs.existsSync(candidatesPath)) {
    fs.mkdirSync(candidatesPath, { recursive: true });
    console.log('📁 Carpeta uploads/candidates creada');
  }

  // 🆕 Servir archivos estáticos desde /uploads
  app.useStaticAssets(uploadsPath, {
    prefix: '/uploads/',
    setHeaders: (res, path) => {
      if (path.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
        res.set('Cache-Control', 'public, max-age=31536000');
        res.set('Content-Type', 'image/*');
      }
    }
  });
  
  // Seguridad
  app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "blob:", "*"],
      },
    },
  }));
  
  app.use(compression());
  
  // 🔧 CORS MEJORADO - Manejar múltiples orígenes y limpiar barras finales
  const corsOrigin = configService.get('CORS_ORIGIN');
  let allowedOrigins: string[] = [];
  
  if (corsOrigin) {
    // Si viene del .env, puede ser una cadena o múltiples separados por coma
    if (typeof corsOrigin === 'string') {
      allowedOrigins = corsOrigin
        .split(',')
        .map(origin => origin.trim())
        .map(origin => origin.endsWith('/') ? origin.slice(0, -1) : origin) // 🔧 Remover barra final
        .filter(origin => origin.length > 0);
    }
  }
  
  // Orígenes por defecto para desarrollo
  const defaultOrigins = [
    'http://localhost:3001', // Frontend principal
    'http://localhost:3000', // Backup
    'http://localhost:5173', // Vite default
  ];
  
  const finalOrigins = allowedOrigins.length > 0 ? allowedOrigins : defaultOrigins;
  
  console.log('🌐 CORS configurado para:', finalOrigins);
  
  app.enableCors({
    origin: finalOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
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
  console.log(`📁 Archivos estáticos: http://localhost:${port}/uploads/`);
  console.log(`📸 Fotos candidatos: http://localhost:${port}/uploads/candidates/`);
}

bootstrap();