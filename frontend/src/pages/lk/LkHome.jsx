import { useEffect, useMemo, useState } from "react";
import { apiGet, apiPost } from "../../api/client";

export default function LkHome() {
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState("");
    const [home, setHome] = useState(null);
    const [code, setCode] = useState("");

    async function load() {
        setErr("");
        setLoading(true);
        try {
            const j = await apiGet("/lk/home");
            setHome(j);
        } catch (e) {
            setErr(String(e.message || e));
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        load();
    }, []);

    const account = home?.account;
    const promocodes = home?.promocodes;

    const referralLink = useMemo(() => {
        const ref = account?.referralCode || "DEMO-REF";
        return `${window.location.origin}/register?ref=${encodeURIComponent(ref)}`;
    }, [account?.referralCode]);

    async function applyPromocode() {
        const normalized = code.trim();
        if (!normalized) return alert("Введите промокод");

        try {
            const j = await apiPost("/lk/promocodes/apply", { code: normalized });
            alert(j?.message ? j.message : JSON.stringify(j, null, 2));
            setCode("");
            await load();
        } catch (e) {
            alert(String(e.message || e));
        }
    }

    async function copyRef() {
        try {
            await navigator.clipboard.writeText(referralLink);
            alert("Ссылка скопирована ✅");
        } catch {
            alert("Не получилось скопировать — можно выделить вручную.");
        }
    }

    return (
        <div>
            <h2>Главная</h2>

            {err && <div style={{ color: "crimson", marginBottom: 12 }}>{err}</div>}
            {loading && <div>Loading…</div>}

            {!loading && home?.ok && (
                <>
                    <div style={{ border: "1px solid #eee", borderRadius: 10, padding: 12, marginBottom: 16 }}>
                        <h3 style={{ marginTop: 0 }}>Данные аккаунта</h3>
                        <div>Email: <b>{account?.email}</b></div>
                        <div>Username: <b>{account?.username}</b></div>
                        <div>IP: <b>{account?.ip}</b></div>
                        <div>Last login IP: <b>{account?.lastLoginIp}</b></div>
                    </div>

                    <div style={{ border: "1px solid #eee", borderRadius: 10, padding: 12, marginBottom: 16 }}>
                        <h3 style={{ marginTop: 0 }}>Промокоды</h3>

                        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 12 }}>
                            <input
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                placeholder="Введите промокод…"
                                style={{ padding: 8, width: 240 }}
                            />
                            <button onClick={applyPromocode} style={{ padding: "8px 12px" }}>
                                Apply
                            </button>
                        </div>

                        <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
                            <div>
                                <div style={{ fontWeight: 700, marginBottom: 6 }}>Активные</div>
                                <ul style={{ marginTop: 0 }}>
                                    {(promocodes?.active || []).map((x) => <li key={x}>{x}</li>)}
                                    {(promocodes?.active || []).length === 0 && <li style={{ color: "#666" }}>Нет</li>}
                                </ul>
                            </div>

                            <div>
                                <div style={{ fontWeight: 700, marginBottom: 6 }}>Использованные</div>
                                <ul style={{ marginTop: 0 }}>
                                    {(promocodes?.used || []).map((x) => <li key={x}>{x}</li>)}
                                    {(promocodes?.used || []).length === 0 && <li style={{ color: "#666" }}>Нет</li>}
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div style={{ border: "1px solid #eee", borderRadius: 10, padding: 12, marginBottom: 16 }}>
                        <h3 style={{ marginTop: 0 }}>Реферальная ссылка</h3>
                        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                            <input value={referralLink} readOnly style={{ padding: 8, width: 420, maxWidth: "100%" }} />
                            <button onClick={copyRef} style={{ padding: "8px 12px" }}>
                                Copy
                            </button>
                        </div>
                    </div>

                    <div style={{ border: "1px solid #eee", borderRadius: 10, padding: 12, marginBottom: 16 }}>
                        <h3 style={{ marginTop: 0 }}>История входов (IP)</h3>
                        <table cellPadding="10" style={{ borderCollapse: "collapse", width: "100%", minWidth: 520 }}>
                            <thead>
                            <tr style={{ borderBottom: "1px solid #ddd" }}>
                                <th align="left">IP</th>
                                <th align="left">Дата</th>
                                <th align="left">Статус</th>
                            </tr>
                            </thead>
                            <tbody>
                            {(home?.loginHistory || []).map((row, idx) => (
                                <tr key={idx} style={{ borderTop: "1px solid #eee" }}>
                                    <td>{row.ip}</td>
                                    <td>{row.at}</td>
                                    <td>{row.status}</td>
                                </tr>
                            ))}
                            {(home?.loginHistory || []).length === 0 && (
                                <tr><td colSpan={3} style={{ color: "#666" }}>Нет данных</td></tr>
                            )}
                            </tbody>
                        </table>
                    </div>

                    <div style={{ border: "1px solid #eee", borderRadius: 10, padding: 12 }}>
                        <h3 style={{ marginTop: 0 }}>{home?.vote?.title || "Голосование"}</h3>
                        <p style={{ color: "#666" }}>Пока заглушка. Позже подключим реальную интеграцию.</p>
                        <a href={home?.vote?.url || "#"} target="_blank" rel="noreferrer">
                            Перейти к голосованию
                        </a>
                    </div>
                </>
            )}
        </div>
    );
}