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
      if (isNaN(appointmentDate.getTime())) {
        throw new Error('Invalid date format. Please use YYYY-MM-DD');
      }

      // Create new appointment 
      const appointment = this.appointmentRepository.create({
        date: appointmentDate,
        time: createAppointmentDto.appointmentTime,
        patient,
        doctor,
        status: createAppointmentDto.status || 'Planifié',
        specialite: createAppointmentDto.specialite || doctor.specialite || 'Généraliste',
        
      });

      const savedAppointment = await queryRunner.manager.save(Appointment, appointment);
    

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

  async update(id: number, updateAppointmentDto: Partial<Appointment> & { date?: string | Date; time?: string }): Promise<Appointment | null> {
    console.log('=== Starting update for appointment ID:', id, '===');
    
    const appointment = await this.appointmentRepository.findOne({ 
      where: { id },
      relations: ['patient', 'doctor']
    });
    
    if (!appointment) {
      console.log('Appointment not found with ID:', id);
      return null;
    }

    // Log current state before any changes
    console.log('Current appointment state:', {
      id: appointment.id,
      currentDate: appointment.date,
      currentTime: appointment.time,
      currentStatus: appointment.status
    });

    // Create a copy of the DTO to avoid modifying the original
    const updateData = { ...updateAppointmentDto };

    // Log the incoming update data
    console.log('Incoming update data (raw):', JSON.parse(JSON.stringify(updateData)));

    // Handle date conversion if date is provided
    if (updateData.date) {
      console.log('Processing date update...');
      let dateValue: Date;
      
      // If date is a string in YYYY-MM-DD format, convert it to a Date object
      if (typeof updateData.date === 'string') {
        console.log('Converting string date to Date object:', updateData.date);
        // Parse the date string and create a date in local time
        const [year, month, day] = updateData.date.split('-').map(Number);
        dateValue = new Date(year, month - 1, day);
        
        // Ensure the date is valid
        if (isNaN(dateValue.getTime())) {
          const error = new Error(`Invalid date format: ${updateData.date}. Expected YYYY-MM-DD`);
          console.error('Date parsing error:', error);
          throw error;
        }
      } else {
        console.log('Received Date object, using as is:', updateData.date);
        dateValue = new Date(updateData.date); 
      }
      
      // handle time update
      if (updateData.time) {
        console.log('Processing time update:', updateData.time);
        const [hours, minutes] = updateData.time.split(':').map(Number);
        dateValue.setHours(hours, minutes, 0, 0);
        console.log('Updated date with time:', dateValue);
      }
      
      // Update the date in the DTO
      updateData.date = dateValue;
      console.log('Final date value to be saved:', dateValue);
    }

    // Log the data that will be used for the update
    console.log('Merging update data into appointment. Update data:', JSON.parse(JSON.stringify(updateData)));
    
    // Update the appointment with the new data
    const updated = this.appointmentRepository.merge(appointment, updateData);
    
    // Log the final update
    console.log('Prepared appointment for save:', {
      id: updated.id,
      date: updated.date,
      time: updated.time,
      status: updated.status,
      rawDateType: typeof updated.date,
      rawDateValue: updated.date,
      rawTimeValue: updated.time
    });

    try {
      console.log('Attempting to save appointment update...');
      // Save and return the updated appointment
      const result = await this.appointmentRepository.save(updated);
      
      // Log the saved result
      console.log('=== Successfully updated appointment ===');
      console.log('Updated appointment details:', {
        id: result.id,
        date: result.date,
        time: result.time,
        status: result.status,
        rawDateType: typeof result.date,
        rawDateValue: result.date,
        rawTimeValue: result.time
      });
      
      return result;
    } catch (error) {
      console.error('Error saving appointment update:', error);
      throw error;
    }
  }

  async delete(id: number): Promise<Appointment | null> {
    const appointment = await this.appointmentRepository.findOne({ where: { id } });
    if (!appointment) {
      return null;
    }
    await this.appointmentRepository.remove(appointment);
    return appointment;
  }

  async findByDoctorId(doctorId: number): Promise<Appointment[]> {
    return this.appointmentRepository.find({
      where: { 
        doctor: { id: doctorId } 
      },
      relations: ['patient', 'doctor'],
      order: {
        date: 'ASC',
        time: 'ASC'
      }
    });
  }

  async findByPatientId(patientId: number): Promise<Appointment[]> {
    try {
      return await this.appointmentRepository.find({
        where: { 
          patient: { id: patientId } 
        },
        relations: ['patient', 'doctor'],
        order: {
          date: 'ASC',
          time: 'ASC'
        }
      });
    } catch (error) {
      console.error('Error in findByPatientId:', error);
      throw error;
    }
  }

  async updateStatus(id: number, status: 'Planifié' | 'Confirmé' | 'Annulé' | 'Terminé'): Promise<Appointment | null> {
    const appointment = await this.appointmentRepository.findOne({ 
      where: { id },
      relations: ['patient', 'doctor'],
    });
    
    if (!appointment) {
      return null;
    }

    appointment.status = status;
    return this.appointmentRepository.save(appointment);
  }

  async requestCancellation(id: number, reason?: string): Promise<boolean> {
    const appointment = await this.appointmentRepository.findOne({
      where: { id },
      relations: ['patient', 'doctor'],
    });

    if (!appointment) {
      return false;
    }

    // Log the cancellation request
    console.log(`Appointment ${id} cancellation requested. Reason: ${reason || 'No reason provided'}`);
    
    // Update the status to 'Annulé'
    appointment.status = 'Annulé';
    if (reason) {
      appointment.notes = `Demande d'annulation: ${reason}`;
    } else {
      appointment.notes = 'Annulé par le patient';
    }
    
    await this.appointmentRepository.save(appointment);
    return true;
  }
}