import React, { useState } from "react";

const API = "/api";

async function safeJson(res) {
    const text = await res.text();
    try {
        return text ? JSON.parse(text) : null;
    } catch {
        return null;
    }
}

export default function AdminGrantItems() {
    const [userId, setUserId] = useState("");
    const [itemId, setItemId] = useState("");
    const [amount, setAmount] = useState("1");
    const [msg, setMsg] = useState("");

    async function grant() {
        setMsg("");

        const body = {
            userId: Number(userId),
            item_id: Number(itemId),
            amount: Number(amount || 1),
        };

        const res = await fetch(`${API}/admin/inventory/grant`, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });

        const j = await safeJson(res);

        if (!res.ok || !j?.ok) {
            setMsg(`Ошибка: ${j?.error || j?.message || `HTTP ${res.status}`}`);
            return;
        }

        setMsg(`✅ Выдано! userId=${body.userId}, item_id=${body.item_id}, amount=${body.amount}`);
    }

    return (
        <div>
            <h2>Выдача предметов (LK Inventory)</h2>

            <div style={{ display: "grid", gap: 10, maxWidth: 420 }}>
                <label>
                    User ID (из ЛК)
                    <input value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="например 1" />
                </label>

                <label>
                    Item ID
                    <input value={itemId} onChange={(e) => setItemId(e.target.value)} placeholder="например 55" />
                </label>

                <label>
                    Amount
                    <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="1" />
                </label>

                <button onClick={grant}>Выдать</button>

                {msg && <div style={{ marginTop: 10, color: msg.startsWith("✅") ? "green" : "crimson" }}>{msg}</div>}
            </div>

            <div style={{ marginTop: 16, fontSize: 12, opacity: 0.75 }}>
                * Это выдаёт предмет в таблицу <code>lk_inventory</code>.
                Потом игрок увидит его в <b>ЛК → Инвентарь</b>.
            </div>
        </div>
    );
}