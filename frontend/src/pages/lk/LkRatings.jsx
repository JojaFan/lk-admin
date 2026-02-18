import { useEffect, useState } from "react";
import { apiGet } from "../../api/client"; // <-- проверь путь, если у тебя другая структура

export default function LkRatings() {
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");
    const [data, setData] = useState({ characters: [], alliances: [] });

    useEffect(() => {
        (async () => {
            try {
                setErr("");
                const d = await apiGet("/lk/ratings");

                if (!d?.ok) throw new Error(d?.message || d?.error || "ratings failed");

                // защита от undefined, чтобы .map() не падал
                setData({
                    characters: Array.isArray(d.characters) ? d.characters : [],
                    alliances: Array.isArray(d.alliances) ? d.alliances : [],
                });
            } catch (e) {
                setErr(String(e.message || e));
                setData({ characters: [], alliances: [] });
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    if (loading) return <div>Loading…</div>;
    if (err) return <div style={{ color: "crimson" }}>{err}</div>;

    return (
        <div>
            <h2>Рейтинги</h2>

            <h3>Персонажи</h3>
            <table border="1" cellPadding="6">
                <thead>
                <tr><th>Имя</th><th>Уровень</th><th>Убийства</th></tr>
                </thead>
                <tbody>
                {data.characters.map((c, i) => (
                    <tr key={i}>
                        <td>{c.name}</td><td>{c.level}</td><td>{c.kills}</td>
                    </tr>
                ))}
                {data.characters.length === 0 && (
                    <tr><td colSpan="3">Пока пусто</td></tr>
                )}
                </tbody>
            </table>

            <h3>Альянсы</h3>
            <table border="1" cellPadding="6">
                <thead>
                <tr><th>Название</th><th>Игроков</th></tr>
                </thead>
                <tbody>
                {data.alliances.map((a, i) => (
                    <tr key={i}>
                        <td>{a.name}</td><td>{a.players}</td>
                    </tr>
                ))}
                {data.alliances.length === 0 && (
                    <tr><td colSpan="2">Пока пусто</td></tr>
                )}
                </tbody>
            </table>
        </div>
    );
}