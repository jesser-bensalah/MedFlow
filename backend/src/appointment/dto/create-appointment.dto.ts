import { IsInt, IsDateString, IsString, IsIn, IsOptional, IsNotEmpty, Matches } from 'class-validator';

export class CreateAppointmentDto {
    @IsInt()
    @IsNotEmpty()
    patientId: number;

    @IsInt()
    @IsNotEmpty()
    doctorId: number;

    @IsDateString()
    @IsNotEmpty()
    appointmentDate: string;

    @IsString()
    @IsNotEmpty()
    @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, {
        message: 'appointmentTime must be a valid time in HH:MM format'
    })
    appointmentTime: string;

    @IsOptional()
    @IsIn(['Planifié', 'Confirmé', 'Annulé', 'Terminé'])
    status?: 'Planifié' | 'Confirmé' | 'Annulé' | 'Terminé';

    @IsOptional()
    @IsString()
    notes?: string;

    @IsOptional()
    @IsString()
    specialite?: string;
}
