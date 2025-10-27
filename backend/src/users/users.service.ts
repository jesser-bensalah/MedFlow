import { Injectable, ConflictException, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from '../entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserRole } from '../enums/user-role.enum';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const existingUser = await this.usersRepository.findOne({
      where: { email: createUserDto.email }
    });

    if (existingUser) {
      throw new ConflictException('Un utilisateur avec cet email existe déjà');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 12);
    
    const user = this.usersRepository.create({
      ...createUserDto,
      password: hashedPassword,
    });

    return await this.usersRepository.save(user);
  }

  async findAll(): Promise<User[]> {
    return await this.usersRepository.find({
      select: ['id', 'email', 'firstName', 'lastName', 'role', 'isActive', 'createdAt'],
      order: { createdAt: 'DESC' }
    });
  }

  async findOne(id: number): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id },
      select: ['id', 'email', 'firstName', 'lastName', 'role', 'isActive', 'createdAt']
    });

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    return user;
  }

  async update(id: number, updateUserDto: UpdateUserDto, currentUser?: User): Promise<User> {
    const user = await this.findOne(id);
    
    
    if (currentUser && currentUser.role === UserRole.RECEPTIONIST) {
      
      if (user.role !== UserRole.PATIENT) {
        throw new ForbiddenException('Vous ne pouvez modifier que les patients');
      }
      
     
      if (updateUserDto.role && updateUserDto.role !== UserRole.PATIENT) {
        throw new ForbiddenException('Vous ne pouvez pas changer le rôle d\'un utilisateur');
      }
    }

    
    if (user.email === 'admin@medflow.com' && updateUserDto.role !== UserRole.ADMIN) {
      throw new BadRequestException('Impossible de modifier le rôle de l\'administrateur principal');
    }

    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.usersRepository.findOne({
        where: { email: updateUserDto.email }
      });
      if (existingUser && existingUser.id !== id) {
        throw new ConflictException('Un utilisateur avec cet email existe déjà');
      }
    }

    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 12);
    }

    await this.usersRepository.update(id, updateUserDto);
    return await this.findOne(id);
  }

  async remove(id: number): Promise<{ message: string }> {
    const user = await this.findOne(id);
    
   
    if (user.email === 'admin@medflow.com') {
      throw new BadRequestException('Impossible de supprimer l\'administrateur principal');
    }

    await this.usersRepository.remove(user);
    return { message: 'Utilisateur supprimé avec succès' };
  }

  async toggleUserStatus(id: number, currentUser?: User): Promise<User> {
    const user = await this.findOne(id);
    
    
    if (currentUser && currentUser.role === UserRole.RECEPTIONIST) {
      if (user.role !== UserRole.PATIENT) {
        throw new ForbiddenException('Vous ne pouvez modifier que le statut des patients');
      }
    }

    if (user.email === 'admin@medflow.com') {
      throw new BadRequestException('Impossible de désactiver l\'administrateur principal');
    }

    user.isActive = !user.isActive;
    return await this.usersRepository.save(user);
  }
}