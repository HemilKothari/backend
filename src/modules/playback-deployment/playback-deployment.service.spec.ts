import { Test, TestingModule } from '@nestjs/testing';
import { PlaybackDeploymentService } from './playback-deployment.service';

describe('PlaybackDeploymentService', () => {
  let service: PlaybackDeploymentService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PlaybackDeploymentService],
    }).compile();

    service = module.get<PlaybackDeploymentService>(PlaybackDeploymentService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
