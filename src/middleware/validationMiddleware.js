import { body, validationResult } from 'express-validator';

// Middleware para manejar los errores de validación
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      error: 'Error de validación', 
      details: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  next();
};

// Validaciones para el registro de usuario
export const validateRegister = [
  body('name')
    .trim()
    .notEmpty().withMessage('El nombre es obligatorio')
    .isLength({ min: 2, max: 50 }).withMessage('El nombre debe tener entre 2 y 50 caracteres')
    .escape(),
  
  body('email')
    .trim()
    .notEmpty().withMessage('El email es obligatorio')
    .isEmail().withMessage('Debe proporcionar un email válido')
    .normalizeEmail(),
  
  body('password')
    .notEmpty().withMessage('La contraseña es obligatoria')
    .isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('La contraseña debe contener al menos una letra mayúscula, una minúscula y un número'),
  
  body('rol')
    .notEmpty().withMessage('El rol es obligatorio')
    .isIn(['admin', 'usuario']).withMessage('Rol no válido'),
  
  handleValidationErrors
];

// Validaciones para el login de usuario
export const validateLogin = [
  body('email')
    .trim()
    .notEmpty().withMessage('El email es obligatorio')
    .isEmail().withMessage('Debe proporcionar un email válido')
    .normalizeEmail(),
  
  body('password')
    .notEmpty().withMessage('La contraseña es obligatoria'),
  
  handleValidationErrors
]; 