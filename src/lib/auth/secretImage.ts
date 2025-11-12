import { readFileSync } from "fs";
import { join } from "path";
import { hashFile } from "./hash";

/**
 * Get the hash of the secret image file
 * The secret image should be placed in src/secrets/secret.png
 * @returns SHA256 hash of the secret image as hex string
 */
export async function getSecretImageHash(): Promise<string> {
    try {
        const secretImagePath = join(process.cwd(), "src", "secrets", "secret.png");
        const secretImageBuffer = readFileSync(secretImagePath);
        return await hashFile(secretImageBuffer);
    } catch (error) {
        console.error("Error reading secret image:", error);
        throw new Error("Secret image file not found. Please ensure secret.png exists in src/secrets/");
    }
}

/**
 * Check if a file is an image based on its MIME type
 * @param file - File object
 * @returns True if file is an image
 */
export function isImageFile(file: File): boolean {
    return file.type.startsWith("image/");
}

