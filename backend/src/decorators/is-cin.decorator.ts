import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

export function IsCIN(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isCIN',
      target: object.constructor,
      propertyName: propertyName,
      options: {
        message: 'CIN must be exactly 8 numeric characters',
        ...validationOptions,
      },
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (value === null || value === undefined) return true; 
          return typeof value === 'string' && /^\d{8}$/.test(value);
        },
      },
    });
  };
}
