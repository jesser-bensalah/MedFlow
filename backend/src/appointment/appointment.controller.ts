import { Controller, Get, Param, Post, Put, Delete, Body, Patch } from '@nestjs/common';
import { UseGuards } from '@nestjs/common';
import { AppointmentService } from './appointment.service';
import { Appointment } from '../entities/appointment.entity';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';
import { UserRole } from 'src/enums/user-role.enum';

@Controller('appointment')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AppointmentController {
    constructor(private readonly appointmentService: AppointmentService) {}

    @Get()
    @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST)
    async findAll(): Promise<Appointment[]> {
        return this.appointmentService.findAll();
    }

    @Get('doctor/:doctorId')
    @Roles(UserRole.DOCTOR, UserRole.ADMIN)
    async findByDoctorId(@Param('doctorId') doctorId: number): Promise<Appointment[]> {
        return this.appointmentService.findByDoctorId(doctorId);
    }

    @Get('patient/:patientId')
    @Roles(UserRole.PATIENT, UserRole.ADMIN, UserRole.RECEPTIONIST)
    async findByPatientId(@Param('patientId') patientId: number): Promise<Appointment[]> {
        return this.appointmentService.findByPatientId(patientId);
    }

    @Get(':id')
    async findOne(@Param('id') id: number): Promise<Appointment | null> {
        return this.appointmentService.findOne(id);
    }

    @Post()
    async create(@Body() createAppointmentDto: CreateAppointmentDto): Promise<Appointment | null> {
        return this.appointmentService.create(createAppointmentDto);
    }

    @Put(':id')
    async update(@Param('id') id: number, @Body() appointment: Appointment): Promise<Appointment | null> {
        return this.appointmentService.update(id, appointment);
    }

    @Delete(':id')
    async delete(@Param('id') id: number): Promise<Appointment | null> {
        return this.appointmentService.delete(id);
    }

    @Patch(':id/status')
    @Roles(UserRole.DOCTOR, UserRole.ADMIN, UserRole.RECEPTIONIST)
    async updateStatus(
        @Param('id') id: number,
        @Body('status') status: 'Planifié' | 'Confirmé' | 'Annulé' | 'Terminé'
    ): Promise<Appointment | null> {
        return this.appointmentService.updateStatus(id, status);
    }

    @Post(':id/request-cancellation')
    @Roles(UserRole.PATIENT)
    async requestCancellation(
        @Param('id') id: number,
        @Body('reason') reason?: string
    ): Promise<{ success: boolean; message: string }> {
        const result = await this.appointmentService.requestCancellation(id, reason);
        return {
            success: result,
            message: result 
                ? 'Demande d\'annulation envoyée avec succès' 
                : 'Impossible de traiter la demande d\'annulation'
        };
    }
}
