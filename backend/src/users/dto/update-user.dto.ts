import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';
import { IsEmail, IsOptional, IsEnum, MinLength, IsString, IsDateString } from 'class-validator';
import { UserRole } from '../../enums/user-role.enum';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @IsOptional()
  @IsEmail({}, { message: "L'email doit être une adresse email valide" })
  email?: string;

  @IsOptional()
  @MinLength(6, { message: 'Le mot de passe doit contenir au moins 6 caractères' })
  password?: string;

  @IsOptional()
  firstName?: string;

  @IsOptional()
  lastName?: string;

  @IsOptional()
  @IsEnum(UserRole, { message: 'Rôle utilisateur invalide' })
  role?: UserRole;

  @IsOptional()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  specialite?: string;

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

}