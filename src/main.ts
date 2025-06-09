import 'tsconfig-paths/register';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import * as compression from 'compression';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  // Trust proxy configuration - for development, we disable it
  // In production behind a load balancer, this should be configured properly
  const expressInstance = app.getHttpAdapter().getInstance();
  const trustProxy = configService.get('TRUST_PROXY') === 'true';
  expressInstance.set('trust proxy', trustProxy);

  // Security middlewares
  app.use(helmet());
  app.use(compression());
  app.use(cookieParser());
  // CORS configuration - more permissive for development
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

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, Postman, etc.)
      if (!origin) return callback(null, true);
      
      // Allow if origin is in allowed list
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      
      // In development, be more permissive
      if (process.env.NODE_ENV === 'development') {
        return callback(null, true);
      }
      
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
      'Cache-Control'
    ],
    exposedHeaders: ['X-Total-Count'],
    preflightContinue: false,
    optionsSuccessStatus: 204
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
  // Swagger configuration
  const config = new DocumentBuilder()
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
    )    .addServer('http://localhost:5051', 'Servidor de desarrollo')
    .build();
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

  console.log(`🚀 Application is running on: http://localhost:${appPort}`);
  console.log(
    `📚 Swagger docs available at: http://localhost:${appPort}/api-docs`,
  );
}

bootstrap();
