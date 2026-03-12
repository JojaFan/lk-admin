import React from "react";
import { Outlet } from "react-router-dom";
import MoonHeader from "../MoonHeader";

export default function LkLayout() {
    return (
        <div className="cosmoPage">
            <MoonHeader
                tabs={[
                    { label: "Главная", to: "/lk/home" },
                    { label: "Персонажи", to: "/lk/chars" },
                    { label: "Магазин", to: "/lk/shop" },
                    { label: "Монеты", to: "/lk/coins" },
                    { label: "Рейтинг", to: "/lk/ratings" },
                    { label: "Донат", to: "/lk/donate" },
                    { label: "Рефералы", to: "/lk/referrals" },
                    { label: "Марафоны", to: "/lk/marafones" },
                    { label: "Инвентарь", to: "/lk/inventory" },
                ]}
            />

            <div className="cosmoShell">
                <aside className="cosmoSide glass">
                    <div className="cosmoSideTitle">Инфо</div>
                    <div className="cosmoSideText">
                        Баланс, быстрые кнопки, уведомления — позже.
                    </div>
                </aside>

                <main className="cosmoMain glass">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}