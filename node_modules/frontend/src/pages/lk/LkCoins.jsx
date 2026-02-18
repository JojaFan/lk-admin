import { useEffect, useState } from "react";

export default function LkCoins() {
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");
    const [data, setData] = useState(null);

    const API_BASE = "http://localhost:3000";
    const api = (path) => `${API_BASE}${path}`;

    useEffect(() => {
        (async () => {
            try {
                const r = await fetch(api("/lk/coins"));
                const d = await r.json();
                if (!r.ok || !d?.ok) throw new Error(d?.message || "coins failed");
                setData(d);
            } catch (e) {
                setErr(e.message || "Error");
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    if (loading) return <div>Loading…</div>;
    if (err) return <div style={{ color: "crimson" }}>{err}</div>;

    return (
        <div>
            <h2>Монеты</h2>
            <div>Баланс: <b>{data.balance}</b></div>
            <p>{data.note}</p>

            <button onClick={() => alert("Скоро: перенос доната")}>Перенести донат</button>{" "}
            <button onClick={() => alert("Скоро: пополнение")}>Пополнить</button>
        </div>
    );
}
