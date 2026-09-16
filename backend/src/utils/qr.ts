import QRCode from 'qrcode';
import crypto from 'crypto';

/**
 * Generates a high-entropy, cryptographically secure random pickup token.
 * Contains only a random hex string - NEVER customer PII or sensitive data.
 */
export const generatePickupToken = (): string => {
  return `PK-${crypto.randomBytes(16).toString('hex').toUpperCase()}`;
};

/**
 * Generates a data URL for the QR code image.
 */
export const generateQRCodeDataUrl = async (token: string): Promise<string> => {
  return QRCode.toDataURL(token, {
    errorCorrectionLevel: 'H',
    margin: 2,
    width: 300,
    color: {
      dark: '#1e1b4b',
      light: '#ffffff'
    }
  });
};
