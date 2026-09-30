import { Test, TestingModule } from '@nestjs/testing';
import { DriverActivityController } from './driver-activity.controller';

describe('DriverActivityController', () => {
  let controller: DriverActivityController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DriverActivityController],
    }).compile();

    controller = module.get<DriverActivityController>(DriverActivityController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
