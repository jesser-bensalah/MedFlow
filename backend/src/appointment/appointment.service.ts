import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appointment } from '../entities/appointment.entity';
import { User } from '../entities/user.entity';

@Injectable()
export class AppointmentService {
  constructor(
    @InjectRepository(Appointment)
    private appointmentRepository: Repository<Appointment>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async findAll(): Promise<Appointment[]> {
    return this.appointmentRepository.find({
      relations: ['patient', 'doctor']
    });
  }

  async findOne(id: number): Promise<Appointment | null> {
    return this.appointmentRepository.findOne({
      where: { id },
      relations: ['patient', 'doctor']
    });
  }

  async create(createAppointmentDto: {
    patientId: number;
    doctorId: number;
    appointmentDate: string;
    appointmentTime: string;
    status?: 'Planifié' | 'Confirmé' | 'Annulé' | 'Terminé';
    specialite?: string;
  }): Promise<Appointment> {
    console.log('Starting appointment creation with data:', JSON.stringify(createAppointmentDto, null, 2));
    
    const queryRunner = this.appointmentRepository.manager.connection.createQueryRunner();
    
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      console.log('Validating appointment data...');
      
      // Input validation
      if (!createAppointmentDto.appointmentDate) {
        throw new Error('Appointment date is required');
      }
      
      const parsedDate = new Date(createAppointmentDto.appointmentDate);
      if (isNaN(parsedDate.getTime())) {
        throw new Error(`Invalid date format: ${createAppointmentDto.appointmentDate}. Please use YYYY-MM-DD format`);
      }
      
      if (!createAppointmentDto.appointmentTime) {
        throw new Error('Appointment time is required');
      }

      // Verify patient exists
      const patient = await queryRunner.manager.findOne(User, { 
        where: { id: createAppointmentDto.patientId } 
      });
      if (!patient) {
        throw new NotFoundException('Patient not found');
      }

      // Verify doctor exists
      const doctor = await queryRunner.manager.findOne(User, { 
        where: { id: createAppointmentDto.doctorId }
      });
      if (!doctor) {
        throw new NotFoundException('Doctor not found');
      }

      // Convert string date to Date object
      const appointmentDate = new Date(createAppointmentDto.appointmentDate);
      
      // Check for existing appointment at the same date and time
      const existingAppointment = await queryRunner.manager.findOne(Appointment, {
        where: {
          doctor: { id: createAppointmentDto.doctorId },
          date: appointmentDate,
          time: createAppointmentDto.appointmentTime,
          status: 'Planifié'
        },
        relations: ['patient', 'doctor']
      });

      if (existingAppointment) {
        console.log('Existing appointment found:', existingAppointment);
        throw new Error('Un rendez-vous existe déjà à cette heure');
      }

      console.log('Creating new appointment with data:', {
        date: appointmentDate,
        time: createAppointmentDto.appointmentTime,
        status: createAppointmentDto.status || 'Planifié',
        patientId: patient.id,
        doctorId: doctor.id,
        doctorSpecialty: doctor.specialite
      });

      // Create new appointment 
      const appointment = this.appointmentRepository.create({
        date: appointmentDate,
        time: createAppointmentDto.appointmentTime,
        patient,
        doctor,
        status: createAppointmentDto.status || 'Planifié',
        specialite: createAppointmentDto.specialite || doctor.specialite || 'Généraliste' 
      });

      const savedAppointment = await queryRunner.manager.save(Appointment, appointment);
      console.log('Appointment saved successfully:', savedAppointment);
      
      await queryRunner.commitTransaction();
      return savedAppointment;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error('Error creating appointment:', error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async update(id: number, updateAppointmentDto: Partial<Appointment>): Promise<Appointment | null> {
    const appointment = await this.appointmentRepository.findOne({ where: { id } });
    if (!appointment) {
      return null;
    }

    //Convert date
    if (updateAppointmentDto.date && typeof updateAppointmentDto.date === 'string') {
      updateAppointmentDto.date = new Date(updateAppointmentDto.date);
    }

    Object.assign(appointment, updateAppointmentDto);
    return this.appointmentRepository.save(appointment);
  }

  async delete(id: number): Promise<Appointment | null> {
      const appointment = await this.appointmentRepository.findOne({ where: { id } });
      if (!appointment) {
          return null;
      }
      await this.appointmentRepository.delete(id);
      return appointment;
  }
}