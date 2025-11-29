import { Injectable, ConflictException, NotFoundException, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from '../entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserRole } from '../enums/user-role.enum';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) { }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const existingUser = await this.usersRepository.findOne({
      where: { email: createUserDto.email }
    });

    if (existingUser) {
      throw new ConflictException('Un utilisateur avec cet email existe déjà');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 12);

    const userData: Partial<User> = {
      email: createUserDto.email,
      password: hashedPassword,
      firstName: createUserDto.firstName,
      lastName: createUserDto.lastName,
      role: createUserDto.role || UserRole.PATIENT,
      phone: createUserDto.phone,
      address: createUserDto.address,
      emergencyContact: createUserDto.emergencyContact,
      isActive: true
    };

    
    if (createUserDto.dateNaissance) {
      const date = new Date(createUserDto.dateNaissance);
      if (isNaN(date.getTime())) {
        throw new BadRequestException('Format de date de naissance invalide');
      }
    
      userData.dateNaissance = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    }

    const user = this.usersRepository.create(userData);

    return await this.usersRepository.save(user);
  }

  async findAll(): Promise<User[]> {
    return await this.usersRepository.find({
      select: [
        'id',
        'email',
        'firstName',
        'lastName',
        'role',
        'isActive',
        'createdAt',
        'phone',
        'dateNaissance',
        'address',
        'emergencyContact'
      ],
      order: { lastName: 'ASC', firstName: 'ASC' }
    });
  }

  async findOne(id: number): Promise<User> {
    if (!id || isNaN(Number(id))) {
      throw new BadRequestException('ID utilisateur invalide');
    }

    try {
      const user = await this.usersRepository.findOne({
        where: { id },
        select: [
          'id',
          'email',
          'firstName',
          'lastName',
          'role',
          'isActive',
          'phone',
          'dateNaissance',
          'address',
          'emergencyContact',
          'createdAt',
          'updatedAt'
        ]
      });

      if (!user) {
        throw new NotFoundException('Utilisateur non trouvé');
      }

      return user;
    } catch (error) {
      console.error('Error in findOne:', {
        error: error.message,
        id,
        idType: typeof id,
        stack: error.stack
      });

      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }

      throw new Error('Une erreur est survenue lors de la récupération de l\'utilisateur');
    }
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

   
    if ('dateNaissance' in updateUserDto) {
      const dateValue = updateUserDto.dateNaissance;

      if (dateValue) {
        const date = new Date(dateValue);
        if (isNaN(date.getTime())) {
          throw new BadRequestException('Format de date de naissance invalide');
        }
        
        user.dateNaissance = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      } else {
        user.dateNaissance = null;
      }

     
      delete updateUserDto.dateNaissance;
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
    try {
      
      if (isNaN(id) || id <= 0) {
        throw new BadRequestException('ID utilisateur invalide');
      }

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

     
      const updatedUser = await this.usersRepository.save(user);

      console.log(`User ${user.id} status toggled to ${user.isActive ? 'active' : 'inactive'}`);

      return updatedUser;
    } catch (error) {
      console.error('Error in toggleUserStatus:', {
        error: error.message,
        userId: id,
        currentUser: currentUser ? {
          id: currentUser.id,
          role: currentUser.role
        } : 'No current user',
        stack: error.stack
      });

 
      if (error instanceof BadRequestException ||
        error instanceof ForbiddenException ||
        error instanceof NotFoundException) {
        throw error;
      }

      throw new Error('Une erreur est survenue lors de la modification du statut de l\'utilisateur');
    }
  }

  /**
   * Find users by role
   * @param role 
   * @param activeOnly 
   * @returns 
   */
  async findByRole(role: string, activeOnly: boolean = true): Promise<User[]> {
    try {
      this.logger.debug(`Finding users with role: ${role}${activeOnly ? ' (active only)' : ''}`);

     
      if (!role || typeof role !== 'string' || role.trim() === '') {
        this.logger.warn('Invalid role parameter provided to findByRole');
        return [];
      }

      const where: any = { role };
      if (activeOnly) {
        where.isActive = true;
      }

      const users = await this.usersRepository.find({
        where,
        select: [
          'id',
          'email',
          'firstName',
          'lastName',
          'role',
          'specialite',
          'isActive',
          'phone',
          'address',
          'createdAt',
          'updatedAt'
        ],
        order: {
          lastName: 'ASC',
          firstName: 'ASC'
        }
      });

      this.logger.debug(`Found ${users.length} users with role: ${role}`);
      return users || [];
    } catch (error) {
      this.logger.error(`Error finding users with role ${role}:`, {
        error: error.message,
        stack: error.stack,
        ...(error.code && { code: error.code }),
        ...(error.sqlMessage && { sqlMessage: error.sqlMessage })
      });

    
      return [];
    }
  }

  /**
   * Get all active doctors
   * @returns 
   */
  async getDoctors(): Promise<User[]> {
    try {
      const doctors = await this.findByRole('doctor');
      if (!Array.isArray(doctors)) {
        this.logger.warn('Expected an array of doctors but received:', doctors);
        return [];
      }
      return doctors;
    } catch (error) {
      this.logger.error('Error in getDoctors:', error);
      return [];
    }
  }

  async updatePassword(userId: number, newPassword: string): Promise<{ message: string }> {
    if (!newPassword || newPassword.length < 6) {
      throw new BadRequestException('Le mot de passe doit contenir au moins 6 caractères');
    }

    const user = await this.findOne(userId);
    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await this.usersRepository.update(userId, { password: hashedPassword });

    return { message: 'Mot de passe mis à jour avec succès' };
  }
}

