import { PartialType } from '@nestjs/mapped-types';
import { CreateOrdonnanceDto } from './create-ordonnance.dto';
import { IsDateString, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateOrdonnanceDto extends PartialType(CreateOrdonnanceDto) {
  @IsOptional()
  @IsString()
  contenu?: string;

  @IsOptional()
  @IsDateString()
  date?: Date;

  @IsOptional()
  @IsNumber()
  patientId?: number;

  @IsOptional()
  @IsNumber()
  doctorId?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}