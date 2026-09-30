import { Test, TestingModule } from '@nestjs/testing';
import { DriverDocumentsController } from './driver-documents.controller';

describe('DriverDocumentsController', () => {
  let controller: DriverDocumentsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DriverDocumentsController],
    }).compile();

    controller = module.get<DriverDocumentsController>(DriverDocumentsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
