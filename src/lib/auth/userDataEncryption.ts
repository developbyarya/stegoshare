import { aesEncrypt, aesDecrypt } from "@/lib/encryption/modern/aesEncrypt";

/**
 * User Data Encryption Module
 * Encrypts/decrypts user data fields using the user's password as the encryption key
 */

export interface UserData {
    username: string;
    passwordHash: string;
}

/**
 * Encrypt user data fields using the user's password as the key
 * @param data - User data to encrypt
 * @param password - User's password (used as encryption key)
 * @returns Encrypted user data
 */
export function encryptUserData(
    data: UserData,
    password: string
): {
    encryptedUsername: string;
    encryptedPasswordHash: string;
} {
    const encryptedUsername = aesEncrypt(data.username, password);
    const encryptedPasswordHash = aesEncrypt(data.passwordHash, password);

    return {
        encryptedUsername,
        encryptedPasswordHash,
    };
}

/**
 * Decrypt user data fields using the user's password as the key
 * @param encryptedData - Encrypted user data
 * @param password - User's password (used as decryption key)
 * @returns Decrypted user data
 */
export function decryptUserData(
    encryptedData: {
        encryptedUsername: string;
        encryptedPasswordHash: string;
    },
    password: string
): UserData {
    const username = aesDecrypt(encryptedData.encryptedUsername, password);
    const passwordHash = aesDecrypt(
        encryptedData.encryptedPasswordHash,
        password
    );

    return {
        username,
        passwordHash,
    };
}

