import { Controller, Get, Head, Res } from '@nestjs/common';
import { Response } from 'express';
import { Public } from './modules/auth/decorators/public.decorator';

/**
 * Root Health Controller
 * This controller handles requests to the root path ("/") without the "/api" prefix
 * It's needed for Render's health checks and to prevent 404 errors on the root path
 */
@Controller() // No path prefix - this handles the root "/"
@Public()
export class RootHealthController {
  @Get()
  getRootHealth(@Res() res: Response): void {
    const currentYear = new Date().getFullYear();
    const environment = process.env.NODE_ENV || 'development';
    const version = process.env.npm_package_version || '1.0.0';

    const html = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>API Ingeocimyc - Sistema de Gestión</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #333;
        }
        
        .container {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
            padding: 40px;
            max-width: 800px;
            width: 90%;
            text-align: center;
            border: 1px solid rgba(255, 255, 255, 0.2);
        }
          .logo {
            font-size: 3rem;
            font-weight: bold;
            background: linear-gradient(135deg, #667eea, #764ba2);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin-bottom: 10px;
        }
        
        .logo-container {
            margin-bottom: 20px;
            display: flex;
            justify-content: center;
            align-items: center;
        }
        
        .logo-container svg {
            filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1));
        }
        
        .subtitle {
            font-size: 1.2rem;
            color: #666;
            margin-bottom: 30px;
        }
        
        .status {
            display: inline-flex;
            align-items: center;
            background: #10b981;
            color: white;
            padding: 8px 20px;
            border-radius: 50px;
            font-weight: 500;
            margin-bottom: 30px;
            box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
        }
        
        .status::before {
            content: "●";
            margin-right: 8px;
            animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
        
        .info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin: 30px 0;
        }
        
        .info-card {
            background: rgba(255, 255, 255, 0.8);
            padding: 20px;
            border-radius: 15px;
            border: 1px solid rgba(0, 0, 0, 0.1);
            transition: transform 0.3s ease;
        }
        
        .info-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
        }
        
        .info-card h3 {
            color: #667eea;
            margin-bottom: 10px;
            font-size: 1.1rem;
        }
        
        .info-card p {
            color: #666;
            font-size: 0.9rem;
        }
        
        .links {
            display: flex;
            gap: 15px;
            justify-content: center;
            flex-wrap: wrap;
            margin-top: 30px;
        }
        
        .btn {
            display: inline-flex;
            align-items: center;
            padding: 12px 24px;
            border-radius: 50px;
            text-decoration: none;
            font-weight: 500;
            transition: all 0.3s ease;
            border: 2px solid transparent;
        }
        
        .btn-primary {
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
        }
        
        .btn-secondary {
            background: transparent;
            color: #667eea;
            border-color: #667eea;
        }
        
        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
        }
        
        .btn-primary:hover {
            box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
        }
        
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid rgba(0, 0, 0, 0.1);
            color: #888;
            font-size: 0.8rem;
        }
        
        .tech-stack {
            display: flex;
            justify-content: center;
            gap: 10px;
            margin: 20px 0;
            flex-wrap: wrap;
        }
        
        .tech-badge {
            background: rgba(102, 126, 234, 0.1);
            color: #667eea;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 0.8rem;
            font-weight: 500;
        }
        
        @media (max-width: 768px) {
            .container {
                padding: 30px 20px;
                margin: 20px;
            }
            
            .logo {
                font-size: 2rem;
            }
            
            .links {
                flex-direction: column;
                align-items: center;
            }
            
            .btn {
                width: 200px;
                justify-content: center;
            }
        }
    </style>
