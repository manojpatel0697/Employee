import React from "react";

interface TheramifyLogoProps {
  /** Height of the logo in px. Width scales proportionally (square). */
  size?: number;
  /** Additional Tailwind or CSS classes */
  className?: string;
}

/**
 * Theramify Technologies brand mark — rendered as inline SVG.
 *
 * Faithfully reproduces the logo image:
 *   - Dark circular background with blue→red glowing ring border
 *   - Circuit-tree icon: blue branch on the left, red arrow/chevron on the right
 *   - "THERAMIFY" wordmark in white bold, "Technologies" subtitle below
 */
export default function TheramifyLogo({
  size = 40,
  className = "",
}: TheramifyLogoProps) {
  const id = "tl"; // short prefix for gradient IDs — avoids collisions if used multiple times
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Theramify Technologies"
      role="img"
      className={className}
    >
      <defs>
        {/* Glowing ring gradient: blue left → red right */}
        <linearGradient id={`${id}-ring`} x1="0%" y1="50%" x2="100%" y2="50%">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="50%" stopColor="#818cf8" />
          <stop offset="100%" stopColor="#ef4444" />
        </linearGradient>

        {/* Circuit tree icon gradient: blue → red */}
        <linearGradient id={`${id}-icon`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#ef4444" />
        </linearGradient>

        {/* Outer glow filter */}
        <filter id={`${id}-glow`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Dark circular background */}
      <circle cx="100" cy="100" r="96" fill="#0f172a" />

      {/* Glowing ring border */}
      <circle
        cx="100"
        cy="100"
        r="93"
        stroke={`url(#${id}-ring)`}
        strokeWidth="5"
        fill="none"
        filter={`url(#${id}-glow)`}
      />

      {/* ── Circuit-tree icon ───────────────────────────────── */}
      {/* Vertical stem */}
      <line
        x1="88" y1="115" x2="88" y2="78"
        stroke={`url(#${id}-icon)`} strokeWidth="5" strokeLinecap="round"
      />
      {/* Left branch */}
      <line
        x1="88" y1="90" x2="65" y2="68"
        stroke="#38bdf8" strokeWidth="5" strokeLinecap="round"
      />
      {/* Centre branch */}
      <line
        x1="88" y1="83" x2="90" y2="58"
        stroke="#38bdf8" strokeWidth="5" strokeLinecap="round"
      />
      {/* Right branch */}
      <line
        x1="88" y1="90" x2="112" y2="68"
        stroke="#7dd3fc" strokeWidth="5" strokeLinecap="round"
      />
      {/* Left endpoint circle */}
      <circle cx="65" cy="64" r="5" fill="none" stroke="#38bdf8" strokeWidth="4" />
      {/* Centre endpoint circle */}
      <circle cx="90" cy="54" r="5" fill="none" stroke="#38bdf8" strokeWidth="4" />
      {/* Right endpoint circle */}
      <circle cx="112" cy="64" r="5" fill="none" stroke="#7dd3fc" strokeWidth="4" />

      {/* Red arrow/chevron (right side of icon) */}
      {/* Diagonal line down-right */}
      <line
        x1="100" y1="78" x2="130" y2="100"
        stroke="#ef4444" strokeWidth="5" strokeLinecap="round"
      />
      {/* Arrow head (pointing right) */}
      <polyline
        points="118,88 132,100 118,112"
        stroke="#ef4444" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none"
      />
      {/* Lower diagonal of chevron */}
      <line
        x1="100" y1="112" x2="122" y2="95"
        stroke="#f87171" strokeWidth="4" strokeLinecap="round"
      />

      {/* ── Wordmark ─────────────────────────────────────────── */}
      <text
        x="100"
        y="148"
        textAnchor="middle"
        fontFamily="'Arial', 'Helvetica Neue', sans-serif"
        fontWeight="900"
        fontSize="22"
        letterSpacing="3"
        fill="white"
      >
        THERAMIFY
      </text>
      <text
        x="100"
        y="165"
        textAnchor="middle"
        fontFamily="'Arial', 'Helvetica Neue', sans-serif"
        fontWeight="400"
        fontSize="11"
        letterSpacing="1.5"
        fill="#94a3b8"
      >
        Technologies
      </text>
    </svg>
  );
}
