import crypto from "crypto";

/**
 * File Encryption Module
 * Encrypt and decrypt files before upload/download
 */

const ALGORITHM = "aes-256-cbc";
const KEY_LENGTH = 32; // 256 bits

/**
 * Derive encryption key from password
 */
function deriveKey(password: string, salt: Buffer): Buffer {
    return crypto.scryptSync(password, salt.toString("hex"), KEY_LENGTH);
}

/**
 * Encrypt a file buffer
 * @param fileBuffer - File buffer to encrypt
 * @param key - Encryption key/password
 * @returns Object containing encrypted buffer and IV
 */
export async function encryptFile(fileBuffer: Buffer, key: string): Promise<{
    encrypted: Buffer;
    iv: Buffer;
    salt: Buffer;
}> {
    const salt = crypto.randomBytes(16);
    const derivedKey = deriveKey(key, salt);
    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipheriv(ALGORITHM, derivedKey, iv);
    const encrypted = Buffer.concat([
        cipher.update(fileBuffer),
        cipher.final(),
    ]);

    return { encrypted, iv, salt };
}

/**
 * Decrypt a file buffer
 * @param encryptedBuffer - Encrypted file buffer
 * @param key - Decryption key/password
 * @param iv - Initialization vector
 * @param salt - Salt used for key derivation
 * @returns Decrypted file buffer
 */
export async function decryptFile(
    encryptedBuffer: Buffer,
    key: string,
    iv: Buffer,
    salt: Buffer
): Promise<Buffer> {
    const derivedKey = deriveKey(key, salt);
    const decipher = crypto.createDecipheriv(ALGORITHM, derivedKey, iv);

    const decrypted = Buffer.concat([
        decipher.update(encryptedBuffer),
        decipher.final(),
    ]);

    return decrypted;
}

/**
 * Encrypt file and return a combined buffer (salt:iv:encrypted)
 * Useful for storing encrypted files
 * @param fileBuffer - File buffer to encrypt
 * @param key - Encryption key
 * @returns Combined buffer with salt, IV, and encrypted data
 */
export async function encryptFileToBuffer(fileBuffer: Buffer, key: string): Promise<Buffer> {
    const { encrypted, iv, salt } = await encryptFile(fileBuffer, key);

    // Combine: salt (16 bytes) + iv (16 bytes) + encrypted data
    return Buffer.concat([salt, iv, encrypted]);
}

/**
 * Decrypt file from combined buffer
 * @param combinedBuffer - Buffer containing salt:iv:encrypted
 * @param key - Decryption key
 * @returns Decrypted file buffer
 */
export async function decryptFileFromBuffer(
    combinedBuffer: Buffer,
    key: string
): Promise<Buffer> {
    const salt = combinedBuffer.subarray(0, 16);
    const iv = combinedBuffer.subarray(16, 32);
    const encrypted = combinedBuffer.subarray(32);

    return decryptFile(encrypted, key, iv, salt);
}

