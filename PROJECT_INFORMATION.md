````{"variant":"standard","title":"PROJECT_INFORMATION.md","id":"59811"}
# 🕵️ Cryptography Final Project — Secret File Sharing Platform

## 📘 Overview

This project is a **Next.js web application** that disguises itself as a **file sharing platform** but secretly acts as an **encrypted communication system**.

It implements several cryptographic concepts:
- Manual **authentication system** (hashing allowed via library)
- **Super encryption** (combination of classical and modern ciphers)
- **Steganography** for hiding messages inside files (images or audio)
- **File encryption** before upload
- **Test-driven development (TDD)** for validation and maintainability

The design emphasizes modular cryptography and incremental testing.

---

## 🏗️ Tech Stack

| Component | Technology |
|------------|-------------|
| Frontend | Next.js 15 (App Router) |
| Backend | Next.js API Routes |
| Database | PostgreSQL (via Supabase client) |
| Storage | Supabase Storage Bucket |
| Hashing Library | bcrypt / crypto (Node.js built-in) |
| Testing Framework | Jest / Vitest |
| Deployment | Vercel |

---

## ⚙️ Core Features

### 1. Manual Authentication System
- **Sign up / Login** pages built manually using custom API routes.
- Passwords are hashed using `bcrypt` or `crypto.scrypt`.
- JWT-like session tokens are generated and stored in cookies (custom implementation).
- **No external auth libraries** (e.g., no NextAuth, Clerk, Supabase Auth).

**Table: `users`**
| Field | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| username | VARCHAR(255) | Unique |
| password_hash | TEXT | Stored hashed password |
| created_at | TIMESTAMP | Default now() |

**Flow:**
1. User registers → password hashed → stored in DB  
2. User logs in → hash verified → session token generated → stored in cookie  
3. Middleware checks session token for protected routes

---

### 2. File Sharing (Decoy System)
A basic upload/download system that uses Supabase storage.

**Table: `files`**
| Field | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Foreign key to users |
| filename | TEXT | Original filename |
| url | TEXT | Supabase bucket URL |
| uploaded_at | TIMESTAMP | Default now() |

**Flow:**
- Users can upload/download files like a normal cloud platform.
- If a user uploads a file with the name **`secret.key`**, and its hash matches a pre-defined hash (hardcoded in backend), they are redirected to `/secret`.

---

### 3. Secret Zone (Hidden Interface)
The `/secret` page is unlocked only when a valid `secret.key` file is uploaded.

This page includes:
- Text encryption/decryption using **super encryption**
- **Steganography** for hiding or extracting messages in files
- **File encryption** (AES or XOR) for secure sharing

---

## 🧩 Encryption Modules

The encryption system is modular — each algorithm is isolated in its own file for flexibility.

### Structure
```
/lib/encryption/
  ├── classical/
  │   ├── caesarCipher.js
  │   └── vigenereCipher.js
  ├── modern/
  │   ├── aesEncrypt.js
  │   └── xorEncrypt.js
  └── superEncryption.js
```

### Example: superEncryption.js
```js
import { caesarEncrypt, caesarDecrypt } from "./classical/caesarCipher";
import { aesEncrypt, aesDecrypt } from "./modern/aesEncrypt";

export function superEncrypt(text, key) {
  const step1 = caesarEncrypt(text, 3);
  const step2 = aesEncrypt(step1, key);
  return step2;
}

export function superDecrypt(cipherText, key) {
  const step1 = aesDecrypt(cipherText, key);
  const step2 = caesarDecrypt(step1, 3);
  return step2;
}
```

---

## 🖼️ Steganography Module

### Goal
Embed text messages inside image/audio files and extract them back.

### File: `/lib/steganography.js`
Functions:
- `hideMessageInImage(imageFile, message)`
- `extractMessageFromImage(imageFile)`
- (Optional) Extend for audio steganography

Approach:
- Use LSB (Least Significant Bit) manipulation for images.
- Store hidden message bits inside pixel data.

---

## 🔐 File Encryption Module

### File: `/lib/fileEncryption.js`
Implements file-level AES encryption before upload:
```js
import crypto from "crypto";

export async function encryptFile(fileBuffer, key) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-cbc", crypto.scryptSync(key, "salt", 32), iv);
  const encrypted = Buffer.concat([cipher.update(fileBuffer), cipher.final()]);
  return { encrypted, iv };
}
```

Decryption uses the same key and IV.

---

## 🧠 Usage Flow Summary

```
Login → Upload files → Upload secret.key → Redirect to /secret
                                    ↓
                            Access to Secret Zone
                                    ↓
          Encrypt / Decrypt Text | Hide / Extract Message | Encrypt Files
```

---

## 🧩 Folder Structure
```
/project-root
  ├── app/
  │   ├── login/
  │   ├── register/
  │   ├── dashboard/
  │   └── secret/
  ├── lib/
  │   ├── auth/
  │   │   ├── hash.js
  │   │   ├── session.js
  │   ├── encryption/
  │   ├── steganography.js
  │   └── fileEncryption.js
  ├── tests/
  │   ├── auth.test.js
  │   ├── encryption.test.js
  │   ├── steganography.test.js
  │   └── fileEncryption.test.js
  ├── pages/api/
  │   ├── auth/
  │   │   ├── login.js
  │   │   └── register.js
  │   ├── upload.js
  │   ├── verifySecretKey.js
  └── PROJECT_INFORMATION.md
```

---

## 🧪 Test-Driven Development (TDD)

This project adopts **Test-Driven Development** to ensure cryptographic integrity and prevent regression errors during rapid development.

### Testing Philosophy
- Write **unit tests** before implementing new encryption/decryption functions.
- Validate **encryption symmetry** (i.e., decrypt(encrypt(x)) = x).
- Mock file uploads and test secret key validation.
- Verify all auth flow (register → login → token verification) with test database.

### Example: `encryption.test.js`
```js
import { superEncrypt, superDecrypt } from "@/lib/encryption/superEncryption";

test("Super encryption symmetry", () => {
  const message = "TOPSECRET";
  const key = "test123";
  const encrypted = superEncrypt(message, key);
  const decrypted = superDecrypt(encrypted, key);
  expect(decrypted).toBe(message);
});
```

### Test Coverage
| Module | Tested For |
|---------|-------------|
| Auth | Hashing, login, registration, token |
| Super Encryption | Symmetry, key mismatch, boundary cases |
| Steganography | Hide/extract consistency |
| File Encryption | Binary integrity, key reuse handling |

---

## 🚀 Future Extensions
- Implement two-factor authentication (2FA)
- Add support for different encryption algorithms
- Use watermarking instead of steganography for higher file tolerance
- Support chat system via encrypted message exchange
- Add CI pipeline to auto-run Jest tests before deploy

---

## 🧑‍💻 Developer Notes
- Only cryptography part can use a cryptographic library.
- Modular structure ensures each encryption algorithm can be replaced or extended independently.
- Use **TDD** to verify correctness before writing UI integration code.
- Ensure documentation comments exist in each encryption file for clarity.

---
**Author:** Gradiva Arya Wicaksana  
**Project Type:** Cryptography Final Project  
**Development Duration:** 3–4 days (Rapid Development + TDD)  
**Deployment:** Vercel (frontend/backend) + Supabase (storage + DB)
````

