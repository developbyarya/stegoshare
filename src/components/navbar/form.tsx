"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Menu } from "lucide-react";

export default function Navbar() {
    const router = useRouter();
    const [open, setOpen] = useState(false);

    const pathname = usePathname()
    const hideNavbarRoutes = ["/login", "/register"]
    const shouldShowNavbar = !hideNavbarRoutes.includes(pathname)

    const handleLogout = async () => {
        try {
            await fetch("/api/auth/logout", { method: "POST" });
            // Clear private key on logout
            localStorage.removeItem("rsa_private_jwk");
            router.push("/login");
        } catch (err) {
            console.error("Logout error:", err);
            // Still clear private key even if API call fails
            localStorage.removeItem("rsa_private_jwk");
            router.push("/login");
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

                <nav className="flex flex-col space-y-3 px-6 justify-between h-[calc(100%-90px)]">
                    <div>
                        <ul className="space-y-2">
                            <li><Link href="/" className="hover:text-blue-400" onClick={() => setOpen(false)}>Dashboard</Link></li>
                            <li><Link href="/message" className="hover:text-blue-400" onClick={() => setOpen(false)}>Pesan Text </Link></li>
                            <li><Link href="/kirim_gambar" className="hover:text-blue-400" onClick={() => setOpen(false)}>Kirim Pesan Gambar </Link></li>
                            <li><Link href="/upload" className="hover:text-blue-400" onClick={() => setOpen(false)}>Kirim File</Link></li>
                        </ul>
                    </div>
                    <div>
                        <button className="text-red-400 hover:text-red-500 mt-6 text-left" onClick={handleLogout}>
                            Logout
                        </button>
                    </div>
                </nav>
            </div>
        </>
    );
}
