import { IsString, IsArray, IsNumber, IsEnum, IsOptional, IsISO8601, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export enum FactureEtat {
  PAYEE = 'Payée',
  NON_PAYEE = 'Non Payée'
}

export class ServiceItemDto {
  @IsString()
  description: string;

  @IsNumber()
  amount: number;
}

export class CreateFactureDto {
  @IsString()
  patientName: string;

  @IsISO8601()
  appointmentDate: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ServiceItemDto)
  services: ServiceItemDto[];

  @IsNumber()
  total: number;

  @IsEnum(['cash', 'card', 'check', 'transfer'])
  paymentMethod: 'cash' | 'card' | 'check' | 'transfer';

  @IsISO8601()
  date: string;

  @IsEnum(FactureEtat)
  @IsOptional()
  etat?: FactureEtat;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsNumber()
  patientId?: number;

  @IsOptional()
  @IsNumber()
  doctorId?: number;

  @IsOptional()
  @IsNumber()
  clinicId?: number;
}