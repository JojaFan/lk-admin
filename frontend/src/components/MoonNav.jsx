import React, { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import moonImg from "../assets/moon.png";
import MoonRibbon from "./MoonRibbon.jsx";
import NeonArrow from "./NeonArrow.jsx";

function wrap(i, len) {
    return (i % len + len) % len;
}

export default function MoonNav({ tabs }) {
    const nav = useNavigate();
    const loc = useLocation();

    const activeIndex = useMemo(() => {
        const path = loc.pathname;
        const idx = tabs.findIndex((t) => path === t.to || path.startsWith(t.to + "/"));
        return idx >= 0 ? idx : 0;
    }, [loc.pathname, tabs]);

    const go = (idx) => nav(tabs[wrap(idx, tabs.length)].to);
    const goLeft = () => go(activeIndex - 1);
    const goRight = () => go(activeIndex + 1);

    const items = useMemo(() => {
        if (!tabs?.length) return [];
        return [-2, -1, 0, 1, 2].map((offset) => {
            const idx = wrap(activeIndex + offset, tabs.length);
            return { offset, idx, ...tabs[idx], isActive: offset === 0 };
        });
    }, [tabs, activeIndex]);

    return (
        <div className="moonWheel">
            <button className="moonArrowBtn left" onClick={goLeft} aria-label="Влево">
                <NeonArrow dir="left" />
            </button>

            <div className="moonWheelCenter">
                <div className="moonOrbGlow" />
                <div className="moonOrb" style={{ backgroundImage: `url(${moonImg})` }} />

                <div className="moonArcPlate">
                    <MoonRibbon />

                    <div className="moonArcTabs">
                        {items.map((t) => (
                            <button
                                key={t.to}
                                className={"moonArcTab pos" + t.offset + (t.isActive ? " active" : "")}
                                onClick={() => nav(t.to)}
                                title={t.label}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <button className="moonArrowBtn right" onClick={goRight} aria-label="Вправо">
                <NeonArrow dir="right" />
            </button>
        </div>
    );
}