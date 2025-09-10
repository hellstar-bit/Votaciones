// 📁 backend/src/main.ts
// ====================================================================
// 🚀 MAIN.TS OPTIMIZADO PARA RENDER/PRODUCCIÓN
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
  
  const configService = app.get(ConfigService);
  const isProduction = configService.get('NODE_ENV') === 'production';
  
  console.log(`🚀 Iniciando aplicación en modo: ${isProduction ? 'PRODUCCIÓN' : 'DESARROLLO'}`);
  
  // 🆕 Crear carpetas de uploads si no existen
  const uploadsPath = join(process.cwd(), 'uploads');
  const candidatesPath = join(uploadsPath, 'candidates');
  
  try {
    if (!fs.existsSync(uploadsPath)) {
      fs.mkdirSync(uploadsPath, { recursive: true });
      console.log('📁 Carpeta uploads creada');
    }
    
    if (!fs.existsSync(candidatesPath)) {
      fs.mkdirSync(candidatesPath, { recursive: true });
      console.log('📁 Carpeta uploads/candidates creada');
    }
  } catch (error) {
    console.warn('⚠️ No se pudieron crear carpetas de uploads:', error.message);
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
  
  // 🔐 Seguridad mejorada para producción
  if (isProduction) {
    app.use(helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "blob:", "*"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          connectSrc: ["'self'", "wss:", "ws:"],
        },
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
      }
    }));
  } else {
    app.use(helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
      contentSecurityPolicy: false, // Desactivar en desarrollo
    }));
  }
  
  // 🗜️ Compresión
  app.use(compression());
  
  // 🌐 CORS configuración dinámica MEJORADA
  const corsOrigin = configService.get('CORS_ORIGIN');
  let allowedOrigins: string[] = [];
  
  if (corsOrigin) {
    allowedOrigins = corsOrigin
      .split(',')
      .map(origin => origin.trim())
      .map(origin => origin.endsWith('/') ? origin.slice(0, -1) : origin)
      .filter(origin => origin.length > 0);
  }
  
  // 🆕 Orígenes por defecto CORREGIDOS
  const defaultOrigins = [
    'https://votaciones-ochre.vercel.app',
    'http://localhost:3001',
    'http://localhost:3000',
    'http://localhost:5173',  // 👈 PUERTO CORRECTO DE VITE
    'http://localhost:4173',  // 👈 PUERTO PREVIEW DE VITE
    'http://127.0.0.1:5173',  // 👈 ALTERNATIVA LOCALHOST
    'http://127.0.0.1:4173',
  ];
  
  const finalOrigins = allowedOrigins.length > 0 ? allowedOrigins : defaultOrigins;
  
  console.log('🌐 CORS configurado para:', finalOrigins);
  
  // 🆕 CONFIGURACIÓN CORS MEJORADA
  app.enableCors({
    origin: (origin, callback) => {
      // Permitir requests sin origin (como desde Postman o apps móviles)
      if (!origin) return callback(null, true);
      
      // Verificar si el origin está en la lista permitida
      if (finalOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn(`🚫 CORS bloqueado para origen: ${origin}`);
        console.log(`✅ Orígenes permitidos:`, finalOrigins);
        callback(new Error('Not allowed by CORS'), false);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type', 
      'Authorization', 
      'Accept',
      'Origin',
      'X-Requested-With',
      'Access-Control-Allow-Origin',
      'Access-Control-Allow-Headers',
      'Access-Control-Allow-Methods'
    ],
    exposedHeaders: ['set-cookie'],
    optionsSuccessStatus: 200,
    preflightContinue: false,
  });
  
  // ✅ Validación global
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    disableErrorMessages: isProduction, // No mostrar detalles en producción
  }));
  
  // 🚀 Prefijo global para APIs
  app.setGlobalPrefix('api/v1');
  
  // 🔌 Puerto dinámico para Render
  const port = configService.get('PORT') || process.env.PORT || 3000;
  
  // 🚀 Iniciar servidor
  await app.listen(port, '0.0.0.0'); // Bind a todas las interfaces para Render
  
  console.log(`🚀 Backend corriendo en: http://localhost:${port}`);
  console.log(`📖 API Base: http://localhost:${port}/api/v1`);
  console.log(`💚 Health Check: http://localhost:${port}/health`);
  console.log(`📁 Archivos estáticos: http://localhost:${port}/uploads/`);
  
  if (isProduction) {
    console.log('🔒 Modo producción activado');
    console.log('🛡️ Seguridad mejorada habilitada');
  }
}

// 🔧 Manejo de errores no capturados
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

bootstrap();