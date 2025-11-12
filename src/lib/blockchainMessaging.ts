import { ethers } from "ethers";
import contractABI from "@/abi/EncryptedMessages.json";

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on: (event: string, handler: (accounts: string[]) => void) => void;
      removeListener: (event: string, handler: (accounts: string[]) => void) => void;
    };
  }
}

export interface BlockchainMessage {
  id: string;
  sender: string;
  receiver: string;
  ciphertext: string;
  timestamp: number;
  plaintext?: string;
  decryptError?: boolean;
}

/* -------------------------------------------------------------------------- */
/*                           WALLET  +  KEY GENERATION                         */
/* -------------------------------------------------------------------------- */

/**
 * Ask MetaMask for active account.
 */
export async function getActiveAccount(): Promise<string> {
  if (!window.ethereum) throw new Error("MetaMask not found");
  const accounts = (await window.ethereum.request({ method: "eth_requestAccounts" })) as string[];
  if (!accounts.length) throw new Error("No wallet connected");
  return accounts[0];
}

/**
 * Derive a symmetric AES key from a MetaMask signature.
 * The same account will always produce the same key for the same salt.
 * This requires the user to sign a message with their wallet.
 */
export async function deriveWalletKey(address: string, salt = "StegoShare-v1"): Promise<CryptoKey> {
  if (!window.ethereum) throw new Error("MetaMask not found");

  const message = `KeyDerivation:${salt}`;
  const signature = (await window.ethereum.request({
    method: "personal_sign",
    params: [message, address],
  })) as string;

  // Hash the signature → 32 bytes → AES-GCM key material
  const hashBuffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(signature));
  return crypto.subtle.importKey("raw", hashBuffer, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
}

/**
 * Derive a key for a recipient address (for encryption).
 * This uses a deterministic method based on the address, so the recipient
 * can derive the same key when they decrypt.
 * Note: This is a simplified approach - in production, you might want to use
 * a shared secret or ECDH key exchange.
 */
async function deriveRecipientKey(recipientAddress: string, salt = "StegoShare-v1"): Promise<CryptoKey> {
  // Create a deterministic key from address + salt
  // The recipient will use the same method to derive their key
  const keyMaterial = `${recipientAddress}:${salt}`;
  const hashBuffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(keyMaterial));
  return crypto.subtle.importKey("raw", hashBuffer, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
}

/* -------------------------------------------------------------------------- */
/*                            ENCRYPTION / DECRYPTION                          */
/* -------------------------------------------------------------------------- */

export interface EncryptedPayload {
  iv: string; // base64
  ciphertext: string; // base64
}

/**
 * Encrypt plaintext with AES-GCM using a CryptoKey.
 * This is the low-level encryption function.
 */
export async function encryptMessage(plaintext: string, key: CryptoKey): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);

  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoded);
  const encrypted: EncryptedPayload = {
    iv: btoa(String.fromCharCode(...iv)),
    ciphertext: btoa(String.fromCharCode(...new Uint8Array(ciphertext))),
  };
  return JSON.stringify(encrypted);
}

/**
 * Decrypt ciphertext with AES-GCM using a CryptoKey.
 * This is the low-level decryption function.
 */
export async function decryptWithKey(encryptedJSON: string, key: CryptoKey): Promise<string> {
  const { iv, ciphertext } = JSON.parse(encryptedJSON) as EncryptedPayload;
  const ivBytes = Uint8Array.from(atob(iv), (c) => c.charCodeAt(0));
  const dataBytes = Uint8Array.from(atob(ciphertext), (c) => c.charCodeAt(0));

  const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv: ivBytes }, key, dataBytes);
  return new TextDecoder().decode(decrypted);
}

/* -------------------------------------------------------------------------- */
/*                               SMART CONTRACT                                */
/* -------------------------------------------------------------------------- */

function getContract(signer: ethers.Signer): ethers.Contract {
  const address = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
  if (!address) throw new Error("NEXT_PUBLIC_CONTRACT_ADDRESS missing");
  return new ethers.Contract(address, contractABI.abi, signer);
}

export async function sendEncryptedMessage(
  signer: ethers.Signer,
  receiver: string,
  ciphertext: string
): Promise<string> {
  const contract = getContract(signer);
  const tx = await contract.storeMessage(receiver, ciphertext);
  // Return the transaction hash immediately (available on tx.hash)
  const txHash = tx.hash;
  // Wait for confirmation in the background
  await tx.wait();
  return txHash;
}

export async function getMessageIdsFor(
  address: string,
  signer: ethers.Signer
): Promise<bigint[]> {
  const contract = getContract(signer);
  return contract.getMessageIdsFor(address);
}

export async function getMessage(
  id: bigint,
  signer: ethers.Signer
): Promise<{ sender: string; receiver: string; ciphertext: string; timestamp: bigint }> {
  const contract = getContract(signer);
  return contract.getMessage(id);
}

