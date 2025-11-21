import { IsEmail, IsString, MinLength, IsEnum, IsOptional, ValidateIf, IsNotEmpty, IsDateString } from 'class-validator';
import { UserRole } from '../../enums/user-role.enum';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsEnum(UserRole)
  role: UserRole;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  emergencyContact?: string;

  @IsOptional()
  @IsDateString()
  dateNaissance?: string;

  @IsOptional()
  clinicId?: number;

  @ValidateIf(o => o.role === 'doctor')
  @IsString()
  @IsNotEmpty({ message: 'La spécialité est requise pour un médecin' })
  specialite?: string;
} 