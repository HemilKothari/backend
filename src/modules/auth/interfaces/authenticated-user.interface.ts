import { UserRole } from '@prisma/client';

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  driverId: string | null;
  advertiserId: string | null;
}