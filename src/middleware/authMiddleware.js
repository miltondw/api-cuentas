import jwt from "jsonwebtoken";

const verificarToken = (req, res, next) => {
  const token = req.cookies.accessToken;
  
  if (!token) {
    return res.status(403).json({ 
      error: "Acceso denegado",
      solution: "Intenta refrescar el token con /api/auth/refresh"
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({
        error: "Token expirado o inválido",
        actionRequired: "refresh_token"
      });
    }
    
    req.user = decoded;
    next();
  });
};

export default verificarToken;
