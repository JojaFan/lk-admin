import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { apiGet, apiPost } from "../api/client";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    async function refresh() {
        try {
            const j = await apiGet("/auth/me"); // ожидаем {ok, user}
            setUser(j?.ok ? j.user : null);
        } catch {
            setUser(null);
        } finally {
            setLoading(false);
        }
    }

    async function login(login, password) {
        const j = await apiPost("/auth/login", { login, password });
        if (!j?.ok) throw new Error(j?.error || "Login failed");
        setUser(j.user);
        return j.user;
    }

    async function logout() {
        try {
            await apiPost("/auth/logout");
        } finally {
            // ✅ ключевое: сбрасываем user, иначе UI “думает” что ты всё ещё залогинен
            setUser(null);
        }
    }

    useEffect(() => {
        refresh();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const value = useMemo(
        () => ({ user, loading, login, logout, refresh }),
        [user, loading]
    );

    return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
    const ctx = useContext(AuthCtx);
    if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
    return ctx;
}