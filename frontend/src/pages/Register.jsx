import { useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { apiPost } from "../api/client";

export default function Register() {
    const nav = useNavigate();

    const [login, setLogin] = useState("");
    const [password, setPassword] = useState("");
    const [password2, setPassword2] = useState("");
    const [email, setEmail] = useState("");
    const [name, setName] = useState("");
    const [securityCode, setSecurityCode] = useState("");
    const [accept, setAccept] = useState(false);

    const [err, setErr] = useState("");
    const [loading, setLoading] = useState(false);

    const [sp] = useSearchParams();
    const ref = sp.get("ref") || undefined;

    async function submit(e) {
        e.preventDefault();
        setErr("");

        if (!login.trim()) return setErr("Логин обязателен");
        if (!password) return setErr("Пароль обязателен");
        if (password !== password2) return setErr("Пароли не совпадают");
        if (!name.trim()) return setErr("Имя обязательно");
        if (!accept) return setErr("Нужно принять правила");
        if (securityCode.trim() !== "1234") return setErr('Неверный код (тест: "1234")');

        setLoading(true);
        try {
            const j = await apiPost("/auth/register", {
                login: login.trim(),
                password,
                email: email.trim() || undefined,
                name: name.trim(),
                acceptTerms: true,
                securityCode: securityCode.trim(),
                ref,
            });

            if (!j?.ok) {
                setErr(j?.error || j?.message || "Register failed");
                return;
            }

            // логин после регистрации
            const j2 = await apiPost("/auth/login", { login: login.trim(), password });
            if (!j2?.ok) {
                nav("/login", { replace: true });
                return;
            }

            nav("/lk/home", { replace: true });
        } catch (e2) {
            setErr(String(e2?.message || e2));
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="container">
            <div className="center">
                <div className="card w360">
                    <div className="card-b">
                        <h1 className="h1">Регистрация</h1>
                        <div className="muted">Создайте аккаунт, чтобы продолжить</div>

                        <form onSubmit={submit} style={{ marginTop: 14 }}>
                            <div className="field">
                                <div className="label">Логин</div>
                                <input className="input" value={login} onChange={(e) => setLogin(e.target.value)} />
                            </div>

                            <div className="field">
                                <div className="label">Пароль</div>
                                <input
                                    className="input"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>

                            <div className="field">
                                <div className="label">Повтор пароля</div>
                                <input
                                    className="input"
                                    type="password"
                                    value={password2}
                                    onChange={(e) => setPassword2(e.target.value)}
                                />
                            </div>

                            <div className="field">
                                <div className="label">Имя</div>
                                <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
                            </div>

                            <div className="field">
                                <div className="label">Почта (необязательно)</div>
                                <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
                            </div>

                            <div className="field">
                                <div className="label">Код безопасности (тест: 1234)</div>
                                <input
                                    className="input"
                                    value={securityCode}
                                    onChange={(e) => setSecurityCode(e.target.value)}
                                />
                            </div>

                            <label style={{ display: "flex", gap: 8, alignItems: "center", margin: "10px 0" }}>
                                <input type="checkbox" checked={accept} onChange={(e) => setAccept(e.target.checked)} />
                                Я прочитал(а) и принимаю правила
                            </label>

                            {err && <div className="err">{err}</div>}

                            <button className="btn btn-primary" disabled={loading} type="submit">
                                {loading ? "Регистрация..." : "Зарегистрироваться"}
                            </button>

                            <div className="linkrow">
                                <div>
                                    Уже есть аккаунт? <Link to="/login">Войти</Link>
                                </div>
                                <Link to="/">← На главную</Link>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}