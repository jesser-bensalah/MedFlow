import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from '../entities/user.entity';
import { LoginDto } from './dto/login.dto';
import { UserRole } from '../enums/user-role.enum';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private jwtService: JwtService,
  ) {
    this.createDefaultAdmin();
  }

  private async createDefaultAdmin() {
    try {
      const adminEmail = 'admin@medflow.com';
      const adminPassword = 'Admin123!';
      
      const existingAdmin = await this.usersRepository.findOne({
        where: { email: adminEmail }
      });

      if (!existingAdmin) {
        const hashedPassword = await bcrypt.hash(adminPassword, 12);
        
        const adminUser = this.usersRepository.create({
          email: adminEmail,
          password: hashedPassword,
          firstName: 'Admin',
          lastName: 'MedFlow',
          role: UserRole.ADMIN,
        });

        await this.usersRepository.save(adminUser);
        console.log(' Admin user créé avec succès');
        console.log(' Email:', adminEmail);
        console.log(' Mot de passe:', adminPassword);
      } else {
        console.log(' Admin user existe déjà');
      }
    } catch (error) {
      console.error(' Erreur création admin:', error);
    }
  }

  async validateUser(loginDto: LoginDto): Promise<any> {
    const user = await this.usersRepository.findOne({
      where: { email: loginDto.email }
    });

    if (user && await bcrypt.compare(loginDto.password, user.password)) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto);
    if (!user) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    const payload = { 
      email: user.email, 
      sub: user.id, 
      role: user.role 
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    };
  }
}