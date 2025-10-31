import { describe, it, expect } from "vitest";
import { caesarEncrypt, caesarDecrypt } from "@/lib/encryption/classical/caesarCipher";
import { vigenereEncrypt, vigenereDecrypt } from "@/lib/encryption/classical/vigenereCipher";
import { aesEncrypt, aesDecrypt } from "@/lib/encryption/modern/aesEncrypt";
import { xorEncrypt, xorDecrypt } from "@/lib/encryption/modern/xorEncrypt";
import { superEncrypt, superDecrypt } from "@/lib/encryption/superEncryption";

describe("Encryption Module", () => {
    describe("Caesar Cipher", () => {
        it("should encrypt text with default shift (3)", () => {
            const text = "HELLO";
            const encrypted = caesarEncrypt(text);
            expect(encrypted).not.toBe(text);
            expect(encrypted).toBe("KHOOR");
        });

        it("should decrypt text with default shift (3)", () => {
            const encrypted = "KHOOR";
            const decrypted = caesarDecrypt(encrypted);
            expect(decrypted).toBe("HELLO");
        });

        it("should maintain encryption symmetry", () => {
            const text = "HELLO WORLD";
            const encrypted = caesarEncrypt(text, 5);
            const decrypted = caesarDecrypt(encrypted, 5);
            expect(decrypted).toBe(text);
        });

        it("should handle lowercase and uppercase", () => {
            const text = "Hello World";
            const encrypted = caesarEncrypt(text);
            const decrypted = caesarDecrypt(encrypted);
            expect(decrypted).toBe(text);
        });

        it("should preserve non-alphabetic characters", () => {
            const text = "HELLO 123 !@#";
            const encrypted = caesarEncrypt(text);
            const decrypted = caesarDecrypt(encrypted);
            expect(decrypted).toBe(text);
        });
    });

    describe("Vigenère Cipher", () => {
        it("should encrypt text with key", () => {
            const text = "HELLO";
            const key = "KEY";
            const encrypted = vigenereEncrypt(text, key);
            expect(encrypted).not.toBe(text);
            expect(encrypted).toBeDefined();
        });

        it("should decrypt text with same key", () => {
            const text = "HELLO WORLD";
            const key = "SECRET";
            const encrypted = vigenereEncrypt(text, key);
            const decrypted = vigenereDecrypt(encrypted, key);
            expect(decrypted).toBe(text);
        });

        it("should maintain encryption symmetry", () => {
            const text = "TOPSECRET MESSAGE";
            const key = "PASSWORD";
            const encrypted = vigenereEncrypt(text, key);
            const decrypted = vigenereDecrypt(encrypted, key);
            expect(decrypted).toBe(text);
        });
    });

    describe("AES Encryption", () => {
        it("should encrypt text", () => {
            const text = "Secret message";
            const key = "mySecretKey123";
            const encrypted = aesEncrypt(text, key);
            expect(encrypted).not.toBe(text);
            expect(encrypted).toContain(":");
        });

        it("should decrypt text correctly", () => {
            const text = "Secret message";
            const key = "mySecretKey123";
            const encrypted = aesEncrypt(text, key);
            const decrypted = aesDecrypt(encrypted, key);
            expect(decrypted).toBe(text);
        });

        it("should maintain encryption symmetry", () => {
            const text = "TOPSECRET";
            const key = "test123";
            const encrypted = aesEncrypt(text, key);
            const decrypted = aesDecrypt(encrypted, key);
            expect(decrypted).toBe(text);
        });

        it("should fail with wrong key", () => {
            const text = "Secret message";
            const key = "correctKey";
            const wrongKey = "wrongKey";
            const encrypted = aesEncrypt(text, key);

            expect(() => {
                aesDecrypt(encrypted, wrongKey);
            }).toThrow();
        });
    });

    describe("XOR Encryption", () => {
        it("should encrypt text", () => {
            const text = "Secret message";
            const key = "key";
            const encrypted = xorEncrypt(text, key);
            expect(encrypted).not.toBe(text);
            expect(typeof encrypted).toBe("string");
        });

        it("should decrypt text correctly", () => {
            const text = "Secret message";
            const key = "key";
            const encrypted = xorEncrypt(text, key);
            const decrypted = xorDecrypt(encrypted, key);
            expect(decrypted).toBe(text);
        });

        it("should maintain encryption symmetry", () => {
            const text = "TOPSECRET";
            const key = "test123";
            const encrypted = xorEncrypt(text, key);
            const decrypted = xorDecrypt(encrypted, key);
            expect(decrypted).toBe(text);
        });
    });

    describe("Super Encryption", () => {
        it("should encrypt text using super encryption", () => {
            const message = "TOPSECRET";
            const key = "test123";
            const encrypted = superEncrypt(message, key);
            expect(encrypted).not.toBe(message);
            expect(encrypted).toBeDefined();
        });

        it("should decrypt text using super decryption", () => {
            const message = "TOPSECRET";
            const key = "test123";
            const encrypted = superEncrypt(message, key);
            const decrypted = superDecrypt(encrypted, key);
            expect(decrypted).toBe(message);
        });

        it("should maintain encryption symmetry", () => {
            const message = "This is a super secret message!";
            const key = "mySecretKey123";
            const encrypted = superEncrypt(message, key);
            const decrypted = superDecrypt(encrypted, key);
            expect(decrypted).toBe(message);
        });

        it("should fail with wrong key", () => {
            const message = "TOPSECRET";
            const key = "correctKey";
            const wrongKey = "wrongKey";
            const encrypted = superEncrypt(message, key);

            expect(() => {
                superDecrypt(encrypted, wrongKey);
            }).toThrow();
        });
    });
});

