"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormField, FormLabel, FormMessage } from "@/components/ui/form";

export default function RegisterPage() {
    const router = useRouter();

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        if (password.length < 6) {
            setError("Password must be at least 6 characters");
            return;
        }

        setLoading(true);

        try {
            const response = await fetch("/api/auth/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || "Registration failed");
                setLoading(false);
                return;
            }

            // Store private key in localStorage for message decryption
            if (data.privateKey) {
                // Ensure privateKey is stored correctly (it should already be an object from the API)
                const privateKeyToStore = typeof data.privateKey === 'string'
                    ? JSON.parse(data.privateKey)
                    : data.privateKey;
                localStorage.setItem("rsa_private_jwk", JSON.stringify(privateKeyToStore));
                console.log("Private key stored successfully");
            } else {
                console.warn("No private key received from registration");
            }

            // Redirect to login after successful registration
            router.push("/login?registered=true");
        } catch (err) {
            setError("An error occurred. Please try again.");
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold">Register</CardTitle>
                    <CardDescription>
                        Create a new account to get started
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form onSubmit={handleSubmit}>
                        <FormField>
                            <FormLabel htmlFor="username">Username</FormLabel>
                            <Input
                                id="username"
                                type="text"
                                placeholder="Choose a username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                                disabled={loading}
                            />
                        </FormField>
                        <FormField>
                            <FormLabel htmlFor="password">Password</FormLabel>
                            <Input
                                id="password"
                                type="password"
                                placeholder="Create a password (min 6 characters)"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                disabled={loading}
                            />
                        </FormField>
                        <FormField>
                            <FormLabel htmlFor="confirmPassword">
                                Confirm Password
                            </FormLabel>
                            <Input
                                id="confirmPassword"
                                type="password"
                                placeholder="Confirm your password"
                                value={confirmPassword}
                                onChange={(e) =>
                                    setConfirmPassword(e.target.value)
                                }
                                required
                                disabled={loading}
                            />
                        </FormField>
                        {error && (
                            <FormMessage className="mt-2">{error}</FormMessage>
                        )}
                        <Button
                            type="submit"
                            className="w-full mt-4"
                            disabled={loading}
                        >
                            {loading ? "Registering..." : "Register"}
                        </Button>
                    </Form>
                </CardContent>
                <CardFooter className="flex flex-col space-y-4">
                    <div className="text-sm text-center text-muted-foreground">
                        Already have an account?{" "}
                        <Link
                            href="/login"
                            className="text-primary hover:underline"
                        >
                            Login here
                        </Link>
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
}

