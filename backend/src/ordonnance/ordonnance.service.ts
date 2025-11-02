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

  async create(createOrdonnanceDto: CreateOrdonnanceDto): Promise<Ordonnance> {
    const ordonnance = this.ordonnanceRepository.create(createOrdonnanceDto);
    return await this.ordonnanceRepository.save(ordonnance);
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
    const ordonnance = await this.findOne(id);
    Object.assign(ordonnance, updateOrdonnanceDto);
    return await this.ordonnanceRepository.save(ordonnance);
  }

  async remove(id: number): Promise<void> {
    const result = await this.ordonnanceRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Ordonnance with ID ${id} not found`);
    }
  }

  async findByPatient(patientId: number): Promise<Ordonnance[]> {
    return await this.ordonnanceRepository.find({
      where: { patientId },
      relations: ['doctor'],
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