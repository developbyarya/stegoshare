import crypto from "crypto";

/**
 * AES-256-CBC Encryption/Decryption
 */

const ALGORITHM = "aes-256-cbc";
const KEY_LENGTH = 32; // 256 bits

// helpers base64 <-> ArrayBuffer
function abToBase64(buf: ArrayBuffer) {
    return btoa(String.fromCharCode(...new Uint8Array(buf)));
}
function base64ToAb(b64: string) {
    return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)).buffer;
}

export async function generateAesKey() {
    return crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]);
}


export async function aesEncryptString(plain: string, aesKey: CryptoKey) {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const enc = new TextEncoder().encode(plain);
    const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, aesKey, enc);
    const combined = new Uint8Array(iv.byteLength + ct.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(ct), iv.byteLength);
    return abToBase64(combined.buffer);
}


export async function aesDecryptString(combinedB64: string, aesKey: CryptoKey) {
    const combined = new Uint8Array(base64ToAb(combinedB64));
    const iv = combined.slice(0, 12);
    const ct = combined.slice(12);
    const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, aesKey, ct);
    return new TextDecoder().decode(pt);
}


export async function exportAesRaw(aesKey: CryptoKey) {
    return crypto.subtle.exportKey("raw", aesKey);
}
export async function importAesRaw(raw: ArrayBuffer) {
    return crypto.subtle.importKey("raw", raw, { name: "AES-GCM" }, false, ["decrypt"]);
}