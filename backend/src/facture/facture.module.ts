import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Facture } from '../entities/facture.entity';
import { User } from '../entities/user.entity';
import { Clinic } from '../entities/clinic.entity';
import { FactureService } from './facture.service';
import { FactureController } from './facture.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Facture, User, Clinic]),
  ],
  controllers: [FactureController],
  providers: [FactureService],
  exports: [FactureService],
})
export class FactureModule {}
