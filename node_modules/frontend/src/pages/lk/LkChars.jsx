import { useEffect, useState } from "react";
import { apiGet } from "../../api/client";

export default function LkChars() {
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState("");
    const [items, setItems] = useState([]);
    const API_BASE = "http://localhost:3000";
    const api = (path) => `${API_BASE}${path}`;


    async function load() {
        setErr("");
        setLoading(true);
        try {
            const j = await apiGet("/lk/chars");
            setItems(j?.items || []);
        } catch (e) {
            setErr(String(e.message || e));
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        const load = async () => {
            try {
                const j = await apiGet("/lk/chars");
                if (!j?.ok) throw new Error(j?.message || "Chars API error");

                setItems(j.characters ?? []);
            } catch (e) {
                setErr(e?.message || "Error");
            }
        };

        load();
    }, []);

    return (
        <div>
            <h2>Персонажи</h2>

            {err && <div style={{ color: "crimson", marginBottom: 12 }}>{err}</div>}
            {loading && <div>Loading…</div>}

            {!loading && (
                <div style={{ overflowX: "auto" }}>
                    <table cellPadding="10" style={{ borderCollapse: "collapse", minWidth: 700, width: "100%" }}>
                        <thead>
                        <tr style={{ borderBottom: "1px solid #ddd" }}>
                            <th align="left">Name</th>
                            <th align="left">Class</th>
                            <th align="left">Race</th>
                            <th align="left">Level</th>
                            <th align="left">Equipment</th>
                        </tr>
                        </thead>
                        <tbody>
                        {items.map((c, idx) => (
                            <tr key={idx} style={{ borderTop: "1px solid #eee" }}>
                                <td>{c.name}</td>
                                <td>{c.class}</td>
                                <td>{c.race}</td>
                                <td>{c.level}</td>
                                <td style={{ color: "#666" }}>(заглушка)</td>
                            </tr>
                        ))}
                        {items.length === 0 && (
                            <tr>
                                <td colSpan={5} style={{ color: "#666" }}>Нет персонажей</td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}