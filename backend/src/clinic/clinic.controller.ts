import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common';
import { ClinicService } from './clinic.service';
import { CreateClinicDto } from './dto/create-clinic.dto';
import { UpdateClinicDto } from './dto/update-clinic.dto';

@Controller('clinics')
export class ClinicController {
  constructor(private readonly clinicService: ClinicService) {}

  @Post()
  create(@Body() createClinicDto: CreateClinicDto) {
    return this.clinicService.create(createClinicDto);
  }

  @Get()
  findAll() {
    return this.clinicService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.clinicService.findOne(+id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateClinicDto: UpdateClinicDto) {
    return this.clinicService.update(+id, updateClinicDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.clinicService.remove(+id);
  }

  @Post(':id/medecins/:medecinId')
  addMedecin(@Param('id') id: string, @Param('medecinId') medecinId: string) {
    return this.clinicService.addMedecin(+id, medecinId);
  }

  @Delete(':id/medecins/:medecinId')
  removeMedecin(@Param('id') id: string, @Param('medecinId') medecinId: string) {
    return this.clinicService.removeMedecin(+id, medecinId);
  }
}