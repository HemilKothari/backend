import * as crypto from 'crypto';
import { createReadStream } from 'fs';

export function calculateFileHash(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

export async function calculateFileHashFromPath(
  filePath: string,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');

    const stream = createReadStream(filePath);

    stream.on('data', (chunk) => {
      hash.update(chunk);
    });

    stream.on('end', () => {
      resolve(hash.digest('hex'));
    });

    stream.on('error', reject);
  });
}
