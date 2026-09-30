import { Test, TestingModule } from '@nestjs/testing';
import { DeviceProvisionController } from './device-provision.controller';

describe('DeviceProvisionController', () => {
  let controller: DeviceProvisionController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DeviceProvisionController],
    }).compile();

    controller = module.get<DeviceProvisionController>(DeviceProvisionController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
