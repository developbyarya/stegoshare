# 🔐 Client-Side Implementation — Blockchain Encrypted Messaging

## 🧭 Overview
This section explains how the **Next.js frontend** integrates the blockchain-based secure messaging feature with **MetaMask wallet**, **Alchemy Sepolia RPC**, and the **`EncryptedMessages.sol`** smart contract.

The goal is to allow users to:
1. Connect their wallet (MetaMask)  
2. Encrypt messages using the recipient’s public encryption key  
3. Store the encrypted payload on the blockchain via the contract  
4. Decrypt messages using their wallet’s private key — directly in MetaMask  

All cryptographic operations and transaction signing occur **client-side** for maximum privacy and security.

---

## 🧩 Dependencies

Install the required libraries:

```bash
npm install ethers @metamask/eth-sig-util ethereumjs-util
```

For projects using Viem:

```bash
npm install viem wagmi
```

---

## ⚙️ Environment Setup

Create `.env.local`:

```env
NEXT_PUBLIC_ALCHEMY_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_KEY
NEXT_PUBLIC_CONTRACT_ADDRESS=0xYourDeployedContract
```

Ensure the deployed `EncryptedMessages.sol` contract address matches.

---

## 🧠 Core Flow

```text
User connects MetaMask
  ↓
App retrieves user's address and public encryption key
  ↓
Sender encrypts text (SuperEncryption → MetaMask Encryption)
  ↓
Ciphertext sent to blockchain using contract.storeMessage()
  ↓
Receiver decrypts message locally using eth_decrypt
```

---

## 🪄 Step-by-Step Implementation

### 1. Wallet Connection (with ethers.js)

```tsx
// app/hooks/useWallet.ts
import { useState } from "react";
import { ethers } from "ethers";

export function useWallet() {
  const [address, setAddress] = useState<string | null>(null);

  async function connect() {
    if (!window.ethereum) throw new Error("MetaMask not installed");
    const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
    setAddress(accounts[0]);
  }

  async function getSigner() {
    const provider = new ethers.BrowserProvider(window.ethereum);
    return provider.getSigner();
  }

  return { address, connect, getSigner };
}
```

---

### 2. Retrieve Public Encryption Key

```tsx
export async function getEncryptionPublicKey(address: string) {
  const publicKey = await window.ethereum.request({
    method: "eth_getEncryptionPublicKey",
    params: [address],
  });
  return publicKey; // base64 string
}
```

---

### 3. Encrypt Message for Recipient

```tsx
import { encrypt } from "@metamask/eth-sig-util";
import { bufferToHex } from "ethereumjs-util";

export function encryptForRecipient(publicKey: string, message: string) {
  const enc = encrypt({
    publicKey,
    data: message,
    version: "x25519-xsalsa20-poly1305",
  });
  const encrypted = Buffer.from(JSON.stringify(enc), "utf8").toString("base64");
  return encrypted;
}
```

---

### 4. Store Encrypted Message on Blockchain

```tsx
import { ethers } from "ethers";
import contractABI from "@/contracts/EncryptedMessages.json"; // ABI file

export async function sendEncryptedMessage(
  signer: ethers.Signer,
  receiver: string,
  ciphertext: string
) {
  const contract = new ethers.Contract(
    process.env.NEXT_PUBLIC_CONTRACT_ADDRESS!,
    contractABI.abi,
    signer
  );
  const tx = await contract.storeMessage(receiver, ciphertext, "");
  await tx.wait();
  return tx.hash;
}
```

---

### 5. Decrypt Message (Receiver Side)

```tsx
export async function decryptMessage(encryptedData: string, userAddress: string) {
  const decrypted = await window.ethereum.request({
    method: "eth_decrypt",
    params: [encryptedData, userAddress],
  });
  return decrypted;
}
```

---

## 🧩 Example React Component — `SecretMail`

```tsx
"use client";
import { useState } from "react";
import { useWallet } from "@/hooks/useWallet";
import {
  getEncryptionPublicKey,
  encryptForRecipient,
  sendEncryptedMessage,
  decryptMessage,
} from "@/lib/blockchainMessaging";

export default function SecretMail() {
  const { address, connect, getSigner } = useWallet();
  const [receiver, setReceiver] = useState("");
  const [message, setMessage] = useState("");
  const [txHash, setTxHash] = useState("");

  async function handleSend() {
    const signer = await getSigner();
    const publicKey = await getEncryptionPublicKey(receiver);
    const encrypted = encryptForRecipient(publicKey, message);
    const tx = await sendEncryptedMessage(signer, receiver, encrypted);
    setTxHash(tx);
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">🕵️ Secret Mail</h2>

      {!address ? (
        <button onClick={connect} className="btn">Connect Wallet</button>
      ) : (
        <>
          <input
            placeholder="Receiver address (0x...)"
            value={receiver}
            onChange={(e) => setReceiver(e.target.value)}
            className="border p-2 w-full mb-2"
          />
          <textarea
            placeholder="Write secret message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="border p-2 w-full mb-2"
          />
          <button onClick={handleSend} className="btn">Send Encrypted</button>
          {txHash && <p className="mt-2">✅ Sent! TX: {txHash}</p>}
        </>
      )}
    </div>
  );
}
```

---

## 🧪 Local Testing with Viem / Hardhat

To test end-to-end before deploying:
1. Run local blockchain  
   ```bash
   npx hardhat node
   ```
2. Deploy the contract locally (`npx hardhat run scripts/deploy.js --network localhost`)
3. Update `.env.local` → `NEXT_PUBLIC_CONTRACT_ADDRESS=0x...`
4. Run your Next.js dev server (`npm run dev`)
5. Interact using MetaMask with the local chain (import Hardhat test accounts)

---

## 🔐 Security Notes
- **Do not store private keys** in client or server code.  
- Encryption and decryption occur **inside MetaMask** using `eth_getEncryptionPublicKey` / `eth_decrypt`.  
- All blockchain writes are **signed by the user** in wallet.  
- Use **testnets (Sepolia)** only — never deploy test contracts to mainnet with real funds.  
- Always sanitize user inputs and validate Ethereum addresses before encrypting or sending.

---

## ✅ Summary
| Step | Component | Responsibility |
|------|------------|----------------|
| 1 | MetaMask | Wallet connection, signing, encryption/decryption |
| 2 | Next.js | UI, calling blockchain methods, managing state |
| 3 | Alchemy RPC | Gateway to Sepolia testnet |
| 4 | Smart Contract | Immutable storage for encrypted messages |

This implementation keeps **privacy client-side**, ensures **immutability via blockchain**, and aligns with the cryptography project’s objective — combining **modern encryption, blockchain immutability, and user-centric key control**.

---

**Author:** Gradiva Arya Wicaksana  
**Feature:** Client-Side Blockchain Secure Messaging  
**Tech:** Next.js + MetaMask + Ethers + Alchemy (Sepolia)

