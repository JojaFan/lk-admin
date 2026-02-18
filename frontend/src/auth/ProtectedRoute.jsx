import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function ProtectedRoute({ allowRoles, children }) {
    const { user, loading } = useAuth();

    if (loading) return <div style={{ padding: 24 }}>Loading…</div>;

    if (!user) return <Navigate to="/login" replace />;

    if (Array.isArray(allowRoles) && allowRoles.length > 0) {
        if (!allowRoles.includes(user.role)) {
            return (
                <div style={{ padding: 24 }}>
                    <h2>403 Forbidden</h2>
                    <div>У вас нет прав для этой страницы.</div>
                </div>
            );
        }
    }

    return children;
}
