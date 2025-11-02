import { Test, TestingModule } from '@nestjs/testing';
import { OrdonnanceService } from './ordonnance.service';

describe('OrdonnanceService', () => {
  let service: OrdonnanceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OrdonnanceService],
    }).compile();

    service = module.get<OrdonnanceService>(OrdonnanceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
