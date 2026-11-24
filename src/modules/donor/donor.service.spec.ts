import { Test, TestingModule } from '@nestjs/testing';
import { DonorService } from './donor.service';

describe('DonorService', () => {
  let service: DonorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DonorService],
    }).compile();

    service = module.get<DonorService>(DonorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
