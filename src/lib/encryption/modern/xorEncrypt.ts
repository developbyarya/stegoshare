/**
 * XOR Cipher Implementation
 * Simple encryption using XOR operation with a key
 */

/**
 * Encrypt/Decrypt text using XOR cipher
 * @param text - Text to encrypt/decrypt
 * @param key - Encryption key
 * @returns Encrypted/decrypted text as hex string
 */
export function xorEncrypt(text: string, key: string): string {
    let result = "";

    for (let i = 0; i < text.length; i++) {
        const textChar = text.charCodeAt(i);
        const keyChar = key.charCodeAt(i % key.length);
        const xorResult = textChar ^ keyChar;
        result += String.fromCharCode(xorResult);
    }

    // Convert to hex for storage
    return Buffer.from(result, "utf8").toString("hex");
}

/**
 * Decrypt text that was encrypted with XOR cipher
 * @param encryptedHex - Hex-encoded encrypted text
 * @param key - Decryption key (same as encryption key)
 * @returns Decrypted plain text
 */
export function xorDecrypt(encryptedHex: string, key: string): string {
    const encryptedBuffer = Buffer.from(encryptedHex, "hex");
    let result = "";

    for (let i = 0; i < encryptedBuffer.length; i++) {
        const encryptedChar = encryptedBuffer[i];
        const keyChar = key.charCodeAt(i % key.length);
        const xorResult = encryptedChar ^ keyChar;
        result += String.fromCharCode(xorResult);
    }

    return result;
}

