"use client";

import React, { useEffect, useMemo, useState } from "react";
import { generateRSAKeyPair, exportPublicKeyToPem, exportPrivateKeyToJwk } from "@/lib/encryption/modern/rsaEncrypt";
import { superEncrypt, superDecrypt } from "@/lib/encryption/superEncryption";

/**
 * Messages Page (Minimal Gmail clone + autosuggest + E2EE hooks)
 *
 * Paste to: app/messages/page.tsx
 *
 * Expects backend endpoints:
 *  - GET  /api/messages?userId=<id>            -> inbox (recipient)
 *  - GET  /api/messages?sentBy=<id>            -> sent items
 *  - POST /api/messages                        -> { senderId, recipientId, ciphertext, encryptedKey }
 *  - GET  /api/users?search=<q>                -> [{ id, username }]
 *  - GET  /api/users/:id/publicKey             -> { publicKey }
 *  - POST /api/users/:id/publicKey             -> { publicKey }
 *
 * Note: keep private key storage secure (this example uses localStorage for simplicity).
 */

// small debounce helper
function debounce<T extends (...args: any[]) => void>(fn: T, wait = 300) {
  let t: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (t) clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}

export default function MessagesPage() {
  // identity + local private key
  const [userId, setUserId] = useState<string>(() => typeof window !== "undefined" ? localStorage.getItem("userId") ?? "" : "");
  const [privateJwk, setPrivateJwk] = useState<JsonWebKey | null>(() => {
    if (typeof window === "undefined") return null;
    const s = localStorage.getItem("rsa_private_jwk");
    return s ? JSON.parse(s) : null;
  });

  // lists
  const [inbox, setInbox] = useState<any[]>([]);
  const [sent, setSent] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"inbox" | "sent">("inbox");
  const [selected, setSelected] = useState<any | null>(null);

  // compose UI
  const [composeOpen, setComposeOpen] = useState(false);
  const [toQuery, setToQuery] = useState("");
  const [toSuggestions, setToSuggestions] = useState<{ id: string; username?: string }[]>([]);
  const [chosenRecipient, setChosenRecipient] = useState<{ id: string; username?: string } | null>(null);
  const [messageBody, setMessageBody] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  // debounced search
  const searchUsers = useMemo(() => debounce(async (q: string) => {
    if (!q || q.trim().length < 1) {
      setToSuggestions([]);
      return;
    }
    try {
      const res = await fetch(`/api/users?search=${encodeURIComponent(q)}`);
      if (!res.ok) throw new Error("user search failed");
      const data = await res.json();
      setToSuggestions(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setToSuggestions([]);
    }
  }, 300), []);

  useEffect(() => {
    // persist userId
    if (typeof window !== "undefined") {
      localStorage.setItem("userId", userId || "");
    }
  }, [userId]);

  useEffect(() => {
    // trigger search when typing
    searchUsers(toQuery);
  }, [toQuery, searchUsers]);

  // load inbox/sent
  async function loadInbox() {
    if (!userId) return setStatus("Set your userId first");
    try {
      const res = await fetch(`/api/messages?userId=${encodeURIComponent(userId)}`);
      if (!res.ok) throw new Error("failed to fetch inbox");
      const data = await res.json();
      setInbox(Array.isArray(data) ? data : []);
      setActiveTab("inbox");
      setSelected(null);
    } catch (e) {
      console.error(e);
      setStatus("Load inbox error");
    } finally {
      setTimeout(() => setStatus(null), 1600);
    }
  }
  async function loadSent() {
    if (!userId) return setStatus("Set your userId first");
    try {
      const res = await fetch(`/api/messages?sentBy=${encodeURIComponent(userId)}`);
      if (!res.ok) throw new Error("failed to fetch sent");
      const data = await res.json();
      setSent(Array.isArray(data) ? data : []);
      setActiveTab("sent");
      setSelected(null);
    } catch (e) {
      console.error(e);
      setStatus("Load sent error");
    } finally {
      setTimeout(() => setStatus(null), 1600);
    }
  }

  // generate keypair (client) and upload public PEM to server
  async function handleGenerateKeys() {
    if (!userId) return setStatus("Set your userId first");
    try {
      const kp = await generateRSAKeyPair();
      const publicPem = await exportPublicKeyToPem(kp.publicKey);
      const privateJwkLocal = await exportPrivateKeyToJwk(kp.privateKey);
      localStorage.setItem("rsa_private_jwk", JSON.stringify(privateJwkLocal));
      setPrivateJwk(privateJwkLocal);
      await fetch(`/api/users/${encodeURIComponent(userId)}/publicKey`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publicKey: publicPem }),
      });
      setStatus("Keys generated & public key uploaded");
    } catch (e) {
      console.error(e);
      setStatus("Key generation/upload failed");
    } finally {
      setTimeout(() => setStatus(null), 2000);
    }
  }

  // send encrypted message using superEncrypt(plain, recipientPublicPem)
  async function handleSend() {
    if (!userId) return setStatus("Set your userId first");
    if (!chosenRecipient) return setStatus("Choose recipient");
    if (!messageBody.trim()) return setStatus("Message empty");
    setStatus("Encrypting & sending...");
    try {
      // get recipient public key
      const r = await fetch(`/api/users/${encodeURIComponent(chosenRecipient.id)}/publicKey`);
      if (!r.ok) throw new Error("failed to fetch recipient public key");
      const rj = await r.json();
      const publicKey = rj.publicKey;
      if (!publicKey) throw new Error("recipient has no public key");

      // superEncrypt should return { ciphertext, encryptedKey }
      const { ciphertext, encryptedKey } = await superEncrypt(messageBody.trim(), publicKey);

      // send to server
      const payload = { senderId: userId, recipientId: chosenRecipient.id, ciphertext, encryptedKey };
      const sres = await fetch(`/api/messages`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!sres.ok) throw new Error("send failed");

      setMessageBody("");
      setComposeOpen(false);
      setStatus("Sent");
      // refresh sent list
      loadSent();
    } catch (e) {
      console.error(e);
      setStatus("Send failed");
    } finally {
      setTimeout(() => setStatus(null), 2000);
    }
  }

  // open message and attempt decrypt via superDecrypt({ciphertext, encryptedKey}, privateJwk)
  async function openMessage(msg: any) {
    setSelected(msg);
    if (!privateJwk) return setStatus("Private key missing (generate/import)");
    try {
      const plain = await superDecrypt({ ciphertext: msg.ciphertext, encryptedKey: msg.encryptedKey }, privateJwk);
      setSelected({ ...msg, plain });
    } catch (e) {
      console.error(e);
      setStatus("Decrypt failed (wrong key?)");
    } finally {
      setTimeout(() => setStatus(null), 1500);
    }
  }

  // import private jwk string
  function importPrivateJwkFromText(txt: string) {
    try {
      const jwk = JSON.parse(txt);
      localStorage.setItem("rsa_private_jwk", JSON.stringify(jwk));
      setPrivateJwk(jwk);
      setStatus("Private key imported");
    } catch (e) {
      setStatus("Invalid JWK JSON");
    } finally {
      setTimeout(() => setStatus(null), 1200);
    }
  }

  // export private JWK
  function exportPrivateKey() {
    if (!privateJwk) return setStatus("No private key");
    const blob = new Blob([JSON.stringify(privateJwk)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${userId || "private"}-rsa-jwk.json`;
    a.click();
    setStatus("Private key exported");
    setTimeout(() => setStatus(null), 1200);
  }

  // small UI helpers for colors (use your globals.css variables)
  const otherBubbleStyle = { backgroundColor: "hsl(var(--muted))", color: "hsl(var(--foreground))" };
  const meBubbleStyle = { backgroundColor: "hsl(var(--foreground))", color: "hsl(var(--primary-foreground))" };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "hsl(var(--background))", color: "hsl(var(--foreground))", padding: "24px" }}>
      <div className="mx-auto" style={{ maxWidth: "1200px" }}>
        <div className="bg-[transparent] rounded-lg shadow-sm overflow-hidden border" style={{ borderColor: "hsl(var(--border))" }}>
          <div className="flex">
            {/* Sidebar: fixed width ~300px */}
            <aside style={{ width: 300, borderRight: "1px solid", borderColor: "hsl(var(--border))" }} className="p-4">
              <div className="mb-3">
                <div className="flex gap-2 items-center">
                  <p className="text-xs text-gray-500">Logged in as: {userId ?? "Dummy User"}</p>

                </div>
                <div className="flex gap-2 mt-3">
                  <button onClick={handleGenerateKeys} className="px-2 py-1 rounded border text-xs" style={{ borderColor: "hsl(var(--border))" }}>
                    Generate Keys
                  </button>
                  <button onClick={() => setComposeOpen(true)} className="px-2 py-1 rounded text-xs" style={{ backgroundColor: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}>
                    Compose
                  </button>
                </div>
              </div>

              <div className="mb-2 text-xs text-[color:var(--muted-foreground)]">Status: {status ?? "idle"}</div>

              <div className="mt-4 flex flex-col gap-1">
                <button onClick={loadInbox} className={`text-left px-3 py-2 rounded ${activeTab === "inbox" ? "bg-[hsl(var(--muted))]" : ""}`} style={{ color: "hsl(var(--foreground))" }}>
                  📥 Inbox
                </button>
                <button onClick={loadSent} className={`text-left px-3 py-2 rounded ${activeTab === "sent" ? "bg-[hsl(var(--muted))]" : ""}`} style={{ color: "hsl(var(--foreground))" }}>
                  📤 Sent
                </button>
              </div>

              <div className="mt-4 text-sm">
                <div className="text-xs text-[color:hsl(var(--muted-foreground))]">Private key: {privateJwk ? "present" : "missing"}</div>
                <div className="flex gap-2 mt-2">
                  <button onClick={exportPrivateKey} className="px-2 py-1 rounded border text-xs" style={{ borderColor: "hsl(var(--border))" }}>
                    Export
                  </button>
                  <button
                    onClick={() => {
                      const txt = prompt("Paste private JWK JSON here (for import)");
                      if (txt) importPrivateJwkFromText(txt);
                    }}
                    className="px-2 py-1 rounded border text-xs"
                    style={{ borderColor: "hsl(var(--border))" }}
                  >
                    Import
                  </button>
                </div>
              </div>
            </aside>

            {/* Main middle & right */}
            <div className="flex-1 flex flex-col" style={{ minHeight: 520 }}>
              {/* top toolbar */}
              <div className="px-6 py-4 border-b" style={{ borderColor: "hsl(var(--border))" }}>
                <div className="flex items-center justify-between">
                  <div className="text-lg font-semibold">Secure Messages</div>
                  <div className="text-sm text-[color:hsl(var(--muted-foreground))]">User: {userId || "(not set)"}</div>
                </div>
              </div>

              <div className="flex flex-1">
                {/* message list (center column) */}
                <div style={{ width: 360, borderRight: "1px solid", borderColor: "hsl(var(--border))" }} className="p-4 overflow-auto">
                  {(activeTab === "inbox" ? inbox : sent).length === 0 ? (
                    <div className="text-sm text-[color:hsl(var(--muted-foreground))]">No messages</div>
                  ) : (
                    (activeTab === "inbox" ? inbox : sent).map((m) => (
                      <div key={m.id} onClick={() => openMessage(m)} className="p-3 mb-2 rounded cursor-pointer" style={{ border: "1px solid transparent", borderColor: "hsl(var(--border))", backgroundColor: "transparent" }}>
                        <div className="font-semibold" style={{ color: "hsl(var(--foreground))" }}>{m.sender?.username ?? m.senderId}</div>
                        <div className="text-xs text-[color:hsl(var(--muted-foreground))] mt-1">{m.ciphertext.slice(0, 56)}...</div>
                        <div className="text-xs text-[color:hsl(var(--muted-foreground))] mt-1">{new Date(m.createdAt).toLocaleString()}</div>
                      </div>
                    ))
                  )}
                </div>

                {/* right: message view */}
                <div className="flex-1 p-6 overflow-auto">
                  {selected ? (
                    <div>
                      <div className="mb-4 text-xs text-[color:hsl(var(--muted-foreground))]">From: {selected.sender?.username ?? selected.senderId}</div>

                      {/* chat bubble container */}
                      <div className="flex flex-col gap-3">
                        {/* if we have decrypted plain text, show as bubble(s) */}
                        {selected.plain ? (
                          // split into paragraphs for simple bubble effect
                          selected.plain.split("\n").map((chunk: string, idx: number) => {
                            const fromMe = selected.senderId === userId ? true : false;
                            return (
                              <div key={idx} className={`max-w-[70%] px-4 py-3 rounded-lg`} style={fromMe ? meBubbleStyle : otherBubbleStyle}>
                                <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.4 }}>{chunk}</div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="text-sm text-[color:hsl(var(--muted-foreground))]">(encrypted) — click decrypt or upload private key</div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-[color:hsl(var(--muted-foreground))]">Select a message to view</div>
                  )}
                </div>
              </div>

              {/* footer quick compose / actions */}
              <div className="px-6 py-4 border-t flex items-center justify-between" style={{ borderColor: "hsl(var(--border))" }}>
                <div className="text-sm text-[color:hsl(var(--muted-foreground))]">Tip: Use Compose to send encrypted message</div>
                <div>
                  <button onClick={() => setComposeOpen(true)} className="px-3 py-2 rounded" style={{ backgroundColor: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}>
                    Compose
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Compose Modal */}
      {composeOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 p-4 z-50">
          <div className="w-full max-w-2xl bg-[hsl(var(--card))] rounded-lg shadow p-5" style={{ border: "1px solid", borderColor: "hsl(var(--border))" }}>
            <h3 className="text-lg font-semibold mb-3">Compose Encrypted</h3>

            <div className="mb-3 relative">
              <label className="text-xs text-[color:hsl(var(--muted-foreground))]">To</label>
              <input
                value={toQuery}
                onChange={(e) => {
                  setToQuery(e.target.value);
                  setChosenRecipient(null);
                }}
                placeholder="Type username or id"
                className="w-full px-3 py-2 rounded border"
                style={{ borderColor: "hsl(var(--input))", backgroundColor: "hsl(var(--card))", color: "hsl(var(--foreground))" }}
              />
              {/* suggestions dropdown */}
              {toSuggestions.length > 0 && (
                <div className="absolute left-0 right-0 bg-[hsl(var(--card))] border rounded mt-1 max-h-44 overflow-auto" style={{ borderColor: "hsl(var(--border))", zIndex: 60 }}>
                  {toSuggestions.map((u) => (
                    <div
                      key={u.id}
                      className="px-3 py-2 hover:bg-[hsl(var(--muted))] cursor-pointer"
                      onClick={() => {
                        setChosenRecipient(u);
                        setToQuery(u.username ?? u.id);
                        setToSuggestions([]);
                      }}
                      style={{ color: "hsl(var(--foreground))" }}
                    >
                      <div className="font-medium">{u.username ?? u.id}</div>
                      <div className="text-xs text-[color:hsl(var(--muted-foreground))]">{u.id}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mb-3">
              <label className="text-xs text-[color:hsl(var(--muted-foreground))]">Message</label>
              <textarea value={messageBody} onChange={(e) => setMessageBody(e.target.value)} className="w-full px-3 py-2 rounded border h-36" style={{ borderColor: "hsl(var(--input))", backgroundColor: "hsl(var(--card))", color: "hsl(var(--foreground))" }} />
            </div>

            <div className="flex justify-end gap-2">
              <button onClick={() => setComposeOpen(false)} className="px-3 py-2 rounded border" style={{ borderColor: "hsl(var(--border))" }}>
                Cancel
              </button>
              <button
                onClick={() => {
                  // if user selected suggestion use that id, else try to use input as id
                  if (!chosenRecipient && toQuery.trim()) setChosenRecipient({ id: toQuery.trim(), username: undefined });
                  // small timeout to ensure chosenRecipient set before send
                  setTimeout(handleSend, 120);
                }}
                className="px-3 py-2 rounded"
                style={{ backgroundColor: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}
              >
                Send Encrypted
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
