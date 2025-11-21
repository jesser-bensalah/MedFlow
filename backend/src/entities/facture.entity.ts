import { BeforeInsert, Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { User } from './user.entity';
import { Clinic } from './clinic.entity';
import { Payment } from './payment.entity';

export class ServiceItem {
    description: string;
    amount: number;
}

@Entity('factures')
export class Facture {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @BeforeInsert()
    generateId() {
        // Generate a random 10-digit number for invoice number
        this.numeroFacture = Math.floor(1000000000 + Math.random() * 9000000000).toString();
    }

    @Column({ unique: true })
    numeroFacture: string;

    @Column()
    patientName: string;

    @Column({ type: 'date' })
    appointmentDate: Date;

    @Column({ type: 'date', nullable: true })
    dueDate: Date | null;

    @OneToMany(() => Payment, payment => payment.facture)
    payments: Payment[];

    @Column({ type: 'text', nullable: true })
    private _services: string | null = null;

    get services(): ServiceItem[] {
        // If _services is not set or is empty, return empty array
        if (!this._services || this._services.trim() === '') {
            return [];
        }
        
        try {
            // Try to parse as JSON
            return JSON.parse(this._services);
        } catch (e) {
            console.error('Error parsing services JSON:', e);
            return [];
        }
    }

    set services(services: ServiceItem[]) {
        if (services && services.length > 0) {
            this._services = JSON.stringify(services);
        } else {
            this._services = null;
        }
    }

    @Column('decimal', { precision: 10, scale: 2 })
    total: number;

    @Column({ type: 'varchar', length: 50 })
    paymentMethod: 'cash' | 'card';

    @Column({
        type: 'timestamp',
        default: () => 'CURRENT_TIMESTAMP'
    })
    date: Date;
    
    @Column({ type: 'text', nullable: true })
    notes: string;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'patientId' })
    patient: User;

    @Column({ nullable: true })
    patientId: number;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'doctorId' })
    doctor: User;

    @Column({ nullable: true })
    doctorId: number;

    @ManyToOne(() => Clinic, { nullable: true })
    @JoinColumn({ name: 'clinicId' })
    clinic: Clinic;

    @Column({ nullable: true })
    clinicId: number;

    @Column({ type: 'varchar', default: 'Non Payée' })
    etat: 'Payée' | 'Non Payée';

  
}