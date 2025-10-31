import bcrypt from "bcryptjs";

/**
 * Hash a plain text password using bcrypt
 * @param password - Plain text password
 * @returns Hashed password
 */
export async function hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
}

/**
 * Verify a password against a hash
 * @param password - Plain text password
 * @param hash - Hashed password
 * @returns True if password matches hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
}

/**
 * Hash a file buffer for secret key verification
 * @param buffer - File buffer
 * @returns SHA256 hash as hex string
 */
export async function hashFile(buffer: Buffer): Promise<string> {
    const crypto = await import("crypto");
    return crypto.createHash("sha256").update(buffer).digest("hex");
}

