"use client";

import { useState, useRef, DragEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function UploadPage() {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

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
            handleFileUpload(files[0]);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            handleFileUpload(files[0]);
        }
    };

    const handleFileUpload = async (file: File) => {
        setError("");
        setSuccess("");
        setUploading(true);
        setProgress(0);

        try {
            const formData = new FormData();
            formData.append("file", file);

            const xhr = new XMLHttpRequest();

            xhr.upload.addEventListener("progress", (e) => {
                if (e.lengthComputable) {
                    const percentComplete = (e.loaded / e.total) * 100;
                    setProgress(percentComplete);
                }
            });

            xhr.addEventListener("load", () => {
                if (xhr.status === 200) {
                    const response = JSON.parse(xhr.responseText);
                    setSuccess("File uploaded successfully!");

                    // If secret.key was uploaded, redirect to secret page
                    if (response.redirect) {
                        setTimeout(() => {
                            router.push(response.redirect);
                        }, 1500);
                    } else {
                        setTimeout(() => {
                            router.push("/dashboard");
                        }, 1500);
                    }
                } else {
                    const error = JSON.parse(xhr.responseText);
                    setError(error.error || "Upload failed");
                    setUploading(false);
                }
            });

            xhr.addEventListener("error", () => {
                setError("Upload failed. Please try again.");
                setUploading(false);
            });

            xhr.open("POST", "/api/upload");
            xhr.send(formData);
        } catch (err) {
            setError("An error occurred. Please try again.");
            setUploading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
            <div className="container mx-auto px-4 py-8">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold">Upload File</h1>
                </div>

                <Card className="max-w-2xl mx-auto">
                    <CardHeader>
                        <CardTitle>Upload a File</CardTitle>
                        <CardDescription>
                            Drag and drop your file here, or click to select
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div
                            className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                                isDragging
                                    ? "border-primary bg-primary/5"
                                    : "border-gray-300 dark:border-gray-700"
                            } ${uploading ? "pointer-events-none opacity-50" : "cursor-pointer"}`}
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
                                onChange={handleFileSelect}
                                disabled={uploading}
                            />

                            {uploading ? (
                                <div className="space-y-4">
                                    <div className="text-lg font-medium">
                                        Uploading... {Math.round(progress)}%
                                    </div>
                                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                        <div
                                            className="bg-primary h-2 rounded-full transition-all"
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="text-4xl">📁</div>
                                    <div className="text-lg font-medium">
                                        {isDragging
                                            ? "Drop your file here"
                                            : "Select a file or drag it here"}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                        Files are encrypted upon upload
                                    </div>
                                </div>
                            )}
                        </div>

                        {error && (
                            <div className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive">
                                {error}
                            </div>
                        )}

                        {success && (
                            <div className="mt-4 p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-green-600 dark:text-green-400">
                                {success}
                            </div>
                        )}

                        <div className="mt-6 text-sm text-muted-foreground">
                            <p className="font-medium mb-2">Note:</p>
                            <ul className="list-disc list-inside space-y-1">
                                <li>
                                    All files are encrypted before being stored
                                </li>
                                <li>
                                    Uploading a file named "secret.key" with the
                                    correct hash will grant access to secret
                                    pages
                                </li>
                            </ul>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

