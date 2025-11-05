// components/MessageComposer.tsx
import  { useState } from "react";
import UserSearch from "@/components/UserSearch/page";
import { useUser } from "@/app/contexts/UserContext/UserContext";
import { superEncrypt } from "@/lib/encryption/superEncryption";

export default function MessageComposer({ onSent }: { onSent?: () => void }) {
  const { user } = useUser();
  const [recipient, setRecipient] = useState<{ id: string; username?: string } | null>(null);
  const [body, setBody] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  async function handleSend() {
    if (!user) return setStatus("Not logged in");
    if (!recipient) return setStatus("Please choose a recipient");
    //checkig recipient
    console.log(recipient);
    if (!body.trim()) return setStatus("Message is empty");

    setStatus("Encrypting...");
    try {
      const res = await fetch(`/api/users/${encodeURIComponent(recipient.id)}/publicKey`);
      console.log("Check res : ",res);
      if (!res.ok) throw new Error("Failed to fetch public key");
      const j = await res.json();
      const publicKey = j.publicKey;
      if (!publicKey) throw new Error("Recipient has no public key");

      // superEncrypt returns { ciphertext, encryptedKey }
      const { ciphertext, encryptedKey } = await superEncrypt(body, publicKey);

      const sendRes = await fetch(`/api/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senderId: user.userId, recipientId: recipient.id, ciphertext, encryptedKey }),
      });
      if (!sendRes.ok) throw new Error("send failed");

      setBody("");
      setRecipient(null);
      setStatus("Sent");
      onSent?.();
    } catch (e) {
      console.error(e);
      setStatus((e as Error).message || "Send error");
    } finally {
      setTimeout(() => setStatus(null), 1500);
    }
  }

  return (
    <div className="p-4 border rounded" style={{ borderColor: "hsl(var(--border))", backgroundColor: "hsl(var(--card))" }}>
      <div className="mb-2 text-sm text-[color:hsl(var(--muted-foreground))]">From: {user?.username ?? "(not logged)"}</div>

      <div className="mb-3">
        <UserSearch onSelect={(u) => setRecipient(u)} />
        {recipient && <div className="text-xs text-[color:hsl(var(--muted-foreground))] mt-2">Recipient: {recipient.username ?? recipient.id}</div>}
      </div>

      <textarea value={body} onChange={(e) => setBody(e.target.value)} className="w-full px-3 py-2 border rounded h-28" style={{ borderColor: "hsl(var(--input))", backgroundColor: "hsl(var(--card))", color: "hsl(var(--foreground))" }} />

      <div className="mt-3 flex justify-end gap-2">
        <div className="text-sm text-[color:hsl(var(--muted-foreground))]">{status ?? ""}</div>
        <button onClick={handleSend} className="px-3 py-2 rounded" style={{ backgroundColor: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}>
          Send Encrypted
        </button>
      </div>
    </div>
  );
}


