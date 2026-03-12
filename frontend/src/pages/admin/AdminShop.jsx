import React, { useEffect, useState } from "react";
import {
    adminGetShopProducts,
    adminCreateShopProduct,
    adminUpdateShopProduct,
    adminDeleteShopProduct,
} from "../../api/client.js";

function toInt(v, def = 0) {
    const n = Number(v);
    return Number.isFinite(n) ? n : def;
}

export default function AdminShop() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");

    // форма "Добавить"
    const [newItemId, setNewItemId] = useState("");
    const [newStack, setNewStack] = useState("1");
    const [newPrice, setNewPrice] = useState("0");

    // режим редактирования
    const [editId, setEditId] = useState(null);
    const [editStack, setEditStack] = useState("");
    const [editPrice, setEditPrice] = useState("");

    async function load() {
        setLoading(true);
        setErr("");
        try {
            const j = await adminGetShopProducts();
            if (!j?.ok) throw new Error(j?.error || "Failed to load");
            setItems(j.items || []);
        } catch (e) {
            setErr(String(e?.message || e));
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        load();
    }, []);

    async function onAdd() {
        setErr("");
        try {
            const body = {
                itemId: toInt(newItemId),
                stackCount: toInt(newStack, 1),
                price: toInt(newPrice, 0),
                isEnabled: true,
                sortOrder: 0,
            };
            const j = await adminCreateShopProduct(body);
            if (!j?.ok) throw new Error(j?.error || "Create failed");
            setNewItemId("");
            setNewStack("1");
            setNewPrice("0");
            await load();
        } catch (e) {
            setErr(String(e?.message || e));
        }
    }

    function startEdit(row) {
        setEditId(row.id);
        setEditStack(String(row.stackCount));
        setEditPrice(String(row.price));
    }

    function cancelEdit() {
        setEditId(null);
        setEditStack("");
        setEditPrice("");
    }

    async function saveEdit(id) {
        setErr("");
        try {
            const j = await adminUpdateShopProduct(id, {
                stackCount: toInt(editStack, 1),
                price: toInt(editPrice, 0),
            });
            if (!j?.ok) throw new Error(j?.error || "Update failed");
            cancelEdit();
            await load();
        } catch (e) {
            setErr(String(e?.message || e));
        }
    }

    async function remove(id) {
        if (!confirm("Удалить товар?")) return;
        setErr("");
        try {
            const j = await adminDeleteShopProduct(id);
            if (!j?.ok) throw new Error(j?.error || "Delete failed");
            await load();
        } catch (e) {
            setErr(String(e?.message || e));
        }
    }

    return (
        <div style={{ padding: 16 }}>
            <h2>Магазин (админ)</h2>

            {err ? (
                <div style={{ color: "crimson", marginBottom: 12 }}>
                    {err}
                </div>
            ) : null}

            <div style={{ display: "flex", gap: 8, alignItems: "end", marginBottom: 16, flexWrap: "wrap" }}>
                <div>
                    <div style={{ fontSize: 12, opacity: 0.8 }}>ID предмета (item_id)</div>
                    <input value={newItemId} onChange={(e) => setNewItemId(e.target.value)} placeholder="например 2940" />
                </div>
                <div>
                    <div style={{ fontSize: 12, opacity: 0.8 }}>Кол-во в стеке</div>
                    <input value={newStack} onChange={(e) => setNewStack(e.target.value)} placeholder="10" />
                </div>
                <div>
                    <div style={{ fontSize: 12, opacity: 0.8 }}>Цена</div>
                    <input value={newPrice} onChange={(e) => setNewPrice(e.target.value)} placeholder="1000" />
                </div>

                <button onClick={onAdd} disabled={!newItemId}>
                    Добавить товар
                </button>

                <button onClick={load} disabled={loading}>
                    Обновить
                </button>
            </div>

            {loading ? <div>Загрузка...</div> : null}

            <div style={{ overflowX: "auto" }}>
                <table style={{ borderCollapse: "collapse", minWidth: 800 }}>
                    <thead>
                    <tr>
                        {["ID", "item_id", "Название", "Стек", "Цена", "Enabled", "Действия"].map((h) => (
                            <th key={h} style={{ borderBottom: "1px solid #ddd", textAlign: "left", padding: 8 }}>
                                {h}
                            </th>
                        ))}
                    </tr>
                    </thead>
                    <tbody>
                    {items.map((r) => {
                        const isEdit = editId === r.id;
                        return (
                            <tr key={r.id}>
                                <td style={{ borderBottom: "1px solid #f0f0f0", padding: 8 }}>{r.id}</td>
                                <td style={{ borderBottom: "1px solid #f0f0f0", padding: 8 }}>{r.itemId}</td>
                                <td style={{ borderBottom: "1px solid #f0f0f0", padding: 8 }}>
                                    {r.itemName ?? <span style={{ color: "#999" }}>не найдено</span>}
                                </td>

                                <td style={{ borderBottom: "1px solid #f0f0f0", padding: 8 }}>
                                    {isEdit ? (
                                        <input value={editStack} onChange={(e) => setEditStack(e.target.value)} style={{ width: 80 }} />
                                    ) : (
                                        r.stackCount
                                    )}
                                </td>

                                <td style={{ borderBottom: "1px solid #f0f0f0", padding: 8 }}>
                                    {isEdit ? (
                                        <input value={editPrice} onChange={(e) => setEditPrice(e.target.value)} style={{ width: 120 }} />
                                    ) : (
                                        r.price
                                    )}
                                </td>

                                <td style={{ borderBottom: "1px solid #f0f0f0", padding: 8 }}>
                                    {r.isEnabled ? "Да" : "Нет"}
                                </td>

                                <td style={{ borderBottom: "1px solid #f0f0f0", padding: 8, display: "flex", gap: 8 }}>
                                    {isEdit ? (
                                        <>
                                            <button onClick={() => saveEdit(r.id)}>Сохранить</button>
                                            <button onClick={cancelEdit}>Отмена</button>
                                        </>
                                    ) : (
                                        <>
                                            <button onClick={() => startEdit(r)}>Изменить</button>
                                            <button onClick={() => remove(r.id)}>Удалить</button>
                                        </>
                                    )}
                                </td>
                            </tr>
                        );
                    })}
                    {items.length === 0 ? (
                        <tr>
                            <td colSpan={7} style={{ padding: 12, opacity: 0.7 }}>
                                Пока нет товаров
                            </td>
                        </tr>
                    ) : null}
                    </tbody>
                </table>
            </div>
        </div>
    );
}