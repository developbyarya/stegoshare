import crypto from "crypto";

/**
 * AES-256-CBC Encryption/Decryption
 */

const ALGORITHM = "aes-256-cbc";
const KEY_LENGTH = 32; // 256 bits

/**
 * Derive encryption key from password using scrypt
 * @param password - Password string
 * @param salt - Salt for key derivation (optional, generates random if not provided)
 * @returns Buffer containing the derived key
 */
function deriveKey(password: string, salt?: Buffer): Buffer {
    const saltBuffer = salt || crypto.randomBytes(16);
    return crypto.scryptSync(password, saltBuffer.toString("hex"), KEY_LENGTH);
}

/**
 * Encrypt text using AES-256-CBC
 * @param text - Plain text to encrypt
 * @param password - Encryption password
 * @returns Base64 encoded string: salt:iv:encryptedData
 */
export function aesEncrypt(text: string, password: string): string {
    const salt = crypto.randomBytes(16);
    const key = deriveKey(password, salt);
    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    const encrypted = Buffer.concat([
        cipher.update(text, "utf8"),
        cipher.final(),
    ]);

    // Format: salt:iv:encryptedData (all base64 encoded)
    const saltB64 = salt.toString("base64");
    const ivB64 = iv.toString("base64");
    const encryptedB64 = encrypted.toString("base64");

    return `${saltB64}:${ivB64}:${encryptedB64}`;
}

/**
 * Decrypt text using AES-256-CBC
 * @param encryptedData - Base64 encoded string: salt:iv:encryptedData
 * @param password - Decryption password
 * @returns Decrypted plain text
 */
export function aesDecrypt(encryptedData: string, password: string): string {
    const parts = encryptedData.split(":");
    if (parts.length !== 3) {
        throw new Error("Invalid encrypted data format");
    }

    const salt = Buffer.from(parts[0], "base64");
    const iv = Buffer.from(parts[1], "base64");
    const encrypted = Buffer.from(parts[2], "base64");

    const key = deriveKey(password, salt);
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);

    const decrypted = Buffer.concat([
        decipher.update(encrypted),
        decipher.final(),
    ]);

    return decrypted.toString("utf8");
}

