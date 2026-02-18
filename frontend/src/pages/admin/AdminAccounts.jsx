import { useEffect, useState } from "react";
import { apiGet, apiPost, apiPatch } from "../../api/client";
import RowActions from "../../components/RowActions";
import { useNavigate } from "react-router-dom";
import QuickBanModal from "../../components/QuickBanModal";

export default function AdminAccounts() {
    const [search, setSearch] = useState("");
    const [data, setData] = useState(null);
    const [err, setErr] = useState("");
    const [loading, setLoading] = useState(false);

    const nav = useNavigate();

    // quick ban
    const [banOpen, setBanOpen] = useState(false);
    const [banAccount, setBanAccount] = useState(null); // {id, login, role, status}

    // edit panel
    const [editUser, setEditUser] = useState(null);
    const [editRole, setEditRole] = useState("user");
    const [editStatus, setEditStatus] = useState("active");
    const [saving, setSaving] = useState(false);

    function openEdit(u) {
        setErr("");
        setEditUser(u);
        setEditRole(u?.role || "user");
        setEditStatus(u?.status || "active");
    }

    function closeEdit() {
        setEditUser(null);
    }

    async function load() {
        setErr("");
        setLoading(true);
        try {
            const q = search.trim()
                ? `?search=${encodeURIComponent(search.trim())}`
                : "";
            const j = await apiGet(`/accounts${q}`);
            setData(j);
        } catch (e) {
            setErr(String(e?.message || e));
            setData(null);
        } finally {
            setLoading(false);
        }
    }

    async function submitQuickBan(duration) {
        if (!banAccount) return;

        try {
            const j = await apiPost(`/admin/accounts/${banAccount.id}/ban`, {
                duration,
                reason: `quick-ban:${duration}`,
            });

            alert(`✅ Banned\n\n${JSON.stringify(j, null, 2)}`);

            setBanOpen(false);
            setBanAccount(null);

            // обновим таблицу, чтобы статус сменился
            await load();
        } catch (e) {
            alert(`❌ Ban error\n\n${String(e?.message || e)}`);
        }
    }

    async function quickUnban(accountId) {
        if (!confirm(`Unban #${accountId}?`)) return;

        try {
            const j = await apiPost(`/admin/accounts/${accountId}/unban`);
            alert(`✅ Unbanned\n\n${JSON.stringify(j, null, 2)}`);

            await load();
        } catch (e) {
            alert(`❌ Unban error\n\n${String(e?.message || e)}`);
        }
    }

    async function saveEdit() {
        if (!editUser) return;

        setSaving(true);
        setErr("");

        try {
            // 1) обновляем роль
            let j = await apiPatch(`/admin/accounts/${editUser.id}/role`, {
                role: editRole,
            });
            if (!j?.ok) throw new Error(j?.error || "role update failed");

            // 2) обновляем статус
            j = await apiPatch(`/admin/accounts/${editUser.id}/status`, {
                status: editStatus,
            });
            if (!j?.ok) throw new Error(j?.error || "status update failed");

            // обновляем таблицу и закрываем форму
            await load();
            closeEdit();
        } catch (e) {
            setErr(String(e?.message || e));
        } finally {
            setSaving(false);
        }
    }

    function act(title, payload) {
        alert(`${title}\n\n${JSON.stringify(payload, null, 2)}`);
    }

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const items = data?.items || [];

    return (
        <div>
            <h2>Аккаунты</h2>

            <div
                style={{
                    display: "flex",
                    gap: 8,
                    alignItems: "center",
                    marginBottom: 12,
                    flexWrap: "wrap",
                }}
            >
                <input
                    placeholder="Search by id/login/email…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{ padding: 8, width: 260 }}
                />

                <button onClick={load} style={{ padding: "8px 12px" }} disabled={loading}>
                    {loading ? "Loading…" : "Search"}
                </button>

                <div style={{ color: "#666" }}>
                    {data?.requestedBy
                        ? `Requested by: ${data.requestedBy.login} (${data.requestedBy.role})`
                        : ""}
                </div>
            </div>

            {err && <div style={{ color: "crimson", marginBottom: 12 }}>{err}</div>}

            <div style={{ overflowX: "auto" }}>
                <table
                    cellPadding="10"
                    style={{
                        borderCollapse: "collapse",
                        minWidth: 700,
                        width: "100%",
                    }}
                >
                    <thead>
                    <tr style={{ borderBottom: "1px solid #ddd" }}>
                        <th align="left">ID</th>
                        <th align="left">Login</th>
                        <th align="left">Role</th>
                        <th align="left">Status</th>
                        <th align="right">Actions</th>
                    </tr>
                    </thead>

                    <tbody>
                    {items.map((a) => {
                        const isBanned = String(a.status).toLowerCase() === "banned";

                        return (
                            <tr key={a.id} style={{ borderTop: "1px solid #eee" }}>
                                <td>{a.id}</td>

                                <td>
                                    <button
                                        onClick={() => nav(`/admin/accounts/${a.id}`)}
                                        style={{
                                            padding: 0,
                                            border: "none",
                                            background: "transparent",
                                            cursor: "pointer",
                                            textDecoration: "underline",
                                        }}
                                        title="Open account"
                                    >
                                        {a.login}
                                    </button>
                                </td>

                                <td>{a.role}</td>
                                <td>{a.status}</td>

                                <td align="right">
                                    <RowActions
                                        onView={() => nav(`/admin/accounts/${a.id}`)}
                                        onEdit={() => openEdit(a)}   // ✅ ВОТ ЭТО ГЛАВНОЕ
                                        banLabel={isBanned ? "Unban" : "Ban"}
                                        onBanClick={async () => {
                                            if (isBanned) await quickUnban(a.id);
                                            else {
                                                setBanAccount(a);
                                                setBanOpen(true);
                                            }
                                        }}
                                        onDelete={() => act("Delete (todo)", a)}
                                    />
                                </td>
                            </tr>
                        );
                    })}

                    {items.length === 0 && !loading && (
                        <tr>
                            <td colSpan={5} style={{ padding: 12, color: "#666" }}>
                                Nothing found
                            </td>
                        </tr>
                    )}
                    </tbody>
                </table>
            </div>

            {/* ✅ EDIT CARD */}
            {editUser && (
                <div className="card" style={{ marginTop: 12 }}>
                    <div className="card-b">
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                            <div style={{ fontWeight: 800 }}>
                                Редактирование: {editUser.login} (id: {editUser.id})
                            </div>
                            <button className="btn" onClick={closeEdit}>
                                ✕
                            </button>
                        </div>

                        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 12 }}>
                            <div className="field" style={{ minWidth: 220 }}>
                                <div className="label">Role</div>
                                <select
                                    className="input"
                                    value={editRole}
                                    onChange={(e) => setEditRole(e.target.value)}
                                >
                                    <option value="user">user</option>
                                    <option value="support">support</option>
                                    <option value="admin">admin</option>
                                </select>
                            </div>

                            <div className="field" style={{ minWidth: 220 }}>
                                <div className="label">Status</div>
                                <select
                                    className="input"
                                    value={editStatus}
                                    onChange={(e) => setEditStatus(e.target.value)}
                                >
                                    <option value="active">active</option>
                                    <option value="banned">banned</option>
                                </select>
                            </div>
                        </div>

                        {err && <div className="err">{err}</div>}

                        <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
                            <button
                                className="btn btn-primary"
                                disabled={saving}
                                onClick={saveEdit}
                            >
                                {saving ? "Saving..." : "Save"}
                            </button>

                            <button className="btn" onClick={closeEdit} disabled={saving}>
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ✅ QUICK BAN MODAL */}
            <QuickBanModal
                open={banOpen}
                account={banAccount}
                onClose={() => {
                    setBanOpen(false);
                    setBanAccount(null);
                }}
                onPick={submitQuickBan}
            />

            {/* raw response */}
            <div style={{ marginTop: 16 }}>
                <details>
                    <summary>Raw response</summary>
                    <pre
                        style={{
                            background: "#f6f6f6",
                            padding: 12,
                            borderRadius: 8,
                            overflowX: "auto",
                        }}
                    >
            {JSON.stringify(data, null, 2)}
          </pre>
                </details>
            </div>
        </div>
    );
}