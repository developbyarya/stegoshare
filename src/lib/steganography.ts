// steganography_module.ts
// Steganography utilities: hide/extract UTF-8 text in images (PNG/JPEG) using Jimp (LSB on R,G,B channels)
// and hide/extract in WAV audio (simple LSB in PCM bytes).
//
// This file consolidates duplicated implementations and keeps the robust Jimp-based image approach
// plus the existing WAV-based audio approach.

 // @ts-ignore - Jimp has limited TS types in this repo; ignore to avoid build errors here
import Jimp from "jimp";

/**
 * Check whether an image with given width/height can contain messageLengthBytes bytes.
 * We use 3 bits per pixel (R,G,B) and reserve 32 bits for the length header.
 */
function ensureCapacity(width: number, height: number, messageLengthBytes: number) {
    const totalPixels = width * height;
    const availableBits = totalPixels * 3; // R,G,B per pixel
    const requiredBits = 32 + messageLengthBytes * 8; // 32-bit length header + message bits
    return availableBits >= requiredBits;
}

/**
 * Hide a UTF-8 message into an image buffer using Jimp.
 * Bits are written into the least-significant bit of R, G, B (skipping alpha),
 * in pixel order. We write a 32-bit big-endian length header (number of bytes).
 *
 * The output is returned as a PNG Buffer to preserve lossless pixels.
 */
export async function hideMessageInImage(imageFile: Buffer, message: string): Promise<Buffer> {
    const image = await Jimp.read(imageFile);
    const { data, width, height } = image.bitmap; // data is a Buffer with RGBA stride

    const messageBytes = Buffer.from(message, "utf8");
    const messageLength = messageBytes.length;

    if (!ensureCapacity(width, height, messageLength)) {
        throw new Error("Image is too small to hide the message");
    }

    let bitIndex = 0; // overall bit index across available LSBs (R,G,B channels)

    const setBit = (bit: number) => {
        const pixelIndex = Math.floor(bitIndex / 3);
        const channel = bitIndex % 3; // 0 -> R, 1 -> G, 2 -> B
        const byteIndex = pixelIndex * 4 + channel; // RGBA stride
        data[byteIndex] = (data[byteIndex] & ~1) | (bit & 1);
        bitIndex++;
    };

    // Write 32-bit message length (big-endian)
    for (let i = 31; i >= 0; i--) {
        const bit = (messageLength >> i) & 1;
        setBit(bit);
    }

    // Write message bytes (big-endian per byte)
    for (let b = 0; b < messageBytes.length; b++) {
        const byte = messageBytes[b];
        for (let i = 7; i >= 0; i--) {
            const bit = (byte >> i) & 1;
            setBit(bit);
        }
    }

    // Put modified data back and export as PNG to preserve pixel values
    image.bitmap.data = data;
    const out = await image.getBufferAsync(Jimp.MIME_PNG);
    return Buffer.from(out);
}

/**
 * Extract a UTF-8 message hidden in an image buffer created by hideMessageInImage.
 */
export async function extractMessageFromImage(imageFile: Buffer): Promise<string> {
    const image = await Jimp.read(imageFile);
    const { data, width, height } = image.bitmap;

    const totalPixels = width * height;
    const availableBits = totalPixels * 3;

    let bitIndex = 0;
    const readBit = (): number => {
        const pixelIndex = Math.floor(bitIndex / 3);
        const channel = bitIndex % 3;
        const byteIndex = pixelIndex * 4 + channel;
        bitIndex++;
        return (data[byteIndex] & 1) || 0;
    };

    // Read 32-bit message length (big-endian)
    let messageLength = 0;
    for (let i = 0; i < 32; i++) {
        if (bitIndex >= availableBits) throw new Error("Invalid or missing hidden message");
        const bit = readBit();
        messageLength = (messageLength << 1) | bit;
    }

    // Basic sanity limits to avoid huge allocations from corrupted data
    if (messageLength < 0 || messageLength > 10_000_000) {
        throw new Error("Invalid message length or no hidden message found");
    }

    const messageBytes: number[] = [];
    for (let b = 0; b < messageLength; b++) {
        let byte = 0;
        for (let i = 0; i < 8; i++) {
            if (bitIndex >= availableBits) throw new Error("Unexpected end of data while extracting message");
            const bit = readBit();
            byte = (byte << 1) | bit;
        }
        messageBytes.push(byte);
    }

    return Buffer.from(messageBytes).toString("utf8");
}

/**
 * Hide a UTF-8 message into a WAV audio buffer (simple approach).
 * This writes a 32-bit big-endian length followed by message bytes into LSBs of audio data
 * starting from a dataOffset (default 44 bytes typical WAV header).
 *
 * Note: This is a naive approach and assumes PCM data bytes are present and that modifying LSBs is acceptable.
 */
export async function hideMessageInAudio(audioFile: Buffer, message: string): Promise<Buffer> {
    const messageBytes = Buffer.from(message, "utf8");
    const messageLength = messageBytes.length;

    const result = Buffer.from(audioFile);
    const dataOffset = 44; // WAV header offset (common case)

    // Need 32 bits for length + 8 * messageLength bits for message
    if (result.length * 8 < (dataOffset * 8) + 32 + messageLength * 8) {
        throw new Error("Audio file is too small to hide the message");
    }

    let bitIndex = 0;
    // Write 32-bit message length (big-endian)
    for (let i = 0; i < 32; i++) {
        const byteIndex = dataOffset + Math.floor(bitIndex / 8);
        const bitPosition = bitIndex % 8;
        const bit = (messageLength >> (31 - i)) & 1;

        if (byteIndex < result.length) {
            result[byteIndex] = (result[byteIndex] & ~(1 << bitPosition)) | (bit << bitPosition);
        }
        bitIndex++;
    }

    // Write message bytes
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
 * Extract a UTF-8 message hidden in WAV audio produced by hideMessageInAudio.
 */
export async function extractMessageFromAudio(audioFile: Buffer): Promise<string> {
    const result = Buffer.from(audioFile);
    const dataOffset = 44; // WAV header offset (common case)

    let bitIndex = 0;
    let messageLength = 0;

    // Read 32-bit message length (big-endian)
    for (let i = 0; i < 32; i++) {
        const byteIndex = dataOffset + Math.floor(bitIndex / 8);
        const bitPosition = bitIndex % 8;
        if (byteIndex < result.length) {
            const bit = (result[byteIndex] >> bitPosition) & 1;
            messageLength = (messageLength << 1) | bit;
        }
        bitIndex++;
    }

    if (messageLength < 0 || messageLength > 1_000_000) {
        throw new Error("Invalid message length or no hidden message found");
    }

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