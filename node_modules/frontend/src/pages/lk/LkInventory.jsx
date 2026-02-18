import React, { useEffect, useMemo, useState } from "react";

const API = "/api";

async function safeJson(res) {
    const text = await res.text();
    try {
        return text ? JSON.parse(text) : null;
    } catch {
        return null;
    }
}

// пока заглушка
function placeholderIconUrl() {
    return "/favicon.ico";
}

function ItemCard({ item }) {
    const iconUrl = placeholderIconUrl();

    // поддержка форматов:
    // - mock: { id, name, type, rarity, qty }
    // - api:  { id, user_id, item_id, amount, created_at }
    const title = item.name ?? `Item #${item.item_id}`;
    const subtitle =
        item.type && item.rarity ? `${item.type} • ${item.rarity}` : `item_id: ${item.item_id}`;
    const qty = item.qty ?? item.amount ?? 1;

    return (
        <div
            style={{
                border: "1px solid #ddd",
                borderRadius: 12,
                padding: 12,
                display: "grid",
                gridTemplateRows: "56px auto auto",
                gap: 10,
            }}
        >
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <img
                    src={iconUrl}
                    alt=""
                    width={56}
                    height={56}
                    style={{ borderRadius: 10, border: "1px solid #eee", objectFit: "cover" }}
                />

                <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 800, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {title}
                    </div>
                    <div style={{ fontSize: 12, opacity: 0.8 }}>{subtitle}</div>
                </div>

                <div
                    style={{
                        marginLeft: "auto",
                        border: "1px solid #ddd",
                        borderRadius: 999,
                        padding: "2px 10px",
                        fontWeight: 700,
                    }}
                    title="Количество"
                >
                    x{qty}
                </div>
            </div>

            <div style={{ fontSize: 12, opacity: 0.7 }}>
                {item.icon != null && (
                    <>
                        icon: <code>{item.icon}</code>
                    </>
                )}
            </div>

            <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => alert("Use: скоро")}>Использовать</button>
                <button onClick={() => alert("Send to game: скоро")}>Отправить в игру</button>
            </div>
        </div>
    );
}

export default function LkInventory() {
    // ✅ ХУКИ ТОЛЬКО ВНУТРИ КОМПОНЕНТА
    const [items, setItems] = useState([]);
    const [err, setErr] = useState("");
    const [q, setQ] = useState("");
    const [type, setType] = useState("all"); // оставляем на будущее

    useEffect(() => {
        (async () => {
            setErr("");

            const res = await fetch(`${API}/lk/inventory`, { credentials: "include" });
            const j = await safeJson(res);

            if (!res.ok || !j?.ok) {
                setItems([]);
                setErr(j?.error || j?.message || `HTTP ${res.status}`);
                return;
            }

            setItems(j.items || []);
        })();
    }, []);

    // ✅ НЕ ПЕРЕОПРЕДЕЛЯЕМ items — делаем filteredItems
    const filteredItems = useMemo(() => {
        const qq = q.trim().toLowerCase();

        return (items || []).filter((x) => {
            // если пришли данные из API, там может не быть name/type/rarity
            const name = String(x.name ?? x.item_id ?? "").toLowerCase();
            const okName = !qq || name.includes(qq);

            // type пока не применяем, потому что из API его нет
            // (позже добавим join к shop_names и будем фильтровать)
            const okType = type === "all" ? true : String(x.type || "") === type;

            return okName && okType;
        });
    }, [items, q, type]);

    return (
        <div>
            <h2>Инвентарь</h2>

            {err && <div style={{ color: "crimson", marginBottom: 10 }}>Ошибка: {err}</div>}

            <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 12 }}>
                <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Поиск по названию / ID..."
                    style={{ padding: 8, minWidth: 260 }}
                />

                <select value={type} onChange={(e) => setType(e.target.value)} style={{ padding: 8 }}>
                    <option value="all">Все типы</option>
                    <option value="consumable">Consumables</option>
                    <option value="material">Materials</option>
                    <option value="ticket">Tickets</option>
                </select>

                <button
                    onClick={async () => {
                        // ручной reload
                        setErr("");
                        const res = await fetch(`${API}/lk/inventory`, { credentials: "include" });
                        const j = await safeJson(res);
                        if (!res.ok || !j?.ok) {
                            setItems([]);
                            setErr(j?.error || j?.message || `HTTP ${res.status}`);
                            return;
                        }
                        setItems(j.items || []);
                    }}
                >
                    Reload
                </button>
            </div>

            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                    gap: 12,
                }}
            >
                {filteredItems.map((item) => (
                    <ItemCard key={item.id ?? `${item.user_id}-${item.item_id}-${item.created_at}`} item={item} />
                ))}
            </div>

            {filteredItems.length === 0 && <div style={{ marginTop: 12 }}>Пусто</div>}
        </div>
    );
}