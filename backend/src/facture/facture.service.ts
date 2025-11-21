import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Facture } from '../entities/facture.entity';
import { CreateFactureDto } from './dto/create-facture.dto';
import { UpdateFactureDto } from './dto/update-facture.dto';

@Injectable()
export class FactureService {
  constructor(
    @InjectRepository(Facture)
    private readonly factureRepository: Repository<Facture>,
  ) {}

  async create(createFactureDto: CreateFactureDto): Promise<Facture> {
    const facture = new Facture();
    
    facture.patientName = createFactureDto.patientName;
    facture.appointmentDate = new Date(createFactureDto.appointmentDate);
    facture.services = createFactureDto.services || [];
    facture.total = createFactureDto.total;
    facture.paymentMethod = createFactureDto.paymentMethod as any;
    facture.date = new Date(createFactureDto.date);
    
    if (createFactureDto.notes) facture.notes = createFactureDto.notes;
    if (createFactureDto.patientId) facture.patientId = createFactureDto.patientId;
    if (createFactureDto.doctorId) facture.doctorId = createFactureDto.doctorId;
    if (createFactureDto.clinicId) facture.clinicId = createFactureDto.clinicId;
    facture.etat = createFactureDto.etat || 'Non Payée';
    
    console.log('Creating facture with services:', facture.services);
    
    const savedFacture = await this.factureRepository.save(facture);
    return this.findOne(savedFacture.id);
  }

  async findAll(): Promise<Facture[]> {
    return await this.factureRepository.find({
      relations: ['patient', 'doctor', 'clinic'],
    });
  }

  async findOne(id: string): Promise<Facture> {
    const facture = await this.factureRepository.findOne({
      where: { id },
      relations: ['patient', 'doctor', 'clinic'],
    });
    
    if (!facture) {
      throw new NotFoundException(`Facture with ID ${id} not found`);
    }
    
    return facture;
  }

  async update(id: string, updateFactureDto: UpdateFactureDto): Promise<Facture> {
    const facture = await this.findOne(id);
    Object.assign(facture, updateFactureDto);
    return await this.factureRepository.save(facture);
  }

  async remove(id: string): Promise<void> {
    const result = await this.factureRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Facture with ID ${id} not found`);
    }
  }
}
