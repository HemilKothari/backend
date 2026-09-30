import { mkdir, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { randomUUID } from 'crypto';

const TEMP_MEDIA_DIR = join(tmpdir(), 'aotg-media');

export async function createTempMediaPath(
  extension: string,
): Promise<string> {
  await mkdir(TEMP_MEDIA_DIR, {
    recursive: true,
  });

  const safeExtension = extension.startsWith('.')
    ? extension
    : `.${extension}`;

  return join(
    TEMP_MEDIA_DIR,
    `${randomUUID()}${safeExtension}`,
  );
}

export async function removeTempFile(
  filePath: string,
): Promise<void> {
  await rm(filePath, {
    force: true,
  });
}