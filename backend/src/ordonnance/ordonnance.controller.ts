import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Res, StreamableFile, ParseIntPipe, ForbiddenException, Header } from '@nestjs/common';
import { OrdonnanceService } from './ordonnance.service';
import { CreateOrdonnanceDto } from './dto/create-ordonnance.dto';
import { UpdateOrdonnanceDto } from './dto/update-ordonnance.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { User } from '../entities/user.entity';
import { UserRole } from '../enums/user-role.enum';
import { GetUser } from '../auth/decorators/get-user.decorator';
import type { Response } from 'express';
import PDFDocument from 'pdfkit';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger'

@ApiTags('ordonnances')
@Controller('ordonnances')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrdonnanceController {
  constructor(private readonly ordonnanceService: OrdonnanceService) {}

  @Post()
  @Roles(UserRole.DOCTOR)
  @ApiOperation({ summary: 'Create a new ordonnance' })
  @ApiResponse({ status: 201, description: 'Ordonnance created successfully' })
  create(@Body() createOrdonnanceDto: CreateOrdonnanceDto, @GetUser() user: User) {
    return this.ordonnanceService.create(createOrdonnanceDto, user.id);
  }

  @Get('patient/:patientId')
  @Roles(UserRole.DOCTOR, UserRole.PATIENT)
  @ApiOperation({ summary: 'Get ordonnances by patient ID' })
  async findByPatient(
    @Param('patientId', ParseIntPipe) patientId: number,
    @GetUser() user: User
  ) {
    if (user.role === UserRole.PATIENT && user.id !== patientId) {
      throw new ForbiddenException('Access denied');
    }
    return this.ordonnanceService.findByPatient(patientId);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.PATIENT)
  @ApiOperation({ summary: 'Get a single ordonnance by ID' })
  async findOne(@Param('id', ParseIntPipe) id: number, @GetUser() user: User) {
    const ordonnance = await this.ordonnanceService.findOne(id);
    if (user.role === UserRole.PATIENT && ordonnance.patientId !== user.id) {
      throw new ForbiddenException('Access denied');
    }
    return ordonnance;
  }

  @Get(':id/pdf')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.DOCTOR, UserRole.PATIENT)
  async getPdf(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() user: User,
    @Res() res: Response
  ) {
    try {
      console.log('Fetching ordonnance with ID:', id);
      const ordonnance = await this.ordonnanceService.findOne(id);
      
      if (!ordonnance) {
        throw new Error(`Ordonnance with ID ${id} not found`);
      }

      // Debug ordonnance object
      const debugData = {
        id: ordonnance.id,
        date: ordonnance.date,
        doctorId: ordonnance.doctorId,
        patientId: ordonnance.patientId,
        notes: ordonnance.notes,
        // Get the raw medicaments data safely
        _medicamentsInfo: {
          type: typeof ordonnance.medicaments,
          isArray: Array.isArray(ordonnance.medicaments),
          length: Array.isArray(ordonnance.medicaments) ? ordonnance.medicaments.length : 'N/A',
          sample: Array.isArray(ordonnance.medicaments) && ordonnance.medicaments.length > 0 
            ? ordonnance.medicaments[0] 
            : 'No medicaments',
          rawType: Object.prototype.toString.call(ordonnance.medicaments),
          rawValue: ordonnance.medicaments && ordonnance.medicaments.length > 0
            ? JSON.stringify(ordonnance.medicaments).substring(0, 200)
            : 'Empty/undefined'
        },
        // Include the processed medicaments array
        processedMedicaments: ordonnance.medicaments
      };
      console.log('Ordonnance data:', JSON.stringify(debugData, null, 2));
      
      console.log('Ordonnance data:', JSON.stringify({
        id: ordonnance.id,
        doctorId: ordonnance.doctorId,
        patientId: ordonnance.patientId,
        medicamentsType: typeof ordonnance.medicaments,
        medicaments: ordonnance.medicaments,
        notes: ordonnance.notes,
        date: ordonnance.date
      }, null, 2));
      
      // Check if user is authorized to access this ordonnance
      if (user.role === UserRole.PATIENT && ordonnance.patientId !== user.id) {
        throw new ForbiddenException('Not authorized to access this resource');
      }
      
      if (user.role === UserRole.DOCTOR && ordonnance.doctorId !== user.id) {
        throw new ForbiddenException('Not authorized to access this resource');
      }

      // Set response headers
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=ordonnance-${ordonnance.id}.pdf`,
        'Access-Control-Expose-Headers': 'Content-Disposition'
      });

      const doc = new PDFDocument();
      
      // Pipe the PDF to the response
      doc.pipe(res);
      
      try {
        // PDF content
        doc.fontSize(20).text('Ordonnance Médicale', { align: 'center' });
        doc.moveDown();
        
        doc.fontSize(12).text(`Date: ${new Date(ordonnance.date).toLocaleDateString()}`);
        doc.text(`Médecin: ${ordonnance.doctorName}`);
        doc.text(`Patient: ${ordonnance.patientName}`);
        doc.moveDown();
        
        // Handle medicaments data
        doc.fontSize(14).text('Médicaments:', { underline: true });
        doc.moveDown();
        
        try {
          // Get the medicaments array 
          const medicaments = ordonnance.medicaments;
          console.log('Medicaments value in controller:', JSON.stringify(medicaments, null, 2));
          
          if (!medicaments || medicaments.length === 0) {
            doc.text('Aucun médicament prescrit.');
          } else {
            // Process each medication in the array
            medicaments.forEach((med: any) => {
              if (med && typeof med === 'object') {
                const name = med.name || med.nom || 'Médicament non spécifié';
                const dosage = med.dosage ? ` - Dosage: ${med.dosage}` : '';
                const duration = med.duration ? ` - Durée: ${med.duration}` : '';
                const instructions = med.instructions ? ` - Instructions: ${med.instructions}` : '';
                doc.text(`• ${name}${dosage}${duration}${instructions}`);
              } else if (med) {
                doc.text(`• ${med}`);
              }
            });
          }
        } catch (error) {
          console.error('Unexpected error processing medicaments:', error);
          doc.text('• Erreur lors du chargement des médicaments');
        }
        
        if (ordonnance.notes) {
          doc.moveDown();
          doc.fontSize(12).text('Notes:', { underline: true });
          doc.text(ordonnance.notes);
        }
        
        doc.end();
      } catch (pdfError) {
        console.error('Error generating PDF content:', pdfError);
        if (!res.headersSent) {
          res.status(500).json({
            statusCode: 500,
            message: 'Error generating PDF content',
            error: pdfError.message
          });
        }
      }
      
    } catch (error) {
      console.error('Error in getPdf:', error);
      if (!res.headersSent) {
        if (error instanceof ForbiddenException) {
          res.status(403).json({
            statusCode: 403,
            message: error.message
          });
        } else {
          res.status(500).json({
            statusCode: 500,
            message: 'Internal server error',
            error: error.message
          });
        }
      }
    }
  }

  @Patch(':id')
  @Roles(UserRole.DOCTOR)
  @ApiOperation({ summary: 'Update an ordonnance' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateOrdonnanceDto: UpdateOrdonnanceDto,
    @GetUser() user: User
  ) {
    return this.ordonnanceService.update(id, updateOrdonnanceDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR)
  @ApiOperation({ summary: 'Delete an ordonnance' })
  remove(@Param('id', ParseIntPipe) id: number, @GetUser() user: User) {
    return this.ordonnanceService.remove(id, user.id);
  }

  @Get('doctor/:doctorId')
  @ApiOperation({ summary: 'Get ordonnances by doctor ID' })
  @Roles(UserRole.ADMIN, UserRole.DOCTOR)
  async findByDoctor(@Param('doctorId', ParseIntPipe) doctorId: number) {
    return this.ordonnanceService.findByDoctor(doctorId);
  }
}