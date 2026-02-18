import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

const API = "/api";

async function safeJson(res) {
    const text = await res.text();
    try { return text ? JSON.parse(text) : null; } catch { return null; }
}

export default function AdminMarathonView() {
    const { id } = useParams();
    const marathonId = Number(id);

    const [stats, setStats] = useState(null);
    const [events, setEvents] = useState([]);
    const [err, setErr] = useState("");

    // create event form
    const [newEvent, setNewEvent] = useState({
        title: "",
        description: "",
        start_at: "",
        end_at: "",
        is_enabled: 1,
        sort: 0,
    });

    // edit event
    const [editId, setEditId] = useState(null);
    const [editEvent, setEditEvent] = useState(null);

    // rewards per eventId
    const [rewardsByEvent, setRewardsByEvent] = useState({}); // { [eventId]: {open, items, loading, err, newReward} }

    async function loadStats() {
        const res = await fetch(`${API}/admin/marathons/${marathonId}/stats`, { credentials: "include" });
        const j = await safeJson(res);
        if (!res.ok || !j?.ok) throw new Error(j?.error || j?.message || `HTTP ${res.status}`);
        setStats(j);
    }

    async function loadEvents() {
        const res = await fetch(`${API}/admin/marathons/${marathonId}/events`, { credentials: "include" });
        const j = await safeJson(res);
        if (!res.ok || !j?.ok) throw new Error(j?.error || j?.message || `HTTP ${res.status}`);
        setEvents(j.items || []);
    }

    async function reloadAll() {
        try {
            setErr("");
            await Promise.all([loadStats(), loadEvents()]);
        } catch (e) {
            setErr(String(e?.message || e));
        }
    }

    useEffect(() => {
        if (!Number.isFinite(marathonId)) {
            setErr("bad marathon id");
            return;
        }
        reloadAll();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [marathonId]);

    async function createEvent() {
        try {
            setErr("");
            const res = await fetch(`${API}/admin/marathons/${marathonId}/events`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newEvent),
            });
            const j = await safeJson(res);
            if (!res.ok || !j?.ok) throw new Error(j?.error || j?.message || `HTTP ${res.status}`);
            setNewEvent({ title: "", description: "", start_at: "", end_at: "", is_enabled: 1, sort: 0 });
            await loadEvents();
        } catch (e) {
            setErr(String(e?.message || e));
        }
    }

    function beginEdit(ev) {
        setEditId(ev.id);
        setEditEvent({
            title: ev.title ?? "",
            description: ev.description ?? "",
            start_at: ev.start_at ?? "",
            end_at: ev.end_at ?? "",
            is_enabled: ev.is_enabled ?? 1,
            sort: ev.sort ?? 0,
        });
    }

    async function saveEdit() {
        try {
            setErr("");
            const res = await fetch(`${API}/admin/events/${editId}`, {
                method: "PUT",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(editEvent),
            });
            const j = await safeJson(res);
            if (!res.ok || !j?.ok) throw new Error(j?.error || j?.message || `HTTP ${res.status}`);
            setEditId(null);
            setEditEvent(null);
            await loadEvents();
        } catch (e) {
            setErr(String(e?.message || e));
        }
    }

    async function deleteEvent(eventId) {
        if (!window.confirm(`Удалить event #${eventId}?`)) return;
        try {
            setErr("");
            const res = await fetch(`${API}/admin/events/${eventId}`, {
                method: "DELETE",
                credentials: "include",
            });
            const j = await safeJson(res);
            if (!res.ok || !j?.ok) throw new Error(j?.error || j?.message || `HTTP ${res.status}`);
            await loadEvents();
        } catch (e) {
            setErr(String(e?.message || e));
        }
    }

    // Rewards
    function ensureRewardState(eventId) {
        setRewardsByEvent((prev) => {
            if (prev[eventId]) return prev;
            return {
                ...prev,
                [eventId]: {
                    open: false,
                    items: [],
                    loading: false,
                    err: "",
                    newReward: { item_id: "", amount: 1, probability: 1, title: "", description: "", sort: 0, is_enabled: 1 },
                },
            };
        });
    }

    async function toggleRewards(eventId) {
        ensureRewardState(eventId);

        setRewardsByEvent((prev) => ({
            ...prev,
            [eventId]: { ...prev[eventId], open: !prev[eventId]?.open },
        }));

        // если открываем — грузим
        const now = rewardsByEvent[eventId];
        if (!now?.open) {
            await loadRewards(eventId);
        }
    }

    async function loadRewards(eventId) {
        ensureRewardState(eventId);
        setRewardsByEvent((prev) => ({
            ...prev,
            [eventId]: { ...prev[eventId], loading: true, err: "" },
        }));

        try {
            const res = await fetch(`${API}/admin/events/${eventId}/rewards`, { credentials: "include" });
            const j = await safeJson(res);
            if (!res.ok || !j?.ok) throw new Error(j?.error || j?.message || `HTTP ${res.status}`);

            setRewardsByEvent((prev) => ({
                ...prev,
                [eventId]: { ...prev[eventId], items: j.items || [], loading: false },
            }));
        } catch (e) {
            setRewardsByEvent((prev) => ({
                ...prev,
                [eventId]: { ...prev[eventId], err: String(e?.message || e), loading: false },
            }));
        }
    }

    async function createReward(eventId) {
        const st = rewardsByEvent[eventId];
        if (!st) return;
        try {
            const dto = {
                ...st.newReward,
                item_id: st.newReward.item_id === "" ? undefined : Number(st.newReward.item_id),
                amount: Number(st.newReward.amount || 1),
                probability: Number(st.newReward.probability || 1),
                sort: Number(st.newReward.sort || 0),
                is_enabled: Number(st.newReward.is_enabled ?? 1),
            };

            const res = await fetch(`${API}/admin/events/${eventId}/rewards`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(dto),
            });
            const j = await safeJson(res);
            if (!res.ok || !j?.ok) throw new Error(j?.error || j?.message || `HTTP ${res.status}`);

            // reset form + reload list
            setRewardsByEvent((prev) => ({
                ...prev,
                [eventId]: {
                    ...prev[eventId],
                    newReward: { item_id: "", amount: 1, probability: 1, title: "", description: "", sort: 0, is_enabled: 1 },
                },
            }));
            await loadRewards(eventId);
        } catch (e) {
            setRewardsByEvent((prev) => ({
                ...prev,
                [eventId]: { ...prev[eventId], err: String(e?.message || e) },
            }));
        }
    }

    async function deleteReward(rewardId, eventId) {
        if (!window.confirm(`Удалить reward #${rewardId}?`)) return;
        try {
            const res = await fetch(`${API}/admin/rewards/${rewardId}`, {
                method: "DELETE",
                credentials: "include",
            });
            const j = await safeJson(res);
            if (!res.ok || !j?.ok) throw new Error(j?.error || j?.message || `HTTP ${res.status}`);
            await loadRewards(eventId);
        } catch (e) {
            setRewardsByEvent((prev) => ({
                ...prev,
                [eventId]: { ...prev[eventId], err: String(e?.message || e) },
            }));
        }
    }

    return (
        <div>
            <h2>Марафон #{marathonId}</h2>

            {err && <div style={{ color: "crimson" }}>Ошибка: {err}</div>}

            <div style={{ marginTop: 10 }}>
                <button onClick={reloadAll}>Reload</button>
            </div>

            <h3 style={{ marginTop: 16 }}>Stats</h3>
            <pre style={{ background: "#f6f6f6", padding: 10 }}>
        {stats ? JSON.stringify(stats, null, 2) : "loading..."}
      </pre>

            <hr />

            <h3>Events</h3>

            {/* Create */}
            <div style={{ border: "1px solid #ddd", padding: 10, borderRadius: 6, marginBottom: 12 }}>
                <div style={{ fontWeight: 700, marginBottom: 8 }}>Добавить событие</div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <label>
                        Title
                        <input
                            value={newEvent.title}
                            onChange={(e) => setNewEvent((s) => ({ ...s, title: e.target.value }))}
                            style={{ width: "100%" }}
                        />
                    </label>
                    <label>
                        Sort
                        <input
                            type="number"
                            value={newEvent.sort}
                            onChange={(e) => setNewEvent((s) => ({ ...s, sort: Number(e.target.value) }))}
                            style={{ width: "100%" }}
                        />
                    </label>

                    <label>
                        Start (YYYY-MM-DD HH:mm:ss)
                        <input
                            value={newEvent.start_at}
                            onChange={(e) => setNewEvent((s) => ({ ...s, start_at: e.target.value }))}
                            placeholder="2026-02-17 00:00:00"
                            style={{ width: "100%" }}
                        />
                    </label>
                    <label>
                        End (YYYY-MM-DD HH:mm:ss)
                        <input
                            value={newEvent.end_at}
                            onChange={(e) => setNewEvent((s) => ({ ...s, end_at: e.target.value }))}
                            placeholder="2026-02-20 23:59:59"
                            style={{ width: "100%" }}
                        />
                    </label>

                    <label style={{ gridColumn: "1 / -1" }}>
                        Description
                        <input
                            value={newEvent.description}
                            onChange={(e) => setNewEvent((s) => ({ ...s, description: e.target.value }))}
                            style={{ width: "100%" }}
                        />
                    </label>

                    <label>
                        Enabled (0/1)
                        <input
                            type="number"
                            value={newEvent.is_enabled}
                            onChange={(e) => setNewEvent((s) => ({ ...s, is_enabled: Number(e.target.value) }))}
                            style={{ width: "100%" }}
                        />
                    </label>

                    <div style={{ alignSelf: "end" }}>
                        <button onClick={createEvent}>Create</button>
                    </div>
                </div>
            </div>

            {/* List */}
            <table border="1" cellPadding="6" style={{ borderCollapse: "collapse", width: "100%" }}>
                <thead>
                <tr>
                    <th>ID</th>
                    <th>Title</th>
                    <th>Start</th>
                    <th>End</th>
                    <th>Enabled</th>
                    <th>Sort</th>
                    <th>Actions</th>
                </tr>
                </thead>
                <tbody>
                {events.map((ev) => (
                    <React.Fragment key={ev.id}>
                        <tr>
                            <td>{ev.id}</td>
                            <td>{ev.title}</td>
                            <td>{ev.start_at}</td>
                            <td>{ev.end_at}</td>
                            <td>{ev.is_enabled}</td>
                            <td>{ev.sort}</td>
                            <td style={{ whiteSpace: "nowrap" }}>
                                <button onClick={() => beginEdit(ev)}>Edit</button>{" "}
                                <button onClick={() => deleteEvent(ev.id)}>Delete</button>{" "}
                                <button onClick={() => toggleRewards(ev.id)}>Rewards</button>
                            </td>
                        </tr>

                        {/* Edit row */}
                        {editId === ev.id && editEvent && (
                            <tr>
                                <td colSpan="7">
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10 }}>
                                        <label>
                                            Title
                                            <input
                                                value={editEvent.title}
                                                onChange={(e) => setEditEvent((s) => ({ ...s, title: e.target.value }))}
                                                style={{ width: "100%" }}
                                            />
                                        </label>
                                        <label>
                                            Sort
                                            <input
                                                type="number"
                                                value={editEvent.sort}
                                                onChange={(e) => setEditEvent((s) => ({ ...s, sort: Number(e.target.value) }))}
                                                style={{ width: "100%" }}
                                            />
                                        </label>
                                        <label>
                                            Start
                                            <input
                                                value={editEvent.start_at}
                                                onChange={(e) => setEditEvent((s) => ({ ...s, start_at: e.target.value }))}
                                                style={{ width: "100%" }}
                                            />
                                        </label>
                                        <label>
                                            End
                                            <input
                                                value={editEvent.end_at}
                                                onChange={(e) => setEditEvent((s) => ({ ...s, end_at: e.target.value }))}
                                                style={{ width: "100%" }}
                                            />
                                        </label>

                                        <label style={{ gridColumn: "1 / -1" }}>
                                            Description
                                            <input
                                                value={editEvent.description}
                                                onChange={(e) => setEditEvent((s) => ({ ...s, description: e.target.value }))}
                                                style={{ width: "100%" }}
                                            />
                                        </label>

                                        <label>
                                            Enabled (0/1)
                                            <input
                                                type="number"
                                                value={editEvent.is_enabled}
                                                onChange={(e) => setEditEvent((s) => ({ ...s, is_enabled: Number(e.target.value) }))}
                                                style={{ width: "100%" }}
                                            />
                                        </label>

                                        <div style={{ alignSelf: "end" }}>
                                            <button onClick={saveEdit}>Save</button>{" "}
                                            <button onClick={() => { setEditId(null); setEditEvent(null); }}>Cancel</button>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        )}

                        {/* Rewards block */}
                        {rewardsByEvent[ev.id]?.open && (
                            <tr>
                                <td colSpan="7">
                                    <div style={{ padding: 10, border: "1px solid #eee", borderRadius: 6 }}>
                                        <div style={{ fontWeight: 700, marginBottom: 8 }}>Rewards for event #{ev.id}</div>

                                        {rewardsByEvent[ev.id]?.err && (
                                            <div style={{ color: "crimson" }}>Ошибка: {rewardsByEvent[ev.id].err}</div>
                                        )}

                                        <div style={{ marginBottom: 10 }}>
                                            <button onClick={() => loadRewards(ev.id)} disabled={rewardsByEvent[ev.id]?.loading}>
                                                {rewardsByEvent[ev.id]?.loading ? "Loading..." : "Reload rewards"}
                                            </button>
                                        </div>

                                        {/* create reward */}
                                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10, marginBottom: 10 }}>
                                            <label>
                                                item_id
                                                <input
                                                    value={rewardsByEvent[ev.id]?.newReward?.item_id ?? ""}
                                                    onChange={(e) =>
                                                        setRewardsByEvent((prev) => ({
                                                            ...prev,
                                                            [ev.id]: { ...prev[ev.id], newReward: { ...prev[ev.id].newReward, item_id: e.target.value } },
                                                        }))
                                                    }
                                                    style={{ width: "100%" }}
                                                />
                                            </label>
                                            <label>
                                                amount
                                                <input
                                                    type="number"
                                                    value={rewardsByEvent[ev.id]?.newReward?.amount ?? 1}
                                                    onChange={(e) =>
                                                        setRewardsByEvent((prev) => ({
                                                            ...prev,
                                                            [ev.id]: { ...prev[ev.id], newReward: { ...prev[ev.id].newReward, amount: Number(e.target.value) } },
                                                        }))
                                                    }
                                                    style={{ width: "100%" }}
                                                />
                                            </label>
                                            <label>
                                                probability
                                                <input
                                                    type="number"
                                                    value={rewardsByEvent[ev.id]?.newReward?.probability ?? 1}
                                                    onChange={(e) =>
                                                        setRewardsByEvent((prev) => ({
                                                            ...prev,
                                                            [ev.id]: { ...prev[ev.id], newReward: { ...prev[ev.id].newReward, probability: Number(e.target.value) } },
                                                        }))
                                                    }
                                                    style={{ width: "100%" }}
                                                />
                                            </label>
                                            <label>
                                                enabled (0/1)
                                                <input
                                                    type="number"
                                                    value={rewardsByEvent[ev.id]?.newReward?.is_enabled ?? 1}
                                                    onChange={(e) =>
                                                        setRewardsByEvent((prev) => ({
                                                            ...prev,
                                                            [ev.id]: { ...prev[ev.id], newReward: { ...prev[ev.id].newReward, is_enabled: Number(e.target.value) } },
                                                        }))
                                                    }
                                                    style={{ width: "100%" }}
                                                />
                                            </label>

                                            <label style={{ gridColumn: "1 / -1" }}>
                                                title
                                                <input
                                                    value={rewardsByEvent[ev.id]?.newReward?.title ?? ""}
                                                    onChange={(e) =>
                                                        setRewardsByEvent((prev) => ({
                                                            ...prev,
                                                            [ev.id]: { ...prev[ev.id], newReward: { ...prev[ev.id].newReward, title: e.target.value } },
                                                        }))
                                                    }
                                                    style={{ width: "100%" }}
                                                />
                                            </label>

                                            <div>
                                                <button onClick={() => createReward(ev.id)}>Add reward</button>
                                            </div>
                                        </div>

                                        {/* list rewards */}
                                        <table border="1" cellPadding="6" style={{ borderCollapse: "collapse", width: "100%" }}>
                                            <thead>
                                            <tr>
                                                <th>ID</th>
                                                <th>item_id</th>
                                                <th>amount</th>
                                                <th>probability</th>
                                                <th>enabled</th>
                                                <th>Actions</th>
                                            </tr>
                                            </thead>
                                            <tbody>
                                            {(rewardsByEvent[ev.id]?.items || []).map((r) => (
                                                <tr key={r.id}>
                                                    <td>{r.id}</td>
                                                    <td>{r.item_id ?? r.itemid ?? ""}</td>
                                                    <td>{r.amount ?? r.count ?? r.qty ?? ""}</td>
                                                    <td>{r.probability ?? ""}</td>
                                                    <td>{r.is_enabled ?? ""}</td>
                                                    <td>
                                                        <button onClick={() => deleteReward(r.id, ev.id)}>Delete</button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {(rewardsByEvent[ev.id]?.items || []).length === 0 && (
                                                <tr><td colSpan="6">Пока пусто</td></tr>
                                            )}
                                            </tbody>
                                        </table>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </React.Fragment>
                ))}

                {events.length === 0 && (
                    <tr>
                        <td colSpan="7">Пока пусто</td>
                    </tr>
                )}
                </tbody>
            </table>
        </div>
    );
}