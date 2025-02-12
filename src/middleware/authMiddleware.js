import jwt from "jsonwebtoken";

const verificarToken = (req, res, next) => {
  // Extraemos el token de la cookie "accessToken"
  const token = req.cookies.accessToken;
  if (!token) return res.status(403).json({ error: "Acceso denegado" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Token no válido" });
  }
};

export default verificarToken;
