import { 
  Body, 
  Controller, 
  Post, 
  HttpStatus, 
  HttpException, 
  Req, 
  Res, 
  HttpCode, 
  BadRequestException, 
  InternalServerErrorException,
  UseGuards
} from '@nestjs/common';
import type { Response } from 'express';
import { RawBodyMiddleware } from '../middleware/raw-body.middleware';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { PaymentStatus } from '../entities/payment.entity';
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto';
import { PaymentsService } from './payment.service';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly configService: ConfigService
  ) {}

  @Post('create-payment-intent')
  @ApiOperation({ summary: 'Create a payment intent' })
  @ApiResponse({ 
    status: 201, 
    description: 'Payment intent created successfully',
    schema: {
      type: 'object',
      properties: {
        clientSecret: { type: 'string' },
        paymentIntentId: { type: 'string' }
      }
    }
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad Request',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number' },
        message: { type: 'string' },
        error: { type: 'string' }
      }
    }
  })
  @ApiBody({ type: CreatePaymentIntentDto })
  async createPaymentIntent(@Body() createPaymentIntentDto: CreatePaymentIntentDto) {
    try {
      return await this.paymentsService.createPaymentIntent(createPaymentIntentDto);
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Failed to create payment intent',
          error: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }


  @Post('webhook')
  @HttpCode(200)
  async handleStripeWebhook(
    @Req() request: { rawBody: Buffer; headers: Record<string, string> },
    @Res() response: Response
  ) {
    const sig = request.headers['stripe-signature'];
    
    if (!sig) {
      throw new BadRequestException('Missing stripe-signature header');
    }

    const stripeSecret = this.configService.get<string>('STRIPE_SECRET_KEY');
    const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');
    
    if (!stripeSecret || !webhookSecret) {
      throw new InternalServerErrorException('Stripe configuration is missing');
    }

    let event: Stripe.Event;
    const rawBody = request.rawBody;

    try {
      const stripe = new Stripe(stripeSecret, {
        apiVersion: '2025-10-29.clover',
        typescript: true,
      });
      
      event = stripe.webhooks.constructEvent(
        rawBody,
        sig,
        webhookSecret,
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      throw new BadRequestException(`Webhook Error: ${err.message}`);
    }

    try {
      // Handle the event
      switch (event.type) {
        case 'payment_intent.succeeded':
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          await this.paymentsService.updatePaymentStatus(
            paymentIntent.id,
            PaymentStatus.SUCCEEDED,
          );
          console.log('PaymentIntent was successful:', paymentIntent.id);
          break;
          
        case 'payment_intent.payment_failed':
          const failedPaymentIntent = event.data.object as Stripe.PaymentIntent;
          await this.paymentsService.updatePaymentStatus(
            failedPaymentIntent.id,
            PaymentStatus.FAILED,
          );
          console.error('Payment failed:', failedPaymentIntent.id);
          break;
          
        
        case 'payment_method.attached':
          const paymentMethod = event.data.object as Stripe.PaymentMethod;
          console.log('PaymentMethod was attached:', paymentMethod.id);
          break;
          
        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      // Return a response to acknowledge receipt of the event
      return response.status(200).json({ received: true });
    } catch (error) {
      console.error('Error processing webhook event:', error);
      response.status(500).json({ error: 'Error processing webhook event' });
    }
  }
}