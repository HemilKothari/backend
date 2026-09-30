import { Test, TestingModule } from '@nestjs/testing';
import { RickshawController } from './rickshaws.controller';

describe('RickshawController', () => {
  let controller: RickshawController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RickshawController],
    }).compile();

    controller = module.get<RickshawController>(RickshawController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
