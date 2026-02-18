import { useEffect, useRef, useState } from "react";

function ActionItem({ label, onClick, danger }) {
    return (
        <button
            onClick={onClick}
            style={{
                width: "100%",
                textAlign: "left",
                padding: "10px 12px",
                border: "none",
                background: "white",
                cursor: "pointer",
                color: danger ? "crimson" : "black",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#f5f5f5")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "white")}
            type="button"
        >
            {label}
        </button>
    );
}

export default function RowActions({
                                       onView,
                                       onEdit,
                                       onBanClick,
                                       onDelete,
                                       banLabel,
                                   }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        function onDocClick(e) {
            if (!ref.current) return;
            if (!ref.current.contains(e.target)) setOpen(false);
        }

        document.addEventListener("click", onDocClick);
        return () => document.removeEventListener("click", onDocClick);
    }, []);

    return (
        <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
            <button
                type="button"
                onClick={(e) => {
                    e.stopPropagation(); // чтобы клик по кнопке не закрывал меню сразу document-click'ом
                    setOpen((v) => !v);
                }}
                style={{
                    padding: "4px 10px",
                    border: "1px solid #ccc",
                    borderRadius: 6,
                    background: "white",
                    cursor: "pointer",
                }}
                title="Actions"
            >
                …
            </button>

            {open && (
                <div
                    style={{
                        position: "absolute",
                        right: 0,
                        top: "110%",
                        minWidth: 140,
                        border: "1px solid #ddd",
                        borderRadius: 8,
                        background: "white",
                        boxShadow: "0 6px 20px rgba(0,0,0,0.08)",
                        overflow: "hidden",
                        zIndex: 10,
                    }}
                >
                    <ActionItem
                        label="Обзор"
                        onClick={() => {
                            setOpen(false);
                            onView?.();
                        }}
                    />
                    <ActionItem
                        label="Изменить"
                        onClick={() => {
                            setOpen(false);
                            onEdit?.();
                        }}
                    />
                    <ActionItem
                        label={banLabel || "Ban"}
                        onClick={() => {
                            setOpen(false);
                            onBanClick?.();
                        }}
                    />
                    <ActionItem
                        label="Удалить"
                        danger
                        onClick={() => {
                            setOpen(false);
                            onDelete?.();
                        }}
                    />
                </div>
            )}
        </div>
    );
}