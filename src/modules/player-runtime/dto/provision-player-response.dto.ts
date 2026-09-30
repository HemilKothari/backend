export class ProvisionPlayerResponseDto {
  success: boolean;

  device: {
    id: string;
    deviceCode: string;
  };

  authentication: {
    apiKey: string;
  };

  runtime: {
    syncIntervalSeconds: number;
    heartbeatIntervalSeconds: number;
    telemetryIntervalSeconds: number;
    downloadRetryIntervalSeconds: number;
  };

  serverTime: Date;
}