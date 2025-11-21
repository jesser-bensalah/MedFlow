import { Module } from '@nestjs/common';
import { ClinicService } from './clinic.service';
import { ClinicController } from './clinic.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Clinic } from '../entities/clinic.entity';
import { User } from '../entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Clinic, User])
  ],
  providers: [ClinicService],
  controllers: [ClinicController],
  exports: [ClinicService]
})
export class ClinicModule {}
