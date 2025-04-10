import crypto from 'crypto';
import jwt from 'jsonwebtoken';

const CSRF_SECRET = process.env.CSRF_SECRET || crypto.randomBytes(32).toString('hex');
const CSRF_COOKIE_NAME = 'csrf_token';
const CSRF_HEADER_NAME = 'X-CSRF-Token';

// Generar token CSRF
export const generateCsrfToken = (req, res, next) => {
  // Solo generar para rutas que lo necesiten (POST, PUT, DELETE)
  if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
    const csrfToken = jwt.sign(
      { 
        timestamp: Date.now(),
        // Vinculamos el token al usuario si está autenticado
        userId: req.user?.id || 'anonymous'
      },
      CSRF_SECRET,
      { expiresIn: '1h' }
    );

    // Establecemos la cookie con el token CSRF
    res.cookie(CSRF_COOKIE_NAME, csrfToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 1000 // 1 hora
    });

    // Agregamos el token a los headers para que el frontend pueda usarlo
    res.setHeader(CSRF_HEADER_NAME, csrfToken);
  }
  next();
};

// Verificar token CSRF
export const verifyCsrfToken = (req, res, next) => {
  // Solo verificar para rutas que modifican datos
  if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
    const csrfCookie = req.cookies[CSRF_COOKIE_NAME];
    const csrfHeader = req.headers[CSRF_HEADER_NAME.toLowerCase()];

    // Verificar que exista token en cookie y header
    if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
      return res.status(403).json({ 
        error: 'CSRF token inválido o no proporcionado'
      });
    }

    try {
      // Verificar que el token sea válido
      jwt.verify(csrfCookie, CSRF_SECRET);
      
      // Regenerar token para la siguiente petición (one-time use)
      const newCsrfToken = jwt.sign(
        { 
          timestamp: Date.now(),
          userId: req.user?.id || 'anonymous'
        },
        CSRF_SECRET,
        { expiresIn: '1h' }
      );

      // Actualizar la cookie con el nuevo token
      res.cookie(CSRF_COOKIE_NAME, newCsrfToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 1000 // 1 hora
      });

      // Actualizar el header con el nuevo token
      res.setHeader(CSRF_HEADER_NAME, newCsrfToken);
    } catch (err) {
      return res.status(403).json({ 
        error: 'CSRF token expirado o inválido'
      });
    }
  }
  next();
}; 