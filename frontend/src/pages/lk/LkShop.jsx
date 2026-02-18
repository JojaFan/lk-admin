import { useEffect, useState } from "react";

export default function LkShop() {
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");
    const [chars, setChars] = useState([]);
    const [charId, setCharId] = useState("");
    const [items, setItems] = useState([]);

    const API_BASE = "http://localhost:3000";
    const api = (path) => `${API_BASE}${path}`;

    useEffect(() => {
        (async () => {
            try {
                setErr("");
                setLoading(true);

                const r1 = await fetch(api("/lk/chars"));
                const d1 = await r1.json();
                if (!r1.ok || !d1?.ok) throw new Error(d1?.message || "chars failed");

                setChars(d1.characters || []);
                const firstId = String(d1.characters?.[0]?.id || "");
                setCharId(firstId);

                const r2 = await fetch(api(`/lk/shop?charId=${firstId}`));
                const d2 = await r2.json();
                if (!r2.ok || !d2?.ok) throw new Error(d2?.message || "shop failed");
                setItems(d2.items || []);
            } catch (e) {
                setErr(e.message || "Error");
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    async function onChangeChar(e) {
        const id = e.target.value;
        setCharId(id);
        setErr("");
        try {
            const r = await fetch(api(`/lk/shop?charId=${id}`));
            const d = await r.json();
            if (!r.ok || !d?.ok) throw new Error(d?.message || "shop failed");
            setItems(d.items || []);
        } catch (e) {
            setErr(e.message || "Error");
        }
    }

    if (loading) return <div>Loading…</div>;
    if (err) return <div style={{ color: "crimson" }}>{err}</div>;

    return (
        <div>
            <h2>Магазин</h2>

            <label>
                Персонаж:{" "}
                <select value={charId} onChange={onChangeChar}>
                    {chars.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                </select>
            </label>

            <hr />

            <ul>
                {items.map((it) => (
                    <li key={it.id}>
                        {it.name} — {it.price}
                    </li>
                ))}
            </ul>
        </div>
    );
}