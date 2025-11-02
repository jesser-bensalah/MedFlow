import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne } from 'typeorm';
import { IsEmail, IsOptional, IsString, MinLength, IsEnum, IsDate } from 'class-validator';
import { Appointment } from './appointment.entity';
import { UserRole } from '../enums/user-role.enum';
import { Ordonnance } from './ordonnance.entity';
import { Clinic } from './clinic.entity';
import { IsCIN } from '../decorators/is-cin.decorator';
import { Facture } from './facture.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 8, nullable: true })
  @IsCIN()
  @IsOptional()
  cin: string | null;

  @Column({ nullable: true })
  dateNaissance: Date;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true, name: 'emergency_contact' })
  emergencyContact: string;

  @OneToMany(() => Appointment, appointment => appointment.patient)
  appointments: Appointment[];

  @Column({ type: 'enum', enum: UserRole, default: UserRole.PATIENT })
  role: UserRole;

  @Column({ nullable: true })
  clinicId: number;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  specialite: string;

  @OneToMany(() => Ordonnance, ordonnance => ordonnance.patient)
  ordonnances: Ordonnance[];

  @ManyToOne(() => Clinic, clinic => clinic.users)
  clinic: Clinic;

  @OneToMany(() => Facture, facture => facture.patient)
  factures: Facture[];    
}