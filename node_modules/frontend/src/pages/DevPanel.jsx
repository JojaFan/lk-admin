import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiGet, apiPost } from "../api/client";
import { useAuth } from "../auth/AuthContext";


export default function DevPanel() {
    const nav = useNavigate();
    const { logout } = useAuth();

    const [me, setMe] = useState(null);
    const [loading, setLoading] = useState(true);

    const [profile, setProfile] = useState(null);
    const [admins, setAdmins] = useState(null);
    const [apiError, setApiError] = useState("");

    async function loadMe() {
        setLoading(true);
        try {
            const j = await apiGet("/auth/me");
            setMe(j.ok ? j.user : null);
            if (!j.ok) nav("/login", { replace: true });
        } catch {
            nav("/login", { replace: true });
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadMe();
    }, []);

    async function doLogout() {
        await logout();
        nav("/login", { replace: true });
    }

    async function loadProfile() {
        setApiError("");
        try {
            const j = await apiGet("/admin/profile");
            setProfile(j);
        } catch (e) {
            setApiError(String(e.message || e));
        }
    }

    async function loadAdmins() {
        setApiError("");
        try {
            const j = await apiGet("/admin/users");
            setAdmins(j);
        } catch (e) {
            setApiError(String(e.message || e));
        }
    }

    if (loading) return <div style={{ padding: 24 }}>Loading…</div>;
    if (!me) return null;

    return (
        <div style={{ padding: 24 }}>
            <h1>LK Admin</h1>

            <p>
                Logged in as <b>{me.login}</b> (role: <b>{me.role}</b>)
            </p>

            <button onClick={doLogout} style={{ padding: "8px 12px", marginBottom: 16 }}>
                Logout
            </button>
            <button onClick={() => nav("/accounts")} style={{ padding: "8px 12px" }}>
                Go to accounts
            </button>

            <hr style={{ margin: "16px 0" }} />

            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                <button onClick={loadProfile} style={{ padding: "8px 12px" }}>
                    Load profile
                </button>

                <button onClick={loadAdmins} style={{ padding: "8px 12px" }}>
                    Load admin users
                </button>
            </div>

            {apiError && <div style={{ color: "crimson" }}>{apiError}</div>}

            {profile && <pre>{JSON.stringify(profile, null, 2)}</pre>}
            {admins && <pre>{JSON.stringify(admins, null, 2)}</pre>}
        </div>
    );
}
