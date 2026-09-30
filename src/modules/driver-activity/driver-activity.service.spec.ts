import { Test, TestingModule } from '@nestjs/testing';
import { DriverActivityService } from './driver-activity.service';

describe('DriverActivityService', () => {
  let service: DriverActivityService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DriverActivityService],
    }).compile();

    service = module.get<DriverActivityService>(DriverActivityService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
