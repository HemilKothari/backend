import { Test, TestingModule } from '@nestjs/testing';
import { DeviceProvisionService } from './device-provision.service';

describe('DeviceProvisionService', () => {
  let service: DeviceProvisionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DeviceProvisionService],
    }).compile();

    service = module.get<DeviceProvisionService>(DeviceProvisionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
