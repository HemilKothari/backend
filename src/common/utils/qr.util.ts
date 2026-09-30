import * as QRCode from 'qrcode';

export async function generateProvisioningQr(
  provisioningToken: string,
): Promise<string> {
  const payload = JSON.stringify({
    type: 'AOTG_PROVISION',
    token: provisioningToken,
  });

  return QRCode.toDataURL(payload, {
    errorCorrectionLevel: 'M',
    margin: 2,
    width: 400,
  });
}