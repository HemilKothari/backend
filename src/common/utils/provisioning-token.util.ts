import { createHash, randomBytes } from 'crypto';

export function generateProvisioningToken(): string {
  return randomBytes(32).toString('hex');
}

export function hashProvisioningToken(token: string): string {
  return createHash('sha256')
    .update(token)
    .digest('hex');
}