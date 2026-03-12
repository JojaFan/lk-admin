import { useEffect, useState } from "react";
import { apiGet } from "../../api/client";

/* =======================
   СЛОТЫ (твоя структура)
======================= */

const LEFT_SLOTS = [
    { key: "helm", label: "Шлем" },
    { key: "armor", label: "Доспех" },
    { key: "boots", label: "Сапоги" },
    { key: "necklace", label: "Ожерелье" },
    { key: "ringL", label: "Кольцо (Л)" },
    { key: "ringR", label: "Кольцо (П)" },
    { key: "flight", label: "Полёт" },
    { key: "anem", label: "Анем" },
    { key: "weapon", label: "Оружие" },
];

const TOP_SLOTS = [
    { key: "esper", label: "Эспер" },
    { key: "esperRelic", label: "Реликвия Эспера" },
    { key: "esperBook", label: "Книга Эспера" },
];

const RIGHT_SLOTS = [
    { key: "vital", label: "Витал" },
    { key: "emotes", label: "Смайлы" },
    { key: "skinMask", label: "Маска (скин)" },
    { key: "skinHead", label: "Голова (скин)" },
    { key: "skinArmor", label: "Доспех (скин)" },
    { key: "medal", label: "Медаль" },
    { key: "skinBoots", label: "Сапоги (скин)" },
    { key: "wallet", label: "Кошелёк" },
];

const BOTTOM_SLOTS = [
    { key: "talisman", label: "Талисман" },
    { key: "emblem", label: "Эмблема" },
    { key: "transformStone", label: "Камень трансформации" },
    { key: "originStone", label: "Камень истока" },
];

/* =======================
   Компонент
======================= */

export default function LkChars() {
    const [chars, setChars] = useState([]);
    const [selectedId, setSelectedId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");

    async function load() {
        setLoading(true);
        setErr("");
        try {
            const j = await apiGet("/lk/chars");

            const list = Array.isArray(j?.characters)
                ? j.characters
                : Array.isArray(j?.items)
                    ? j.items
                    : [];

            setChars(list);

            if (list.length && !selectedId) {
                setSelectedId(list[0].id);
            }
        } catch (e) {
            setErr("Не удалось загрузить персонажей (пока демо)");
            // демо данные если API не готов
            const demo = [
                {
                    id: 1,
                    name: "DemoHero",
                    class: "Warrior",
                    race: "Human",
                    level: 120,
                    equipment: {},
                },
            ];
            setChars(demo);
            setSelectedId(1);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        load();
    }, []);

    const selected = chars.find((c) => c.id === selectedId);

    const renderSlot = (slot, char) => {
        const item = char?.equipment?.[slot.key] ?? null;
        return (
            <div
                key={slot.key}
                title={item?.name || `${slot.label} (пусто)`}
                style={{
                    border: "1px solid #aaa",
                    borderRadius: 10,
                    padding: 8,
                    minHeight: 60,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    background: item ? "rgba(255,255,255,0.1)" : "transparent",
                }}
            >
                <div style={{ fontWeight: 700, fontSize: 13 }}>{slot.label}</div>
                <div style={{ fontSize: 12, opacity: 0.85 }}>
                    {item ? item.name : "— пусто —"}
                </div>
            </div>
        );
    };

    return (
        <div>
            <h2>Персонажи</h2>

            {err && <div style={{ color: "crimson" }}>{err}</div>}
            {loading && <div>Loading…</div>}

            {!loading && (
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "260px 1fr",
                        gap: 20,
                        alignItems: "start",
                    }}
                >
                    {/* ================= LEFT: список ================= */}
                    <div style={{ border: "1px solid #ddd", borderRadius: 12, padding: 12 }}>
                        <div style={{ fontWeight: 700, marginBottom: 10 }}>Список</div>

                        <div style={{ display: "grid", gap: 10 }}>
                            {chars.map((c) => (
                                <button
                                    key={c.id}
                                    onClick={() => setSelectedId(c.id)}
                                    style={{
                                        border: c.id === selectedId ? "1px solid #888" : "1px solid #ccc",
                                        borderRadius: 10,
                                        padding: 8,
                                        textAlign: "left",
                                        background:
                                            c.id === selectedId ? "rgba(255,255,255,0.15)" : "transparent",
                                    }}
                                >
                                    <div style={{ fontWeight: 800 }}>{c.name}</div>
                                    <div style={{ fontSize: 13, opacity: 0.8 }}>
                                        {c.class} • Lv {c.level}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* ================= RIGHT: экран персонажа ================= */}
                    {selected && (
                        <div
                            style={{
                                border: "1px solid #ddd",
                                borderRadius: 12,
                                padding: 16,
                            }}
                        >
                            {/* Верх */}
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                                {TOP_SLOTS.map((s) => renderSlot(s, selected))}
                            </div>

                            <div style={{ height: 20 }} />

                            {/* Центр */}
                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "200px 1fr 200px",
                                    gap: 20,
                                }}
                            >
                                {/* Левая колонка */}
                                <div style={{ display: "grid", gap: 10 }}>
                                    {LEFT_SLOTS.map((s) => renderSlot(s, selected))}
                                </div>

                                {/* Центр – персонаж */}
                                <div
                                    style={{
                                        border: "1px solid #aaa",
                                        borderRadius: 12,
                                        minHeight: 420,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontSize: 18,
                                        fontWeight: 700,
                                        opacity: 0.7,
                                    }}
                                >
                                    {selected.name}
                                </div>

                                {/* Правая колонка */}
                                <div style={{ display: "grid", gap: 10 }}>
                                    {RIGHT_SLOTS.map((s) => renderSlot(s, selected))}
                                </div>
                            </div>

                            <div style={{ height: 20 }} />

                            {/* Низ */}
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
                                {BOTTOM_SLOTS.map((s) => renderSlot(s, selected))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}