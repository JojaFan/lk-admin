import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiGet } from "../../api/client";
import BanModal from "../../components/BanModal";
import { apiPost } from "../../api/client";

export default function AdminAccountView() {
    const [banOpen, setBanOpen] = useState(false);
    const [actionMsg, setActionMsg] = useState("");
    const { id } = useParams();
    const nav = useNavigate();

    const [data, setData] = useState(null);
    const [err, setErr] = useState("");
    const [loading, setLoading] = useState(false);

    async function load() {
        setErr("");
        setLoading(true);
        try {
            const j = await apiGet(`/accounts/${id}`);
            setData(j);
        } catch (e) {
            setErr(String(e.message || e));
        } finally {
            setLoading(false);
        }
    }
    async function submitBan({ duration, reason }) {
        setActionMsg("");
        try {
            const j = await apiPost(`/admin/accounts/${id}/ban`, { duration, reason });
            setActionMsg(`✅ Banned: ${JSON.stringify(j)}`);
            setBanOpen(false);
            // позже тут можно сделать reload() чтобы обновить status
        } catch (e) {
            setActionMsg(`❌ Ban error: ${String(e.message || e)}`);
        }
    }

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const item = data?.item;

    return (
        <div>
            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                <button onClick={() => nav("/admin/accounts")} style={{ padding: "6px 10px" }}>
                    ← Back
                </button>
                <h2 style={{ margin: 0 }}>Account #{id}</h2>
            </div>

            {loading && <div style={{ marginTop: 12 }}>Loading…</div>}
            {err && <div style={{ marginTop: 12, color: "crimson" }}>{err}</div>}

            {!loading && data && data.ok === false && (
                <div style={{ marginTop: 12, color: "crimson" }}>
                    Not found
                </div>
            )}

            {item && (
                <div style={{ marginTop: 16 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "160px 1fr", gap: 8, maxWidth: 600 }}>
                        <Field label="ID" value={item.id} />
                        <Field label="Login" value={item.login} />
                        <Field label="Role" value={item.role} />
                        <Field label="Status" value={item.status} />
                    </div>

                    <div style={{ marginTop: 16, display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <button
                            onClick={() => alert("Edit (todo)")}
                            style={{ padding: "8px 12px" }}
                        >
                            Edit
                        </button>

                        <button
                            onClick={() => setBanOpen(true)}
                            style={{ padding: "8px 12px" }}
                        >
                            Ban
                        </button>

                        <button
                            onClick={() => {
                                if (confirm("Delete account? (demo)")) alert("Delete (todo)");
                            }}
                            style={{ padding: "8px 12px" }}
                        >
                            Delete
                        </button>
                    </div>
                    {actionMsg && (
                        <div style={{ marginTop: 12, whiteSpace: "pre-wrap" }}>
                            {actionMsg}
                        </div>
                    )}
                    <BanModal
                        open={banOpen}
                        onClose={() => setBanOpen(false)}
                        onSubmit={submitBan}
                        account={item}
                    />

                    <div style={{ marginTop: 16 }}>
                        <details>
                            <summary>Raw response</summary>
                            <pre style={{ background: "#f6f6f6", padding: 12, borderRadius: 8, overflowX: "auto" }}>
                {JSON.stringify(data, null, 2)}
              </pre>
                        </details>
                    </div>
                </div>
            )}
        </div>
    );
}


function Field({ label, value }) {
    return (
        <>
            <div style={{ color: "#666" }}>{label}</div>
            <div><b>{String(value)}</b></div>
        </>
    );

}