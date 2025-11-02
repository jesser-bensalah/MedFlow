import { BeforeInsert, Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "./user.entity";
import { Clinic } from "./clinic.entity";

@Entity('factures')
export class Facture {
    @PrimaryGeneratedColumn()
    id: string;  

    @BeforeInsert()
    generateId() {
        // Generate a random 10-digit number
        this.id = Math.floor(1000000000 + Math.random() * 9000000000).toString();
    }

    @Column('decimal', { precision: 10, scale: 2 })
    montant: number;

    @Column({ type: 'date' })
    date: Date;

    @Column({ name: 'patientId' })
    patientId: number;

    @Column({ name: 'doctorId' })
    doctorId: number;

    @Column()
    clinicId: number;

    @Column()
    etat: 'Payée' | 'Non Payée';

    @ManyToOne(() => User, user => user.factures)
    @JoinColumn({ name: 'patientId' })
    patient: User;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'doctorId' })
    doctor: User;

    @ManyToOne(() => Clinic)
    @JoinColumn({ name: 'clinicId' })
    clinic: Clinic;
}