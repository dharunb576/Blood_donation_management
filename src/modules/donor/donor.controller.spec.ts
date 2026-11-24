import { Test, TestingModule } from '@nestjs/testing';
import { DonorController } from './donor.controller';

describe('DonorController', () => {
  let controller: DonorController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DonorController],
    }).compile();

    controller = module.get<DonorController>(DonorController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
