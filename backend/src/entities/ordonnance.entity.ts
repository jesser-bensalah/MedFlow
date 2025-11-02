import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { User } from "./user.entity";

@Entity('ordonnance')
export class Ordonnance {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    contenu: string;

    @Column({ type: 'date' })
    date: Date;

    @Column({ name: 'patientId' })
    patientId: number;

    @Column({ name: 'doctorId' })
    doctorId: number;

    @ManyToOne(() => User, user => user.ordonnances)
    @JoinColumn({ name: 'patientId' })
    patient: User;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'doctorId' })
    doctor: User;

}