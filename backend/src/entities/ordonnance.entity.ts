import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, AfterLoad } from "typeorm";
import { User } from "./user.entity";

@Entity('ordonnance')
export class Ordonnance {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'date' })
    date: Date;

    @Column()
    dateExpiration: Date;

    @Column({ name: 'patientId' })
    patientId: number;

    @Column({ name: 'doctorId' })
    doctorId: number;

    @Column({ nullable: true })
    notes?: string;

    @ManyToOne(() => User, user => user.ordonnances, { eager: true })
    @JoinColumn({ name: 'patientId' })
    patient: User;

    @ManyToOne(() => User, { eager: true })
    @JoinColumn({ name: 'doctorId' })
    doctor: User;

    @Column()
    nomClinique: string;

    @Column('text', { name: 'medicaments', nullable: true })
    private _medicaments: string | null = null;

    get medicaments(): any[] {
        // If _medicaments is not set or is empty, return empty array
        if (!this._medicaments || this._medicaments.trim() === '') {
            return [];
        }
        
        try {
            // Try to parse as JSON
            const parsed = JSON.parse(this._medicaments);
            // If parsing succeeds, return the parsed value
            return Array.isArray(parsed) ? parsed : [parsed];
        } catch (e) {
            // If parsing fails, treat it as a single medication string
            return [{ name: this._medicaments }];
        }
    }

    set medicaments(value: any[] | string | any) {
        if (value === undefined || value === null) {
            this._medicaments = '[]';
        } else if (typeof value === 'string') {
            // If it's a string, try to parse it to see if it's JSON
            try {
                const parsed = JSON.parse(value);
                this._medicaments = JSON.stringify(Array.isArray(parsed) ? parsed : [parsed]);
            } catch (e) {
                // If it's not valid JSON, store as a single medication
                this._medicaments = value.trim() === '' ? '[]' : JSON.stringify([{ name: value }]);
            }
        } else if (Array.isArray(value)) {
            // If it's already an array, stringify it
            this._medicaments = JSON.stringify(value);
        } else if (typeof value === 'object') {
            // If it's an object, wrap it in an array and stringify
            this._medicaments = JSON.stringify([value]);
        } else {
            // For any other case, store as empty array
            this._medicaments = '[]';
        }
    }

    patientName?: string;
    doctorName?: string;

    @AfterLoad()
    setComputedProperties() {
        if (this.patient) {
            this.patientName = `${this.patient.firstName} ${this.patient.lastName}`;
        }
        if (this.doctor) {
            this.doctorName = `${this.doctor.firstName} ${this.doctor.lastName}`;
        }
    }
}