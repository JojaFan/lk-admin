const API = "/api";

export async function apiGet(path) {
    const r = await fetch(`${API}${path}`, { credentials: "include" });

    if (r.status === 401) throw new Error("401: Not logged in");
    if (r.status === 403) throw new Error("403: Forbidden (no role)");
    return r.json();
}
export async function apiPatch(path, body) {
    const r = await fetch(`${API}${path}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : null,
    });

    const t = await r.text();
    const j = t ? JSON.parse(t) : {};

    if (!r.ok) throw new Error(j.error || `HTTP ${r.status}`);
    return j;
}

export async function apiPost(path, body) {
    const r = await fetch(`${API}${path}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : null,
    });

    const text = await r.text();
    let j = null;
    try { j = text ? JSON.parse(text) : null; } catch {}

    if (!r.ok) return j || { ok: false, error: text || r.statusText, statusCode: r.status };
    return j;


}