import { PartialType } from '@nestjs/mapped-types';
import { CreateOrdonnanceDto, IsValidDate } from './create-ordonnance.dto';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateOrdonnanceDto extends PartialType(CreateOrdonnanceDto) {

  @IsOptional()
  @IsValidDate({ message: 'date must be a valid date string' })
  date?: string | Date;

  @IsOptional()
  @IsNumber()
  patientId?: number;

  @IsOptional()
  @IsNumber()
  doctorId?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  nomClinique?: string;

  @IsOptional()
  @IsValidDate({ message: 'dateExpiration must be a valid date string' })
  dateExpiration?: string | Date;

  @IsOptional()
  @IsString()
  medicaments?: string;
}