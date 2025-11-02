import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Clinic } from '../entities/clinic.entity';
import { CreateClinicDto } from './dto/create-clinic.dto';
import { UpdateClinicDto } from './dto/update-clinic.dto';

@Injectable()
export class ClinicService {
  constructor(
    @InjectRepository(Clinic)
    private clinicRepository: Repository<Clinic>,
  ) {}

  async create(createClinicDto: CreateClinicDto): Promise<Clinic> {
    const clinic = this.clinicRepository.create(createClinicDto);
    return await this.clinicRepository.save(clinic);
  }

  async findAll(): Promise<Clinic[]> {
    return await this.clinicRepository.find();
  }

  async findOne(id: number): Promise<Clinic> {
    const clinic = await this.clinicRepository.findOne({ where: { idClinic: id } });
    if (!clinic) {
      throw new NotFoundException(`Clinic with ID ${id} not found`);
    }
    return clinic;
  }

  async update(id: number, updateClinicDto: UpdateClinicDto): Promise<Clinic> {
    const clinic = await this.findOne(id);
    Object.assign(clinic, updateClinicDto);
    return await this.clinicRepository.save(clinic);
  }

  async remove(id: number): Promise<void> {
    const result = await this.clinicRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Clinic with ID ${id} not found`);
    }
  }


  async addMedecin(clinicId: number, medecinId: string): Promise<Clinic> {
    const clinic = await this.findOne(clinicId);
    if (!clinic.listeMedecins) {
      clinic.listeMedecins = [];
    }
    if (!clinic.listeMedecins.includes(medecinId)) {
      clinic.listeMedecins.push(medecinId);
    }
    return await this.clinicRepository.save(clinic);
  }

  async removeMedecin(clinicId: number, medecinId: string): Promise<Clinic> {
    const clinic = await this.findOne(clinicId);
    if (clinic.listeMedecins) {
      clinic.listeMedecins = clinic.listeMedecins.filter(id => id !== medecinId);
      return await this.clinicRepository.save(clinic);
    }
    return clinic;
  }
}