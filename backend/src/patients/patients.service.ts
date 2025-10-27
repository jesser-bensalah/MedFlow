import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { Patient } from '../entities/patient.entity';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { User } from '../entities/user.entity';
import { UserRole } from '../enums/user-role.enum';

@Injectable()
export class PatientsService {
  constructor(
    @InjectRepository(Patient)
    private patientsRepository: Repository<Patient>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}


  async create(createPatientDto: CreatePatientDto): Promise<User> {
   
    const existingUser = await this.usersRepository.findOne({
      where: { email: createPatientDto.email }
    });

    if (existingUser) {
      throw new ConflictException('Un utilisateur avec cet email existe déjà');
    }

   
    const hashedPassword = await bcrypt.hash(createPatientDto.password, 12);
    
  
    const user = this.usersRepository.create({
      email: createPatientDto.email,
      password: hashedPassword,
      firstName: createPatientDto.firstName,
      lastName: createPatientDto.lastName,
      role: UserRole.PATIENT, 
      isActive: true, 
    });

    return await this.usersRepository.save(user);
  }

  async findAll(): Promise<User[]> {
    return await this.usersRepository.find({
      where: { role: UserRole.PATIENT },
      select: ['id', 'email', 'firstName', 'lastName', 'role', 'isActive', 'createdAt'],
      order: { createdAt: 'DESC' }
    });
  }

  async findOne(id: number): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id, role: UserRole.PATIENT },
      select: ['id', 'email', 'firstName', 'lastName', 'role', 'isActive', 'createdAt']
    });

    if (!user) {
      throw new NotFoundException('Patient non trouvé');
    }

    return user;
  }

  async update(id: number, updatePatientDto: UpdatePatientDto): Promise<User> {
    const user = await this.findOne(id);
    
   
    if (updatePatientDto.email && updatePatientDto.email !== user.email) {
      const existingUser = await this.usersRepository.findOne({
        where: { email: updatePatientDto.email }
      });
      if (existingUser && existingUser.id !== id) {
        throw new ConflictException('Un utilisateur avec cet email existe déjà');
      }
    }

    const updateData: any = {};

    if (updatePatientDto.email) updateData.email = updatePatientDto.email;
    if (updatePatientDto.firstName) updateData.firstName = updatePatientDto.firstName;
    if (updatePatientDto.lastName) updateData.lastName = updatePatientDto.lastName;
    if (updatePatientDto.isActive !== undefined) updateData.isActive = updatePatientDto.isActive;

    // Hasher le mot de passe si fourni
    if (updatePatientDto.password) {
      updateData.password = await bcrypt.hash(updatePatientDto.password, 12);
    }

    console.log('Données de mise à jour patient:', updateData);

    
    await this.usersRepository.update(id, updateData);
    
    return await this.findOne(id);
  }


  async remove(id: number): Promise<{ message: string }> {
    const user = await this.findOne(id); 
    
    // Empêcher la suppression de l'admin
    if (user.email === 'admin@medflow.com') {
      throw new ForbiddenException('Impossible de supprimer l\'administrateur principal');
    }

    await this.usersRepository.remove(user);
    return { message: 'Patient supprimé avec succès' };
  }

  async togglePatientStatus(id: number): Promise<User> {
    const user = await this.findOne(id);
    user.isActive = !user.isActive;
    return await this.usersRepository.save(user);
  }
}