</head>
<body>    <div class="container">
        <div class="logo-container">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 100" width="250" height="83" style="margin-bottom: 10px;">
                <defs>
                    <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
                        <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
                    </linearGradient>
                </defs>
                
                <circle cx="50" cy="50" r="35" fill="url(#logoGradient)" opacity="0.1"/>
                
                <g transform="translate(25, 25)">
                    <rect x="10" y="20" width="30" height="25" fill="url(#logoGradient)" rx="2"/>
                    <rect x="15" y="25" width="5" height="5" fill="white" opacity="0.8"/>
                    <rect x="25" y="25" width="5" height="5" fill="white" opacity="0.8"/>
                    <rect x="15" y="32" width="5" height="5" fill="white" opacity="0.8"/>
                    <rect x="25" y="32" width="5" height="5" fill="white" opacity="0.8"/>
                    
                    <circle cx="45" cy="15" r="8" fill="none" stroke="url(#logoGradient)" stroke-width="2"/>
                    <circle cx="45" cy="15" r="4" fill="url(#logoGradient)"/>
                </g>
                
                <text x="100" y="35" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="url(#logoGradient)">
                    INGEOCIMYC
                </text>
                
                <text x="100" y="55" font-family="Arial, sans-serif" font-size="12" fill="#666">
                    Ingeniería • Geología • Construcción
                </text>
                <text x="100" y="70" font-family="Arial, sans-serif" font-size="12" fill="#666">
                    Investigación • Minería • Consultoría
                </text>
            </svg>
        </div>
        
        <div class="subtitle">Sistema de Gestión de Proyectos y Servicios</div>
        
        <div class="status">
            API Funcionando Correctamente
        </div>
        
        <div class="info-grid">
            <div class="info-card">
                <h3>🚀 Estado del Sistema</h3>
                <p>Activo y funcionando</p>
                <p>Entorno: <strong>${environment}</strong></p>
            </div>
            
            <div class="info-card">
                <h3>📊 Versión</h3>
                <p>API v${version}</p>
                <p>Última actualización: ${new Date().toLocaleDateString('es-ES')}</p>
            </div>
            
            <div class="info-card">
                <h3>🔧 Servicios</h3>
                <p>Gestión de Proyectos</p>
                <p>Laboratorio y Análisis</p>
            </div>
            
            <div class="info-card">
                <h3>📈 Rendimiento</h3>
                <p>Tiempo activo: ${Math.floor(process.uptime() / 3600)}h ${Math.floor((process.uptime() % 3600) / 60)}m</p>
                <p>Estado: Óptimo</p>
            </div>
        </div>
        
        <div class="tech-stack">
            <span class="tech-badge">NestJS</span>
            <span class="tech-badge">TypeScript</span>
            <span class="tech-badge">MySQL</span>
            <span class="tech-badge">JWT Auth</span>
            <span class="tech-badge">Swagger</span>
        </div>
          <div class="links">
            <a href="/api-docs" class="btn btn-primary">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="margin-right: 8px;">
                    <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                </svg>
                Documentación API
            </a>
            <a href="/api/health" class="btn btn-secondary">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="margin-right: 8px;">
                    <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M11,14H13V16H11V14M11,6H13V12H11V6Z"/>
                </svg>
                Health Check
            </a>
            <a href="/info" class="btn btn-secondary">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="margin-right: 8px;">
                    <path d="M13,9H11V7H13M13,17H11V11H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z"/>
                </svg>
                API Info (JSON)
            </a>
        </div>
        
        <div class="footer">
            <p>&copy; ${currentYear} INGEOCIMYC - Ingeniería, Geología, Construcción, Investigación, Minería y Consultoría</p>
            <p>API desarrollada con ❤️ usando NestJS y TypeScript</p>
        </div>
    </div>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  }

  @Head()
  headRootHealth(): void {
    // HEAD requests don't return a body, just headers
    // This method exists to handle HEAD requests from health checkers like Render
    // The response will have status 200 but no body content
  }

  @Get('info')
  getApiInfo(): {
    name: string;
    version: string;
    description: string;
    environment: string;
    timestamp: string;
    status: string;
    uptime: number;
    endpoints: {
      api: string;
      docs: string;
      health: string;
    };
  } {
    return {
      name: 'API Ingeocimyc',
      version: process.env.npm_package_version || '1.0.0',
      description: 'API de Gestión de Proyectos y Servicios INGEOCIMYC',
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
      status: 'running',
      uptime: process.uptime(),
      endpoints: {
        api: '/api',
        docs: '/api-docs',
        health: '/health',
      },
    };
  }

  @Get('health')
  getHealth(): {
    status: string;
    timestamp: string;
    uptime: number;
  } {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }

  @Head('health')
  headHealth(): void {
    // HEAD requests don't return a body, just headers
    // This method exists to handle HEAD requests from health checkers like Render
  }
}
