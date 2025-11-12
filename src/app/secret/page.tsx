"use client";

import { useEffect, useState, useRef } from "react";
import { useWallet } from "@/hooks/useWallet";
import SecretMessageComposer from "@/components/SecretMessageComposer/page";
import {
    getInboxMessages,
    getSentMessages,
    decryptMessage,
    type BlockchainMessage,
} from "@/lib/blockchainMessaging";
import { Button } from "@/components/ui/button";

type ViewMode = "inbox" | "sent";

export default function SecretPage() {
    // ignore biome error
    // @ts-ignore
    const {
        address,
        connect,
        disconnect,
        switchAccount,
        getSigner,
        error: walletError,
        isCorrectNetwork,
        isSwitchingNetwork,
        switchToSepolia,
    } = useWallet();
    const [inbox, setInbox] = useState<BlockchainMessage[]>([]);
    const [sent, setSent] = useState<BlockchainMessage[]>([]);
    const [selected, setSelected] = useState<BlockchainMessage | null>(null);
    const [status, setStatus] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<ViewMode>("inbox");
    const [isLoading, setIsLoading] = useState(false);
    const didFetch = useRef(false);

    const currentMessages = viewMode === "inbox" ? inbox : sent;

    useEffect(() => {
        if (!address) {
            setInbox([]);
            setSent([]);
            setSelected(null);
            didFetch.current = false;
            return;
        }
        if (didFetch.current) return;
        didFetch.current = true;
        loadMessages();
    }, [address]);

    async function loadMessages() {
        if (!address) return;

        setIsLoading(true);
        setStatus("Loading messages...");

        try {
            const signer = await getSigner();
            const [inboxMsgs, sentMsgs] = await Promise.all([
                getInboxMessages(address, signer),
                getSentMessages(address, signer),
            ]);

            setInbox(inboxMsgs);
            setSent(sentMsgs);
            setStatus(null);
        } catch (e) {
            console.error("Error loading messages:", e);
            setStatus(
                `Failed to load messages: ${e instanceof Error ? e.message : "Unknown error"}`
            );
        } finally {
            setIsLoading(false);
        }
    }

    async function openMessage(msg: BlockchainMessage) {
        setSelected(msg);

        // If message is already decrypted, just show it
        if (msg.plaintext) {
            return;
        }

        if (!address) {
            setStatus("Wallet not connected");
            return;
        }

        // Verify the user is the receiver (for inbox) or sender (for sent)
        // Only receivers can decrypt messages sent to them
        if (viewMode === "inbox") {
            if (msg.receiver.toLowerCase() !== address.toLowerCase()) {
                setStatus("You can only decrypt messages sent to your address.");
                return;
            }
        }

        setStatus("Decrypting message...");

        try {
            // Decrypt using the recipient's address (the message was encrypted for the recipient)
            // Both inbox and sent messages use the recipient's address since that's who it was encrypted for
            // The sender can also decrypt because they know the recipient's address
            const plaintext = await decryptMessage(msg.ciphertext, msg.receiver);
            setSelected({ ...msg, plaintext });
            setStatus(null);

            // Update the message in the list
            const updateMessage = (msgs: BlockchainMessage[]) =>
                msgs.map((m) =>
                    m.id === msg.id ? { ...m, plaintext } : m
                );

            if (viewMode === "inbox") {
                setInbox(updateMessage(inbox));
            } else {
                setSent(updateMessage(sent));
            }
        } catch (e: unknown) {
            console.error("Decryption error:", e);
            const errorMessage =
                e instanceof Error ? e.message : "Decryption failed";

            // Log full error for debugging
            if (e && typeof e === "object") {
                console.error("Full error object:", JSON.stringify(e, null, 2));
            }

            // Provide more helpful error messages
            // Only show "denied" if it's explicitly about denial, not other errors
            if (
                (errorMessage.includes("rejected") || errorMessage.includes("denied")) &&
                (errorMessage.includes("request") || errorMessage.includes("Decrypt"))
            ) {
                setStatus(
                    `⚠️ ${errorMessage}`
                );
            } else {
                setStatus(`Decryption failed: ${errorMessage}`);
            }

            // Mark message with decrypt error
            const updateMessage = (msgs: BlockchainMessage[]) =>
                msgs.map((m) =>
                    m.id === msg.id ? { ...m, decryptError: true } : m
                );

            if (viewMode === "inbox") {
                setInbox(updateMessage(inbox));
            } else {
                setSent(updateMessage(sent));
            }
        }
    }

    const formatAddress = (addr: string): string => {
        if (!addr) return "Unknown";
        return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
    };

    if (!address) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
                <div className="container mx-auto px-4 py-8" style={{ maxWidth: 1200 }}>
                    <div
                        className="bg-[transparent] rounded shadow-sm overflow-hidden border p-8"
                        style={{ borderColor: "hsl(var(--border))" }}
                    >
                        <div className="text-center">
                            <h2 className="text-2xl font-bold mb-4">Connect Your Wallet</h2>
                            <p className="text-[color:hsl(var(--muted-foreground))] mb-6">
                                Please connect your MetaMask wallet to access the secret messaging
                                system. Make sure you're on Sepolia testnet.
                            </p>
                            <Button
                                onClick={connect}
                                disabled={isSwitchingNetwork}
                                style={{
                                    backgroundColor: "hsl(var(--primary))",
                                    color: "hsl(var(--primary-foreground))",
                                }}
                            >
                                Connect MetaMask
                            </Button>
                            {walletError && (
                                <div
                                    className="mt-4 p-3 rounded text-sm"
                                    style={{
                                        backgroundColor: "hsl(var(--destructive))",
                                        color: "hsl(var(--destructive-foreground))",
                                    }}
                                >
                                    {walletError}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (isCorrectNetwork === false) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
                <div className="container mx-auto px-4 py-8" style={{ maxWidth: 1200 }}>
                    <div
                        className="bg-[transparent] rounded shadow-sm overflow-hidden border p-8"
                        style={{ borderColor: "hsl(var(--border))" }}
                    >
                        <div className="text-center">
                            <h2 className="text-2xl font-bold mb-4">Wrong Network</h2>
                            <p className="text-[color:hsl(var(--muted-foreground))] mb-6">
                                Please switch to Sepolia testnet to use the secret messaging
                                system.
                            </p>
                            <Button
                                onClick={switchToSepolia}
                                disabled={isSwitchingNetwork}
                                style={{
                                    backgroundColor: "hsl(var(--primary))",
                                    color: "hsl(var(--primary-foreground))",
                                }}
                            >
                                {isSwitchingNetwork
                                    ? "Switching Network..."
                                    : "Switch to Sepolia"}
                            </Button>
                            {walletError && (
                                <div
                                    className="mt-4 p-3 rounded text-sm"
                                    style={{
                                        backgroundColor: "hsl(var(--destructive))",
                                        color: "hsl(var(--destructive-foreground))",
                                    }}
                                >
                                    {walletError}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
            <div className="container mx-auto px-4 py-8" style={{ maxWidth: 1200 }}>
                <div
                    className="bg-[transparent] rounded shadow-sm overflow-hidden border"
                    style={{ borderColor: "hsl(var(--border))" }}
                >
                    <div className="flex">
                        <aside
                            style={{
                                width: 300,
                                borderRight: "1px solid",
                                borderColor: "hsl(var(--border))",
                            }}
                            className="p-4"
                        >
                            <div className="mb-3">
                                <div className="text-lg font-semibold">Secret Messages</div>
                                <div className="text-xs text-[color:hsl(var(--muted-foreground))] mb-2">
                                    Wallet: {formatAddress(address)}
                                </div>
                                <div className="flex gap-2 mt-2">
                                    <Button
                                        onClick={async () => {
                                            await switchAccount();
                                            // Reset fetch flag so useEffect will reload messages
                                            didFetch.current = false;
                                        }}
                                        variant="outline"
                                        className="text-xs px-2 py-1"
                                        style={{
                                            fontSize: "0.75rem",
                                            padding: "0.25rem 0.5rem",
                                        }}
                                    >
                                        Switch Account
                                    </Button>
                                    <Button
                                        onClick={() => {
                                            disconnect();
                                            setInbox([]);
                                            setSent([]);
                                            setSelected(null);
                                            didFetch.current = false;
                                        }}
                                        variant="outline"
                                        className="text-xs px-2 py-1"
                                        style={{
                                            fontSize: "0.75rem",
                                            padding: "0.25rem 0.5rem",
                                        }}
                                    >
                                        Disconnect
                                    </Button>
                                </div>
                            </div>

                            <div className="mb-4">
                                <Button
                                    onClick={() => {
                                        setViewMode("inbox");
                                        setSelected(null);
                                    }}
                                    className="w-full text-left px-3 py-2 rounded"
                                >
                                    Inbox
                                </Button>
                                <Button
                                    onClick={() => {
                                        setViewMode("sent");
                                        setSelected(null);
                                    }}
                                    className="w-full text-left px-3 py-2 rounded mt-2"
                                >
                                    Sent
                                </Button>
                                <Button
                                    onClick={loadMessages}
                                    className="w-full text-left px-3 py-2 rounded mt-2"
                                    disabled={isLoading}
                                >
                                    {isLoading ? "Loading..." : "Refresh"}
                                </Button>
                            </div>

                            <div className="mt-4">
                                <SecretMessageComposer
                                    onSent={() => {
                                        didFetch.current = false;
                                        loadMessages();
                                    }}
                                />
                            </div>
                        </aside>

                        <div className="flex-1 p-6">
                            <div className="grid grid-cols-3 gap-4">
                                <div className="col-span-1">
                                    <div className="text-sm text-[color:hsl(var(--muted-foreground))]">
                                        List ({viewMode === "inbox" ? "Inbox" : "Sent"})
                                    </div>
                                    <div className="mt-2">
                                        {isLoading ? (
                                            <div className="text-sm">Loading...</div>
                                        ) : currentMessages.length === 0 ? (
                                            <div className="text-sm">No messages</div>
                                        ) : (
                                            currentMessages.map((m) => (
                                                <div
                                                    key={m.id}
                                                    className={`p-3 border-b cursor-pointer hover:bg-[color:hsl(var(--muted))] ${selected?.id === m.id
                                                        ? "bg-[color:hsl(var(--muted))]"
                                                        : ""
                                                        }`}
                                                    onClick={() => openMessage(m)}
                                                >
                                                    <div className="font-medium">
                                                        {viewMode === "inbox"
                                                            ? formatAddress(m.sender)
                                                            : formatAddress(m.receiver)}
                                                    </div>
                                                    <div className="text-xs text-[color:hsl(var(--muted-foreground))]">
                                                        {m.plaintext
                                                            ? m.plaintext.slice(0, 48) +
                                                            (m.plaintext.length > 48
                                                                ? "..."
                                                                : "")
                                                            : m.ciphertext.slice(0, 48) +
                                                            "..."}
                                                    </div>
                                                    {m.decryptError && (
                                                        <div className="text-xs text-red-500 mt-1">
                                                            Decryption failed
                                                        </div>
                                                    )}
                                                    {m.timestamp && (
                                                        <div className="text-xs text-[color:hsl(var(--muted-foreground))] mt-1">
                                                            {new Date(
                                                                m.timestamp
                                                            ).toLocaleString()}
                                                        </div>
                                                    )}
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>

                                <div className="col-span-2">
                                    <div className="text-sm text-[color:hsl(var(--muted-foreground))]">
                                        Message
                                    </div>
                                    <div
                                        className="mt-2 p-4 rounded"
                                        style={{
                                            backgroundColor: "hsl(var(--card))",
                                            border: "1px solid",
                                            borderColor: "hsl(var(--border))",
                                        }}
                                    >
                                        {selected ? (
                                            selected.plaintext ? (
                                                <div style={{ maxWidth: 800 }}>
                                                    <div className="mb-2 text-xs text-[color:hsl(var(--muted-foreground))]">
                                                        {viewMode === "inbox" ? "From" : "To"}:{" "}
                                                        {viewMode === "inbox"
                                                            ? formatAddress(selected.sender)
                                                            : formatAddress(selected.receiver)}
                                                        {selected.timestamp && (
                                                            <>
                                                                {" • "}
                                                                {new Date(
                                                                    selected.timestamp
                                                                ).toLocaleString()}
                                                            </>
                                                        )}
                                                    </div>
                                                    <div
                                                        className="p-4 rounded"
                                                        style={{
                                                            backgroundColor:
                                                                "hsl(var(--muted))",
                                                            color: "hsl(var(--foreground))",
                                                        }}
                                                    >
                                                        <pre className="whitespace-pre-wrap font-sans">
                                                            {selected.plaintext}
                                                        </pre>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="text-sm text-[color:hsl(var(--muted-foreground))]">
                                                    <div className="mb-2">(encrypted)</div>
                                                    <div className="text-xs">
                                                        {status || "Click to decrypt..."}
                                                    </div>
                                                </div>
                                            )
                                        ) : (
                                            <div className="text-sm text-[color:hsl(var(--muted-foreground))]">
                                                Select a message to view
                                            </div>
                                        )}
                                        {status && !selected?.plaintext && (
                                            <div
                                                className="mt-4 p-3 rounded text-sm"
                                                style={{
                                                    backgroundColor:
                                                        "hsl(var(--destructive))",
                                                    color: "hsl(var(--destructive-foreground))",
                                                }}
                                            >
                                                {status}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
