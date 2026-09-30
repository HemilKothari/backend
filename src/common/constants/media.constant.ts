import { MediaOrientation } from '@prisma/client';

export const MEDIA_VALIDATION = {

  REQUIRED_ORIENTATION: MediaOrientation.PORTRAIT,

  MIN_DURATION_SECONDS: 10,

  MAX_DURATION_SECONDS: 60,

  MIN_ASPECT_RATIO: 1.70,

  MAX_ASPECT_RATIO: 1.85,

  MIN_WIDTH: 720,

  MIN_HEIGHT: 1280,

  MAX_FILE_SIZE: 100 * 1024 * 1024, //100 MB
} as const;