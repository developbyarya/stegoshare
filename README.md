# 🕵️ StegoShare - Secret File Sharing Platform

> **A Next.js application that disguises itself as a file sharing platform but secretly acts as an encrypted communication system using advanced cryptographic techniques.**

[![Next.js](https://img.shields.io/badge/Next.js-16.0-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6.18-2D3748?logo=prisma)](https://www.prisma.io/)

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Encryption Architecture](#-encryption-architecture)
- [Getting Started](#-getting-started)
- [Project Structure](#-project-structure)
- [API Documentation](#-api-documentation)
- [Security Features](#-security-features)
- [Testing](#-testing)

---

## 🎯 Overview

StegoShare is a sophisticated cryptography project that demonstrates multiple encryption techniques, steganography, and secure file sharing. The application implements a **layered security approach** combining classical and modern cryptographic algorithms to ensure maximum protection for sensitive communications.

### Key Concepts

- **Super Encryption**: Multi-layered encryption combining classical and modern ciphers
- **Steganography**: Hiding messages within image and audio files using LSB (Least Significant Bit) techniques
- **Hybrid Cryptography**: Asymmetric (RSA) + Symmetric (AES) encryption for secure key exchange
- **File Encryption**: User-specific encryption keys derived from user IDs
- **Secret Access System**: Hidden zone unlocked by uploading a special key file

---

## ✨ Features

### 🔐 Authentication System
- Manual authentication implementation (no external auth libraries)
- Password hashing using `bcryptjs`
- JWT-like session tokens stored in secure cookies
- Protected routes with middleware-based access control
- Secret zone access via special key file upload

### 🛡️ Encryption Capabilities

#### Classical Cryptography
- **Caesar Cipher**: Character shift encryption (configurable shift value)
- **Vigenère Cipher**: Polyalphabetic substitution using keyword-based shifting

#### Modern Cryptography
- **AES-256-GCM**: Advanced Encryption Standard with Galois/Counter Mode
- **AES-256-CBC**: AES with Cipher Block Chaining mode
- **XOR Cipher**: Exclusive OR encryption for lightweight obfuscation
- **RSA-OAEP**: Asymmetric encryption (4096-bit keys) for secure key exchange

#### Super Encryption
- **Multi-layered encryption** combining:
  1. Caesar Cipher (shift: 3)
  2. Vigenère Cipher (key: "Kd129Nj")
  3. XOR Encryption (key: "Kjsdo19_123")
  4. AES-256-GCM encryption
  5. RSA-OAEP key wrapping

### 🖼️ Steganography

#### Image Steganography
- **LSB (Least Significant Bit)** technique on RGB channels
- Supports PNG and JPEG formats
- 32-bit length header for message extraction
- Capacity calculation based on image dimensions

#### Audio Steganography
- LSB embedding in WAV audio files
- PCM data manipulation
- Header-aware processing (44-byte WAV header)

### 📁 File Management
- Secure file upload to Supabase storage
- User-specific file encryption (keys derived from user ID)
- Encrypted file storage and retrieval
- Secret key file verification system

---

## 🔐 Encryption Architecture

### Encryption Module Structure

```
src/lib/encryption/
├── classical/
│   ├── caesarCipher.ts      # Caesar cipher implementation
│   └── vigenereCipher.ts    # Vigenère cipher implementation
├── modern/
│   ├── aesEncrypt.ts        # AES-256-CBC encryption
│   ├── aesEncryptKey.ts     # AES-GCM with key management
│   ├── rsaEncrypt.ts        # RSA-OAEP key pair generation
│   └── xorEncrypt.ts        # XOR cipher implementation
└── superEncryption.ts       # Multi-layered encryption
```

### Super Encryption Flow

The **Super Encryption** system implements a five-layer encryption process:

```
Plain Text
    ↓
[1] Caesar Cipher (shift: 3)
    ↓
[2] Vigenère Cipher (key: "Kd129Nj")
    ↓
[3] XOR Encryption (key: "Kjsdo19_123")
    ↓
[4] AES-256-GCM Encryption (random key generated)
    ↓
[5] RSA-OAEP Key Wrapping (AES key encrypted with recipient's public key)
    ↓
Encrypted Output: { ciphertext, encryptedKey }
```

#### Implementation Details

**Encryption Process:**
```typescript
// Step 1: Classical ciphers
const step1 = caesarEncrypt(plain, CAESAR_SHIFT);
const step2 = vigenereEncrypt(step1, VIGENERE_KEY);
const step3 = xorEncrypt(step2, XOR_KEY);

// Step 2: Generate AES key and encrypt
const aesKey = await generateAesKey();
const ciphertext = await aesEncryptString(step3, aesKey);

// Step 3: Encrypt AES key with recipient's RSA public key
const rawAes = await exportAesRaw(aesKey);
const recipientKey = await importPublicKeyFromPem(recipientPublicKeyPem);
const encryptedKeyAb = await crypto.subtle.encrypt(
  { name: "RSA-OAEP" }, 
  recipientKey, 
  rawAes
);

return { ciphertext, encryptedKey: encryptedKeyB64 };
```

**Decryption Process:**
```typescript
// Reverse the process in opposite order
const rawAes = await decryptWithRSA(message.encryptedKey, privateKey);
const aesKey = await importAesRaw(rawAes);
const step3 = await aesDecryptString(message.ciphertext, aesKey);
const step2 = xorDecrypt(step3, XOR_KEY);
const step1 = vigenereDecrypt(step2, VIGENERE_KEY);
const plain = caesarDecrypt(step1, CAESAR_SHIFT);
```

### Classical Encryption Algorithms

#### Caesar Cipher (`caesarCipher.ts`)
- **Algorithm**: Character shift encryption
- **Default Shift**: 3 positions
- **Character Set**: A-Z (case-preserving)
- **Non-alphabetic**: Unchanged

```typescript
caesarEncrypt("Hello", 3)  // "Khoor"
caesarDecrypt("Khoor", 3)  // "Hello"
```

#### Vigenère Cipher (`vigenereCipher.ts`)
- **Algorithm**: Polyalphabetic substitution
- **Key**: Repeating keyword pattern
- **Security**: More secure than Caesar (variable shift per character)

```typescript
vigenereEncrypt("Hello", "KEY")  // Encrypted with variable shifts
vigenereDecrypt(encrypted, "KEY") // Original text
```

### Modern Encryption Algorithms

#### AES Encryption

**AES-256-CBC** (`aesEncrypt.ts`):
- Key derivation: `scrypt` with random salt
- Format: `salt:iv:encryptedData` (all base64)
- Usage: File encryption, user data encryption

**AES-256-GCM** (`aesEncryptKey.ts`):
- Web Crypto API implementation
- 12-byte IV prepended to ciphertext
- Authenticated encryption
- Usage: Super encryption core layer

#### RSA Encryption (`rsaEncrypt.ts`)
- **Key Size**: 4096 bits
- **Algorithm**: RSA-OAEP with SHA-256
- **Usage**: Encrypting AES keys for secure key exchange
- **Key Formats**: 
  - Public: PEM format
  - Private: JWK (JSON Web Key) format

**Key Generation:**
```typescript
const keyPair = await generateRSAKeyPair();
const publicKeyPem = await exportPublicKeyToPem(keyPair.publicKey);
const privateKeyJwk = await exportPrivateKeyToJwk(keyPair.privateKey);
```

#### XOR Cipher (`xorEncrypt.ts`)
- **Algorithm**: Exclusive OR operation
- **Output**: Hex-encoded string
- **Usage**: Lightweight obfuscation layer in super encryption

### Steganography Implementation

#### Image Steganography (`steganography.ts`)

**LSB Technique:**
- Uses RGB channels (3 bits per pixel)
- Preserves alpha channel
- 32-bit length header for extraction
- Capacity: `(width × height × 3 - 32) / 8` bytes

**Process:**
1. Embed 32-bit message length (big-endian)
2. Embed message bytes bit-by-bit in RGB LSBs
3. Export as PNG to preserve pixel values

```typescript
// Hide message
const imageWithMessage = await hideMessageInImage(imageBuffer, "Secret message");

// Extract message
const message = await extractMessageFromImage(imageWithMessage);
```

#### Audio Steganography

**WAV File Support:**
- LSB embedding in PCM audio data
- Skips 44-byte WAV header
- 32-bit length header
- Capacity: `(fileSize - 44) / 8` bytes

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- PostgreSQL database (or Supabase account)
- Supabase project for file storage

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd stegoshare
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Required variables:
   ```env
   DATABASE_URL="postgresql://..."
   SUPABASE_URL="https://..."
   SUPABASE_ANON_KEY="..."
   SUPABASE_SERVICE_ROLE_KEY="..."
   JWT_SECRET="your-secret-key"
   SECRET_KEY_HASH="sha256-hash-of-secret.key-file"
   ```

4. **Set up database**
   ```bash
   npm run db:generate  # Generate Prisma Client
   npm run db:push      # Push schema to database
   ```

5. **Create Supabase storage bucket**
   - Create a bucket named `files` in Supabase dashboard
   - Set appropriate permissions

6. **Run development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📁 Project Structure

```
stegoshare/
├── prisma/
│   └── schema.prisma              # Database schema
├── src/
│   ├── app/                        # Next.js App Router
│   │   ├── api/                    # API routes
│   │   │   ├── auth/               # Authentication endpoints
│   │   │   ├── upload/             # File upload
│   │   │   ├── download/           # File download
│   │   │   ├── steganography/      # Steganography operations
│   │   │   ├── messages/           # Message handling
│   │   │   └── users/              # User management
│   │   ├── dashboard/              # User dashboard
│   │   ├── login/                  # Login page
│   │   ├── register/               # Registration page
│   │   ├── secret/                 # Secret zone (requires key)
│   │   └── message/                # Messaging interface
│   ├── components/                 # React components
│   │   ├── ui/                     # UI components
│   │   └── navbar/                 # Navigation
│   ├── lib/                        # Core libraries
│   │   ├── auth/                   # Authentication modules
│   │   │   ├── hash.ts             # Password/file hashing
│   │   │   ├── session.ts          # JWT session management
│   │   │   ├── middleware.ts       # Auth middleware
│   │   │   ├── secretAccess.ts     # Secret zone access
│   │   │   └── userDataEncryption.ts # User data encryption
│   │   ├── encryption/             # 🔐 Encryption modules
│   │   │   ├── classical/          # Classical ciphers
│   │   │   │   ├── caesarCipher.ts
│   │   │   │   └── vigenereCipher.ts
│   │   │   ├── modern/             # Modern ciphers
│   │   │   │   ├── aesEncrypt.ts
│   │   │   │   ├── aesEncryptKey.ts
│   │   │   │   ├── rsaEncrypt.ts
│   │   │   │   └── xorEncrypt.ts
│   │   │   └── superEncryption.ts  # Multi-layered encryption
│   │   ├── steganography.ts        # LSB steganography
│   │   ├── fileEncryption.ts       # File encryption
│   │   ├── prisma.ts               # Prisma client
│   │   └── supabase.ts             # Supabase client
│   ├── generated/                  # Generated Prisma types
│   └── middleware.ts               # Next.js middleware
├── tests/                          # Test files
├── README.md                       # This file
└── package.json                    # Dependencies
```

---

## 🔌 API Documentation

### Authentication Endpoints

#### `POST /api/auth/register`
Register a new user.

**Request:**
```json
{
  "username": "user123",
  "password": "securePassword"
}
```

**Response:**
```json
{
  "success": true,
  "userId": "uuid"
}
```

#### `POST /api/auth/login`
Login and create session.

**Request:**
```json
{
  "username": "user123",
  "password": "securePassword"
}
```

**Response:**
- Sets HTTP-only cookie with session token
- Returns user data

#### `POST /api/auth/logout`
Logout and clear session.

---

### File Operations

#### `POST /api/upload`
Upload file to Supabase storage.

**Request:** Multipart form data with file

**Response:**
```json
{
  "success": true,
  "fileId": "uuid",
  "redirectToSecret": true  // If secret.key uploaded
}
```

#### `GET /api/download/[fileId]`
Download encrypted file.

**Headers:** Requires authentication cookie

**Response:** Encrypted file stream

---

### Encryption Operations

#### `POST /api/encrypt-file`
Encrypt file using super encryption.

#### `POST /api/steganography/hide`
Hide message in image/audio file.

**Request:**
```json
{
  "file": "base64-encoded-file",
  "message": "Secret message"
}
```

#### `POST /api/steganography/extract`
Extract hidden message from file.

**Request:**
```json
{
  "file": "base64-encoded-file"
}
```

---

### Messaging

#### `POST /api/sendMessage`
Send encrypted message to recipient.

**Request:**
```json
{
  "recipientId": "uuid",
  "message": "Hello",
  "recipientPublicKey": "PEM-format-public-key"
}
```

#### `GET /api/messages`
Get user's messages.

#### `GET /api/messages/[id]`
Get specific message (decrypted).

---

## 🔒 Security Features

### Encryption Best Practices

1. **Key Management**
   - AES keys generated per encryption
   - RSA keys for secure key exchange
   - User-specific file encryption keys

2. **Layered Security**
   - Multiple encryption layers (super encryption)
   - Different algorithms for defense in depth
   - Classical + modern cipher combination

3. **Secure Storage**
   - Encrypted files in Supabase storage
   - User data encrypted at rest
   - Session tokens in HTTP-only cookies

4. **Access Control**
   - Middleware-based route protection
   - Secret zone requires key file upload
   - User-specific file access

### Security Considerations

⚠️ **Important Notes:**
- This is an educational project demonstrating cryptographic concepts
- For production use, additional security measures are recommended:
  - Rate limiting
  - Input validation and sanitization
  - Security headers (CSP, HSTS, etc.)
  - Regular security audits
  - Key rotation policies

---

## 🧪 Testing

### Run Tests

```bash
# Watch mode
npm test

# Single run
npm run test:run

# UI mode
npm run test:ui
```

### Test Coverage

The project includes comprehensive tests for:
- ✅ Encryption/decryption symmetry
- ✅ Error handling (wrong keys, invalid input)
- ✅ Edge cases (empty strings, special characters)
- ✅ File operations (binary data, large files)
- ✅ Steganography (hide/extract operations)

### Test Structure

```
tests/
├── auth.test.ts              # Authentication tests
├── encryption.test.ts        # Encryption algorithm tests
├── steganography.test.ts     # Steganography tests
└── fileEncryption.test.ts    # File encryption tests
```

---

## 🛠️ Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run linter
npm run format       # Format code
npm test             # Run tests
npm run db:generate  # Generate Prisma Client
npm run db:push      # Push schema changes
npm run db:studio    # Open Prisma Studio
```

### Code Style

- TypeScript with strict mode
- Biome for linting and formatting
- Consistent code organization

---

## 📚 Learn More

### Cryptographic Concepts

- **Caesar Cipher**: Historical substitution cipher
- **Vigenère Cipher**: Polyalphabetic substitution
- **AES**: Advanced Encryption Standard (NIST standard)
- **RSA**: Rivest-Shamir-Adleman asymmetric encryption
- **Steganography**: Information hiding in media files
- **LSB Technique**: Least Significant Bit manipulation

### Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)
- [Supabase Documentation](https://supabase.com/docs)

---

## 📝 License

This project is for educational purposes. Please use responsibly and in accordance with applicable laws and regulations.

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## ⚠️ Disclaimer

This software is provided for **educational and demonstration purposes only**. The authors are not responsible for any misuse of this software. Always ensure compliance with local laws and regulations regarding cryptography and data protection.

---

**Built with ❤️ using Next.js, TypeScript, and modern cryptographic techniques.**
