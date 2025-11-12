"use client";

import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";

declare global {
    interface Window {
        ethereum?: {
            request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
            on: (event: string, handler: (accounts: string[]) => void) => void;
            removeListener: (event: string, handler: (accounts: string[]) => void) => void;
        };
    }
}

// Sepolia testnet chain ID
const SEPOLIA_CHAIN_ID = "0xaa36a7"; // 11155111 in hex

export function useWallet() {
    const [address, setAddress] = useState<string | null>(null);
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isCorrectNetwork, setIsCorrectNetwork] = useState<boolean | null>(null);
    const [isSwitchingNetwork, setIsSwitchingNetwork] = useState(false);

    const checkNetwork = useCallback(async () => {
        if (!window.ethereum) return;

        try {
            const chainId = (await window.ethereum.request({
                method: "eth_chainId",
            })) as string;

            const isSepolia = chainId === SEPOLIA_CHAIN_ID;
            setIsCorrectNetwork(isSepolia);

            if (!isSepolia && address) {
                setError(
                    "Please switch to Sepolia testnet. Click 'Switch to Sepolia' to continue."
                );
            } else if (isSepolia) {
                setError(null);
            }
        } catch (err) {
            console.error("Error checking network:", err);
            setIsCorrectNetwork(false);
        }
    }, [address]);

    const handleAccountsChanged = useCallback(
        (accounts: string[]) => {
            if (accounts.length === 0) {
                setAddress(null);
                setIsCorrectNetwork(null);
            } else {
                setAddress(accounts[0]);
                checkNetwork();
            }
        },
        [checkNetwork]
    );

    const handleChainChanged = useCallback(() => {
        checkNetwork();
    }, [checkNetwork]);

    const checkConnection = useCallback(async () => {
        try {
            const accounts = (await window.ethereum?.request({
                method: "eth_accounts",
            })) as string[];
            if (accounts && accounts.length > 0) {
                setAddress(accounts[0]);
                await checkNetwork();
            }
        } catch (err) {
            console.error("Error checking wallet connection:", err);
        }
    }, [checkNetwork]);

    const setupListeners = useCallback(() => {
        if (window.ethereum) {
            window.ethereum.on("accountsChanged", handleAccountsChanged);
            window.ethereum.on("chainChanged", handleChainChanged);
        }
    }, [handleAccountsChanged, handleChainChanged]);

    // Check if wallet is already connected on mount
    useEffect(() => {
        if (typeof window !== "undefined" && window.ethereum) {
            checkConnection();
            checkNetwork();
            setupListeners();
        }

        return () => {
            if (window.ethereum) {
                window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
                window.ethereum.removeListener("chainChanged", handleChainChanged);
            }
        };
    }, [checkConnection, checkNetwork, setupListeners, handleAccountsChanged, handleChainChanged]);

    const switchToSepolia = async () => {
        if (!window.ethereum) {
            setError("MetaMask is not installed");
            return;
        }

        setIsSwitchingNetwork(true);
        setError(null);

        try {
            // Try to switch to Sepolia
            await window.ethereum.request({
                method: "wallet_switchEthereumChain",
                params: [{ chainId: SEPOLIA_CHAIN_ID }],
            });
            await checkNetwork();
        } catch (switchError: unknown) {
            // This error code indicates that the chain has not been added to MetaMask
            if (
                switchError &&
                typeof switchError === "object" &&
                "code" in switchError &&
                switchError.code === 4902
            ) {
                try {
                    // Add Sepolia network to MetaMask
                    await window.ethereum.request({
                        method: "wallet_addEthereumChain",
                        params: [
                            {
                                chainId: SEPOLIA_CHAIN_ID,
                                chainName: "Sepolia",
                                nativeCurrency: {
                                    name: "ETH",
                                    symbol: "ETH",
                                    decimals: 18,
                                },
                                rpcUrls: ["https://sepolia.infura.io/v3/"],
                                blockExplorerUrls: ["https://sepolia.etherscan.io"],
                            },
                        ],
                    });
                    await checkNetwork();
                } catch (addError) {
                    console.error("Error adding Sepolia network:", addError);
                    setError(
                        "Failed to add Sepolia network. Please add it manually in MetaMask."
                    );
                }
            } else {
                console.error("Error switching network:", switchError);
                setError("Failed to switch to Sepolia network");
            }
        } finally {
            setIsSwitchingNetwork(false);
        }
    };


    const connect = async () => {
        if (!window.ethereum) {
            setError("MetaMask is not installed. Please install MetaMask to continue.");
            return;
        }

        setIsConnecting(true);
        setError(null);

        try {
            // First check network
            await checkNetwork();

            const accounts = (await window.ethereum.request({
                method: "eth_requestAccounts",
            })) as string[];

            if (accounts && accounts.length > 0) {
                setAddress(accounts[0]);
                // Check network again after connection
                await checkNetwork();
            }
        } catch (err: unknown) {
            console.error("Error connecting wallet:", err);
            if (err instanceof Error) {
                if (err.message.includes("rejected")) {
                    setError("Connection rejected. Please approve the connection request.");
                } else {
                    setError(err.message);
                }
            } else {
                setError("Failed to connect wallet");
            }
        } finally {
            setIsConnecting(false);
        }
    };

    const disconnect = () => {
        setAddress(null);
        setError(null);
        setIsCorrectNetwork(null);
    };

    const switchAccount = async () => {
        if (!window.ethereum) {
            setError("MetaMask is not installed");
            return;
        }

        try {
            // Request account access which will show account selection if multiple accounts
            const accounts = (await window.ethereum.request({
                method: "wallet_requestPermissions",
                params: [{ eth_accounts: {} }],
            })) as { accounts: string[] }[];

            if (accounts && accounts.length > 0 && accounts[0].accounts) {
                const newAddress = accounts[0].accounts[0];
                if (newAddress !== address) {
                    setAddress(newAddress);
                    await checkNetwork();
                }
            }
        } catch (err: unknown) {
            console.error("Error switching account:", err);
            if (err instanceof Error) {
                if (err.message.includes("rejected")) {
                    // User rejected, that's fine
                    return;
                }
                setError(err.message);
            } else {
                setError("Failed to switch account");
            }
        }
    };

    const getSigner = async (): Promise<ethers.Signer> => {
        if (!window.ethereum) {
            throw new Error("MetaMask is not installed");
        }
        if (!address) {
            throw new Error("Wallet not connected");
        }

        // Verify we're on Sepolia before getting signer
        await checkNetwork();
        if (!isCorrectNetwork) {
            throw new Error("Please switch to Sepolia testnet to continue");
        }

        const provider = new ethers.BrowserProvider(window.ethereum);
        return provider.getSigner();
    };

    return {
        address,
        isConnecting,
        error,
        isCorrectNetwork,
        isSwitchingNetwork,
        connect,
        disconnect,
        switchAccount,
        getSigner,
        switchToSepolia,
        checkNetwork,
    };
}

