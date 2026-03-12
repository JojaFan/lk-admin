import React from "react";

export default function MoonRibbon() {
    return (
        <svg
            className="moonRibbonSvg"
            viewBox="0 0 1000 220"
            preserveAspectRatio="none"
            aria-hidden="true"
        >
            <defs>
                <linearGradient id="ribFill" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0" stopColor="#d9b6ff" stopOpacity="0.28" />
                    <stop offset="0.5" stopColor="#c8e6ff" stopOpacity="0.32" />
                    <stop offset="1" stopColor="#d9b6ff" stopOpacity="0.28" />
                </linearGradient>

                <linearGradient id="ribStroke" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0" stopColor="#f7ddff" stopOpacity="0.70" />
                    <stop offset="0.5" stopColor="#e6f7ff" stopOpacity="0.70" />
                    <stop offset="1" stopColor="#f7ddff" stopOpacity="0.70" />
                </linearGradient>

                <filter id="ribGlow" x="-40%" y="-80%" width="180%" height="260%">
                    <feGaussianBlur stdDeviation="10" result="blur" />
                    <feColorMatrix
                        in="blur"
                        type="matrix"
                        values="
              1 0 0 0 0
              0 1 0 0 0
              0 0 1 0 0
              0 0 0 0.55 0
            "
                        result="glow"
                    />
                    <feMerge>
                        <feMergeNode in="glow" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>

                <radialGradient id="ribShine" cx="50%" cy="50%" r="70%">
                    <stop offset="0" stopColor="#ffffff" stopOpacity="0.22" />
                    <stop offset="0.55" stopColor="#ffffff" stopOpacity="0.08" />
                    <stop offset="1" stopColor="#ffffff" stopOpacity="0.00" />
                </radialGradient>

                <mask id="ribMask">
                    <rect x="0" y="0" width="1000" height="220" fill="black" />
                    <path
                        d="
              M 60 70
              Q 500 185 940 70
              Q 970 66 970 102
              Q 500 228 30 102
              Q 30 66 60 70
              Z
            "
                        fill="white"
                    />
                </mask>
            </defs>

            <path
                d="
          M 60 70
          Q 500 185 940 70
          Q 970 66 970 102
          Q 500 228 30 102
          Q 30 66 60 70
          Z
        "
                fill="url(#ribFill)"
                stroke="url(#ribStroke)"
                strokeWidth="2.2"
                filter="url(#ribGlow)"
            />

            <g mask="url(#ribMask)">
                <ellipse cx="500" cy="125" rx="460" ry="92" fill="url(#ribShine)" />
            </g>
        </svg>
    );
}