import { IsNumber, IsString, IsObject, IsOptional, IsNotEmpty, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class PaymentMetadataDto {
  @IsString()
  @IsNotEmpty()
  factureId: string;

  @IsNumber()
  @IsOptional()
  patientId?: number;

  @IsNumber()
  @IsOptional()
  doctorId?: number;

  @IsNumber()
  @IsOptional()
  clinicId?: number;

  [key: string]: any;
}

export class CreatePaymentIntentDto {
  @IsNumber()
  @Min(1, { message: 'Amount must be a positive number' })
  amount: number;

  @IsString()
  @IsOptional()
  currency?: string = 'usd'; 

  @IsObject()
  @ValidateNested()
  @Type(() => PaymentMetadataDto)
  metadata: PaymentMetadataDto;
}