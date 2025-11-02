import { Module } from '@nestjs/common';
import { FactureService } from './facture.service';
import { FactureController } from './facture.controller';

@Module({
  providers: [FactureService],
  controllers: [FactureController]
})
export class FactureModule {}
