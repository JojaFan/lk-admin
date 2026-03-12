import React from "react";

export default function NeonArrow({ dir = "left" }) {
    const flip = dir === "right" ? "scale(-1,1) translate(-1000,0)" : "";

    return (
        <svg
            className="neonArrowSvg"
            viewBox="0 0 1000 220"
            preserveAspectRatio="none"
            aria-hidden="true"
        >
            <defs>
                <linearGradient id="aFill" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0" stopColor="#d9b6ff" stopOpacity="0.26" />
                    <stop offset="0.5" stopColor="#c8e6ff" stopOpacity="0.30" />
                    <stop offset="1" stopColor="#d9b6ff" stopOpacity="0.26" />
                </linearGradient>

                <linearGradient id="aStroke" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0" stopColor="#f7ddff" stopOpacity="0.78" />
                    <stop offset="0.5" stopColor="#e6f7ff" stopOpacity="0.78" />
                    <stop offset="1" stopColor="#f7ddff" stopOpacity="0.78" />
                </linearGradient>

                <filter id="aGlow" x="-60%" y="-120%" width="220%" height="340%">
                    <feGaussianBlur stdDeviation="10" result="blur" />
                    <feColorMatrix
                        in="blur"
                        type="matrix"
                        values="
              1 0 0 0 0
              0 1 0 0 0
              0 0 1 0 0
              0 0 0 0.65 0
            "
                        result="glow"
                    />
                    <feMerge>
                        <feMergeNode in="glow" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
            </defs>

            <g transform={flip}>
                <path
                    d="
            M 90 110
            L 680 110
            L 680 70
            L 930 110
            L 680 150
            L 680 110
            L 90 110
            Z
          "
                    fill="url(#aFill)"
                    stroke="url(#aStroke)"
                    strokeWidth="2.4"
                    filter="url(#aGlow)"
                />
            </g>
        </svg>
    );
}