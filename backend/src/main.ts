// 📁 src/main.ts
// ====================================================================
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
  
  // Configuración global
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
      // Configurar headers para imágenes
      if (path.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
        res.set('Cache-Control', 'public, max-age=31536000'); // Cache por 1 año
        res.set('Content-Type', 'image/*');
      }
    }
  });
  
  // Seguridad - 🔧 Modificado para permitir imágenes
  app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }, // Permitir carga de imágenes
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "blob:", "*"], // Permitir imágenes de cualquier origen
      },
    },
  }));
  
  app.use(compression());
  
  // CORS
  app.enableCors({
    origin: configService.get('CORS_ORIGIN') || ['http://localhost:5173', 'http://localhost:3000'],
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
  console.log(`📁 Archivos estáticos: http://localhost:${port}/uploads/`);
  console.log(`📸 Fotos candidatos: http://localhost:${port}/uploads/candidates/`);
}

bootstrap();