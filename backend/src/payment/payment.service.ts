import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment, PaymentMethod, PaymentStatus } from '../entities/payment.entity';
import Stripe from 'stripe';

@Injectable()
export class PaymentsService {
  private readonly stripe: Stripe;

  constructor(
    @InjectRepository(Payment)
    private paymentsRepository: Repository<Payment>,
    private configService: ConfigService
  ) {
    const stripeKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (!stripeKey) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }
    this.stripe = new Stripe(stripeKey, {
      apiVersion: '2025-10-29.clover',
      typescript: true,
    });
  }

  async createPaymentRecord(paymentData: {
    amount: number;
    currency: string;
    factureId: string;
    stripePaymentIntentId: string;
    status: PaymentStatus;
    method: PaymentMethod;
    metadata?: any;
    stripeResponse?: any;
  }) {
    const payment = this.paymentsRepository.create({
      ...paymentData,
      metadata: {
        ...paymentData.metadata,
        ...(paymentData.stripeResponse && { stripeResponse: paymentData.stripeResponse })
      }
    });

    return this.paymentsRepository.save(payment);
  }

  async createPaymentIntent(createPaymentIntentDto: any) {
    try {
      const { amount, currency = 'tnd', metadata } = createPaymentIntentDto;
      
      console.log('Received payment intent request:', {
        amount,
        currency,
        metadata,
        amountType: typeof amount
      });

      // Ensure amount is a positive number
      if (typeof amount !== 'number' || amount <= 0) {
        const errorMsg = `Invalid amount provided: ${amount}. Must be a positive number.`;
        console.error(errorMsg);
        throw new Error(errorMsg);
      }
      const amountInMillimes = Math.round(amount);
      
      console.log('Creating payment intent with:', {
        amountInMillimes,
        currency: currency.toLowerCase(),
        metadata
      });

      // Create a PaymentIntent 
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: amountInMillimes,
        currency: currency.toLowerCase(),
        metadata,
        automatic_payment_methods: {
          enabled: true,
        },
      });

      console.log('Payment intent created:', {
        id: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        client_secret: '***' 
      });

      return {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      };
    } catch (error) {
      console.error('Error creating payment intent:', error);
      throw new Error(`Failed to create payment intent: ${error.message}`);
  }
}

  async updatePaymentStatus(stripePaymentIntentId: string, status: PaymentStatus) {
    const payment = await this.paymentsRepository.findOne({ 
      where: { stripePaymentIntentId } 
    });
    
    if (payment) {
      payment.status = status;
      return this.paymentsRepository.save(payment);
    }
  }
}