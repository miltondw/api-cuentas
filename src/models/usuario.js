import db from "../config/db.js";

// Crear un nuevo usuario
const createUsuario = async (data) => {
  const { name, email, password, rol } = data;

  try {
    // Verificar si el email ya existe
    const [existingUser] = await db.query("SELECT id FROM usuarios WHERE email = ?", [email]);
    if (existingUser.length > 0) {
      const error = new Error("El email ya está registrado");
      error.status = 409; // Conflict
      throw error;
    }

    // Crear el usuario con valores iniciales de seguridad
    const [results] = await db.query(
      `INSERT INTO usuarios (
        name, 
        email, 
        password, 
        rol, 
        failed_attempts, 
        last_failed_attempt,
        account_locked_until
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [name, email, password, rol, 0, null, null]
    );

    return results;
  } catch (err) {
    console.error("Error en createUsuario:", err);
    throw err;
  }
};

// Obtener un usuario por email
const getUsuarioByEmail = async (email) => {
  try {
    const [results] = await db.query("SELECT * FROM usuarios WHERE email = ?", [email]);
    return results[0] || null;
  } catch (err) {
    console.error("❌ Error en getUsuarioByEmail:", err);
    throw err;
  }
};

// Registrar un intento fallido de login
const registerFailedAttempt = async (userId) => {
  try {
    const now = new Date();
    
    // Incrementar el contador de intentos fallidos y registrar la fecha/hora
    const [result] = await db.query(
      `UPDATE usuarios 
       SET failed_attempts = failed_attempts + 1, 
           last_failed_attempt = ?
       WHERE id = ?`,
      [now, userId]
    );
    
    // Obtener el número actual de intentos fallidos
    const [userInfo] = await db.query(
      "SELECT failed_attempts FROM usuarios WHERE id = ?",
      [userId]
    );
    
    // Si hay demasiados intentos fallidos, bloquear la cuenta temporalmente
    if (userInfo[0]?.failed_attempts >= 5) {
      // Bloquear la cuenta por 15 minutos
      const lockUntil = new Date(now.getTime() + 15 * 60 * 1000);
      
      await db.query(
        "UPDATE usuarios SET account_locked_until = ? WHERE id = ?",
        [lockUntil, userId]
      );
      
      return {
        isLocked: true,
        lockedUntil: lockUntil
      };
    }
    
    return {
      isLocked: false,
      attempts: userInfo[0]?.failed_attempts || 0
    };
  } catch (err) {
    console.error("Error en registerFailedAttempt:", err);
    throw err;
  }
};

// Resetear los intentos fallidos después de un login exitoso
const resetFailedAttempts = async (userId) => {
  try {
    await db.query(
      `UPDATE usuarios 
       SET failed_attempts = 0, 
           last_failed_attempt = NULL,
           account_locked_until = NULL
       WHERE id = ?`,
      [userId]
    );
  } catch (err) {
    console.error("Error en resetFailedAttempts:", err);
    throw err;
  }
};

// Verificar si una cuenta está bloqueada temporalmente
const isAccountLocked = async (userId) => {
  try {
    const [results] = await db.query(
      "SELECT account_locked_until FROM usuarios WHERE id = ?",
      [userId]
    );
    
    if (!results[0] || !results[0].account_locked_until) {
      return {
        isLocked: false
      };
    }
    
    const now = new Date();
    const lockedUntil = new Date(results[0].account_locked_until);
    
    // Si el tiempo de bloqueo ha pasado, desbloquear la cuenta
    if (now > lockedUntil) {
      await db.query(
        `UPDATE usuarios 
         SET account_locked_until = NULL
         WHERE id = ?`,
        [userId]
      );
      
      return {
        isLocked: false
      };
    }
    
    return {
      isLocked: true,
      lockedUntil
    };
  } catch (err) {
    console.error("Error en isAccountLocked:", err);
    throw err;
  }
};

export { 
  createUsuario, 
  getUsuarioByEmail,
  registerFailedAttempt,
  resetFailedAttempts,
  isAccountLocked
};