/* -------------------------------------------------------------------------- */
/*                                HIGH-LEVEL API                               */
/* -------------------------------------------------------------------------- */

/**
 * High-level helper for your UI.
 * Example:
 * const addr = await getActiveAccount();
 * const key = await deriveWalletKey(addr);
 * const enc = await encryptMessage("hello", key);
 * const dec = await decryptMessage(enc, key);
 */
export async function walletEncrypt(plaintext: string): Promise<{ ciphertext: string; key: CryptoKey }> {
  const address = await getActiveAccount();
  const key = await deriveWalletKey(address);
  const ciphertext = await encryptMessage(plaintext, key);
  return { ciphertext, key };
}

export async function walletDecrypt(ciphertext: string): Promise<string> {
  const address = await getActiveAccount();
  const key = await deriveWalletKey(address);
  return decryptWithKey(ciphertext, key);
}

/* -------------------------------------------------------------------------- */
/*                    LEGACY API COMPATIBILITY HELPERS                        */
/* -------------------------------------------------------------------------- */

/**
 * Encrypt message for a recipient address.
 * Uses deterministic key derivation so recipient can decrypt with their wallet.
 * 
 * @deprecated Use encryptForRecipientAddress instead
 */
export async function encryptForRecipient(recipientAddress: string, message: string): Promise<string> {
  const key = await deriveRecipientKey(recipientAddress);
  return encryptMessage(message, key);
}

/**
 * Encrypt message for a recipient address (new API).
 * Uses deterministic key derivation based on recipient address.
 */
export async function encryptForRecipientAddress(recipientAddress: string, message: string): Promise<string> {
  const key = await deriveRecipientKey(recipientAddress);
  return encryptMessage(message, key);
}

/**
 * Decrypt message using the recipient's address.
 * Uses the same deterministic key derivation as encryption.
 * This allows the recipient to decrypt messages sent to them.
 * 
 * This is the main decryption function for messages encrypted with encryptForRecipient().
 */
export async function decryptMessage(encryptedData: string, recipientAddress: string): Promise<string> {
  const key = await deriveRecipientKey(recipientAddress);
  return decryptWithKey(encryptedData, key);
}

/**
 * Decrypt message using the current wallet's derived key (signature-based).
 * This requires the user to sign a message with their wallet.
 * 
 * Note: This uses a different key derivation than encryptForRecipient,
 * so it won't work for decrypting messages encrypted with that function.
 * Use decryptMessage() instead for messages encrypted with encryptForRecipient().
 */
export async function decryptMessageForWallet(encryptedData: string): Promise<string> {
  const address = await getActiveAccount();
  const key = await deriveWalletKey(address);
  return decryptWithKey(encryptedData, key);
}

/**
 * Get inbox messages (where user is receiver)
 */
export async function getInboxMessages(
  address: string,
  signer: ethers.Signer
): Promise<BlockchainMessage[]> {
  const ids = await getMessageIdsFor(address, signer);
  const messages: BlockchainMessage[] = [];

  for (const id of ids) {
    try {
      const msg = await getMessage(id, signer);
      // Only include messages where user is receiver
      if (msg.receiver.toLowerCase() === address.toLowerCase()) {
        messages.push({
          id: id.toString(),
          sender: msg.sender,
          receiver: msg.receiver,
          ciphertext: msg.ciphertext,
          timestamp: Number(msg.timestamp) * 1000, // Convert to milliseconds
        });
      }
    } catch (error) {
      // Message might not exist or user doesn't have access
      console.error(`Error fetching message ${id}:`, error);
    }
  }

  // Sort by timestamp (newest first)
  return messages.sort((a, b) => b.timestamp - a.timestamp);
}

/**
 * Get sent messages (where user is sender)
 */
export async function getSentMessages(
  address: string,
  signer: ethers.Signer
): Promise<BlockchainMessage[]> {
  const ids = await getMessageIdsFor(address, signer);
  const messages: BlockchainMessage[] = [];

  for (const id of ids) {
    try {
      const msg = await getMessage(id, signer);
      // Only include messages where user is sender
      if (msg.sender.toLowerCase() === address.toLowerCase()) {
        messages.push({
          id: id.toString(),
          sender: msg.sender,
          receiver: msg.receiver,
          ciphertext: msg.ciphertext,
          timestamp: Number(msg.timestamp) * 1000, // Convert to milliseconds
        });
      }
    } catch (error) {
      // Message might not exist or user doesn't have access
      console.error(`Error fetching message ${id}:`, error);
    }
  }

  // Sort by timestamp (newest first)
  return messages.sort((a, b) => b.timestamp - a.timestamp);
}

/**
 * Validate Ethereum address format
 */
export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

