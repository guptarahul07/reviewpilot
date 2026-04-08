// backend/utils/crypto.js
import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;

// Don't load the key immediately - load it when first needed
let SECRET_KEY = null;

/**
 * Get encryption key (loads on first use)
 */
function getSecretKey() {
  if (!SECRET_KEY) {
    const keyHex = process.env.ENCRYPTION_KEY;
    
    if (!keyHex) {
      console.warn('⚠️  WARNING: ENCRYPTION_KEY not set in .env - tokens will not be encrypted properly!');
      // Return a dummy key for development (DO NOT USE IN PRODUCTION)
      return Buffer.alloc(32);
    }
    
    if (keyHex.length !== 64) {
      throw new Error('ENCRYPTION_KEY must be exactly 64 characters (32 bytes in hex)');
    }
    
    SECRET_KEY = Buffer.from(keyHex, 'hex');
  }
  
  return SECRET_KEY;
}

/**
 * Encrypt text using AES-256-GCM
 */
export function encrypt(text) {
  if (!text) return null;
  
  try {
    const secretKey = getSecretKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, secretKey, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
    
  } catch (err) {
    console.error('Encryption error:', err);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt text using AES-256-GCM
 */
export function decrypt(text) {
  if (!text) return null;
  
  try {
    const secretKey = getSecretKey();
    const parts = text.split(':');
    
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format');
    }
    
    const [ivHex, authTagHex, encrypted] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, secretKey, iv);
    
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
    
  } catch (err) {
    console.error('Decryption error:', err);
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Test encryption/decryption
 */
export function testEncryption() {
  console.log('🔐 Testing encryption...');
  
  const testData = 'test-refresh-token-12345';
  
  try {
    const encrypted = encrypt(testData);
    console.log('✅ Encrypted:', encrypted.substring(0, 50) + '...');
    
    const decrypted = decrypt(encrypted);
    console.log('✅ Decrypted:', decrypted);
    
    if (testData === decrypted) {
      console.log('✅ Encryption working correctly!');
    } else {
      console.log('❌ Encryption failed - decrypted data does not match');
    }
  } catch (err) {
    console.error('❌ Encryption test failed:', err.message);
  }
}