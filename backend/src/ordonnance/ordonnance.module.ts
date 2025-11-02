import { Module } from '@nestjs/common';
import { OrdonnanceService } from './ordonnance.service';
import { OrdonnanceController } from './ordonnance.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Ordonnance } from '../entities/ordonnance.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Ordonnance])],
  providers: [OrdonnanceService],
  controllers: [OrdonnanceController],
  exports: [OrdonnanceService]
})
export class OrdonnanceModule {}
