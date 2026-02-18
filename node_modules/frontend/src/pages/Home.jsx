import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function Home() {
    const nav = useNavigate();
    const { user, loading, logout } = useAuth();

    function goCabinet() {
        if (!user) {
            nav("/login");
            return;
        }
        if (user.role === "admin") nav("/admin/accounts");
        else nav("/lk/home");
    }

    return (
        <div style={{ padding: 24 }}>
            <h1>Main site</h1>
            <p>Public homepage (пока пусто).</p>

            {!loading && !user && (
                <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                    <Link to="/register">Register</Link>
                    <Link to="/login">Login</Link>
                    <button onClick={goCabinet} style={{ padding: "6px 10px" }}>
                        Личный кабинет
                    </button>
                </div>
            )}

            {!loading && user && (
                <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                    <div>
                        Вы вошли как <b>{user.login}</b> ({user.role})
                    </div>

                    <button onClick={goCabinet} style={{ padding: "6px 10px" }}>
                        В кабинет
                    </button>

                    <button onClick={logout} style={{ padding: "6px 10px" }}>
                        Logout
                    </button>
                </div>
            )}

            {loading && <div>Loading…</div>}
        </div>
    );
}