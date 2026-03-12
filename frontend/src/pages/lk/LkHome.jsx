import {useEffect, useMemo, useState} from "react";
import {apiGet, apiPost} from "../../api/client";

export default function LkHome() {
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState("");
    const [home, setHome] = useState(null);
    const [code, setCode] = useState("");
    const [showIpHistory, setShowIpHistory] = useState(false);

    // ---- СМЕНА ПАРОЛЯ (добавили правильно, без второго export) ----
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [newPassword2, setNewPassword2] = useState("");
    const [msg, setMsg] = useState("");

    async function load() {
        setErr("");
        setLoading(true);
        try {
            const j = await apiGet("/lk/home");
            setHome(j);
        } catch (e) {
            setErr(String(e?.message || e));
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        load();
    }, []);

    const account = home?.account;
    const promocodes = home?.promocodes;
    const ipHistory = home?.loginHistory || [];

    const referralLink = useMemo(() => {
        const ref = account?.referralCode || "DEMO-REF";
        return `${window.location.origin}/register?ref=${encodeURIComponent(ref)}`;
    }, [account?.referralCode]);

    async function applyPromocode() {
        const normalized = code.trim();
        if (!normalized) return alert("Введите промокод");

        try {
            const j = await apiPost("/lk/promocodes/apply", {code: normalized});
            alert(j?.message ? j.message : JSON.stringify(j, null, 2));
            setCode("");
            await load();
        } catch (e) {
            alert(String(e?.message || e));
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

    async function changePassword(e) {
        e.preventDefault();
        setErr("");
        setMsg("");

        if (!oldPassword || !newPassword) return setErr("Заполни поля");
        if (newPassword !== newPassword2) return setErr("Новые пароли не совпадают");
        if (newPassword.length < 6) return setErr("Пароль слишком короткий (мин. 6)");

        try {
            const j = await apiPost("/auth/change-password", { currentPassword: oldPassword, newPassword });
            if (!j?.ok) return setErr(j?.error || j?.message || "Не удалось сменить пароль");

            setMsg("Пароль успешно изменён");
            setOldPassword("");
            setNewPassword("");
            setNewPassword2("");
        } catch (e2) {
            setErr(String(e2?.message || e2));
        }
    }

    return (
        <div>
            <h2>Главная</h2>

            {err && <div style={{color: "crimson", marginBottom: 12}}>{err}</div>}
            {msg && <div style={{color: "green", marginBottom: 12}}>{msg}</div>}
            {loading && <div>Loading…</div>}

            {!loading && home?.ok && (
                <>
                    <div style={{border: "1px solid #eee", borderRadius: 10, padding: 12, marginBottom: 16}}>
                        <h3 style={{marginTop: 0}}>Данные аккаунта</h3>
                        <div>Email: <b>{account?.email}</b></div>
                        <div>Username: <b>{account?.username}</b></div>
                        <div>IP: <b>{account?.ip}</b></div>
                        <div>Last login IP: <b>{account?.lastLoginIp}</b></div>
                    </div>

                    {/* ---- Смена пароля ---- */}
                    <div style={{border: "1px solid #eee", borderRadius: 10, padding: 12, marginBottom: 16}}>
                        <h3 style={{marginTop: 0}}>Смена пароля</h3>

                        <form onSubmit={changePassword} style={{display: "grid", gap: 10, maxWidth: 360}}>
                            <input
                                type="password"
                                placeholder="Старый пароль"
                                value={oldPassword}
                                onChange={(e) => setOldPassword(e.target.value)}
                            />
                            <input
                                type="password"
                                placeholder="Новый пароль"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                            />
                            <input
                                type="password"
                                placeholder="Повтор нового пароля"
                                value={newPassword2}
                                onChange={(e) => setNewPassword2(e.target.value)}
                            />
                            <button type="submit">Изменить пароль</button>
                        </form>
                    </div>

                    <div style={{border: "1px solid #eee", borderRadius: 10, padding: 12, marginBottom: 16}}>
                        <h3 style={{marginTop: 0}}>Промокоды</h3>

                        <div
                            style={{display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 12}}>
                            <input
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                placeholder="Введите промокод…"
                                style={{padding: 8, width: 240}}
                            />
                            <button type="button" onClick={applyPromocode} style={{padding: "8px 12px"}}>
                                Apply
                            </button>
                        </div>

                        <div style={{display: "flex", gap: 24, flexWrap: "wrap"}}>
                            <div>
                                <div style={{fontWeight: 700, marginBottom: 6}}>Активные</div>
                                <ul style={{marginTop: 0}}>
                                    {(promocodes?.active || []).map((x) => <li key={x}>{x}</li>)}
                                    {(promocodes?.active || []).length === 0 && <li style={{color: "#666"}}>Нет</li>}
                                </ul>
                            </div>

                            <div>
                                <div style={{fontWeight: 700, marginBottom: 6}}>Использованные</div>
                                <ul style={{marginTop: 0}}>
                                    {(promocodes?.used || []).map((x) => <li key={x}>{x}</li>)}
                                    {(promocodes?.used || []).length === 0 && <li style={{color: "#666"}}>Нет</li>}
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div style={{border: "1px solid #eee", borderRadius: 10, padding: 12, marginBottom: 16}}>
                        <h3 style={{marginTop: 0}}>Реферальная ссылка</h3>
                        <div style={{display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap"}}>
                            <input value={referralLink} readOnly style={{padding: 8, width: 420, maxWidth: "100%"}}/>
                            <button type="button" onClick={copyRef} style={{padding: "8px 12px"}}>
                                Copy
                            </button>
                        </div>
                    </div>

                    <div className="lkSection">
                        <div className="lkSectionHeader">
                            <div>
                                <h3 style={{ margin: 0 }}>История входов (IP)</h3>
                                <div className="lkToggleHint">Нажми “Показать”, чтобы открыть список входов</div>
                            </div>

                            <button
                                className="lkToggleBtn"
                                type="button"
                                onClick={() => setShowIpHistory((v) => !v)}
                            >
                                {showIpHistory ? "Скрыть" : "Показать"}
                            </button>
                        </div>

                        {showIpHistory && (
                            <div style={{ marginTop: 12 }}>
                                <table className="cosmoTable">
                                    <thead>
                                    <tr>
                                        <th>IP</th>
                                        <th>Дата</th>
                                        <th>Статус</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {ipHistory.map((r, i) => (
                                        <tr key={i}>
                                            <td>{r.ip ?? r.IP ?? "-"}</td>
                                            <td>{String(r.date ?? r.createdAt ?? r.created_at ?? "")}</td>
                                            <td>{r.status ?? r.ok ?? "-"}</td>
                                        </tr>
                                    ))}
                                    {ipHistory.length === 0 && (
                                        <tr>
                                            <td colSpan={3} style={{ opacity: 0.7 }}>Пока пусто</td>
                                        </tr>
                                    )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    <div style={{border: "1px solid #eee", borderRadius: 10, padding: 12}}>
                        <h3 style={{marginTop: 0}}>{home?.vote?.title || "Голосование"}</h3>
                        <p style={{color: "#666"}}>Пока заглушка. Позже подключим реальную интеграцию.</p>
                        <a href={home?.vote?.url || "#"} target="_blank" rel="noreferrer">
                            Перейти к голосованию
                        </a>
                    </div>
                </>
            )}
        </div>
    );
}
