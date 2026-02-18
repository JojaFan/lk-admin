import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

const API = "http://localhost:3000"; // если у тебя другой порт — поменяй

export default function Register() {
    const nav = useNavigate();
    const [login, setLogin] = useState("");
    const [password, setPassword] = useState("");
    const [email, setEmail] = useState("");
    const [err, setErr] = useState("");

    async function submit(e) {
        e.preventDefault();
        setErr("");

        const r = await fetch(`${API}/auth/register`, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ login, password, email: email || undefined }),
        });

        const j = await r.json().catch(() => null);
        if (!j?.ok) {
            setErr(j?.error || "Register failed");
            return;
        }

        nav("/lk", { replace: true });
    }

    return (
        <div className="container">
            <div className="page">
                <div className="card">
                    <div className="card-b">
                        <h1 className="h1">Register</h1>

                        <form onSubmit={submit}>
                            <div className="field">
                                <div className="label">Login</div>
                                <input className="input" value={login} onChange={(e) => setLogin(e.target.value)} />
                            </div>

                            <div className="field">
                                <div className="label">Email (optional)</div>
                                <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
                            </div>

                            <div className="field">
                                <div className="label">Password</div>
                                <input
                                    className="input"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>

                            {err && <div className="err">{err}</div>}

                            <button className="btn btn-primary" type="submit">Create account</button>
                        </form>

                        <div style={{ marginTop: 12 }}>
                            Уже есть аккаунт? <Link to="/login">Login</Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}