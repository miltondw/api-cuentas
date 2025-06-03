import rateLimit from "express-rate-limit";

// Función para obtener la IP real del cliente
const getClientIP = (req) => {
  // Si trust proxy está deshabilitado, usar req.ip directamente
  if (!req.app.get('trust proxy')) {
    return req.ip || req.connection.remoteAddress;
  }
  
  // Con trust proxy habilitado, priorizar headers de proxy
  const forwarded = req.headers['x-forwarded-for'];
  const realIp = req.headers['x-real-ip'];
  const cfConnectingIp = req.headers['cf-connecting-ip'];
  
  if (cfConnectingIp) return cfConnectingIp;
  if (realIp) return realIp;
  if (forwarded) {
    // X-Forwarded-For puede contener múltiples IPs, tomar la primera
    return forwarded.split(',')[0].trim();
  }
  
  return req.ip || req.connection.remoteAddress || 'unknown';
};

// Limitar los intentos de login para prevenir ataques de fuerza bruta
export const loginLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutos
  max: 5, // Limitar a 5 intentos por IP en la ventana de tiempo
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error:
      "Demasiados intentos de inicio de sesión. Por favor, intente de nuevo después de 15 minutos.",
    remainingTime: (req) =>
      Math.ceil(req.rateLimit.resetTime - Date.now()) / 1000 / 60,
  },
  keyGenerator: getClientIP, // Usar función personalizada para obtener IP
});

// Limitar las solicitudes de registro para evitar la creación masiva de cuentas
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 3, // Máximo 3 registros por IP en una hora
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error:
      "Demasiados intentos de registro. Por favor, intente de nuevo después de 1 hora.",
  },
  keyGenerator: getClientIP, // Usar función personalizada para obtener IP
});
