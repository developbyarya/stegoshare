"use client";

import { useState } from "react";
import { isValidAddress } from "@/lib/blockchainMessaging";

interface WalletAddressInputProps {
    onSelect: (address: string) => void;
    value?: string;
}

export default function WalletAddressInput({
    onSelect,
    value: controlledValue,
}: WalletAddressInputProps) {
    const [inputValue, setInputValue] = useState(controlledValue || "");
    const [error, setError] = useState<string | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value.trim();
        setInputValue(val);
        setError(null);

        if (val && !isValidAddress(val)) {
            setError("Invalid Ethereum address format");
            return;
        }

        if (val && isValidAddress(val)) {
            onSelect(val);
            setError(null);
        }
    };

    const formatAddress = (addr: string): string => {
        if (addr.length < 10) return addr;
        return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
    };

    return (
        <div className="relative">
            <input
                type="text"
                value={controlledValue !== undefined ? controlledValue : inputValue}
                onChange={handleChange}
                placeholder="Enter recipient address (0x...)"
                className="w-full px-3 py-2 border rounded"
                style={{
                    borderColor: error
                        ? "hsl(var(--destructive))"
                        : "hsl(var(--input))",
                    backgroundColor: "hsl(var(--card))",
                    color: "hsl(var(--foreground))",
                }}
            />
            {error && (
                <div
                    className="text-xs mt-1"
                    style={{ color: "hsl(var(--destructive))" }}
                >
                    {error}
                </div>
            )}
            {inputValue &&
                isValidAddress(inputValue) &&
                !error && (
                    <div
                        className="text-xs mt-1"
                        style={{ color: "hsl(var(--muted-foreground))" }}
                    >
                        {formatAddress(inputValue)}
                    </div>
                )}
        </div>
    );
}

