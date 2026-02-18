import { useEffect, useState } from "react";

export default function LkDonate() {
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");
    const [data, setData] = useState(null);

    const API_BASE = "http://localhost:3000";
    const api = (path) => `${API_BASE}${path}`;

    useEffect(() => {
        (async () => {
            try {
                setErr("");
                setLoading(true);

                const r = await fetch(api("/lk/donate"), { credentials: "include" });
                const d = await r.json();
                if (!r.ok || !d?.ok) throw new Error(d?.message || "Donate API error");

                setData(d);
            } catch (e) {
                setErr(e?.message || "Error");
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    if (loading) return <div>Loading…</div>;
    if (err) return <div style={{ color: "crimson" }}>{err}</div>;

    return (
        <div>
            <h2>Донат</h2>
            <p style={{ opacity: 0.8 }}>{data?.note}</p>

            <div style={{ display: "grid", gap: 12, maxWidth: 520 }}>
                {(data?.packages || []).map((p) => (
                    <div key={p.id} style={{ border: "1px solid #ddd", padding: 12, borderRadius: 8 }}>
                        <div style={{ fontWeight: 700 }}>{p.title}</div>
                        <div>Монеты: <b>{p.coins}</b></div>
                        <div>Цена: <b>{p.priceText}</b></div>

                        <button
                            style={{ marginTop: 10 }}
                            onClick={() => alert("Платежи позже 🙂")}
                        >
                            Купить (заглушка)
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}