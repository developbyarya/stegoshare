/**
 * Steganography Module
 * Hide and extract text messages inside image files using LSB (Least Significant Bit) manipulation
 */

/**
 * Hide a message inside an image file using LSB steganography
 * @param imageFile - Image file buffer
 * @param message - Text message to hide
 * @returns Buffer containing image with hidden message
 */
export async function hideMessageInImage(imageFile: Buffer, message: string): Promise<Buffer> {
    // For PNG/JPG, we need to work with pixel data
    // This is a simplified implementation - in production, use a library like 'sharp' or 'jimp'

    const messageBytes = Buffer.from(message, "utf8");
    const messageLength = messageBytes.length;

    // Check if image is large enough
    // Rough estimate: need at least 8 pixels per byte (1 bit per pixel LSB)
    const minRequiredSize = messageLength * 8 + 32; // 32 bits for length header

    if (imageFile.length < minRequiredSize) {
        throw new Error("Image file is too small to hide the message");
    }

    // Create a copy of the image buffer
    const result = Buffer.from(imageFile);

    // Encode message length in first 32 bits (4 bytes)
    let bitIndex = 0;
    for (let i = 0; i < 32; i++) {
        const byteIndex = Math.floor(bitIndex / 8);
        const bitPosition = bitIndex % 8;
        const bit = (messageLength >> (31 - i)) & 1;

        if (byteIndex < result.length) {
            result[byteIndex] = (result[byteIndex] & ~(1 << bitPosition)) | (bit << bitPosition);
        }
        bitIndex++;
    }

    // Encode message bytes
    for (let byteIdx = 0; byteIdx < messageBytes.length; byteIdx++) {
        const byte = messageBytes[byteIdx];

        for (let bitIdx = 0; bitIdx < 8; bitIdx++) {
            const bit = (byte >> (7 - bitIdx)) & 1;

            if (bitIndex < result.length * 8) {
                const byteIndex = Math.floor(bitIndex / 8);
                const bitPosition = bitIndex % 8;

                result[byteIndex] = (result[byteIndex] & ~(1 << bitPosition)) | (bit << bitPosition);
                bitIndex++;
            }
        }
    }

    return result;
}

/**
 * Extract a hidden message from an image file
 * @param imageFile - Image file buffer containing hidden message
 * @returns Extracted text message
 */
export async function extractMessageFromImage(imageFile: Buffer): Promise<string> {
    const result = Buffer.from(imageFile);

    // Extract message length from first 32 bits
    let bitIndex = 0;
    let messageLength = 0;

    for (let i = 0; i < 32; i++) {
        const byteIndex = Math.floor(bitIndex / 8);
        const bitPosition = bitIndex % 8;

        if (byteIndex < result.length) {
            const bit = (result[byteIndex] >> bitPosition) & 1;
            messageLength = (messageLength << 1) | bit;
        }
        bitIndex++;
    }

    if (messageLength <= 0 || messageLength > 1000000) {
        throw new Error("Invalid message length or no hidden message found");
    }

    // Extract message bytes
    const messageBytes: number[] = [];

    for (let byteIdx = 0; byteIdx < messageLength; byteIdx++) {
        let byte = 0;

        for (let bitIdx = 0; bitIdx < 8; bitIdx++) {
            const byteIndex = Math.floor(bitIndex / 8);
            const bitPosition = bitIndex % 8;

            if (byteIndex < result.length) {
                const bit = (result[byteIndex] >> bitPosition) & 1;
                byte = (byte << 1) | bit;
            }
            bitIndex++;
        }

        messageBytes.push(byte);
    }

    return Buffer.from(messageBytes).toString("utf8");
}

/**
 * Hide a message inside an audio file using LSB steganography
 * @param audioFile - Audio file buffer
 * @param message - Text message to hide
 * @returns Buffer containing audio with hidden message
 */
export async function hideMessageInAudio(audioFile: Buffer, message: string): Promise<Buffer> {
    // Similar to image steganography but works on audio sample data
    const messageBytes = Buffer.from(message, "utf8");
    const messageLength = messageBytes.length;

    const result = Buffer.from(audioFile);

    // Skip WAV header (first 44 bytes typically) or use offset
    const dataOffset = 44; // Common WAV header size

    if (result.length < dataOffset + messageLength * 8 + 32) {
        throw new Error("Audio file is too small to hide the message");
    }

    // Encode length and message similar to image method
    let bitIndex = 0;

    // Encode message length
    for (let i = 0; i < 32; i++) {
        const byteIndex = dataOffset + Math.floor(bitIndex / 8);
        const bitPosition = bitIndex % 8;
        const bit = (messageLength >> (31 - i)) & 1;

        if (byteIndex < result.length) {
            result[byteIndex] = (result[byteIndex] & ~(1 << bitPosition)) | (bit << bitPosition);
        }
        bitIndex++;
    }

    // Encode message
    for (let byteIdx = 0; byteIdx < messageBytes.length; byteIdx++) {
        const byte = messageBytes[byteIdx];

        for (let bitIdx = 0; bitIdx < 8; bitIdx++) {
            const bit = (byte >> (7 - bitIdx)) & 1;
            const byteIndex = dataOffset + Math.floor(bitIndex / 8);
            const bitPosition = bitIndex % 8;

            if (byteIndex < result.length) {
                result[byteIndex] = (result[byteIndex] & ~(1 << bitPosition)) | (bit << bitPosition);
            }
            bitIndex++;
        }
    }

    return result;
}

/**
 * Extract a hidden message from an audio file
 * @param audioFile - Audio file buffer containing hidden message
 * @returns Extracted text message
 */
export async function extractMessageFromAudio(audioFile: Buffer): Promise<string> {
    const result = Buffer.from(audioFile);
    const dataOffset = 44; // Common WAV header size

    let bitIndex = 0;
    let messageLength = 0;

    // Extract message length
    for (let i = 0; i < 32; i++) {
        const byteIndex = dataOffset + Math.floor(bitIndex / 8);
        const bitPosition = bitIndex % 8;

        if (byteIndex < result.length) {
            const bit = (result[byteIndex] >> bitPosition) & 1;
            messageLength = (messageLength << 1) | bit;
        }
        bitIndex++;
    }

    if (messageLength <= 0 || messageLength > 1000000) {
        throw new Error("Invalid message length or no hidden message found");
    }

    // Extract message bytes
    const messageBytes: number[] = [];

    for (let byteIdx = 0; byteIdx < messageLength; byteIdx++) {
        let byte = 0;

        for (let bitIdx = 0; bitIdx < 8; bitIdx++) {
            const byteIndex = dataOffset + Math.floor(bitIndex / 8);
            const bitPosition = bitIndex % 8;

            if (byteIndex < result.length) {
                const bit = (result[byteIndex] >> bitPosition) & 1;
                byte = (byte << 1) | bit;
            }
            bitIndex++;
        }

        messageBytes.push(byte);
    }

    return Buffer.from(messageBytes).toString("utf8");
}

