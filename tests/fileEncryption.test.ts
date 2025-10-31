import { describe, it, expect } from "vitest";
import {
    encryptFile,
    decryptFile,
    encryptFileToBuffer,
    decryptFileFromBuffer,
} from "@/lib/fileEncryption";

describe("File Encryption Module", () => {
    describe("encryptFile / decryptFile", () => {
        it("should encrypt a file buffer", async () => {
            const fileBuffer = Buffer.from("This is a test file content");
            const key = "mySecretKey123";

            const { encrypted, iv, salt } = await encryptFile(fileBuffer, key);

            expect(encrypted).toBeDefined();
            expect(iv).toBeDefined();
            expect(salt).toBeDefined();
            expect(encrypted).not.toEqual(fileBuffer);
        });

        it("should decrypt a file buffer correctly", async () => {
            const fileBuffer = Buffer.from("This is a test file content");
            const key = "mySecretKey123";

            const { encrypted, iv, salt } = await encryptFile(fileBuffer, key);
            const decrypted = await decryptFile(encrypted, key, iv, salt);

            expect(decrypted).toEqual(fileBuffer);
        });

        it("should maintain encryption symmetry", async () => {
            const fileBuffer = Buffer.from("Binary file content with special chars: !@#$%");
            const key = "test123";

            const { encrypted, iv, salt } = await encryptFile(fileBuffer, key);
            const decrypted = await decryptFile(encrypted, key, iv, salt);

            expect(decrypted).toEqual(fileBuffer);
        });

        it("should fail with wrong key", async () => {
            const fileBuffer = Buffer.from("Secret file");
            const key = "correctKey";
            const wrongKey = "wrongKey";

            const { encrypted, iv, salt } = await encryptFile(fileBuffer, key);

            await expect(
                decryptFile(encrypted, wrongKey, iv, salt)
            ).rejects.toThrow();
        });
    });

    describe("encryptFileToBuffer / decryptFileFromBuffer", () => {
        it("should encrypt file to combined buffer", async () => {
            const fileBuffer = Buffer.from("File content");
            const key = "mySecretKey";

            const combined = await encryptFileToBuffer(fileBuffer, key);

            expect(combined).toBeDefined();
            expect(combined.length).toBeGreaterThan(fileBuffer.length);
        });

        it("should decrypt file from combined buffer", async () => {
            const fileBuffer = Buffer.from("File content");
            const key = "mySecretKey";

            const combined = await encryptFileToBuffer(fileBuffer, key);
            const decrypted = await decryptFileFromBuffer(combined, key);

            expect(decrypted).toEqual(fileBuffer);
        });

        it("should maintain encryption symmetry with combined buffer", async () => {
            const fileBuffer = Buffer.from("Large file content with multiple lines\nLine 2\nLine 3");
            const key = "testKey123";

            const combined = await encryptFileToBuffer(fileBuffer, key);
            const decrypted = await decryptFileFromBuffer(combined, key);

            expect(decrypted).toEqual(fileBuffer);
        });

        it("should handle binary files", async () => {
            const fileBuffer = Buffer.from([0x00, 0x01, 0x02, 0xFF, 0xFE, 0xFD]);
            const key = "binaryKey";

            const combined = await encryptFileToBuffer(fileBuffer, key);
            const decrypted = await decryptFileFromBuffer(combined, key);

            expect(decrypted).toEqual(fileBuffer);
        });
    });
});

