import { Test, TestingModule } from '@nestjs/testing';
import { OrdonnanceController } from './ordonnance.controller';

describe('OrdonnanceController', () => {
  let controller: OrdonnanceController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrdonnanceController],
    }).compile();

    controller = module.get<OrdonnanceController>(OrdonnanceController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
