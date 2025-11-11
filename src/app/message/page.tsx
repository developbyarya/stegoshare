"use client";

import { useEffect, useState,useRef } from "react";
import { useUser } from "@/app/contexts/UserContext/UserContext";
import MessageComposer from "@/components/MessageComposer/page";
import { superDecrypt } from "@/lib/encryption/superEncryption";
import { Button } from "@/components/ui/button";
import { getPrivateKeyJwk } from "@/lib/encryption/modern/keyStore";
export default function InnerMessagesPage() {
  const { user } = useUser();
  const [inbox, setInbox] = useState<any[]>([]);
  const [sent, setSent] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const userName = user?.username ;

  const didFetch = useRef(false);
  //mengetes tampilkan username
  // console.log("nama user check : ", userName);
  useEffect(() => {
    if (!user?.userId || didFetch.current) return;
    didFetch.current = true;
    loadInbox();
    loadSent();

  }, [user?.userId]);

  async function loadInbox() {
    if (!user?.userId) return; // ensure safe call
    console.log("load inbox");
    const res = await fetch(`/api/messages?receivedBy=${encodeURIComponent(user.userId)}`);
    if (!res.ok) {
      console.warn("Inbox fetch failed:", await res.text());
      setInbox([]);
      return;
    }

    const data = await res.json();
    setInbox(data ?? []);
  }

  async function loadSent() {
    console.log("load sent");
    if (!user?.userId) return;

    const res = await fetch(`/api/messages?sentBy=${encodeURIComponent(user.userId)}`);
    if (!res.ok) {
      console.warn("Sent fetch failed:", await res.text());
      setSent([]);
      return;
    }
    const data = await res.json();
    setSent(data ?? []);
  }


  async function openMessage(msg: any) {
    setSelected(msg);
    try {
      const privateJwk = await getPrivateKeyJwk();
      if (!privateJwk) {
        setStatus("Private key not found (import or generate)");
        return;
      }

      const plain = await superDecrypt(
        { ciphertext: msg.ciphertext, encryptedKey: msg.encryptedKey },
        privateJwk
      );

      setSelected({ ...msg, plain });
      setStatus(null); // reset status jika sukses
    } catch (e) {
      console.error(e);
      setStatus("Decrypt failed");
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
                    {(inbox).length === 0 ? <div className="text-sm">No messages</div> : inbox.map((m) => (
                      <div key={m.id} className="p-3 border-b cursor-pointer" onClick={() => openMessage(m)}>
                        <div className="text-xs ">{m.sender?.username ?? m.senderId}</div>
                        <div className="font-medium text-[color:hsl(var(--muted-foreground))]">{m.ciphertext.slice(0, 25)}...</div>
                      </div>
                      
                    ))}
                    {(sent).length === 0 ? <div className="text-sm"></div> : sent.map((m) => (
                      <div key={m.id} className="p-3 border-b cursor-pointer" onClick={() => openMessage(m)}>
                        <div className="text-xs ">{m.sender?.username ?? m.senderId}</div>
                        <div className="font-medium text-[color:hsl(var(--muted-foreground))]">{m.ciphertext.slice(0, 25)}...</div>
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


