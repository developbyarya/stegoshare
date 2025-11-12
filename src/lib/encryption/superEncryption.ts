/**
 * Super Encryption Implementation
 * Combines classical (Caesar) and modern (AES) encryption for layered security
 */

import { caesarEncrypt, caesarDecrypt } from "./classical/caesarCipher";
import { vigenereEncrypt, vigenereDecrypt } from "./classical/vigenereCipher";
import { aesEncryptString, aesDecryptString, exportAesRaw, importAesRaw, generateAesKey } from "./modern/aesEncryptKey";
import { xorEncrypt, xorDecrypt } from "./modern/xorEncrypt";
import { importPrivateKeyFromJwk, importPublicKeyFromPem } from "./modern/rsaEncrypt"

import { getWebCrypto } from "./webCrypto";

const webCrypto = getWebCrypto();

const CAESAR_SHIFT = 3;
const VIGENERE_KEY = "Kd129Nj";
const XOR_KEY = "Kjsdo19_123";

// helpers base64 <-> ArrayBuffer
function abToBase64(buf: ArrayBuffer) {
    return btoa(String.fromCharCode(...new Uint8Array(buf)));
}
function base64ToAb(b64: string) {
    return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)).buffer;
}

/**
 * Super encrypt: Apply Caesar cipher first, then AES encryption
 * @param text - Plain text to encrypt
 * @param key - AES encryption key
 * @returns Encrypted text
 */
export async function superEncrypt(plain: string, recipientPublicKeyPem: string) {
    // Step 1: Apply Caesar cipher
    const step1 = caesarEncrypt(plain, CAESAR_SHIFT);

    //Step 2: Aplly encryption vigenere
    const step2 = vigenereEncrypt(step1, VIGENERE_KEY);

    //Step 3: Aplly encryption xor
    const step3 = xorEncrypt(step2, XOR_KEY);

    // step 4: generate AES key and encrypt step3
    const aesKey = await generateAesKey();
    const ciphertext = await aesEncryptString(step3, aesKey); // base64 (iv + ct)
    // Step 5: Apply AES encryption
    // export raw AES key and encrypt with recipient RSA public key
    const rawAes = await exportAesRaw(aesKey);
    const recipientKey = await importPublicKeyFromPem(recipientPublicKeyPem);
    const encryptedKeyAb = await webCrypto.subtle.encrypt({ name: "RSA-OAEP" }, recipientKey, rawAes);
    const encryptedKeyB64 = abToBase64(encryptedKeyAb);

    return { ciphertext, encryptedKey: encryptedKeyB64 };

}

/**
 * Super decrypt: Reverse the encryption process
 * Decrypt AES first, then reverse classical layers: XOR -> Vigenere -> Caesar
 * @param message - Object containing ciphertext and encryptedKey
 * @param privateJwk - Private key in JWK format for RSA decryption
 * @returns Decrypted plain text
 */
export async function superDecrypt(message: { ciphertext: string; encryptedKey: string }, privateJwk: JsonWebKey) {
    try {
        // Step 1: Import private key
        const privateKey = await importPrivateKeyFromJwk(privateJwk);

        // Step 2: Decrypt the AES key using RSA private key
        const encryptedKeyAb = base64ToAb(message.encryptedKey);
        let rawAes: ArrayBuffer;
        try {
            rawAes = await webCrypto.subtle.decrypt({ name: "RSA-OAEP" }, privateKey, encryptedKeyAb);
        } catch (e) {
            throw new Error(`RSA decryption failed: ${e instanceof Error ? e.message : String(e)}. The message may be encrypted with a different public key.`);
        }

        const aesKey = await importAesRaw(rawAes);

        // Step 3: Decrypt the ciphertext using AES (this gives us the XOR-encrypted hex string)
        let xorEncryptedHex: string;
        try {
            xorEncryptedHex = await aesDecryptString(message.ciphertext, aesKey);
        } catch (e) {
            throw new Error(`AES decryption failed: ${e instanceof Error ? e.message : String(e)}. The ciphertext may be corrupted.`);
        }

        // Step 4: Reverse classical layers in reverse order: XOR -> Vigenere -> Caesar
        const vigenereEncrypted = xorDecrypt(xorEncryptedHex, XOR_KEY);
        const caesarEncrypted = vigenereDecrypt(vigenereEncrypted, VIGENERE_KEY);
        const plain = caesarDecrypt(caesarEncrypted, CAESAR_SHIFT);

        return plain;
    } catch (e) {
        // Re-throw with more context
        if (e instanceof Error) {
            throw e;
        }
        throw new Error(`Decryption failed: ${String(e)}`);
    }
}

