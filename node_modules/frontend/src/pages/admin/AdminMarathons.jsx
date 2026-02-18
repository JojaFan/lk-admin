import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const API = "/api";

async function safeJson(res) {
    const text = await res.text();
    try {
        return text ? JSON.parse(text) : null;
    } catch {
        return null;
    }
}

export default function AdminMarathons() {
    const [items, setItems] = useState([]);
    const [err, setErr] = useState("");

    async function load() {
        setErr("");

        const res = await fetch(`${API}/admin/marathons`, {
            credentials: "include",
        });

        const j = await safeJson(res);

        if (!res.ok || !j?.ok) {
            setItems([]);
            setErr(j?.error || j?.message || `HTTP ${res.status}`);
            return;
        }

        // поддержим разные форматы ответа:
        const list = j.items || j.marathons || j.data || [];
        setItems(Array.isArray(list) ? list : []);
    }

    useEffect(() => {
        load();
    }, []);

    return (
        <div>
            <h2>Марафоны</h2>

            {err && <div style={{ color: "crimson" }}>Ошибка: {err}</div>}

            <table border="1" cellPadding="6" style={{ marginTop: 12, borderCollapse: "collapse" }}>
                <thead>
                <tr>
                    <th>ID</th>
                    <th>Название</th>
                    <th>Действия</th>
                </tr>
                </thead>

                <tbody>
                {items.map((m) => (
                    <tr key={m.id}>
                        <td>{m.id}</td>
                        <td>{m.title ?? m.name ?? `Marathon #${m.id}`}</td>
                        <td>
                            <Link to={`/admin/marathons/${m.id}`}>Открыть</Link>
                        </td>
                    </tr>
                ))}

                {items.length === 0 && (
                    <tr>
                        <td colSpan="3">Пока пусто</td>
                    </tr>
                )}
                </tbody>
            </table>

            <div style={{ marginTop: 10 }}>
                <button onClick={load}>Reload</button>
            </div>
        </div>
    );
}