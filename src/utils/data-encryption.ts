import { KMS } from 'aws-sdk';
import * as crypto from 'crypto';

export interface EncryptionConfig {
  kmsKeyId: string;
  algorithm?: string;
}

export class DataEncryption {
  private kms: KMS;
  private keyId: string;
  private algorithm: string;

  constructor(config: EncryptionConfig) {
    this.kms = new KMS();
    this.keyId = config.kmsKeyId;
    this.algorithm = config.algorithm || 'aes-256-gcm';
  }

  /**
   * Encrypts sensitive data using KMS data key
   */
  async encryptData(plaintext: string | Buffer): Promise<{
    encryptedData: string;
    encryptedDataKey: string;
    iv: string;
    authTag: string;
  }> {
    try {
      // Generate a data key from KMS
      const dataKeyResult = await this.kms.generateDataKey({
        KeyId: this.keyId,
        KeySpec: 'AES_256',
      }).promise();

      if (!dataKeyResult.Plaintext || !dataKeyResult.CiphertextBlob) {
        throw new Error('Failed to generate data key');
      }

      // Use the plaintext data key to encrypt the data
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipher(this.algorithm, dataKeyResult.Plaintext as Buffer);
      cipher.setAAD(Buffer.from('inventory-replenishment'));

      let encrypted = cipher.update(plaintext, 'utf8', 'base64');
      encrypted += cipher.final('base64');

      const authTag = cipher.getAuthTag();

      return {
        encryptedData: encrypted,
        encryptedDataKey: dataKeyResult.CiphertextBlob.toString('base64'),
        iv: iv.toString('base64'),
        authTag: authTag.toString('base64'),
      };

    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypts data using KMS
   */
  async decryptData(encryptedPayload: {
    encryptedData: string;
    encryptedDataKey: string;
    iv: string;
    authTag: string;
  }): Promise<string> {
    try {
      // Decrypt the data key using KMS
      const decryptResult = await this.kms.decrypt({
        CiphertextBlob: Buffer.from(encryptedPayload.encryptedDataKey, 'base64'),
      }).promise();

      if (!decryptResult.Plaintext) {
        throw new Error('Failed to decrypt data key');
      }

      // Use the decrypted data key to decrypt the data
      const decipher = crypto.createDecipher(this.algorithm, decryptResult.Plaintext as Buffer);
      decipher.setAAD(Buffer.from('inventory-replenishment'));
      decipher.setAuthTag(Buffer.from(encryptedPayload.authTag, 'base64'));

      let decrypted = decipher.update(encryptedPayload.encryptedData, 'base64', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;

    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * Encrypts sensitive fields in an object
   */
  async encryptSensitiveFields(
    data: Record<string, any>,
    sensitiveFields: string[]
  ): Promise<Record<string, any>> {
    const result = { ...data };

    for (const field of sensitiveFields) {
      if (result[field] && typeof result[field] === 'string') {
        const encrypted = await this.encryptData(result[field]);
        result[field] = {
          encrypted: true,
          ...encrypted,
        };
      }
    }

    return result;
  }

  /**
   * Decrypts sensitive fields in an object
   */
  async decryptSensitiveFields(
    data: Record<string, any>,
    sensitiveFields: string[]
  ): Promise<Record<string, any>> {
    const result = { ...data };

    for (const field of sensitiveFields) {
      if (result[field] && typeof result[field] === 'object' && result[field].encrypted) {
        const decrypted = await this.decryptData(result[field]);
        result[field] = decrypted;
      }
    }

    return result;
  }

  /**
   * Hashes sensitive data for indexing (one-way)
   */
  hashForIndex(data: string, salt?: string): string {
    const actualSalt = salt || process.env.HASH_SALT || 'inventory-replenishment-salt';
    return crypto.createHash('sha256').update(data + actualSalt).digest('hex');
  }

  /**
   * Generates a secure random token
   */
  generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Validates data integrity using HMAC
   */
  generateHMAC(data: string, secret?: string): string {
    const actualSecret = secret || process.env.HMAC_SECRET || 'inventory-replenishment-hmac';
    return crypto.createHmac('sha256', actualSecret).update(data).digest('hex');
  }

  /**
   * Verifies data integrity using HMAC
   */
  verifyHMAC(data: string, hmac: string, secret?: string): boolean {
    const expectedHmac = this.generateHMAC(data, secret);
    return crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(expectedHmac));
  }
}

/**
 * Utility function to identify sensitive fields in invoice data
 */
export function getSensitiveInvoiceFields(): string[] {
  return [
    'supplierTaxId',
    'customerTaxId',
    'bankAccountNumber',
    'routingNumber',
    'creditCardNumber',
    'paymentDetails',
    'contactEmail',
    'contactPhone',
    'billingAddress',
    'shippingAddress',
  ];
}

/**
 * Utility function to identify PII fields
 */
export function getPIIFields(): string[] {
  return [
    'email',
    'phone',
    'address',
    'ssn',
    'taxId',
    'firstName',
    'lastName',
    'fullName',
    'dateOfBirth',
  ];
}