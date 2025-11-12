"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/app/contexts/UserContext/UserContext";
import MessageComposer from "@/components/MessageComposer/page";
import { superDecrypt } from "@/lib/encryption/superEncryption";
import { Button } from "@/components/ui/button";

export default function InnerMessagesPage() {
  const { user } = useUser();
  const [inbox, setInbox] = useState<any[]>([]);
  const [sent, setSent] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const userName = user?.username;
  //mengetes tampilkan username
  console.log("nama user : ", userName);
  useEffect(() => {
    if (user) {
      loadInbox();
      loadSent();
    }
  }, [user]);

  async function loadInbox() {
    if (!user) return;
    try {
      const res = await fetch(`/api/messages?userId=${encodeURIComponent(user.userId)}`);
      const data = await res.json();
      const messages = Array.isArray(data) ? data : [];

      // Automatically decrypt messages if private key is available
      const privateKeyStr = localStorage.getItem("rsa_private_jwk");
      if (privateKeyStr) {
        try {
          const privateJwk = JSON.parse(privateKeyStr);

          // Validate private key format
          if (!privateJwk || !privateJwk.kty || privateJwk.kty !== "RSA") {
            console.error("Invalid private key format");
            setInbox(messages);
            setStatus("Invalid private key format. Please register again.");
            return;
          }

          const decryptedMessages = await Promise.all(
            messages.map(async (msg: any) => {
              try {
                // Validate message has required fields
                if (!msg.ciphertext || !msg.encryptedKey) {
                  console.error("Message missing required fields:", msg);
                  return { ...msg, plain: null, decryptError: true };
                }

                const plain = await superDecrypt(
                  { ciphertext: msg.ciphertext, encryptedKey: msg.encryptedKey },
                  privateJwk
                );
                return { ...msg, plain };
              } catch (e: any) {
                console.error("Failed to decrypt message:", e, "Message ID:", msg.id);
                // Log more details for debugging
                if (e?.message) {
                  console.error("Error message:", e.message);
                }
                return { ...msg, plain: null, decryptError: true };
              }
            })
          );
          setInbox(decryptedMessages);
        } catch (e) {
          console.error("Failed to parse private key:", e);
          setInbox(messages);
          setStatus("Invalid private key format. Please register again.");
        }
      } else {
        setInbox(messages);
      }
    } catch (e) {
      console.error(e);
      setStatus("Failed to load inbox");
    }
  }

  async function loadSent() {
    if (!user) return;
    try {
      const res = await fetch(`/api/messages?sentBy=${encodeURIComponent(user.userId)}`);
      const data = await res.json();
      setSent(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setStatus("Failed to load sent");
    }
  }

  async function openMessage(msg: any) {
    setSelected(msg);

    // If message is already decrypted, just show it
    if (msg.plain) {
      return;
    }

    // Try to decrypt if not already decrypted
    const privateKeyStr = localStorage.getItem("rsa_private_jwk");
    if (!privateKeyStr) {
      setStatus("Private key not found. Please register or import your private key.");
      return;
    }

    try {
      const privateJwk = JSON.parse(privateKeyStr);

      // Validate private key format
      if (!privateJwk || !privateJwk.kty || privateJwk.kty !== "RSA") {
        setStatus("Invalid private key format. Please register again to get a new key pair.");
        return;
      }

      const plain = await superDecrypt(
        { ciphertext: msg.ciphertext, encryptedKey: msg.encryptedKey },
        privateJwk
      );
      setSelected({ ...msg, plain });
      setStatus(null);
    } catch (e: any) {
      console.error("Decryption error:", e);
      const errorMessage = e?.message || String(e);

      // Provide user-friendly error messages
      if (errorMessage.includes("RSA decryption failed") || errorMessage.includes("different public key")) {
        setStatus("Your private key doesn't match your public key. Please make sure you're logged in with the correct account and that you registered after automatic key generation was added.");
      } else if (errorMessage.includes("decryption") || errorMessage.includes("decrypt")) {
        setStatus("Decryption failed. The message may be encrypted with a different key or corrupted.");
      } else if (errorMessage.includes("key") || errorMessage.includes("Key")) {
        setStatus("Key error. Please check if your private key is valid. You may need to register again.");
      } else {
        setStatus(`Decryption failed: ${errorMessage}. The message may be corrupted or encrypted with a different key.`);
      }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800" >
      <div className="container mx-auto px-4 py-8" style={{ maxWidth: 1200 }}>
        <div className="bg-[transparent] rounded shadow-sm overflow-hidden border" style={{ borderColor: "hsl(var(--border))" }}>
          <div className="flex">
            <aside style={{ width: 300, borderRight: "1px solid", borderColor: "hsl(var(--border))" }} className="p-4">
              <div className="mb-3">
                <div className="text-lg font-semibold">Messages</div>
                <div className="text-xs text-[color:hsl(var(--muted-foreground))]">User: {userName ?? "Dummy"}</div>
              </div>

              <div className="mb-4">
                <Button onClick={loadInbox} className="w-full text-left px-3 py-2 rounded">Inbox</Button>
                <Button onClick={loadSent} className="w-full text-left px-3 py-2 rounded mt-2">Sent</Button>
              </div>

              <div className="mt-4">
                <MessageComposer onSent={() => loadSent()} />
              </div>
            </aside>

            <div className="flex-1 p-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-1">
                  <div className="text-sm text-[color:hsl(var(--muted-foreground))]">List</div>
                  <div className="mt-2">
                    {(inbox).length === 0 ? (
                      <div className="text-sm">No messages</div>
                    ) : (
                      inbox.map((m) => (
                        <div
                          key={m.id}
                          className={`p-3 border-b cursor-pointer hover:bg-[color:hsl(var(--muted))] ${selected?.id === m.id ? "bg-[color:hsl(var(--muted))]" : ""
                            }`}
                          onClick={() => openMessage(m)}
                        >
                          <div className="font-medium">{m.sender?.username ?? m.senderId}</div>
                          <div className="text-xs text-[color:hsl(var(--muted-foreground))]">
                            {m.plain
                              ? m.plain.slice(0, 48) + (m.plain.length > 48 ? "..." : "")
                              : m.ciphertext.slice(0, 48) + "..."}
                          </div>
                          {m.decryptError && (
                            <div className="text-xs text-red-500 mt-1">Decryption failed</div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="col-span-2">
                  <div className="text-sm text-[color:hsl(var(--muted-foreground))]">Message</div>
                  <div className="mt-2 p-4 rounded" style={{ backgroundColor: "hsl(var(--card))", border: "1px solid", borderColor: "hsl(var(--border))" }}>
                    {selected ? (
                      selected.plain ? (
                        <div style={{ maxWidth: 800 }}>
                          <div className="mb-2 text-xs text-[color:hsl(var(--muted-foreground))]">
                            From: {selected.sender?.username ?? selected.senderId}
                            {selected.createdAt && (
                              <> • {new Date(selected.createdAt).toLocaleString()}</>
                            )}
                          </div>
                          <div className="p-4 rounded" style={{ backgroundColor: "hsl(var(--muted))", color: "hsl(var(--foreground))" }}>
                            <pre className="whitespace-pre-wrap font-sans">{selected.plain}</pre>
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-[color:hsl(var(--muted-foreground))]">
                          <div className="mb-2">(encrypted)</div>
                          <div className="text-xs">
                            {localStorage.getItem("rsa_private_jwk")
                              ? "Decrypting..."
                              : "Private key not found. Please register or import your private key to decrypt messages."}
                          </div>
                        </div>
                      )
                    ) : (
                      <div className="text-sm text-[color:hsl(var(--muted-foreground))]">Select a message to view</div>
                    )}
                    {status && (
                      <div className="mt-4 p-3 rounded text-sm" style={{ backgroundColor: "hsl(var(--destructive))", color: "hsl(var(--destructive-foreground))" }}>
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


