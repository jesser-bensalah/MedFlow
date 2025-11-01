import { Controller } from '@nestjs/common';
import { UseGuards } from '@nestjs/common';
import { AppointmentService } from './appointment.service';
import { Get, Param, Post, Put, Delete, Body } from '@nestjs/common';
import { Appointment } from '../entities/appointment.entity';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';

@Controller('appointment')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AppointmentController {
    constructor(private readonly appointmentService: AppointmentService) {}

    @Get()
    async findAll(): Promise<Appointment[]> {
        return this.appointmentService.findAll();
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
}
