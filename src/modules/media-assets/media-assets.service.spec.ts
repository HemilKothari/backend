import { Test, TestingModule } from '@nestjs/testing';
import { MediaAssetsService } from './media-assets.service';

describe('MediaAssetsService', () => {
  let service: MediaAssetsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MediaAssetsService],
    }).compile();

    service = module.get<MediaAssetsService>(MediaAssetsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
