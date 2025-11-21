import { IsNotEmpty, IsNumber, IsOptional, IsString, registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

// Custom validator for date strings
export function IsValidDate(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isValidDate',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any) {
          return !isNaN(Date.parse(value));
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a valid date`;
        },
      },
    });
  };
}

export class CreateOrdonnanceDto {
  @IsNotEmpty()
  @IsValidDate({ message: 'date must be a valid date string' })
  date: string | Date;

  @IsNotEmpty()
  @IsNumber()
  patientId: number;

  @IsNotEmpty()
  @IsNumber()
  doctorId: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  nomClinique?: string;

  @IsNotEmpty()
  @IsValidDate({ message: 'dateExpiration must be a valid date string' })
  dateExpiration: string | Date;

  @IsNotEmpty()
  @IsString()
  medicaments: string;
  
}