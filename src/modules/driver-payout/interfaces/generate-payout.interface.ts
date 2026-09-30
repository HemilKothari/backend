import { DriverPayout } from "@prisma/client";

export interface GeneratePayoutResult {
  payout: DriverPayout;

  created: boolean;
}