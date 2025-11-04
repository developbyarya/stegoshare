// Generate RSA Keypair
export async function generateRSAKeyPair() {
  return crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 4096,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256"
    },
    true,
    ["encrypt", "decrypt"]
  );
}

// EXPORT PUBLIC KEY to PEM
export async function exportPublicKeyToPem(key: CryptoKey): Promise<string> {
  const spki = await crypto.subtle.exportKey("spki", key);
  const b64 = btoa(String.fromCharCode(...new Uint8Array(spki)));
  const chunks = b64.match(/.{1,64}/g)!.join("\n");

  return `-----BEGIN PUBLIC KEY-----\n${chunks}\n-----END PUBLIC KEY-----`;
}

// IMPORT PUBLIC KEY from PEM
export async function importPublicKeyFromPem(pem: string): Promise<CryptoKey> {
  const pemHeader = "-----BEGIN PUBLIC KEY-----";
  const pemFooter = "-----END PUBLIC KEY-----";
  const pemContents = pem.replace(pemHeader, "").replace(pemFooter, "").replace(/\s+/g, "");

  const binaryDer = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0)).buffer;

  return crypto.subtle.importKey(
    "spki",
    binaryDer,
    { name: "RSA-OAEP", hash: "SHA-256" },
    true,
    ["encrypt"]
  );
}

// EXPORT PRIVATE KEY to JWK
export async function exportPrivateKeyToJwk(key: CryptoKey) {
  return crypto.subtle.exportKey("jwk", key);
}

// IMPORT PRIVATE KEY from JWK
export async function importPrivateKeyFromJwk(jwk: JsonWebKey): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "RSA-OAEP", hash: "SHA-256" },
    true,
    ["decrypt"]
  );
}