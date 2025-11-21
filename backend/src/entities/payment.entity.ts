import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Facture } from './facture.entity';
import { User } from './user.entity';

export enum PaymentStatus {
  PENDING = 'En cours',
  SUCCEEDED = 'Payée',
  FAILED = 'Non Payée',
  REFUNDED = 'Refundée',
  CANCELED = 'Annulée',
  PROCESSING = 'En cours de traitement'
}

export enum PaymentMethod {
  CARD = 'Carte',
  CASH = 'Cash',
  CHECK = 'Check',
  TRANSFER = 'Virement',
}

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

 
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'varchar', length: 3, default: 'TND' })
  currency: string;

  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
  status: PaymentStatus;

  @Column({ type: 'enum', enum: PaymentMethod })
  method: PaymentMethod;

  @Column({ type: 'varchar', nullable: true })
  stripePaymentIntentId: string;

  @Column({ type: 'varchar', nullable: true })
  stripePaymentMethodId: string;

  @Column({ type: 'varchar', nullable: true })
  cardBrand: string;

  @Column({ type: 'varchar', length: 4, nullable: true })
  last4: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  expiry: string; 

  @ManyToOne(() => Facture, facture => facture.payments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id' })
  facture: Facture;

  @Column({ type: 'uuid' })
  factureId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'processedById' })
  processedBy: User;

  @Column({ type: 'uuid', nullable: true })
  processedById: string;


  @Column({ type: 'json', nullable: true })
  metadata: {
    patientId?: number;
    doctorId?: number;
    clinicId?: number;
    [key: string]: any;
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  isSuccessful(): boolean {
    return this.status === PaymentStatus.SUCCEEDED;
  }

  isPending(): boolean {
    return this.status === PaymentStatus.PENDING;
  }

  isFailed(): boolean {
    return this.status === PaymentStatus.FAILED;
  }
}