import { Controller, Get, Post, Body, Patch, Param, Delete, Req, UseGuards, InternalServerErrorException, UnauthorizedException, Put, BadRequestException, SetMetadata } from '@nestjs/common';
import type { Request } from 'express';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../enums/user-role.enum';

interface AuthenticatedRequest extends Request {
  user: any;
}

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST)
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST)
  findAll() {
    return this.usersService.findAll();
  }

  @Get('role/:role')
  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST, UserRole.DOCTOR)
  async findByRole(@Param('role') role: string) {
    // Convert role to lowercase to match enum values
    const normalizedRole = role.toLowerCase();
    
    // Validate if the role exists in the UserRole enum
    if (!Object.values(UserRole).includes(normalizedRole as UserRole)) {
      throw new BadRequestException(`Invalid role: ${role}`);
    }
    
    return this.usersService.findByRole(normalizedRole);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @SetMetadata('roles', [UserRole.ADMIN, UserRole.RECEPTIONIST, UserRole.DOCTOR, UserRole.PATIENT])
  async findOne(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    // If the user is a patient, they can only access their own information
    if (req.user.role === UserRole.PATIENT && req.user.id !== +id) {
      throw new UnauthorizedException('You can only access your own information');
    }
    return this.usersService.findOne(+id);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST)
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto, @Req() req: AuthenticatedRequest) {
    return this.usersService.update(+id, updateUserDto, req.user);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST)
  remove(@Param('id') id: string) {
    return this.usersService.remove(+id);
  }

  @Patch(':id/toggle-status')
  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST)
  toggleUserStatus(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.usersService.toggleUserStatus(+id, req.user);
  }

  // Public endpoint to get doctors
  @Get('public/doctors')
  async getPublicDoctors() {
    const requestId = Math.random().toString(36).substr(2, 9);
    
    try {
      console.log(`[${requestId}] [PUBLIC] Fetching doctors list...`);
      const doctors = await this.usersService.findByRole('doctor', true);
      
      if (!Array.isArray(doctors)) {
        console.error(`[${requestId}] [PUBLIC] Expected array but got:`, typeof doctors);
        return {
          success: true,
          data: []
        };
      }
      
      console.log(`[${requestId}] [PUBLIC] Successfully fetched ${doctors.length} doctors`);
      
      
      return {
        success: true,
        data: doctors.map(doctor => ({
          id: doctor.id,
          email: doctor.email,
          firstName: doctor.firstName,
          lastName: doctor.lastName,
          specialite: doctor.specialite,
          phone: doctor.phone,
          isActive: doctor.isActive,
          role: doctor.role
        }))
      };
    } catch (error) {
      console.error(`[${requestId}] [PUBLIC] Error in getPublicDoctors:`, error);
      return {
        success: false,
        message: 'Failed to fetch doctors',
        error: error.message,
        requestId
      };
    }
  }
  
  @Get('doctors')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST, UserRole.DOCTOR)
  async getDoctors() {
    // call the public endpoint internally
    return this.getPublicDoctors();
  }
}