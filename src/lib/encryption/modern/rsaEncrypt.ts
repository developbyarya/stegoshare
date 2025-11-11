// src/lib/encryption/modern/rsaEncrypt.ts
// RSA helpers using Web Crypto (browser)

export async function generateRSAKeyPair(): Promise<CryptoKeyPair> {
  return crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 4096,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true, // extractable true so we can export keys
    ["encrypt", "decrypt"]
  );
}

export async function exportPublicKeyToPem(key: CryptoKey): Promise<string> {
  const spki = await crypto.subtle.exportKey("spki", key);
  const b64 = arrayBufferToBase64(spki);
  const chunks = b64.match(/.{1,64}/g)?.join("\n") ?? b64;
  return `-----BEGIN PUBLIC KEY-----\n${chunks}\n-----END PUBLIC KEY-----`;
}

export async function exportPrivateKeyToJwk(key: CryptoKey): Promise<JsonWebKey> {
  return crypto.subtle.exportKey("jwk", key);
}

export async function importPrivateKeyFromJwk(jwk: JsonWebKey): Promise<CryptoKey> {
  return crypto.subtle.importKey("jwk", jwk, { name: "RSA-OAEP", hash: "SHA-256" }, true, ["decrypt"]);
}

export async function importPublicKeyFromPem(pem: string): Promise<CryptoKey> {
  const pemHeader = "-----BEGIN PUBLIC KEY-----";
  const pemFooter = "-----END PUBLIC KEY-----";
  const pemContents = pem.replace(pemHeader, "").replace(pemFooter, "").replace(/\s+/g, "");
  const binaryDer = Uint8Array.from(atob(pemContents), (c) => c.charCodeAt(0)).buffer;
  return crypto.subtle.importKey("spki", binaryDer, { name: "RSA-OAEP", hash: "SHA-256" }, true, ["encrypt"]);
}

/* helpers */
function arrayBufferToBase64(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}
