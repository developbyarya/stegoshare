
import { openDB } from "idb";

const DB_NAME = "stegoshare_keys";
const STORE = "private";

export async function savePrivateKeyJwk(jwk: JsonWebKey) {
  const db = await openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    },
  });
  await db.put(STORE, jwk, "rsa_private_key");
}

export async function getPrivateKeyJwk(): Promise<JsonWebKey | null> {
  const db = await openDB(DB_NAME, 1);
  const jwk = await db.get(STORE, "rsa_private_key");
  return jwk ?? null;
}

export async function clearPrivateKey() {
  const db = await openDB(DB_NAME, 1);
  await db.delete(STORE, "rsa_private_key");
}
