import { Column, Entity, ManyToOne, JoinColumn, PrimaryGeneratedColumn } from 'typeorm';
import { User } from './user.entity';


@Entity('appointments')
export class Appointment {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    date: Date;

    @Column()
    time: string;   
    
    @ManyToOne(() => User, user => user.appointments, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'patientId' })
    patient: User;

    @ManyToOne(() => User, user => user.appointments, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'doctorId' })
    doctor: User;
    
    @Column()
    specialite: string;

    @Column()
    status: 'Planifié' | 'Confirmé' | 'Annulé' | 'Terminé';

    @Column({ nullable: true })
    notes?: string;
    
}