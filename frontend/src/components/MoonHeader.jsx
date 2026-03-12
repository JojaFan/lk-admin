import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function MoonHeader({ tabs }) {
    const { user, logout } = useAuth();
    return (

        <div className="cosmoHeader">
            <div className="cosmoMoon" aria-hidden="true" />
            <div className="cosmoGlow" aria-hidden="true" />

            <div className="cosmoTop">
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    {user && (
                        <button className="cosmoTab" type="button" onClick={logout}>
                            Выйти
                        </button>
                    )}
                </div>
                <div className="cosmoBrand">
                    <div className="cosmoDot" />
                    <div>
                        <div className="cosmoTitle">LK</div>
                        <div className="cosmoSub">Personal Cabinet</div>
                    </div>
                </div>

                <nav className="cosmoNav">
                    {tabs.map((t) => (
                        <NavLink
                            key={t.to}
                            to={t.to}
                            className={({ isActive }) => "cosmoTab" + (isActive ? " active" : "")}
                        >
                            {t.label}
                        </NavLink>
                    ))}
                </nav>
            </div>
        </div>
    );
}