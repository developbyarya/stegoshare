import { describe, it, expect, beforeEach } from "vitest";
import { hashPassword, verifyPassword, hashFile } from "@/lib/auth/hash";
import { generateSessionToken, verifySessionToken } from "@/lib/auth/session";

describe("Authentication Module", () => {
    describe("hashPassword", () => {
        it("should hash a password", async () => {
            const password = "testPassword123";
            const hash = await hashPassword(password);
            expect(hash).toBeDefined();
            expect(hash).not.toBe(password);
            expect(hash.length).toBeGreaterThan(0);
        });

        it("should produce different hashes for same password", async () => {
            const password = "samePassword";
            const hash1 = await hashPassword(password);
            const hash2 = await hashPassword(password);
            // bcrypt produces different hashes each time due to salt
            expect(hash1).not.toBe(hash2);
        });
    });

    describe("verifyPassword", () => {
        it("should verify correct password", async () => {
            const password = "testPassword123";
            const hash = await hashPassword(password);
            const isValid = await verifyPassword(password, hash);
            expect(isValid).toBe(true);
        });

        it("should reject incorrect password", async () => {
            const password = "testPassword123";
            const wrongPassword = "wrongPassword";
            const hash = await hashPassword(password);
            const isValid = await verifyPassword(wrongPassword, hash);
            expect(isValid).toBe(false);
        });
    });

    describe("hashFile", () => {
        it("should hash a file buffer", async () => {
            const buffer = Buffer.from("test file content");
            const hash = await hashFile(buffer);
            expect(hash).toBeDefined();
            expect(hash.length).toBe(64); // SHA256 produces 64 hex characters
        });

        it("should produce same hash for same file", async () => {
            const buffer = Buffer.from("test file content");
            const hash1 = await hashFile(buffer);
            const hash2 = await hashFile(buffer);
            expect(hash1).toBe(hash2);
        });

        it("should produce different hash for different files", async () => {
            const buffer1 = Buffer.from("file 1");
            const buffer2 = Buffer.from("file 2");
            const hash1 = await hashFile(buffer1);
            const hash2 = await hashFile(buffer2);
            expect(hash1).not.toBe(hash2);
        });
    });

    describe("Session Tokens", () => {
        const originalEnv = process.env.JWT_SECRET;

        beforeEach(() => {
            process.env.JWT_SECRET = "test-secret-key";
        });

        it("should generate a session token", () => {
            const payload = { userId: "123", username: "testuser" };
            const token = generateSessionToken(payload);
            expect(token).toBeDefined();
            expect(typeof token).toBe("string");
        });

        it("should verify and decode a valid token", () => {
            const payload = { userId: "123", username: "testuser" };
            const token = generateSessionToken(payload);
            const decoded = verifySessionToken(token);

            expect(decoded).not.toBeNull();
            expect(decoded?.userId).toBe("123");
            expect(decoded?.username).toBe("testuser");
        });

        it("should reject invalid token", () => {
            const invalidToken = "invalid.token.here";
            const decoded = verifySessionToken(invalidToken);
            expect(decoded).toBeNull();
        });

        it("should reject token with wrong secret", () => {
            const payload = { userId: "123", username: "testuser" };
            const token = generateSessionToken(payload);

            // Change secret
            process.env.JWT_SECRET = "different-secret";
            const decoded = verifySessionToken(token);
            expect(decoded).toBeNull();

            // Restore
            process.env.JWT_SECRET = originalEnv;
        });
    });
});

