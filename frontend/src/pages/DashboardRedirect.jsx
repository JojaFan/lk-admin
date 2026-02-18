import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiGet } from "../api/client";

export default function DashboardRedirect() {
    const nav = useNavigate();

    useEffect(() => {
        (async () => {
            try {
                const j = await apiGet("/auth/me");
                if (!j?.ok) return nav("/login", { replace: true });

                const role = j.user?.role;
                if (role === "admin") return nav("/admin/accounts", { replace: true });
                if (role === "support") return nav("/admin/accounts", { replace: true });

                return nav("/lk/home", { replace: true }); // user
            } catch {
                nav("/login", { replace: true });
            }
        })();
    }, [nav]);

    return <div style={{ padding: 24 }}>Loading…</div>;
}