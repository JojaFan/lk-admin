import { useState } from "react";

export default function BanModal({ open, onClose, onSubmit, account }) {
    const [duration, setDuration] = useState("1d");
    const [reason, setReason] = useState("");

    if (!open) return null;

    return (
        <div style={overlayStyle} onMouseDown={onClose}>
            <div style={modalStyle} onMouseDown={(e) => e.stopPropagation()}>
                <h3 style={{ marginTop: 0 }}>
                    Ban account {account ? `#${account.id} (${account.login})` : ""}
                </h3>

                <div style={{ marginBottom: 12 }}>
                    <label>Duration</label>
                    <select
                        value={duration}
                        onChange={(e) => setDuration(e.target.value)}
                        style={{ width: "100%", padding: 8, marginTop: 6 }}
                    >
                        <option value="1h">1 hour</option>
                        <option value="1d">1 day</option>
                        <option value="7d">7 days</option>
                        <option value="30d">30 days</option>
                        <option value="forever">Forever</option>
                    </select>
                </div>

                <div style={{ marginBottom: 12 }}>
                    <label>Reason (optional)</label>
                    <textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        rows={3}
                        style={{ width: "100%", padding: 8, marginTop: 6 }}
                        placeholder="Например: RMT / токсичность / мультиакк…"
                    />
                </div>

                <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                    <button onClick={onClose} style={{ padding: "8px 12px" }}>
                        Cancel
                    </button>
                    <button
                        onClick={() => onSubmit({ duration, reason })}
                        style={{ padding: "8px 12px" }}
                    >
                        Ban
                    </button>
                </div>
            </div>
        </div>
    );
}
const overlayStyle = {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.25)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 999,
};

const modalStyle = {
    width: "min(520px, 92vw)",
    background: "white",
    borderRadius: 12,
    padding: 16,
    boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
};
