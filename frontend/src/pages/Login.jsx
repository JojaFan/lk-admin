import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function Login() {
    const nav = useNavigate();
    const { user, loading, login } = useAuth();

    const [loginStr, setLoginStr] = useState("admin");
    const [password, setPassword] = useState("admin123");
    const [err, setErr] = useState("");

    useEffect(() => {
        if (loading) return;
        if (!user) return;

        if (user.role === "admin") nav("/admin/accounts", { replace: true });
        else nav("/lk/home", { replace: true });
    }, [user, loading, nav]);

    async function doLogin(e) {
        e.preventDefault();
        setErr("");

        try {
            const u = await login(loginStr, password);
            if (u.role === "admin") nav("/admin/accounts", { replace: true });
            else nav("/lk/home", { replace: true });
        } catch (e2) {
            setErr(String(e2?.message || e2));
        }
    }

    return (
        <div className="container">
            <div className="center">
                <div className="card w360">
                    <div className="card-b">
                        <h1 className="h1">Login</h1>
                        <div className="muted">Войдите в аккаунт, чтобы продолжить</div>

                        <form onSubmit={doLogin} style={{ marginTop: 14 }}>
                            <div className="field">
                                <div className="label">Login</div>
                                <input
                                    className="input"
                                    value={loginStr}
                                    onChange={(e) => setLoginStr(e.target.value)}
                                    autoComplete="username"
                                />
                            </div>

                            <div className="field">
                                <div className="label">Password</div>
                                <input
                                    className="input"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    autoComplete="current-password"
                                />
                            </div>

                            {err && <div className="err">{err}</div>}

                            <button className="btn btn-primary" type="submit" disabled={loading}>
                                {loading ? "Loading..." : "Login"}
                            </button>

                            <div className="linkrow">
                                <div>
                                    Ещё нет аккаунта?{" "}
                                    <a
                                        href="/register"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            nav("/register");
                                        }}
                                    >
                                        Зарегистрируйтесь
                                    </a>
                                </div>

                                <a
                                    href="/forgot"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        alert("Забыли пароль — сделаем позже (нужно решить, как восстанавливать доступ).");
                                    }}
                                >
                                    Забыли пароль?
                                </a>

                                <a
                                    href="/"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        nav("/");
                                    }}
                                >
                                    ← На главную
                                </a>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}