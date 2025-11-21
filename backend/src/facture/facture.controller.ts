import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards } from '@nestjs/common';
import { FactureService } from './facture.service';
import { CreateFactureDto } from './dto/create-facture.dto';
import { UpdateFactureDto } from './dto/update-facture.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('factures')
@Controller('factures')
export class FactureController {
  constructor(private readonly factureService: FactureService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create a new facture' })
  @ApiResponse({ status: 201, description: 'The facture has been successfully created.' })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  create(@Body() createFactureDto: CreateFactureDto) {
    return this.factureService.create(createFactureDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get all factures' })
  @ApiResponse({ status: 200, description: 'Return all factures.' })
  findAll() {
    return this.factureService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get a facture by ID' })
  @ApiResponse({ status: 200, description: 'Return the facture with the specified ID.' })
  @ApiResponse({ status: 404, description: 'Facture not found.' })
  findOne(@Param('id') id: string) {
    return this.factureService.findOne(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update a facture' })
  @ApiResponse({ status: 200, description: 'The facture has been successfully updated.' })
  @ApiResponse({ status: 404, description: 'Facture not found.' })
  update(@Param('id') id: string, @Body() updateFactureDto: UpdateFactureDto) {
    return this.factureService.update(id, updateFactureDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete a facture' })
  @ApiResponse({ status: 200, description: 'The facture has been successfully deleted.' })
  @ApiResponse({ status: 404, description: 'Facture not found.' })
  remove(@Param('id') id: string) {
    return this.factureService.remove(id);
  }
}
