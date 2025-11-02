import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { User } from "./user.entity";



@Entity('clinics')
export class Clinic {
    
    @PrimaryGeneratedColumn()
    idClinic: number;

    @Column()   
    nomClinic: string;

    @Column()
    adresseClinic: string;

    @Column()
    telephoneClinic: string;

    @Column()
    emailClinic: string;

    @Column({ type: 'json', nullable: true })
    listeMedecins: string[];

    @Column({ type: 'json', nullable: true })
    listePatients: string[];

    @OneToMany(() => User, user => user.clinic)
    users: User[];

}