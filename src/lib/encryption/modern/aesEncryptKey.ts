// src/lib/encryption/modern/aes.ts
import { abToBase64, base64ToAb } from "@/lib/encryption/utils";

export async function generateAesKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]);
}

export async function exportAesRaw(aesKey: CryptoKey): Promise<ArrayBuffer> {
  return crypto.subtle.exportKey("raw", aesKey);
}

export async function importAesRaw(raw: ArrayBuffer): Promise<CryptoKey> {
  return crypto.subtle.importKey("raw", raw, { name: "AES-GCM" }, false, ["decrypt"]);
}

export async function aesEncryptString(plain: string, aesKey: CryptoKey): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const enc = new TextEncoder().encode(plain);
  const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, aesKey, enc);
  const combined = new Uint8Array(iv.byteLength + ct.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ct), iv.byteLength);
  return abToBase64(combined.buffer);
}

export async function aesDecryptString(combinedB64: string, aesKey: CryptoKey): Promise<string> {
  const combined = new Uint8Array(base64ToAb(combinedB64));
  const iv = combined.slice(0, 12);
  const ct = combined.slice(12);
  const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, aesKey, ct);
  return new TextDecoder().decode(pt);
}
