export default function QuickBanModal({ open, onClose, onPick, account }) {
    if (!open) return null;

    return (
        <div style={overlay} onMouseDown={onClose}>
            <div style={modal} onMouseDown={(e) => e.stopPropagation()}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                    <div>
                        <b>Quick ban</b>
                        <div style={{ color: "#666", marginTop: 4 }}>
                            {account ? `#${account.id} (${account.login})` : ""}
                        </div>
                    </div>

                    <button onClick={onClose} style={xBtn} aria-label="Close">
                        ✕
                    </button>
                </div>

                <div style={{ marginTop: 14, color: "#666" }}>
                    Choose duration:
                </div>

                <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
                    <button onClick={() => onPick("15m")} style={btn}>15 min</button>
                    <button onClick={() => onPick("30m")} style={btn}>30 min</button>
                    <button onClick={() => onPick("60m")} style={btn}>60 min</button>
                </div>

                <div style={{ marginTop: 14, fontSize: 12, color: "#888" }}>
                    Full ban with reason is available in <b>View</b>.
                </div>
            </div>
        </div>
    );
}

const overlay = {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.25)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 999,
};

const modal = {
    width: "min(360px, 92vw)",
    background: "white",
    borderRadius: 12,
    padding: 16,
    boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
};

const btn = {
    padding: "8px 12px",
    borderRadius: 8,
    border: "1px solid #ddd",
    background: "white",
    cursor: "pointer",
};

const xBtn = {
    padding: "6px 10px",
    borderRadius: 8,
    border: "1px solid #ddd",
    background: "white",
    cursor: "pointer",
};
