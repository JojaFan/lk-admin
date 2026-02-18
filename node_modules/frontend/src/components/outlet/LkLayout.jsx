import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext.jsx";

export default function LkLayout() {
    const nav = useNavigate();
    const { user, logout } = useAuth();

    async function doLogout() {
        await logout();
        nav("/login", { replace: true });
    }

    const username = user?.login ?? "user";
    const role = user?.role ?? "user";

    const navLinkClass = ({ isActive }) => "nav-link" + (isActive ? " active" : "");

    return (
        <div className="container">
            <div className="page">
                <div className="card">
                    <div className="card-b">
                        <div className="lk-top">
                            <div>
                                <div style={{ fontWeight: 700 }}>USER — {username} ({role})</div>
                                <div style={{ marginTop: 6 }}>
                                    <NavLink to="/" className="nav-link">← На сайт</NavLink>
                                </div>
                            </div>

                            <button onClick={doLogout} className="btn btn-light">Logout</button>
                        </div>

                        <div className="lk-nav">
                            <NavLink to="/lk" end className={navLinkClass}>Главная</NavLink>
                            <NavLink to="/lk/chars" className={navLinkClass}>Персонажи</NavLink>
                            <NavLink to="/lk/shop" className={navLinkClass}>Магазин</NavLink>
                            <NavLink to="/lk/coins" className={navLinkClass}>Монеты</NavLink>
                            <NavLink to="/lk/ratings" className={navLinkClass}>Рейтинг</NavLink>
                            <NavLink to="/lk/donate" className={navLinkClass}>Донат</NavLink>
                            <NavLink to="/lk/referrals" className={navLinkClass}>Рефералы</NavLink>
                            <NavLink to="/lk/marafones" className={navLinkClass}>Марафоны</NavLink>
                            <NavLink to="/lk/inventory" className={navLinkClass}>Инвентарь</NavLink>
                        </div>

                        <hr className="sep" />
                        <Outlet />
                    </div>
                </div>
            </div>
        </div>
    );
}