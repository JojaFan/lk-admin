import { useEffect, useMemo, useState } from "react";

export default function LkReferrals() {
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");
    const [data, setData] = useState(null);

    const API_BASE = "http://localhost:3000";
    const api = (path) => `${API_BASE}${path}`;

    useEffect(() => {
        (async () => {
            try {
                setErr("");
                setLoading(true);

                const r = await fetch(api("/lk/referrals"), { credentials: "include" });
                const d = await r.json();
                if (!r.ok || !d?.ok) throw new Error(d?.message || "Referrals API error");

                setData(d);
            } catch (e) {
                setErr(e?.message || "Error");
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const invitedByText = useMemo(() => {
        if (!data?.invitedBy) return "Вас никто не приглашал";
        const nick = data.invitedBy.nick || "Unknown";
        const joinedAt = data.invitedBy.joinedAt ? ` (с ${data.invitedBy.joinedAt})` : "";
        return `${nick}${joinedAt}`;
    }, [data]);

    if (loading) return <div>Loading…</div>;
    if (err) return <div style={{ color: "crimson" }}>{err}</div>;

    const invited = data?.invited || [];
    const rewards = data?.rewards?.available || [];

    return (
        <div>
            <h2>Рефералы</h2>

            <div style={{ marginBottom: 16 }}>
                <div style={{ fontWeight: 700 }}>Кто пригласил:</div>
                <div>{invitedByText}</div>
            </div>

            <div style={{ marginBottom: 16 }}>
                <div style={{ fontWeight: 700, marginBottom: 8 }}>Приглашённые:</div>

                {invited.length === 0 ? (
                    <div style={{ opacity: 0.8 }}>Пока нет приглашённых</div>
                ) : (
                    <table border="1" cellPadding="8" style={{ borderCollapse: "collapse" }}>
                        <thead>
                        <tr>
                            <th>Ник</th>
                            <th>Статус</th>
                            <th>Онлайн персонаж</th>
                        </tr>
                        </thead>
                        <tbody>
                        {invited.map((u) => (
                            <tr key={u.id}>
                                <td>{u.nick}</td>
                                <td>{u.online ? "online" : "offline"}</td>
                                <td>{u.online ? (u.onlineChar || "-") : "-"}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                )}
            </div>

            <div>
                <div style={{ fontWeight: 700, marginBottom: 8 }}>Награды:</div>

                {rewards.length === 0 ? (
                    <div style={{ opacity: 0.8 }}>Награды пока не настроены</div>
                ) : (
                    <div style={{ display: "grid", gap: 10, maxWidth: 620 }}>
                        {rewards.map((r) => (
                            <div key={r.id} style={{ border: "1px solid #ddd", padding: 12, borderRadius: 8 }}>
                                <div style={{ fontWeight: 700 }}>{r.title}</div>
                                <div>Статус: <b>{r.status}</b></div>
                                <div>Награда: <b>{r.reward}</b></div>
                                <button
                                    style={{ marginTop: 8 }}
                                    onClick={() => alert("Получение наград позже 🙂")}
                                    disabled={r.status !== "done"}
                                    title={r.status !== "done" ? "Пока недоступно" : "Заглушка"}
                                >
                                    Забрать (заглушка)
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {data?.rewards?.note ? <p style={{ opacity: 0.75 }}>{data.rewards.note}</p> : null}
            </div>
        </div>
    );
}