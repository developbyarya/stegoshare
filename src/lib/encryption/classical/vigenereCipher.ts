/**
 * Vigenère Cipher Implementation
 * Uses a keyword to shift each letter differently
 */

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const ALPHABET_LENGTH = ALPHABET.length;

/**
 * Normalize key by repeating it to match text length
 */
function normalizeKey(key: string, length: number): string {
    const normalizedKey = key.toUpperCase().replace(/[^A-Z]/g, "");
    if (normalizedKey.length === 0) throw new Error("Key must contain at least one letter");

    let result = "";
    for (let i = 0; i < length; i++) {
        result += normalizedKey[i % normalizedKey.length];
    }
    return result;
}

/**
 * Encrypt text using Vigenère cipher
 * @param text - Plain text to encrypt
 * @param key - Encryption key
 * @returns Encrypted text
 */
export function vigenereEncrypt(text: string, key: string): string {
    const normalizedKey = normalizeKey(key, text.length);
    let keyIndex = 0;

    return text
        .split("")
        .map((char) => {
            const upperChar = char.toUpperCase();
            const textIndex = ALPHABET.indexOf(upperChar);

            if (textIndex === -1) {
                return char; // Non-alphabetic characters remain unchanged
            }

            const keyChar = normalizedKey[keyIndex++];
            const keyShift = ALPHABET.indexOf(keyChar);
            const newIndex = (textIndex + keyShift) % ALPHABET_LENGTH;
            const encryptedChar = ALPHABET[newIndex];

            return char === upperChar ? encryptedChar : encryptedChar.toLowerCase();
        })
        .join("");
}

/**
 * Decrypt text using Vigenère cipher
 * @param cipherText - Encrypted text
 * @param key - Decryption key (same as encryption key)
 * @returns Decrypted text
 */
export function vigenereDecrypt(cipherText: string, key: string): string {
    const normalizedKey = normalizeKey(key, cipherText.length);
    let keyIndex = 0;

    return cipherText
        .split("")
        .map((char) => {
            const upperChar = char.toUpperCase();
            const textIndex = ALPHABET.indexOf(upperChar);

            if (textIndex === -1) {
                return char; // Non-alphabetic characters remain unchanged
            }

            const keyChar = normalizedKey[keyIndex++];
            const keyShift = ALPHABET.indexOf(keyChar);
            const newIndex = (textIndex - keyShift + ALPHABET_LENGTH) % ALPHABET_LENGTH;
            const decryptedChar = ALPHABET[newIndex];

            return char === upperChar ? decryptedChar : decryptedChar.toLowerCase();
        })
        .join("");
}

