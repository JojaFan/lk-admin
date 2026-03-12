import { useEffect, useMemo, useState } from "react";
import { apiGet } from "../../api/client";

export default function LkReferrals() {
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");
    const [data, setData] = useState(null);

    async function load() {
        setErr("");
        setLoading(true);
        try {
            const d = await apiGet("/lk/referrals"); // ВАЖНО: только через apiGet (/api -> proxy -> 3000)
            if (!d?.ok) throw new Error(d?.message || "Referrals API error");
            setData(d);
        } catch (e) {
            setErr(String(e?.message || e));
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        load();
    }, []);

    const invitedByText = useMemo(() => {
        if (!data?.invitedBy) return "Вас никто не приглашал";
        const login = data.invitedBy.login || "Unknown";
        const joinedAt = data.invitedBy.joinedAt ? ` (с ${data.invitedBy.joinedAt})` : "";
        return `${login}${joinedAt}`;
    }, [data?.invitedBy]);

    if (loading) return <div>Loading…</div>;
    if (err) return <div style={{ color: "crimson" }}>{err}</div>;

    const invited = data?.invited || [];

    return (
        <div>
            <h2>Рефералы</h2>

            <div style={{ marginBottom: 16 }}>
                <div style={{ fontWeight: 700 }}>Кто пригласил:</div>
                <div>{invitedByText}</div>
            </div>

            <div style={{ marginBottom: 16 }}>
                <div style={{ fontWeight: 700, marginBottom: 8 }}>
                    Приглашённые: <span style={{ opacity: 0.8 }}>({data?.total ?? invited.length})</span>
                </div>

                {invited.length === 0 ? (
                    <div style={{ opacity: 0.8 }}>Пока нет приглашённых</div>
                ) : (
                    <table cellPadding="8" style={{ borderCollapse: "collapse", width: "100%", maxWidth: 520 }}>
                        <thead>
                        <tr style={{ borderBottom: "1px solid #ddd" }}>
                            <th align="left">Логин</th>
                            <th align="left">Дата регистрации</th>
                        </tr>
                        </thead>
                        <tbody>
                        {invited.map((u) => (
                            <tr key={u.id} style={{ borderTop: "1px solid #eee" }}>
                                <td>{u.login}</td>
                                <td>{u.createdAt || "-"}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                )}
            </div>

            <button onClick={load}>Обновить</button>
        </div>
    );
}