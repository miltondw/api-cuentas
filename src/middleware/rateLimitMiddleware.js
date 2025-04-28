import rateLimit from "express-rate-limit";

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
  keyGenerator: (req) => req.ip, // Usa la IP como identificador
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
  keyGenerator: (req) => req.ip,
});
