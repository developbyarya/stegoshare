import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { verifySessionToken } from "@/lib/auth/session";

export default async function Home() {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session");

    if (sessionCookie) {
        const payload = await verifySessionToken(sessionCookie.value);
        if (payload) {
            redirect("/dashboard");
        }
    }

    redirect("/login");
}
