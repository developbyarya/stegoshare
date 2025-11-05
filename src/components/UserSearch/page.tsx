import  { useEffect, useMemo, useState } from "react";

type UserItem = { id: string; username?: string };

export default function UserSearch({ onSelect }: { onSelect: (u: UserItem) => void }) {
  const [q, setQ] = useState("");
  const [list, setList] = useState<UserItem[]>([]);
  const [open, setOpen] = useState(false);

  const debounced = useMemo(() => {
    let t: ReturnType<typeof setTimeout> | null = null;
    return (fn: () => void, wait = 300) => {
      if (t) clearTimeout(t);
      t = setTimeout(fn, wait);
    };
  }, []);

  useEffect(() => {
    if (!q || q.trim().length < 1) {
      setList([]);
      setOpen(false);
      return;
    }
    debounced(async () => {
      try {
        const res = await fetch(`/api/users?search=${encodeURIComponent(q)}`);
        if (!res.ok) throw new Error("search failed");
        const data = await res.json();
        setList(Array.isArray(data) ? data : []);
        setOpen(true);
      } catch (e) {
        console.error(e);
        setList([]);
        setOpen(false);
      }
    });
  }, [q, debounced]);

  return (
    <div className="relative">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search user (by name or id)"
        className="w-full px-3 py-2 border rounded"
        style={{ borderColor: "hsl(var(--input))", backgroundColor: "hsl(var(--card))", color: "hsl(var(--foreground))" }}
      />

      {open && list.length > 0 && (
        <div className="absolute left-0 right-0 mt-1 rounded shadow overflow-auto z-40" style={{ backgroundColor: "hsl(var(--card))", border: "1px solid", borderColor: "hsl(var(--border))", maxHeight: 240 }}>
          {list.map((u) => (
            <div
              key={u.id}
              className="px-3 py-2 hover:bg-[hsl(var(--muted))] cursor-pointer"
              style={{ color: "hsl(var(--foreground))" }}
              onClick={() => {
                onSelect(u);
                setQ(u.username ?? u.id);
                setOpen(false);
              }}
            >
              <div className="font-medium">{u.username ?? u.id}</div>
              <div className="text-xs text-[color:hsl(var(--muted-foreground))]">{u.id}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


