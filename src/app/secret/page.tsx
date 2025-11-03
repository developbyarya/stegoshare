"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Form, FormField, FormLabel } from "@/components/ui/form";
import { superEncrypt, superDecrypt } from "@/lib/encryption/superEncryption";
import {
    hideMessageInImage,
    extractMessageFromImage,
} from "@/lib/steganography";

export default function SecretPage() {
    // Super Encryption State
    const [encryptText, setEncryptText] = useState("");
    const [encryptKey, setEncryptKey] = useState("");
    const [encryptedResult, setEncryptedResult] = useState("");
    const [decryptText, setDecryptText] = useState("");
    const [decryptKey, setDecryptKey] = useState("");
    const [decryptedResult, setDecryptedResult] = useState("");

    // Steganography State
    const [stegoImage, setStegoImage] = useState<File | null>(null);
    const [stegoMessage, setStegoMessage] = useState("");
    const [stegoResult, setStegoResult] = useState("");
    const [extractImage, setExtractImage] = useState<File | null>(null);
    const [extractedMessage, setExtractedMessage] = useState("");

    // File Encryption State
    const [fileEncryptKey, setFileEncryptKey] = useState("");
    const [fileToEncrypt, setFileToEncrypt] = useState<File | null>(null);
    const [fileEncryptResult, setFileEncryptResult] = useState("");

    const handleSuperEncrypt = () => {
        try {
            if (!encryptText || !encryptKey) {
                setEncryptedResult("Please enter both text and key");
                return;
            }
            const result = superEncrypt(encryptText, encryptKey);
            setEncryptedResult(result);
        } catch (error) {
            setEncryptedResult(
                `Error: ${error instanceof Error ? error.message : "Unknown error"}`
            );
        }
    };

    const handleSuperDecrypt = () => {
        try {
            if (!decryptText || !decryptKey) {
                setDecryptedResult("Please enter both encrypted text and key");
                return;
            }
            const result = superDecrypt(decryptText, decryptKey);
            setDecryptedResult(result);
        } catch (error) {
            setDecryptedResult(
                `Error: ${error instanceof Error ? error.message : "Unknown error"}`
            );
        }
    };

    const handleHideMessage = async () => {
        try {
            if (!stegoImage || !stegoMessage) {
                setStegoResult("Please select an image and enter a message");
                return;
            }
            // Convert File to Buffer for server-side processing
            const formData = new FormData();
            formData.append("image", stegoImage);
            formData.append("message", stegoMessage);

            const response = await fetch("/api/steganography/hide", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                throw new Error("Failed to hide message");
            }

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `hidden_${stegoImage.name}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            setStegoResult("Message hidden successfully! File downloaded.");
        } catch (error) {
            setStegoResult(
                `Error: ${error instanceof Error ? error.message : "Unknown error"}`
            );
        }
    };

    const handleExtractMessage = async () => {
        try {
            if (!extractImage) {
                setExtractedMessage("Please select an image");
                return;
            }
            const formData = new FormData();
            formData.append("image", extractImage);

            const response = await fetch("/api/steganography/extract", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                throw new Error("Failed to extract message");
            }

            const data = await response.json();
            setExtractedMessage(data.message);
        } catch (error) {
            setExtractedMessage(
                `Error: ${error instanceof Error ? error.message : "Unknown error"}`
            );
        }
    };

    const handleFileEncrypt = async () => {
        try {
            if (!fileToEncrypt || !fileEncryptKey) {
                setFileEncryptResult("Please select a file and enter a key");
                return;
            }

            const formData = new FormData();
            formData.append("file", fileToEncrypt);
            formData.append("key", fileEncryptKey);

            const response = await fetch("/api/encrypt-file", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                throw new Error("Failed to encrypt file");
            }

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `encrypted_${fileToEncrypt.name}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            setFileEncryptResult("File encrypted successfully! File downloaded.");
        } catch (error) {
            setFileEncryptResult(
                `Error: ${error instanceof Error ? error.message : "Unknown error"}`
            );
        }
    };

    return (
        <div className="space-y-8">
            {/* Super Encryption Section */}
            <Card>
                <CardHeader>
                    <CardTitle>Super Encryption</CardTitle>
                    <CardDescription>
                        Encrypt and decrypt text using Caesar + AES encryption
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Encryption */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-gray-900 dark:text-white">Encrypt Text</h3>
                        <FormField>
                            <FormLabel>Text to Encrypt</FormLabel>
                            <Input
                                value={encryptText}
                                onChange={(e) => setEncryptText(e.target.value)}
                                placeholder="Enter text to encrypt"
                            />
                        </FormField>
                        <FormField>
                            <FormLabel>Encryption Key</FormLabel>
                            <Input
                                type="password"
                                value={encryptKey}
                                onChange={(e) => setEncryptKey(e.target.value)}
                                placeholder="Enter encryption key"
                            />
                        </FormField>
                        <Button onClick={handleSuperEncrypt}>Encrypt</Button>
                        {encryptedResult && (
                            <div className="p-4 bg-muted rounded-lg">
                                <p className="text-sm font-medium mb-2">
                                    Encrypted Result:
                                </p>
                                <p className="text-xs break-all">
                                    {encryptedResult}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Decryption */}
                    <div className="space-y-4 border-t pt-6">
                        <h3 className="font-semibold text-gray-900 dark:text-white">Decrypt Text</h3>
                        <FormField>
                            <FormLabel>Encrypted Text</FormLabel>
                            <Input
                                value={decryptText}
                                onChange={(e) => setDecryptText(e.target.value)}
                                placeholder="Enter encrypted text"
                            />
                        </FormField>
                        <FormField>
                            <FormLabel>Decryption Key</FormLabel>
                            <Input
                                type="password"
                                value={decryptKey}
                                onChange={(e) => setDecryptKey(e.target.value)}
                                placeholder="Enter decryption key"
                            />
                        </FormField>
                        <Button onClick={handleSuperDecrypt}>Decrypt</Button>
                        {decryptedResult && (
                            <div className="p-4 bg-muted rounded-lg">
                                <p className="text-sm font-medium mb-2">
                                    Decrypted Result:
                                </p>
                                <p className="break-words">{decryptedResult}</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Steganography Section */}
            <Card>
                <CardHeader>
                    <CardTitle>Steganography</CardTitle>
                    <CardDescription>
                        Hide and extract messages in image files
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Hide Message */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-gray-900 dark:text-white">Hide Message in Image</h3>
                        <FormField>
                            <FormLabel>Select Image</FormLabel>
                            <Input
                                type="file"
                                accept="image/*"
                                onChange={(e) =>
                                    setStegoImage(
                                        e.target.files?.[0] || null
                                    )
                                }
                            />
                        </FormField>
                        <FormField>
                            <FormLabel>Message to Hide</FormLabel>
                            <Input
                                value={stegoMessage}
                                onChange={(e) => setStegoMessage(e.target.value)}
                                placeholder="Enter message to hide"
                            />
                        </FormField>
                        <Button onClick={handleHideMessage}>
                            Hide Message
                        </Button>
                        {stegoResult && (
                            <div className="p-4 bg-muted rounded-lg">
                                <p>{stegoResult}</p>
                            </div>
                        )}
                    </div>

                    {/* Extract Message */}
                    <div className="space-y-4 border-t pt-6">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                            Extract Message from Image
                        </h3>
                        <FormField>
                            <FormLabel>Select Image</FormLabel>
                            <Input
                                type="file"
                                accept="image/*"
                                onChange={(e) =>
                                    setExtractImage(
                                        e.target.files?.[0] || null
                                    )
                                }
                            />
                        </FormField>
                        <Button onClick={handleExtractMessage}>
                            Extract Message
                        </Button>
                        {extractedMessage && (
                            <div className="p-4 bg-muted rounded-lg">
                                <p className="text-sm font-medium mb-2">
                                    Extracted Message:
                                </p>
                                <p className="break-words">
                                    {extractedMessage}
                                </p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* File Encryption Section */}
            <Card>
                <CardHeader>
                    <CardTitle>File Encryption</CardTitle>
                    <CardDescription>
                        Encrypt files with AES encryption
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <FormField>
                        <FormLabel>Select File</FormLabel>
                        <Input
                            type="file"
                            onChange={(e) =>
                                setFileToEncrypt(e.target.files?.[0] || null)
                            }
                        />
                    </FormField>
                    <FormField>
                        <FormLabel>Encryption Key</FormLabel>
                        <Input
                            type="password"
                            value={fileEncryptKey}
                            onChange={(e) => setFileEncryptKey(e.target.value)}
                            placeholder="Enter encryption key"
                        />
                    </FormField>
                    <Button onClick={handleFileEncrypt}>Encrypt File</Button>
                    {fileEncryptResult && (
                        <div className="p-4 bg-muted rounded-lg">
                            <p>{fileEncryptResult}</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

