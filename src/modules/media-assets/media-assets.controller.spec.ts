import { Test, TestingModule } from '@nestjs/testing';
import { MediaAssetsController } from './media-assets.controller';

describe('MediaAssetsController', () => {
  let controller: MediaAssetsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MediaAssetsController],
    }).compile();

    controller = module.get<MediaAssetsController>(MediaAssetsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
