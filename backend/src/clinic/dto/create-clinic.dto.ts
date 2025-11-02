import { IsString, IsOptional, IsBoolean, IsEmail } from 'class-validator';

export class CreateClinicDto {
  @IsString()
  nomClinic: string;

  @IsString()
  @IsOptional()
  adresseClinic?: string;

  @IsString()
  @IsOptional()
  telephoneClinic?: string;

  @IsEmail()
  @IsOptional()
  emailClinic?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsOptional()
  listeMedecins?: string[];

  @IsOptional()
  listePatients?: string[];
}