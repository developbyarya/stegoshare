"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/app/contexts/UserContext/UserContext";
import MessageComposer from "@/components/MessageComposer/page";
import { superDecrypt } from "@/lib/encryption/superEncryption";

export default function InnerMessagesPage() {
  const { login,user } = useUser();
  const [inbox, setInbox] = useState<any[]>([]);
  const [sent, setSent] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const userName = user?.username ;
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
      setInbox(Array.isArray(data) ? data : []);
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
    const s = localStorage.getItem("rsa_private_jwk");
    if (!s) return setStatus("Private key not found (import or generate)");
    try {
      const privateJwk = JSON.parse(s);
      const plain = await superDecrypt({ ciphertext: msg.ciphertext, encryptedKey: msg.encryptedKey }, privateJwk);
      setSelected({ ...msg, plain });
    } catch (e) {
      console.error(e);
      setStatus("Decrypt failed");
    }
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "hsl(var(--background))", color: "hsl(var(--foreground))", padding: 24 }}>
      <div className="mx-auto" style={{ maxWidth: 1200 }}>
        <div className="bg-[transparent] rounded shadow-sm overflow-hidden border" style={{ borderColor: "hsl(var(--border))" }}>
          <div className="flex">
            <aside style={{ width: 300, borderRight: "1px solid", borderColor: "hsl(var(--border))" }} className="p-4">
              <div className="mb-3">
                <div className="text-lg font-semibold">Messages</div>
                <div className="text-xs text-[color:hsl(var(--muted-foreground))]">User: {userName ?? "Dummy"}</div>
              </div>

              <div className="mb-4">
                <button onClick={loadInbox} className="w-full text-left px-3 py-2 rounded">Inbox</button>
                <button onClick={loadSent} className="w-full text-left px-3 py-2 rounded mt-2">Sent</button>
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
                    {(inbox).length === 0 ? <div className="text-sm">No messages</div> : inbox.map((m) => (
                      <div key={m.id} className="p-3 border-b cursor-pointer" onClick={() => openMessage(m)}>
                        <div className="font-medium">{m.sender?.username ?? m.senderId}</div>
                        <div className="text-xs text-[color:hsl(var(--muted-foreground))]">{m.ciphertext.slice(0, 48)}...</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="col-span-2">
                  <div className="text-sm text-[color:hsl(var(--muted-foreground))]">Message</div>
                  <div className="mt-2 p-4 rounded" style={{ backgroundColor: "hsl(var(--card))", border: "1px solid", borderColor: "hsl(var(--border))" }}>
                    {selected ? (
                      selected.plain ? (
                        <div style={{ maxWidth: 800 }}>
                          {selected.plain.split("\n").map((p: string, i: number) => (
                            <div key={i} className="mb-3 p-3 rounded" style={{ backgroundColor: "hsl(var(--muted))", color: "hsl(var(--foreground))" }}>
                              <pre className="whitespace-pre-wrap">{p}</pre>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-[color:hsl(var(--muted-foreground))]">(encrypted) — import/generate private key to decrypt</div>
                      )
                    ) : (
                      <div className="text-sm text-[color:hsl(var(--muted-foreground))]">Select a message to view</div>
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


