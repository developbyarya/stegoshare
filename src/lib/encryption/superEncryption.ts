/**
 * Super Encryption Implementation
 * Combines classical (Caesar) and modern (AES) encryption for layered security
 */

import { caesarEncrypt, caesarDecrypt } from "./classical/caesarCipher";
import { aesEncrypt, aesDecrypt } from "./modern/aesEncrypt";

const CAESAR_SHIFT = 3;

/**
 * Super encrypt: Apply Caesar cipher first, then AES encryption
 * @param text - Plain text to encrypt
 * @param key - AES encryption key
 * @returns Encrypted text
 */
export function superEncrypt(text: string, key: string): string {
    // Step 1: Apply Caesar cipher
    const step1 = caesarEncrypt(text, CAESAR_SHIFT);

    // Step 2: Apply AES encryption
    const step2 = aesEncrypt(step1, key);

    return step2;
}

/**
 * Super decrypt: Apply AES decryption first, then Caesar decryption
 * @param cipherText - Encrypted text
 * @param key - AES decryption key
 * @returns Decrypted plain text
 */
export function superDecrypt(cipherText: string, key: string): string {
    // Step 1: Decrypt AES
    const step1 = aesDecrypt(cipherText, key);

    // Step 2: Decrypt Caesar cipher
    const step2 = caesarDecrypt(step1, CAESAR_SHIFT);

    return step2;
}

