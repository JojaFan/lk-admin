import React, { useEffect, useState } from "react";

const API = "/api";

async function safeJson(res) {
    const text = await res.text();
    try {
        return text ? JSON.parse(text) : null;
    } catch {
        return null;
    }
}

export default function LkMarafones() {
    const [status, setStatus] = useState("active"); // active|future|past
    const [items, setItems] = useState([]);
    const [err, setErr] = useState("");

    const [openId, setOpenId] = useState(null);
    const [events, setEvents] = useState([]);
    const [eventsErr, setEventsErr] = useState("");

    async function load() {
        setErr("");
        setOpenId(null);
        setEvents([]);
        setEventsErr("");

        const res = await fetch(`${API}/lk/marathons?status=${encodeURIComponent(status)}`, {
            credentials: "include",
        });
        const j = await safeJson(res);

        if (!res.ok || !j?.ok) {
            setItems([]);
            setErr(j?.error || j?.message || `HTTP ${res.status}`);
            return;
        }

        const list = j.items || j.marathons || j.data || [];
        setItems(Array.isArray(list) ? list : []);
    }

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [status]);

    async function openMarathon(id) {
        setOpenId(id);
        setEvents([]);
        setEventsErr("");

        const res = await fetch(`/api/lk/marathons/${id}`, { credentials: "include" });
        const j = await safeJson(res);

        if (!res.ok || !j?.ok) {
            setEventsErr(j?.error || j?.message || `HTTP ${res.status}`);

            return;
        }

        const list = j.items || j.events || j.data || [];
        setEvents(Array.isArray(list) ? list : []);
    }

    async function claim(eventId) {
        const res = await fetch(`${API}/lk/marathons/events/${eventId}/claim`, {
            method: "POST",
            credentials: "include",
        });
        const j = await safeJson(res);

        if (!res.ok || !j?.ok) {
            alert(j?.error || j?.message || `HTTP ${res.status}`);
            return;
        }

        alert(j.message || "OK");
        // можно перезагрузить события, чтобы обновить статус
        if (openId) openMarathon(openId);
    }

    return (
        <div>
            <h2>Марафоны</h2>

            <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
                <span>Фильтр:</span>
                <select value={status} onChange={(e) => setStatus(e.target.value)}>
                    <option value="active">Active</option>
                    <option value="future">Future</option>
                    <option value="past">Past</option>
                </select>

                <button onClick={load}>Reload</button>
            </div>

            {err && <div style={{ color: "crimson" }}>Ошибка: {err}</div>}

            <table border="1" cellPadding="6" style={{ borderCollapse: "collapse", width: "100%" }}>
                <thead>
                <tr>
                    <th>ID</th>
                    <th>Название</th>
                    <th>Период</th>
                    <th>Действия</th>
                </tr>
                </thead>
                <tbody>
                {items.map((m) => (
                    <tr key={m.id}>
                        <td>{m.id}</td>
                        <td>{m.title}</td>
                        <td>
                            {m.start_at} — {m.end_at}
                        </td>
                        <td>
                            <button onClick={() => openMarathon(m.id)}>Открыть</button>
                        </td>
                    </tr>
                ))}

                {items.length === 0 && (
                    <tr>
                        <td colSpan="4">Пока пусто</td>
                    </tr>
                )}
                </tbody>
            </table>

            {openId && (
                <div style={{ marginTop: 16 }}>
                    <h3>События марафона #{openId}</h3>
                    {eventsErr && <div style={{ color: "crimson" }}>Ошибка: {eventsErr}</div>}

                    <table border="1" cellPadding="6" style={{ borderCollapse: "collapse", width: "100%" }}>
                        <thead>
                        <tr>
                            <th>ID</th>
                            <th>Title</th>
                            <th>Период</th>
                            <th>Действия</th>
                        </tr>
                        </thead>
                        <tbody>
                        {events.map((e) => (
                            <tr key={e.id}>
                                <td>{e.id}</td>
                                <td>{e.title}</td>
                                <td>
                                    {e.start_at} — {e.end_at}
                                </td>
                                <td>
                                    <button onClick={() => claim(e.id)}>Claim</button>
                                </td>
                            </tr>
                        ))}

                        {events.length === 0 && (
                            <tr>
                                <td colSpan="4">Пока пусто</td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}