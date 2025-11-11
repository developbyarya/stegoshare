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

export async function superDecrypt(
  message: { ciphertext: string; encryptedKey: string },
  privateJwk: JsonWebKey
) {
  try {
    // 1️⃣ Import RSA private key
    const privateKey = await importPrivateKeyFromJwk(privateJwk);

    // 2️⃣ Decode encrypted AES key dari base64 -> ArrayBuffer
    const encryptedKeyAb = base64ToAb(message.encryptedKey);

    // 3️⃣ RSA decrypt untuk mendapatkan raw AES key
    let rawAes: ArrayBuffer;
    try {
      rawAes = await crypto.subtle.decrypt({ name: "RSA-OAEP" }, privateKey, encryptedKeyAb);
    } catch (err) {
      console.error("RSA decrypt gagal:", err);
      throw new Error("Gagal mendekripsi AES key (RSA-OAEP). Pastikan pasangan kunci cocok.");
    }

    // 4️⃣ Validasi panjang AES key
    const keyBytes = new Uint8Array(rawAes);
    console.log("AES raw key length:", keyBytes.length, "bytes");
    if (![16, 24, 32].includes(keyBytes.length)) {
      throw new Error(`Panjang AES key tidak valid (${keyBytes.length}). Harus 16/24/32 byte.`);
    }

    // 5️⃣ Import AES key
    const aesKey = await importAesRaw(rawAes);

    // 6️⃣ Decrypt ciphertext (AES)
    const step2 = await aesDecryptString(message.ciphertext, aesKey);

    // 7️⃣ Reverse classical layers
    const step3 = xorDecrypt(step2, XOR_KEY);
    const step4 = vigenereDecrypt(step3, VIGENERE_KEY);
    const plain = caesarDecrypt(step4, CAESAR_SHIFT);

    return plain;
  } catch (err) {
    console.error("superDecrypt error:", err);
    throw err;
  }
}
