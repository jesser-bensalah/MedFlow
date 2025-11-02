import { Controller, Get, Post, Body, Param, Put, Delete, Query, ParseIntPipe } from '@nestjs/common';
import { OrdonnanceService } from './ordonnance.service';
import { CreateOrdonnanceDto } from './dto/create-ordonnance.dto';
import { UpdateOrdonnanceDto } from './dto/update-ordonnance.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger'

@ApiTags('ordonnances')
@Controller('ordonnances')
export class OrdonnanceController {
  constructor(private readonly ordonnanceService: OrdonnanceService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new ordonnance' })
  @ApiResponse({ status: 201, description: 'Ordonnance created successfully' })
  create(@Body() createOrdonnanceDto: CreateOrdonnanceDto) {
    return this.ordonnanceService.create(createOrdonnanceDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all ordonnances' })
  findAll() {
    return this.ordonnanceService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single ordonnance by ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.ordonnanceService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an ordonnance' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateOrdonnanceDto: UpdateOrdonnanceDto,
  ) {
    return this.ordonnanceService.update(id, updateOrdonnanceDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an ordonnance' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.ordonnanceService.remove(id);
  }

  @Get('patient/:patientId')
  @ApiOperation({ summary: 'Get ordonnances by patient ID' })
  findByPatient(@Param('patientId', ParseIntPipe) patientId: number) {
    return this.ordonnanceService.findByPatient(patientId);
  }

  @Get('doctor/:doctorId')
  @ApiOperation({ summary: 'Get ordonnances by doctor ID' })
  findByDoctor(@Param('doctorId', ParseIntPipe) doctorId: number) {
    return this.ordonnanceService.findByDoctor(doctorId);
  }
}