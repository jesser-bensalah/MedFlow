import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ordonnance } from '../entities/ordonnance.entity';
import { CreateOrdonnanceDto } from './dto/create-ordonnance.dto';
import { UpdateOrdonnanceDto } from './dto/update-ordonnance.dto';

@Injectable()
export class OrdonnanceService {
  constructor(
    @InjectRepository(Ordonnance)
    private ordonnanceRepository: Repository<Ordonnance>,
  ) {}

  async create(createOrdonnanceDto: CreateOrdonnanceDto, doctorId: number): Promise<Ordonnance> {
    console.log('Creating ordonnance with data:', JSON.stringify(createOrdonnanceDto, null, 2));
    
    // Create a new Ordonnance instance with the DTO data
    const ordonnance = new Ordonnance();
    ordonnance.date = new Date(createOrdonnanceDto.date);
    ordonnance.dateExpiration = new Date(createOrdonnanceDto.dateExpiration);
    ordonnance.patientId = createOrdonnanceDto.patientId;
    ordonnance.doctorId = doctorId;
    ordonnance.notes = createOrdonnanceDto.notes || undefined;
    ordonnance.nomClinique = createOrdonnanceDto.nomClinique || 'Clinique par défaut';
    
    // The setter will handle the JSON stringification
    ordonnance.medicaments = createOrdonnanceDto.medicaments;
    
    const saved = await this.ordonnanceRepository.save(ordonnance);
    console.log('Created ordonnance:', JSON.stringify(saved, null, 2));
    return saved;
  }

  async findAll(): Promise<Ordonnance[]> {
    return await this.ordonnanceRepository.find({
      relations: ['patient', 'doctor'],
    });
  }

  async findOne(id: number): Promise<Ordonnance> {
    const ordonnance = await this.ordonnanceRepository.findOne({
      where: { id },
      relations: ['patient', 'doctor'],
    });
    if (!ordonnance) {
      throw new NotFoundException(`Ordonnance with ID ${id} not found`);
    }
    return ordonnance;
  }

  async update(
    id: number,
    updateOrdonnanceDto: UpdateOrdonnanceDto,
  ): Promise<Ordonnance> {
    console.log('Updating ordonnance:', id, 'with data:', JSON.stringify(updateOrdonnanceDto, null, 2));
    
    const ordonnance = await this.findOne(id);
    
    // Create a new object with only the fields that are defined in the DTO
    const updates: Partial<Ordonnance> = {};
    
    // Copy all properties from DTO to updates object
    Object.entries(updateOrdonnanceDto).forEach(([key, value]) => {
      if (value !== undefined) {
        updates[key] = value;
      }
    });
    
    // Apply updates
    Object.assign(ordonnance, updates);
    
    const updated = await this.ordonnanceRepository.save(ordonnance);
    console.log('Updated ordonnance:', JSON.stringify(updated, null, 2));
    return updated;
  }

  async remove(id: number, doctorId: number): Promise<void> {
    const result = await this.ordonnanceRepository.delete({ id, doctor: { id: doctorId } });
    if (result.affected === 0) {
      throw new NotFoundException(`Ordonnance with ID ${id} not found or access denied`);
    }
  }

  async findByPatient(patientId: number): Promise<Ordonnance[]> {
    return this.ordonnanceRepository.find({
      where: { patient: { id: patientId } },
      relations: ['patient', 'doctor'],
      order: { date: 'DESC' },
    });
  }

  async findByDoctor(doctorId: number): Promise<Ordonnance[]> {
    return await this.ordonnanceRepository.find({
      where: { doctorId },
      relations: ['patient'],
      order: { date: 'DESC' },
    });
  }
}