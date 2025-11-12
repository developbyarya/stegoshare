// src/lib/encryption/modern/hybridEncrypt.ts
import { generateAesKey, exportAesRaw, importAesRaw, aesEncryptString, aesDecryptString } from "@/lib/encryption/modern/aesEncryptKey";
import { importPublicKeyFromPem, importPrivateKeyFromJwk } from "@/lib/encryption/modern/rsaEncrypt";
import { getPrivateKeyJwk } from "@/lib/encryption/modern/keyStore";
import { abToBase64, base64ToAb } from "@/lib/encryption/utils";

/**
 * Encrypt plaintext for a recipient given their public PEM.
 * Returns { ciphertext (base64), encryptedKey (base64) }.
 */
export async function encryptForRecipient(plainText: string, recipientPublicPem: string) {
  // 1) AES key
  const aesKey = await generateAesKey();

  // 2) encrypt message with AES
  const ciphertext = await aesEncryptString(plainText, aesKey);

  // 3) export raw AES and encrypt with recipient RSA public key
  const rawAes = await exportAesRaw(aesKey); // ArrayBuffer
  const recipientKey = await importPublicKeyFromPem(recipientPublicPem);

  const encryptedRaw = await crypto.subtle.encrypt({ name: "RSA-OAEP" }, recipientKey, rawAes);
  const encryptedKeyB64 = abToBase64(encryptedRaw);

  return { ciphertext, encryptedKey: encryptedKeyB64 };
}

/**
 * Decrypt received message using private key stored in IndexedDB.
 */
export async function decryptReceived(ciphertext: string, encryptedKeyB64: string) {
  const jwk = await getPrivateKeyJwk();
  if (!jwk) throw new Error("Private key missing on this device");

  const privateKey = await importPrivateKeyFromJwk(jwk);
  const encryptedRaw = base64ToAb(encryptedKeyB64);
  const rawAes = await crypto.subtle.decrypt({ name: "RSA-OAEP" }, privateKey, encryptedRaw);

  const aesKey = await importAesRaw(rawAes);
  const plain = await aesDecryptString(ciphertext, aesKey);
  return plain;
}
