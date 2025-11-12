"use client";

import { useState } from "react";
import { useWallet } from "@/hooks/useWallet";
import WalletAddressInput from "@/components/WalletAddressInput/page";
import {
    encryptForRecipient,
    sendEncryptedMessage,
    isValidAddress,
} from "@/lib/blockchainMessaging";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface SecretMessageComposerProps {
    onSent?: () => void;
}

export default function SecretMessageComposer({
    onSent,
}: SecretMessageComposerProps) {
    const { address, getSigner } = useWallet();
    const [recipient, setRecipient] = useState("");
    const [body, setBody] = useState("");
    const [status, setStatus] = useState<string | null>(null);
    const [isSending, setIsSending] = useState(false);

    async function handleSend() {
        if (!address) {
            setStatus("Please connect your wallet");
            return;
        }

        if (!recipient || !isValidAddress(recipient)) {
            setStatus("Please enter a valid recipient address");
            return;
        }

        if (!body.trim()) {
            setStatus("Message is empty");
            return;
        }

        setIsSending(true);
        setStatus("Encrypting...");

        try {
            // Encrypt message using AES-GCM with recipient's address
            setStatus("Encrypting message...");
            console.log(`[DEBUG] Encrypting message for recipient: ${recipient}`);
            const encrypted = await encryptForRecipient(recipient, body);
            console.log(`[DEBUG] Encryption complete, encrypted data length: ${encrypted.length}`);

            // Get signer and send to blockchain
            setStatus("Sending to blockchain...");
            const signer = await getSigner();
            const txHash = await sendEncryptedMessage(signer, recipient, encrypted);

            setStatus(`Sent! Transaction: ${txHash ? txHash.slice(0, 10) + "..." : "pending"}`);
            setBody("");
            setRecipient("");

            onSent?.();
        } catch (e) {
            console.error("Send error:", e);
            const errorMessage =
                e instanceof Error ? e.message : "Failed to send message";
            setStatus(`Error: ${errorMessage}`);
        } finally {
            setIsSending(false);
            setTimeout(() => setStatus(null), 8000); // Longer timeout for error messages
        }
    }

    return (
        <div
            className="p-4 border rounded"
            style={{
                borderColor: "hsl(var(--border))",
                backgroundColor: "hsl(var(--card))",
            }}
        >
            <div className="mb-2 text-sm text-[color:hsl(var(--muted-foreground))]">
                From: {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "Not connected"}
            </div>

            <div className="mb-3">
                <WalletAddressInput
                    onSelect={setRecipient}
                    value={recipient}
                />
            </div>

            <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Write your encrypted message..."
                className="w-full px-3 py-2 border rounded h-28"
                style={{
                    borderColor: "hsl(var(--input))",
                    backgroundColor: "hsl(var(--card))",
                    color: "hsl(var(--foreground))",
                }}
                disabled={isSending}
            />

            <div className="mt-3 flex justify-end gap-2 items-center">
                <div className="text-sm text-[color:hsl(var(--muted-foreground))]">
                    {status ?? ""}
                </div>
                <Button
                    onClick={handleSend}
                    disabled={isSending || !address || !recipient || !body.trim()}
                    style={{
                        backgroundColor: "hsl(var(--primary))",
                        color: "hsl(var(--primary-foreground))",
                    }}
                >
                    {isSending ? "Sending..." : "Send Encrypted"}
                </Button>
            </div>
        </div>
    );
}

