import { Test, TestingModule } from '@nestjs/testing';
import { RickshawService } from './rickshaws.service';

describe('RickshawService', () => {
  let service: RickshawService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RickshawService],
    }).compile();

    service = module.get<RickshawService>(RickshawService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
