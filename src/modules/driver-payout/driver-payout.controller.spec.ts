import { Test, TestingModule } from '@nestjs/testing';
import { DriverPayoutController } from './driver-payout.controller';

describe('DriverPayoutController', () => {
  let controller: DriverPayoutController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DriverPayoutController],
    }).compile();

    controller = module.get<DriverPayoutController>(DriverPayoutController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
