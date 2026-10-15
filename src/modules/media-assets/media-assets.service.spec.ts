
import { Test, TestingModule } from '@nestjs/testing';
import { MediaAssetsService } from './media-assets.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { MediaService } from '../media/media.service';
import { AuditService } from '../audit/audit.service';
import { STORAGE_PROVIDER } from '../storage/constants';

describe('MediaAssetsService', () => {
  let service: MediaAssetsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MediaAssetsService,
        {
          provide: PrismaService,
          useValue: {},
        },
        {
          provide: MediaService,
          useValue: {},
        },
        {
          provide: AuditService,
          useValue: {},
        },
        {
          provide: STORAGE_PROVIDER,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<MediaAssetsService>(MediaAssetsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
