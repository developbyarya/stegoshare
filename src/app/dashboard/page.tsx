"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface FileData {
    id: string;
    filename: string;
    url: string;
    uploadedAt: string;
    userId: string;
    uploader: string;
}

export default function DashboardPage() {
    const router = useRouter();
    const [files, setFiles] = useState<FileData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        fetchFiles();
    }, []);

    const fetchFiles = async () => {
        try {
            const response = await fetch("/api/files");
            if (!response.ok) {
                if (response.status === 401) {
                    router.push("/login");
                    return;
                }
                throw new Error("Failed to fetch files");
            }
            const data = await response.json();
            setFiles(data.files || []);
        } catch (err) {
            setError("Failed to load files");
            console.error("Error fetching files:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async (fileId: string, filename: string) => {
        try {
            const response = await fetch(`/api/download/${fileId}`);
            if (!response.ok) {
                throw new Error("Download failed");
            }
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (err) {
            console.error("Download error:", err);
            alert("Failed to download file");
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
            <div className="container mx-auto px-4 py-8">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold">Dashboard</h1>
                </div>

                {loading ? (
                    <div className="text-center py-12">Loading files...</div>
                ) : error ? (
                    <Card>
                        <CardContent className="pt-6">
                            <p className="text-destructive">{error}</p>
                        </CardContent>
                    </Card>
                ) : files.length === 0 ? (
                    <Card>
                        <CardContent className="pt-6">
                            <p className="text-center text-muted-foreground">
                                No files uploaded yet.
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {files.map((file) => (
                            <Card key={file.id}>
                                <CardHeader>
                                    <CardTitle className="truncate">
                                        {file.filename}
                                    </CardTitle>
                                    <CardDescription>
                                        Uploaded by {file.uploader}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        <p className="text-sm text-muted-foreground">
                                            {new Date(
                                                file.uploadedAt
                                            ).toLocaleDateString()}
                                        </p>
                                        <Button
                                            onClick={() =>
                                                handleDownload(
                                                    file.id,
                                                    file.filename
                                                )
                                            }
                                            className="w-full"
                                            variant="outline"
                                        >
                                            Download
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

