import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ProtectedRoute from "./auth/ProtectedRoute";

// LK
import LkLayout from "./components/outlet/LkLayout.jsx";
import LkHome from "./pages/lk/LkHome";
import LkChars from "./pages/lk/LkChars";
import LkShop from "./pages/lk/LkShop";
import LkCoins from "./pages/lk/LkCoins";
import LkRatings from "./pages/lk/LkRatings";
import LkDonate from "./pages/lk/LkDonate";
import LkReferrals from "./pages/lk/LkReferrals";
import DashboardRedirect from "./pages/DashboardRedirect";
import DevPanel from "./pages/DevPanel";
import LkInventory from "./pages/lk/LkInventory.jsx";


// Admin
import AdminLayout from "./components/outlet/AdminLayout.jsx";
import AdminDonateRating from "./pages/admin/AdminDonateRating";
import AdminAccounts from "./pages/admin/AdminAccounts";
import AdminShopItems from "./pages/admin/AdminShopItems";
import AdminAccountView from "./pages/admin/AdminAccountView";
import LkMarafones from "./pages/lk/LkMarafones.jsx";
import AdminMarathons from "./pages/admin/AdminMarathons";
import AdminMarathonView from "./pages/admin/AdminMarathonView";
import AdminGrantItems from "./pages/admin/AdminGrantItems.jsx";

export default function App() {
    return (
        <Routes>
            {/* public */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={<DashboardRedirect />} />

            {/* optional dev panel */}
            <Route
                path="/dev"
                element={
                    <ProtectedRoute allowRoles={["admin"]}>
                        <DevPanel />
                    </ProtectedRoute>
                }
            />


            {/* LK (user/admin/support can view LK pages if you want; пока разрешим всем залогиненным) */}
            <Route
                path="/lk"
                element={
                    <ProtectedRoute allowRoles={["admin", "support", "user"]}>
                        <LkLayout />
                    </ProtectedRoute>
                }
            >

                <Route path="/lk/inventory" element={<LkInventory />} />
                <Route index element={<Navigate to="/lk/home" replace />} />
                <Route path="home" element={<LkHome />} />
                <Route path="chars" element={<LkChars />} />
                <Route path="shop" element={<LkShop />} />
                <Route path="coins" element={<LkCoins />} />
                <Route path="ratings" element={<LkRatings />} />
                <Route path="donate" element={<LkDonate />} />
                <Route path="referrals" element={<LkReferrals />} />
                <Route path='marafones' element={<LkMarafones />} />
            </Route>

            {/* Admin (admin only) */}

            <Route
                path="/admin"
                element={
                    <ProtectedRoute allowRoles={["admin"]}>
                        <AdminLayout />
                    </ProtectedRoute>
                }

            >
                <Route path="/admin/grant" element={<AdminGrantItems />} />
                <Route path="marathons" element={<AdminMarathons />} />
                <Route path="marathons/:id" element={<AdminMarathonView />} />
                <Route path="accounts/:id" element={<AdminAccountView />} />
                <Route index element={<Navigate to="/admin/accounts" replace />} />
                <Route path="donate-rating" element={<AdminDonateRating />} />
                <Route path="accounts" element={<AdminAccounts />} />
                <Route path="shop-items" element={<AdminShopItems />} />
            </Route>

            {/* default */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}