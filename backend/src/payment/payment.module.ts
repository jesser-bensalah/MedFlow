import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentsService } from './payment.service';
import { PaymentsController } from './payment.controller';
import { Payment } from '../entities/payment.entity';
import { RawBodyMiddleware } from '../middleware/raw-body.middleware';

@Module({
  imports: [
    TypeOrmModule.forFeature([Payment]),
  ],
  providers: [PaymentsService],
  controllers: [PaymentsController],
  exports: [PaymentsService],
})
export class PaymentModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(RawBodyMiddleware)
      .forRoutes({ path: 'payments/webhook', method: RequestMethod.POST });
  }
}
