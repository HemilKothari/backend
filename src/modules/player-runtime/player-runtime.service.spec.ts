import { Test, TestingModule } from '@nestjs/testing';
import { PlayerRuntimeService } from './player-runtime.service';

describe('PlayerRuntimeService', () => {
  let service: PlayerRuntimeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PlayerRuntimeService],
    }).compile();

    service = module.get<PlayerRuntimeService>(PlayerRuntimeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
