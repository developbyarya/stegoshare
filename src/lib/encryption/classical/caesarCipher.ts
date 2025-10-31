/**
 * Caesar Cipher Implementation
 * Shifts each letter in the text by a fixed number of positions
 */

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const ALPHABET_LENGTH = ALPHABET.length;

/**
 * Encrypt text using Caesar cipher
 * @param text - Plain text to encrypt
 * @param shift - Number of positions to shift (default: 3)
 * @returns Encrypted text
 */
export function caesarEncrypt(text: string, shift: number = 3): string {
    return text
        .split("")
        .map((char) => {
            const upperChar = char.toUpperCase();
            const index = ALPHABET.indexOf(upperChar);

            if (index === -1) {
                return char; // Non-alphabetic characters remain unchanged
            }

            const newIndex = (index + shift) % ALPHABET_LENGTH;
            const encryptedChar = ALPHABET[newIndex];

            return char === upperChar ? encryptedChar : encryptedChar.toLowerCase();
        })
        .join("");
}

/**
 * Decrypt text using Caesar cipher
 * @param cipherText - Encrypted text
 * @param shift - Number of positions to shift (default: 3)
 * @returns Decrypted text
 */
export function caesarDecrypt(cipherText: string, shift: number = 3): string {
    return caesarEncrypt(cipherText, ALPHABET_LENGTH - shift);
}

