"use client";

import { useState, useRef, DragEvent } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function UploadImage() {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [message, setMessage] = useState("");
    const [processing, setProcessing] = useState<"encode" | "decode" | null>(null);
    const [error, setError] = useState("");
    const [extractedMessage, setExtractedMessage] = useState<string | null>(null);

    const resetAll = () => {
        setSelectedFile(null);
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
        setMessage("");
        setProcessing(null);
        setError("");
        setExtractedMessage(null);
        fileInputRef.current && (fileInputRef.current.value = "");
    };

    const setFileAndPreview = (file: File) => {
        setError("");
        setExtractedMessage(null);
        if (!file.type.startsWith("image/")) {
            setError("Only image files are allowed");
            return;
        }
        setSelectedFile(file);
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
    };

    const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            setFileAndPreview(files[0]);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            setFileAndPreview(files[0]);
        }
    };

    const handleEncode = async () => {
        setError("");
        setExtractedMessage(null);
        if (!selectedFile) {
            setError("Please select an image file");
            return;
        }
        if (!message || message.trim() === "") {
            setError("Please enter the hidden message");
            return;
        }
        setProcessing("encode");
        try {
            const formData = new FormData();
            formData.append("image", selectedFile);
            formData.append("message", message);

            const res = await fetch("/api/steganography/hide", {
                method: "POST",
                body: formData,
            });

            if (!res.ok) {
                if (res.status === 401) {
                    router.push("/login");
                    return;
                }
                const json = await res.json().catch(() => null);
                throw new Error(json?.error || "Failed to hide message");
            }

            const blob = await res.blob();
            const disp = res.headers.get("content-disposition") || "";
            let filename = "hidden_image";
            const match = /filename="?([^";]+)"?/.exec(disp);
            if (match && match[1]) filename = match[1];

            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        } finally {
            setProcessing(null);
        }
    };

    const handleDecode = async () => {
        setError("");
        setExtractedMessage(null);
        if (!selectedFile) {
            setError("Please select an image file to extract from");
            return;
        }
        setProcessing("decode");
        try {
            const formData = new FormData();
            formData.append("image", selectedFile);

            const res = await fetch("/api/steganography/extract", {
                method: "POST",
                body: formData,
            });

            if (!res.ok) {
                if (res.status === 401) {
                    router.push("/login");
                    return;
                }
                const json = await res.json().catch(() => null);
                throw new Error(json?.error || "Failed to extract message");
            }

            const json = await res.json();
            setExtractedMessage(json.message ?? "");
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        } finally {
            setProcessing(null);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
            <div className="container mx-auto px-4 py-8">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold">Stegoshare - Encode/Decode</h1>
                </div>

                <Card className="max-w-3xl mx-auto">
                    <CardHeader>
                        <CardTitle>Upload an Image</CardTitle>
                        <CardDescription>Drag & drop or click to select a single image, then choose Encode or Decode</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div
                            className={`border-2 border-dashed rounded-lg p-6 md:p-12 text-center transition-colors ${isDragging ? "border-primary bg-primary/5" : "border-gray-300 dark:border-gray-700"
                                } ${processing ? "pointer-events-none opacity-50" : "cursor-pointer"}`}
                            onDragEnter={handleDragEnter}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                className="hidden"
                                accept="image/*"
                                onChange={handleFileSelect}
                                disabled={!!processing}
                            />

                            {!selectedFile ? (
                                <div className="space-y-4">
                                    <div className="text-4xl">📷</div>
                                    <div className="text-lg font-medium">
                                        {isDragging ? "Drop your Image here" : "Select an Image or drag it here"}
                                    </div>
                                    <div className="text-sm text-muted-foreground">Only image files are allowed</div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {previewUrl && (
                                        <div className="flex justify-center">
                                            <img src={previewUrl} alt="preview" className="max-h-72 rounded-md shadow" />
                                        </div>
                                    )}
                                    <div className="text-sm text-muted-foreground">Selected: {selectedFile.name}</div>
                                </div>
                            )}
                        </div>

                        <div className="mt-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Hidden message (for Encode)</label>
                                <Input
                                    type="text"
                                    placeholder="Enter hidden message"
                                    value={message}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMessage(e.target.value)}
                                />
                            </div>

                            {error && (
                                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive">{error}</div>
                            )}

                            <div className="flex flex-wrap gap-3">
                                <Button onClick={handleEncode} disabled={processing !== null || !selectedFile} className="min-w-28">
                                    {processing === "encode" ? "Encoding..." : "Encode"}
                                </Button>
                                <Button onClick={handleDecode} disabled={processing !== null || !selectedFile} className="min-w-28" variant="secondary">
                                    {processing === "decode" ? "Decoding..." : "Decode"}
                                </Button>
                                <Button onClick={resetAll} variant="outline" className="min-w-28">Reset</Button>
                            </div>

                            {extractedMessage !== null && (
                                <div className="mt-2">
                                    <label className="block text-sm font-medium mb-1">Extracted message</label>
                                    <div className="rounded-md border border-input bg-transparent p-3 text-sm">
                                        {extractedMessage === "" ? (
                                            <span className="text-muted-foreground">(no message found)</span>
                                        ) : (
                                            <pre className="whitespace-pre-wrap break-words">{extractedMessage}</pre>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className="text-sm text-muted-foreground">
                                Tip: Select an image once, then choose Encode or Decode. Use Reset to clear.
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

