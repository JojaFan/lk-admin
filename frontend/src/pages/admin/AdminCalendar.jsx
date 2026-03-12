import React, { useMemo, useState } from "react";

const API = "/api";
const SLOTS_PER_DAY = 4;

function yyyymm(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    return `${y}-${m}`;
}
function yyyymmdd(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}
async function safeJson(res) {
    const text = await res.text();
    try { return text ? JSON.parse(text) : null; } catch { return null; }
}

export default function AdminCalendar() {
    const [cursor, setCursor] = useState(() => new Date());
    const month = useMemo(() => yyyymm(cursor), [cursor]);

    const [loading, setLoading] = useState(false);
    const [items, setItems] = useState([]); // {day, slot, itemId, qty}
    const [dirty, setDirty] = useState(false);

    const [modal, setModal] = useState(null); // {day, slot}
    const [itemId, setItemId] = useState("");
    const [qty, setQty] = useState("1");

    async function loadMonth() {
        setLoading(true);
        try {
            const r = await fetch(`${API}/admin/calendar?month=${encodeURIComponent(month)}`, { credentials: "include" });
            const j = await safeJson(r);
            if (!j?.ok) throw new Error(j?.error || "Load failed");
            setItems(j.items || []);
            setDirty(false);
        } finally {
            setLoading(false);
        }
    }

    async function saveMonth() {
        setLoading(true);
        try {
            const r = await fetch(`${API}/admin/calendar?month=${encodeURIComponent(month)}`, {
                method: "PUT",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ slotsPerDay: SLOTS_PER_DAY, items }),
            });
            const j = await safeJson(r);
            if (!j?.ok) throw new Error(j?.error || "Save failed");
            setDirty(false);
            alert(`Сохранено: ${j.saved}, удалено: ${j.deleted}`);
        } finally {
            setLoading(false);
        }
    }

    // календарная сетка
    const grid = useMemo(() => {
        const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
        const start = new Date(first);
        const dow = (first.getDay() + 6) % 7; // monday=0
        start.setDate(first.getDate() - dow);

        const days = [];
        for (let i = 0; i < 42; i++) {
            const d = new Date(start);
            d.setDate(start.getDate() + i);
            days.push(d);
        }
        return days;
    }, [cursor]);

    function getSlot(dayStr, slot) {
        return items.find((x) => x.day === dayStr && x.slot === slot) || null;
    }

    function removeSlot(dayStr, slot) {
        setItems((prev) => prev.filter((x) => !(x.day === dayStr && x.slot === slot)));
        setDirty(true);
    }

    function openAdd(dayStr, slot) {
        setModal({ day: dayStr, slot });
        setItemId("");
        setQty("1");
    }

    function confirmAdd() {
        const id = Number(itemId);
        const q = Number(qty);
        if (!Number.isFinite(id) || id <= 0) return alert("Введите корректный itemId");
        if (!Number.isFinite(q) || q <= 0) return alert("Введите корректное количество");

        setItems((prev) => {
            const next = prev.filter((x) => !(x.day === modal.day && x.slot === modal.slot));
            next.push({ day: modal.day, slot: modal.slot, itemId: id, qty: q });
            return next;
        });
        setDirty(true);
        setModal(null);
    }

    return (
        <div className="adminCal">
            <div className="adminCalTop">
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <button className="adminBtn" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}>←</button>
                    <div style={{ fontWeight: 900, fontSize: 18 }}>{month}</div>
                    <button className="adminBtn" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}>→</button>
                </div>

                <div style={{ display: "flex", gap: 8 }}>
                    <button className="adminBtn" onClick={loadMonth} disabled={loading}>Загрузить</button>
                    <button className="adminBtn" onClick={saveMonth} disabled={loading || !dirty}>Сохранить</button>
                </div>
            </div>

            <div className="adminCalGrid">
                {grid.map((d) => {
                    const dayStr = yyyymmdd(d);
                    const inMonth = d.getMonth() === cursor.getMonth();

                    return (
                        <div key={dayStr} className={"adminCalDay" + (inMonth ? "" : " muted")}>
                            <div className="adminCalDayHead">
                                <div>{d.getDate()}</div>
                            </div>

                            <div className="adminCalSlots">
                                {Array.from({ length: SLOTS_PER_DAY }).map((_, slot) => {
                                    const s = getSlot(dayStr, slot);
                                    return (
                                        <div key={slot} className="adminCalSlot">
                                            {s ? (
                                                <>
                                                    <div className="adminCalItem">
                                                        <div className="adminCalItemId">ID: {s.itemId}</div>
                                                        <div className="adminCalItemQty">x{s.qty}</div>
                                                    </div>
                                                    <button className="adminCalMinus" onClick={() => removeSlot(dayStr, slot)} title="Удалить">−</button>
                                                </>
                                            ) : (
                                                <>
                                                    <div className="adminCalEmpty">пусто</div>
                                                    <button className="adminCalPlus" onClick={() => openAdd(dayStr, slot)} title="Добавить">+</button>
                                                </>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>

            {modal && (
                <div className="adminModalOverlay" onClick={() => setModal(null)}>
                    <div className="adminModal" onClick={(e) => e.stopPropagation()}>
                        <div style={{ fontWeight: 900, fontSize: 16, marginBottom: 10 }}>
                            Добавить предмет — {modal.day} (slot {modal.slot})
                        </div>

                        <div style={{ display: "grid", gap: 10 }}>
                            <label>
                                Item ID
                                <input value={itemId} onChange={(e) => setItemId(e.target.value)} placeholder="например 12345" />
                            </label>

                            <label>
                                Количество
                                <input value={qty} onChange={(e) => setQty(e.target.value)} placeholder="1" />
                            </label>

                            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 6 }}>
                                <button className="adminBtn" onClick={() => setModal(null)}>Отмена</button>
                                <button className="adminBtn" onClick={confirmAdd}>ОК</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}