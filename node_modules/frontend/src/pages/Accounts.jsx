import { useEffect, useState } from "react";
import { apiGet } from "../api/client";

export default function Accounts() {
    const [search, setSearch] = useState("");
    const [data, setData] = useState(null);
    const [err, setErr] = useState("");

    async function load() {
        setErr("");
        try {
            const q = search.trim() ? `?search=${encodeURIComponent(search.trim())}` : "";
            const j = await apiGet(`/accounts${q}`);
            setData(j);
        } catch (e) {
            setErr(String(e.message || e));
        }
    }

    useEffect(() => {
        load();
    }, []);

    return (
        <div style={{ padding: 24 }}>
            <h2>Accounts</h2>

            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                <input
                    placeholder="Search by id/login/email…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{ padding: 8, width: 260 }}
                />
                <button onClick={load} style={{ padding: "8px 12px" }}>
                    Search
                </button>
            </div>

            {err && <div style={{ color: "crimson" }}>{err}</div>}

            {data?.items && (
                <table cellPadding="8" style={{ borderCollapse: "collapse" }}>
                    <thead>
                    <tr>
                        <th align="left">ID</th>
                        <th align="left">Login</th>
                        <th align="left">Email</th>
                        <th align="left">Status</th>
                        <th align="left">Created</th>
                    </tr>
                    </thead>
                    <tbody>
                    {data.items.map((a) => (
                        <tr key={a.id} style={{ borderTop: "1px solid #ddd" }}>
                            <td>{a.id}</td>
                            <td>{a.login}</td>
                            <td>{a.email}</td>
                            <td>{a.status}</td>
                            <td>{a.createdAt}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}