import { Test, TestingModule } from '@nestjs/testing';
import { DriverPayoutService } from './driver-payout.service';

describe('DriverPayoutService', () => {
  let service: DriverPayoutService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DriverPayoutService],
    }).compile();

    service = module.get<DriverPayoutService>(DriverPayoutService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
