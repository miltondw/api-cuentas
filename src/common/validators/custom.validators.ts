import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

@ValidatorConstraint({ async: false })
export class IsStrongPasswordConstraint
  implements ValidatorConstraintInterface
{
  validate(password: string, args: ValidationArguments) {
    if (!password) return false;

    // At least 8 characters long
    if (password.length < 8) return false;

    // Contains uppercase letter
    if (!/[A-Z]/.test(password)) return false;

    // Contains lowercase letter
    if (!/[a-z]/.test(password)) return false;

    // Contains number
    if (!/\d/.test(password)) return false;

    // Contains special character
    if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) return false;

    return true;
  }

  defaultMessage(args: ValidationArguments) {
    return 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character';
  }
}

export function IsStrongPassword(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsStrongPasswordConstraint,
    });
  };
}

@ValidatorConstraint({ async: false })
export class IsValidNameConstraint implements ValidatorConstraintInterface {
  validate(name: string, args: ValidationArguments) {
    if (!name) return false;

    // Only letters, spaces, hyphens, and apostrophes
    const nameRegex = /^[a-zA-ZÀ-ÿĀ-žА-я\s'-]+$/;

    // Must be between 2 and 50 characters
    if (name.length < 2 || name.length > 50) return false;

    // Must match regex
    if (!nameRegex.test(name)) return false;

    // Cannot start or end with space
    if (name.trim() !== name) return false;

    // Cannot have multiple consecutive spaces
    if (/\s{2,}/.test(name)) return false;

    return true;
  }

  defaultMessage(args: ValidationArguments) {
    return 'Name must be between 2 and 50 characters and contain only letters, spaces, hyphens, and apostrophes';
  }
}

export function IsValidName(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidNameConstraint,
    });
  };
}
