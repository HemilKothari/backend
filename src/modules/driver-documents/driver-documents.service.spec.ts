import { Test, TestingModule } from '@nestjs/testing';
import { DriverDocumentsService } from './driver-documents.service';

describe('DriverDocumentsService', () => {
  let service: DriverDocumentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DriverDocumentsService],
    }).compile();

    service = module.get<DriverDocumentsService>(DriverDocumentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
