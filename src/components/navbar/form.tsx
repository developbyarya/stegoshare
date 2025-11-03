"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Menu } from "lucide-react";

export default function Navbar() {
    const router = useRouter();
    const [open, setOpen] = useState(true);

    const pathname = usePathname()
    const hideNavbarRoutes = ["/login", "/register"]
    const shouldShowNavbar = !hideNavbarRoutes.includes(pathname)

    const handleLogout = async () => {
        try {
            await fetch("/api/auth/logout", { method: "POST" });
            router.push("/login");
        } catch (err) {
            console.error("Logout error:", err);
        }
    };

    if (!shouldShowNavbar) {
        return <></>
    }

    return (
        <>
            {/* Icon button fixed kanan atas */}
            <button 
                onClick={() => setOpen(!open)}
                className="fixed top-4 right-4 z-[100] p-2 rounded-md bg-gray-800 text-white hover:bg-gray-700"
            >
                <Menu size={22} />
            </button>

            {/* overlay ketika open */}
            {open && (
                <div 
                    onClick={() => setOpen(false)}
                    className="fixed inset-0 bg-black/40 z-[90]"
                />
            )}

            {/* Drawer kanan */}
            <div className={`fixed top-0 right-0 h-full w-64 bg-gray-900 text-white shadow-xl z-[99] 
                transition-transform duration-300 ${open ? "translate-x-0" : "translate-x-full"}`}>
                
                <div className="px-6 py-6 font-semibold text-lg">
                    Menu
                </div>

                <nav className="flex flex-col space-y-4 px-6">
                    <Link href="/" className="hover:text-blue-400" onClick={()=>setOpen(false)}>Dashboard</Link>
                    <Link href="/text" className="hover:text-blue-400" onClick={()=>setOpen(false)}>Pesan Text (Crypto)</Link>
                    <Link href="/image" className="hover:text-blue-400" onClick={()=>setOpen(false)}>Pesan Gambar (Steganografi)</Link>
                    <Link href="/upload" className="hover:text-blue-400" onClick={()=>setOpen(false)}>Kirim File</Link>

                    <button className="text-red-400 hover:text-red-500 mt-6 text-left" onClick={handleLogout}>
                        Logout
                    </button>
                </nav>
            </div>
        </>
    );
}
