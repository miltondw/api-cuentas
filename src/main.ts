// import 'tsconfig-paths/register'; // Commented out to fix build issues - paths handled in start.js
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import * as compression from 'compression';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { RateLimitMiddleware } from './common/middleware/rate-limit.middleware';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  // Trust proxy configuration - for development, we disable it
  // In production behind a load balancer, this should be configured properly
  const expressInstance = app.getHttpAdapter().getInstance();
  const trustProxy = configService.get('TRUST_PROXY') === 'true';
  expressInstance.set('trust proxy', trustProxy);
  // Custom rate limiting middleware for specific paths
  const rateLimitMiddleware = new RateLimitMiddleware();
  app.use((req, res, next) => rateLimitMiddleware.use(req, res, next));

  // Security middlewares
  app.use(helmet());
  app.use(compression());
  app.use(cookieParser()); // CORS configuration - more permissive for development
  const corsOrigins = configService.get('CORS_ORIGINS');
  const allowedOrigins = corsOrigins
    ? corsOrigins.split(',').map(origin => origin.trim())
    : [configService.get('FRONTEND_URL') || 'http://localhost:5173'];

  // In development, also allow the same origin (Swagger UI)
  const port = configService.get('PORT') || 5051;
  const currentOrigin = `http://localhost:${port}`;

  if (!allowedOrigins.includes(currentOrigin)) {
    allowedOrigins.push(currentOrigin);
  }

  // In production, allow the Render URL and Swagger UI
  const renderUrl = configService.get('RENDER_EXTERNAL_URL');
  if (renderUrl && !allowedOrigins.includes(renderUrl)) {
    allowedOrigins.push(renderUrl);
  }

  // Always allow the same origin for Swagger UI
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
  const host =
    process.env.NODE_ENV === 'production'
      ? renderUrl
        ? new URL(renderUrl).host
        : 'api-cuentas-zlut.onrender.com'
      : `localhost:${port}`;
  const sameOrigin = `${protocol}://${host}`;

  if (!allowedOrigins.includes(sameOrigin)) {
    allowedOrigins.push(sameOrigin);
  }
  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, Postman, etc.)
      if (!origin) {
        console.log('🌐 CORS: Allowing request with no origin');
        return callback(null, true);
      }

      // Log the origin for debugging
      console.log(`🌐 CORS: Checking origin: ${origin}`);
      console.log(`🌐 CORS: Allowed origins: ${allowedOrigins.join(', ')}`);

      // Allow if origin is in allowed list
      if (allowedOrigins.includes(origin)) {
        console.log(`✅ CORS: Origin ${origin} is allowed`);
        return callback(null, true);
      }

      // In development, be more permissive
      if (process.env.NODE_ENV === 'development') {
        console.log(`✅ CORS: Allowing ${origin} due to development mode`);
        return callback(null, true);
      }

      // In production, also check for common variations
      if (process.env.NODE_ENV === 'production') {
        // Allow if it's the same domain (for Swagger UI)
        const renderDomain = 'api-cuentas-zlut.onrender.com';
        if (origin.includes(renderDomain)) {
          console.log(
            `✅ CORS: Allowing ${origin} as it matches Render domain`,
          );
          return callback(null, true);
        }
      }

      console.log(`❌ CORS: Origin ${origin} not allowed`);
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
      'X-CSRF-Token',
      'Cache-Control',
    ],
    exposedHeaders: ['X-Total-Count'],
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });
  // Global exception filter
  app.useGlobalFilters(new AllExceptionsFilter());

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  // API prefix
  app.setGlobalPrefix('api');

  // Configuración de URLs según el entorno
  const isProduction = configService.get('NODE_ENV') === 'production';
  const productionUrl =
    configService.get('RENDER_EXTERNAL_URL') ||
    'https://api-cuentas-zlut.onrender.com';
  const developmentUrl = `http://localhost:${port}`;

  // Swagger configuration
  let configBuilder = new DocumentBuilder()
    .setTitle('API Cuentas - Ingeocimyc')
    .setDescription(
      `
    API para gestión de solicitudes de servicios y cuentas
    
    ## 🔐 Cómo usar la autenticación:
    
    1. **Hacer login**: Usa el endpoint POST /api/auth/login con credenciales válidas
    2. **Copiar el token**: Del response, copia el valor de 'accessToken'
    3. **Autorizar**: Haz clic en el botón 'Authorize' arriba y pega el token
    4. **Usar endpoints**: Ahora puedes usar todos los endpoints protegidos
    
    ## 👤 Credenciales de prueba:
    - Email: admin@ingeocimyc.com
    - Password: admin123
    `,
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Ingresa tu JWT token aquí',
      },
      'JWT-auth', // Nombre del esquema de seguridad
    );

  // Configurar servidores según el entorno
  if (isProduction) {
    configBuilder = configBuilder
      .addServer(productionUrl, 'Servidor de producción (Render)')
      .addServer(developmentUrl, 'Servidor de desarrollo (fallback)');
  } else {
    configBuilder = configBuilder
      .addServer(developmentUrl, 'Servidor de desarrollo')
      .addServer(productionUrl, 'Servidor de producción (Render)');
  }

  const config = configBuilder.build();
  const document = SwaggerModule.createDocument(app, config);

  // Configuración adicional de Swagger UI
  const swaggerOptions = {
    swaggerOptions: {
      persistAuthorization: true, // Mantiene la autorización entre recargas
      docExpansion: 'none', // No expande automáticamente las secciones
      filter: true, // Habilita el filtro de búsqueda
      showRequestDuration: true, // Muestra la duración de las peticiones
      tryItOutEnabled: true, // Habilita "Try it out" por defecto
    },
    customSiteTitle: 'API Ingeocimyc - Documentación',
    customCss: `
      .topbar-wrapper img { content: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjQwIiB2aWV3Qm94PSIwIDAgMTAwIDQwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8dGV4dCB4PSI1IiB5PSIyNSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE2IiBmb250LXdlaWdodD0iYm9sZCIgZmlsbD0iIzMzNzNkYyI+SW5nZW9jaW15YzwvdGV4dD4KPHN2Zz4K'); }
      .swagger-ui .topbar { background-color: #1e293b; }
      .swagger-ui .info .title { color: #3373dc; }
    `,
  };
  SwaggerModule.setup('api-docs', app, document, swaggerOptions);
  const appPort = configService.get('PORT') || 5051;
  await app.listen(appPort);

  // Mostrar URLs según el entorno
  if (isProduction) {
    console.log(`🚀 Application is running on: ${productionUrl}`);
    console.log(`📚 Swagger docs available at: ${productionUrl}/api-docs`);
    console.log(`🌐 Environment: PRODUCTION`);
  } else {
    console.log(`🚀 Application is running on: http://localhost:${appPort}`);
    console.log(
      `📚 Swagger docs available at: http://localhost:${appPort}/api-docs`,
    );
    console.log(`🌐 Environment: DEVELOPMENT`);
  }
}

bootstrap();
