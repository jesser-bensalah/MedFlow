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
    @Roles(UserRole.ADMIN)
    async findAll(): Promise<Appointment[]> {
        return this.appointmentService.findAll();
    }

    @Get('doctor/:doctorId')
    @Roles(UserRole.DOCTOR, UserRole.ADMIN)
    async findByDoctorId(@Param('doctorId') doctorId: number): Promise<Appointment[]> {
        return this.appointmentService.findByDoctorId(doctorId);
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
    @Roles(UserRole.DOCTOR, UserRole.ADMIN)
    async updateStatus(
        @Param('id') id: number,
        @Body('status') status: 'Planifié' | 'Confirmé' | 'Annulé' | 'Terminé'
    ): Promise<Appointment | null> {
        return this.appointmentService.updateStatus(id, status);
    }
}
