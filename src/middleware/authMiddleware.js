import jwt from "jsonwebtoken";

const verificarToken = (req, res, next) => {
  // Obtener el token del encabezado Authorization
  const token = req.header("Authorization")?.split(" ")[1]; // Esto extrae el token después de 'Bearer'

  if (!token) return res.status(403).json({ error: "Acceso denegado" });

  try {
    // Verificar el token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Adjuntar la información del usuario decodificado al request
    next();
  } catch (err) {
    return res.status(400).json({ error: "Token no válido" });
  }
};

export default verificarToken;
