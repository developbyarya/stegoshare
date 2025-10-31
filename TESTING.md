# Testing Guide (TDD)

This project follows **Test-Driven Development (TDD)** principles. Tests are written before or alongside implementation to ensure cryptographic integrity.

## Test Structure

```
tests/
├── setup.ts              # Test configuration and setup
├── auth.test.ts          # Authentication module tests
├── encryption.test.ts    # Encryption algorithms tests
├── steganography.test.ts # Steganography tests
├── fileEncryption.test.ts # File encryption tests
└── api/
    └── auth.test.ts      # API route tests (templates)
```

## Running Tests

### Watch Mode (Development)
```bash
npm test
```
Runs tests in watch mode, automatically rerunning when files change.

### Single Run
```bash
npm run test:run
```
Runs all tests once and exits.

### UI Mode
```bash
npm run test:ui
```
Opens Vitest UI in the browser for interactive testing.

## Test Coverage

### Authentication Tests (`auth.test.ts`)
- ✅ Password hashing and verification
- ✅ File hashing
- ✅ Session token generation and verification

### Encryption Tests (`encryption.test.ts`)
- ✅ Caesar Cipher encryption/decryption symmetry
- ✅ Vigenère Cipher encryption/decryption symmetry
- ✅ AES encryption/decryption symmetry
- ✅ XOR encryption/decryption symmetry
- ✅ Super Encryption (combined cipher) symmetry
- ✅ Key mismatch error handling

### Steganography Tests (`steganography.test.ts`)
- ✅ Hide message in image
- ✅ Extract message from image
- ✅ Hide/extract consistency
- ✅ Audio steganography
- ✅ Error handling for small files

### File Encryption Tests (`fileEncryption.test.ts`)
- ✅ File buffer encryption/decryption
- ✅ Combined buffer format
- ✅ Binary file handling
- ✅ Key mismatch error handling

## TDD Workflow

1. **Write Test First**: Write a failing test for the feature
2. **Implement Feature**: Write minimal code to pass the test
3. **Refactor**: Improve code while keeping tests green
4. **Repeat**: Continue for next feature

## Example: Adding a New Cipher

1. Add test in `encryption.test.ts`:
```typescript
it("should encrypt and decrypt with new cipher", () => {
  const text = "TEST";
  const encrypted = newCipherEncrypt(text, key);
  const decrypted = newCipherDecrypt(encrypted, key);
  expect(decrypted).toBe(text);
});
```

2. Run test (should fail):
```bash
npm test
```

3. Implement the cipher functions
4. Run test again (should pass)
5. Refactor if needed

## Test Database

For integration tests that require a database:
- Use a separate test database
- Or mock Prisma client
- Clean up test data after each test

## Best Practices

- ✅ Always test encryption symmetry: `decrypt(encrypt(x)) === x`
- ✅ Test error cases (wrong keys, invalid input)
- ✅ Test edge cases (empty strings, special characters)
- ✅ Keep tests isolated and independent
- ✅ Use descriptive test names

