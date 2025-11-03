"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function RahasiaHidupPage() {
    const router = useRouter();
    const [message, setMessage] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [extractFile, setExtractFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [extracting, setExtracting] = useState(false);
    const [error, setError] = useState("");
    const [extractedMessage, setExtractedMessage] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setError("");
        const f = e.target.files && e.target.files[0];
        if (f) {
            // only allow image mime types
            if (!f.type.startsWith("image/")) {
                setError("Only image files are allowed");
                setFile(null);
                return;
            }
            setFile(f);
        } else {
            setFile(null);
        }
    };

    const handleExtractFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setError("");
        setExtractedMessage(null);
        const f = e.target.files && e.target.files[0];
        if (f) {
            if (!f.type.startsWith("image/")) {
                setError("Only image files are allowed");
                setExtractFile(null);
                return;
            }
            setExtractFile(f);
        } else {
            setExtractFile(null);
        }
    };

    const handleExtract = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setExtractedMessage(null);

        if (!extractFile) {
            setError("Please select an image file to extract from");
            return;
        }

        setExtracting(true);
        try {
            const formData = new FormData();
            formData.append("image", extractFile);

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
            console.error("Extract error:", err);
            setError(err instanceof Error ? err.message : String(err));
        } finally {
            setExtracting(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!file) {
            setError("Please select an image file");
            return;
        }

        if (!message || message.trim() === "") {
            setError("Please enter the hidden massage");
            return;
        }

        setLoading(true);
        try {
            const formData = new FormData();
            formData.append("image", file);
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
            // try to extract filename from content-disposition
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
            console.error("Hide error:", err);
            setError(err instanceof Error ? err.message : String(err));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
            <div className="container mx-auto px-4 py-8">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold">Sembunyikan Rahasia Anda biar ga ketahuan pemerintah</h1>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Hide message in image</CardTitle>
                        <CardDescription>
                            Provide a short message (hidden massage) and an image. Only images are
                            allowed. The API will return a processed image you can download.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Hidden massage</label>
                                <Input
                                    type="text"
                                    placeholder="Enter hidden massage"
                                    value={message}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMessage(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Image file (only images)</label>
                                <Input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                />
                            </div>

                            {error && (
                                <div className="text-sm text-destructive">{error}</div>
                            )}

                            <div className="flex gap-4">
                                <Button type="submit" className="w-full" disabled={loading}>
                                    {loading ? "Processing..." : "Hide and Download"}
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setMessage("");
                                        setFile(null);
                                        setError("");
                                    }}
                                    className="w-44"
                                >
                                    Reset
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                <div className="h-6" />

                <Card>
                    <CardHeader>
                        <CardTitle>Extract message from image</CardTitle>
                        <CardDescription>
                            Upload an image that contains a hidden message. The server will
                            attempt to extract and display the hidden message.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleExtract} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Image file (only images)</label>
                                <Input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleExtractFileChange}
                                />
                            </div>

                            {error && (
                                <div className="text-sm text-destructive">{error}</div>
                            )}

                            <div className="flex gap-4">
                                <Button type="submit" className="w-full" disabled={extracting}>
                                    {extracting ? "Extracting..." : "Extract message"}
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setExtractFile(null);
                                        setExtractedMessage(null);
                                        setError("");
                                    }}
                                    className="w-44"
                                >
                                    Reset
                                </Button>
                            </div>

                            {extractedMessage !== null && (
                                <div className="mt-2">
                                    <label className="block text-sm font-medium mb-1">Extracted message</label>
                                    <div className="rounded-md border border-input bg-transparent p-3 text-sm">
                                        {extractedMessage === "" ? (
                                            <span className="text-muted-foreground">(no message found)</span>
                                        ) : (
                                            <div className="flex items-start justify-between gap-4">
                                                <pre className="whitespace-pre-wrap break-words">{extractedMessage}</pre>
                                                <div>
                                                    <Button
                                                        variant="ghost"
                                                        onClick={() => navigator.clipboard.writeText(extractedMessage)}
                                                    >
                                                        Copy
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
