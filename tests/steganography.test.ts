import { describe, it, expect } from "vitest";
import {
    hideMessageInImage,
    extractMessageFromImage,
    hideMessageInAudio,
    extractMessageFromAudio,
} from "@/lib/steganography";

describe("Steganography Module", () => {
    describe("Image Steganography", () => {
        it("should hide message in image", async () => {
            // Create a dummy image buffer (minimal PNG header + data)
            const imageBuffer = Buffer.alloc(1000, 0x80); // Fill with arbitrary data
            const message = "Hidden message";

            const result = await hideMessageInImage(imageBuffer, message);
            expect(result).toBeDefined();
            expect(result.length).toBe(imageBuffer.length);
        });

        it("should extract message from image", async () => {
            const imageBuffer = Buffer.alloc(1000, 0x80);
            const message = "Hidden message";

            const stegoImage = await hideMessageInImage(imageBuffer, message);
            const extracted = await extractMessageFromImage(stegoImage);

            expect(extracted).toBe(message);
        });

        it("should maintain hide/extract consistency", async () => {
            const imageBuffer = Buffer.alloc(5000, 0x90);
            const message = "This is a longer hidden message with special chars: !@#$%";

            const stegoImage = await hideMessageInImage(imageBuffer, message);
            const extracted = await extractMessageFromImage(stegoImage);

            expect(extracted).toBe(message);
        });

        it("should throw error if image is too small", async () => {
            const smallBuffer = Buffer.alloc(10); // Too small
            const message = "This message is too long for such a small buffer";

            await expect(
                hideMessageInImage(smallBuffer, message)
            ).rejects.toThrow();
        });
    });

    describe("Audio Steganography", () => {
        it("should hide message in audio", async () => {
            // Create a dummy audio buffer with WAV header
            const audioBuffer = Buffer.alloc(2000);
            audioBuffer.write("RIFF", 0); // WAV header marker
            const message = "Hidden audio message";

            const result = await hideMessageInAudio(audioBuffer, message);
            expect(result).toBeDefined();
            expect(result.length).toBe(audioBuffer.length);
        });

        it("should extract message from audio", async () => {
            const audioBuffer = Buffer.alloc(2000);
            audioBuffer.write("RIFF", 0);
            const message = "Hidden audio message";

            const stegoAudio = await hideMessageInAudio(audioBuffer, message);
            const extracted = await extractMessageFromAudio(stegoAudio);

            expect(extracted).toBe(message);
        });

        it("should maintain hide/extract consistency for audio", async () => {
            const audioBuffer = Buffer.alloc(10000);
            audioBuffer.write("RIFF", 0);
            const message = "Longer audio steganography message!";

            const stegoAudio = await hideMessageInAudio(audioBuffer, message);
            const extracted = await extractMessageFromAudio(stegoAudio);

            expect(extracted).toBe(message);
        });
    });
});

