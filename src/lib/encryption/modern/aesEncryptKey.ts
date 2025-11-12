/**
 * AES-GCM Encryption/Decryption using Web Crypto API
 * Works in both browser and Node.js environments
 */

import { getWebCrypto } from "../webCrypto";

const webCrypto = getWebCrypto();

// helpers base64 <-> ArrayBuffer
function abToBase64(buf: ArrayBuffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}

export async function exportAesRaw(aesKey: CryptoKey): Promise<ArrayBuffer> {
  return crypto.subtle.exportKey("raw", aesKey);
}

export async function generateAesKey() {
  return webCrypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]);
}

export async function aesEncryptString(plain: string, aesKey: CryptoKey) {
  const iv = webCrypto.getRandomValues(new Uint8Array(12));
  const enc = new TextEncoder().encode(plain);
  const ct = await webCrypto.subtle.encrypt({ name: "AES-GCM", iv }, aesKey, enc);
  const combined = new Uint8Array(iv.byteLength + ct.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ct), iv.byteLength);
  return abToBase64(combined.buffer);
}


export async function aesDecryptString(combinedB64: string, aesKey: CryptoKey) {
  const combined = new Uint8Array(base64ToAb(combinedB64));
  const iv = combined.slice(0, 12);
  const ct = combined.slice(12);
  const pt = await webCrypto.subtle.decrypt({ name: "AES-GCM", iv }, aesKey, ct);
  return new TextDecoder().decode(pt);
}


export async function exportAesRaw(aesKey: CryptoKey) {
  return webCrypto.subtle.exportKey("raw", aesKey);
}
export async function importAesRaw(raw: ArrayBuffer) {
  return webCrypto.subtle.importKey("raw", raw, { name: "AES-GCM" }, false, ["decrypt"]);
}