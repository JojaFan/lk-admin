import {useEffect, useState} from "react";
import { apiGet, apiPost } from "../../api/client";

export default function LkShop() {
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");
    const [items, setItems] = useState([]);

    const [chars, setChars] = useState([]);
    const [charId, setCharId] = useState("");

    useEffect(() => {
        (async () => {
            try {
                setErr("");
                setLoading(true);

                const d = await apiGet("/lk/shop-products");
                if (!d?.ok) throw new Error(d?.message || d?.error || "shop-products failed");

                setItems(d.items || []);
            } catch (e) {
                setErr(String(e?.message || e));
            } finally {
                setLoading(false);
            }
            const c = await apiGet("/lk/chars");
            if (c?.ok) setChars(c.items || c.chars || []);
        })();
    }, []);

    async function buy(productId) {
        if (!charId) return alert("Выбери персонажа");
        const r = await apiPost("/lk/shop/buy", {productId, charId: Number(charId), qty: 1});
        if (!r?.ok) return alert(r?.error || r?.message || "Не удалось купить");
        alert("Отправлено на почту персонажа ✅");
    }

    if (loading) return <div>Loading…</div>;
    if (err) return <div style={{color: "crimson"}}>{err}</div>;

    return (
        <div>
            <h2>Магазин</h2>
            <div style={{display: "flex", gap: 10, alignItems: "center", marginBottom: 12}}>
                <div style={{fontWeight: 800}}>Персонаж:</div>

                <select value={charId} onChange={(e) => setCharId(e.target.value)}>
                    <option value="">— выбери персонажа —</option>
                    {chars.map((c) => (
                        <option key={c.id || c.roleId} value={c.id || c.roleId}>
                            {c.name || c.rolename} (lvl {c.level || c.rolelevel})
                        </option>
                    ))}
                </select>
            </div>

            <table className="cosmoTable">
                <thead>
                <tr>
                    <th>ID</th>
                    <th>Предмет</th>
                    <th>Кол-во</th>
                    <th>Цена</th>
                    <th>Купить</th>
                </tr>
                </thead>
                <tbody>

                {items.map((it) => (
                    <tr key={it.id}>
                        <td>{it.itemId}</td>
                        <td>{it.name || "(без названия)"}</td>
                        <td>{it.stackCount}</td>
                        <td>{it.price}</td>
                        <td>
                            <button
                                className="adminBtn"
                                disabled={!charId}
                                onClick={() => buy(it.id)}
                            >
                                Купить
                            </button>
                        </td>
                    </tr>
                ))}
                {items.length === 0 && (
                    <tr>
                        <td colSpan={4} style={{opacity: 0.7}}>Пока нет товаров</td>
                    </tr>
                )}
                </tbody>
            </table>
        </div>
    );
}