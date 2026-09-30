import { Test, TestingModule } from '@nestjs/testing';
import { PlayerRuntimeController } from './player-runtime.controller';

describe('PlayerRuntimeController', () => {
  let controller: PlayerRuntimeController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PlayerRuntimeController],
    }).compile();

    controller = module.get<PlayerRuntimeController>(PlayerRuntimeController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
