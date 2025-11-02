import { IsDateString, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateOrdonnanceDto {
  @IsNotEmpty()
  @IsString()
  contenu: string;

  @IsNotEmpty()
  @IsDateString()
  date: Date;

  @IsNotEmpty()
  @IsNumber()
  patientId: number;

  @IsNotEmpty()
  @IsNumber()
  doctorId: number;

  @IsOptional()
  @IsString()
  notes?: string;
}