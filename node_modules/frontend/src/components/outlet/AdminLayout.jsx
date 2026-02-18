import React from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext.jsx";

export default function AdminLayout() {
    const { user, logout } = useAuth();
    const nav = useNavigate();

    async function doLogout() {
        await logout();
        nav("/", { replace: true });
    }

    const adminTabClass = ({ isActive }) =>
        "admin-link" + (isActive ? " active" : "");

    return (
        <div className="container">
            <div className="page">
                <div className="card">
                    <div className="card-b">
                        <div className="admin-top">
                            <div>
                                <NavLink to="/" className="admin-link">← На сайт</NavLink>
                                <span className="admin-badge">ADMIN</span>{" "}
                                <span style={{ fontWeight: 700 }}>
                  — {user?.login} ({user?.role})
                </span>
                            </div>

                            <button onClick={doLogout} className="btn btn-light">
                                Logout
                            </button>
                        </div>

                        <div className="admin-sub">
                            <NavLink to="/admin/donate-rating" className={adminTabClass}>
                                Рейтинг доната
                            </NavLink>

                            <NavLink to="/admin/accounts" className={adminTabClass}>
                                Управление пользователями
                            </NavLink>

                            <NavLink to="/admin/shop-items" className={adminTabClass}>
                                Магазин (товары)
                            </NavLink>

                            <NavLink to="/admin/marathons" className={adminTabClass}>
                                Марафоны
                            </NavLink>

                            <NavLink to="/admin/grant" className={adminTabClass}>
                                Управление предметами
                            </NavLink>
                        </div>

                        <hr className="sep" />

                        <Outlet />
                    </div>
                </div>
            </div>
        </div>
    );
}