import React from "react";
import {NavLink, Outlet, useNavigate} from "react-router-dom";


export default function AdminLayout() {
    const navigate = useNavigate();

    async function handleLogout() {
        try {
            await fetch("/api/auth/logout", {
                method: "POST",
                credentials: "include",
            });
        } catch (e) {}

        navigate("/");
        window.location.reload(); // чтобы полностью сбросить состояние
    }
    return (

        <div className="adminApp">
            <aside className="adminSidebar">
                <div className="adminBrand">
                    <div className="adminLogo">LK</div>
                    <div>
                        <div className="adminTitle">Admin Panel</div>
                        <div className="adminSub">Management</div>
                    </div>
                    <div className="adminSideFooter">
                        <button className="adminBtnGhost" onClick={handleLogout}>
                            Выйти
                        </button>
                    </div>
                </div>


                <nav className="adminNav">
                    <NavLink to="/admin/accounts" className="adminLink">Аккаунты</NavLink>
                    <NavLink to="/admin/marathons" className="adminLink">Марафоны</NavLink>
                    <NavLink to="/admin/shop" className="adminLink">Магазин</NavLink>
                    <NavLink to="/admin/grant-items" className="adminLink">Выдача предметов</NavLink>
                    <NavLink to="/admin/donate-rating" className="adminLink">Рейтинг доната</NavLink>
                    <NavLink to="/admin/calendar" className="adminLink">Управление календарём</NavLink>
                </nav>
            </aside>



            <main className="adminMain">
                <header className="adminTopbar">
                    <div className="adminPageTitle">Админ панель</div>
                </header>


                <div className="adminContent">
                    <Outlet/>
                </div>

            </main>

        </div>

    );


}
