/**
 * Super Encryption Implementation
 * Combines classical (Caesar) and modern (AES) encryption for layered security
 */

import { caesarEncrypt, caesarDecrypt } from "./classical/caesarCipher";
import { vigenereEncrypt,vigenereDecrypt } from "./classical/vigenereCipher";
import { aesEncryptString,aesDecryptString,exportAesRaw,importAesRaw,generateAesKey} from "./modern/aesEncryptKey";
import { xorEncrypt, xorDecrypt } from "./modern/xorEncrypt";
import {importPrivateKeyFromJwk,importPublicKeyFromPem} from "./modern/rsaEncrypt"


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
    const encryptedKeyAb = await crypto.subtle.encrypt({ name: "RSA-OAEP" }, recipientKey, rawAes);
    const encryptedKeyB64 = abToBase64(encryptedKeyAb);

    return { ciphertext, encryptedKey: encryptedKeyB64 };

}

/**
 * Super decrypt: Apply AES decryption first, then Caesar decryption
 * @param cipherText - Encrypted text
 * @param key - AES decryption key
 * @returns Decrypted plain text
 */
export async function superDecrypt(message: { ciphertext: string; encryptedKey: string }, privateJwk: JsonWebKey) {
    // import private key
    const privateKey = await importPrivateKeyFromJwk(privateJwk);
    // decrypt AES raw
    const encryptedKeyAb = base64ToAb(message.encryptedKey);
    const rawAes = await crypto.subtle.decrypt({ name: "RSA-OAEP" }, privateKey, encryptedKeyAb);
    const aesKey = await importAesRaw(rawAes);
    // decrypt ciphertext
    const step2 = await aesDecryptString(message.ciphertext, aesKey);
    // reverse classical layers: XOR -> Vigenere -> Caesar
    const step3 = xorDecrypt(step2, "Kjsdo19_123");
    const step4 = vigenereDecrypt(step3, "Kd129Nj");
    const plain = caesarDecrypt(step4, 3);
    return plain;
}

