"use client"

interface LexoraLogoProps {
  size?: "hero" | "large" | "medium" | "small"
  theme?: "light" | "dark"
}

function LexoraIcon({ size = 32, color = "#0D0D0F" }: { size?: number; color?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Left bar — shortest */}
      <rect x="2" y="28" width="8" height="16" fill={color} rx="1" />

      {/* Middle bar — medium */}
      <rect x="14" y="20" width="8" height="24" fill={color} rx="1" />

      {/* Right bar — tallest */}
      <rect x="26" y="12" width="8" height="32" fill={color} rx="1" />

      {/* Diagonal line of the arrow */}
      <path
        d="M8 32 L36 6"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      {/* Arrow head */}
      <path
        d="M28 4 L38 4 L38 14"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  )
}

export function LexoraLogo({ size = "medium", theme = "dark" }: LexoraLogoProps) {
  const config = {
    hero: { iconSize: 52, fontSize: "42px", gap: "16px" },
    large: { iconSize: 40, fontSize: "34px", gap: "14px" },
    medium: { iconSize: 30, fontSize: "26px", gap: "10px" },
    small: { iconSize: 22, fontSize: "20px", gap: "8px" },
  }

  const iconColor = theme === "light" ? "#0D0D0F" : "#F7F6F2"
  const textColor = theme === "light" ? "#0D0D0F" : "#F7F6F2"
  const { iconSize, fontSize, gap } = config[size]

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap,
        userSelect: "none",
      }}
    >
      <LexoraIcon size={iconSize} color={iconColor} />
      <span
        style={{
          fontFamily: "'Inter', -apple-system, sans-serif",
          fontSize,
          fontWeight: 600,
          letterSpacing: "-0.02em",
          lineHeight: 1,
          color: textColor,
        }}
      >
        Lexora
      </span>
    </div>
  )
}

export function LexoraFavicon() {
  return (
    <div
      style={{
        background: "#2563EB",
        width: "32px",
        height: "32px",
        borderRadius: "7px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "6px",
      }}
    >
      <LexoraIcon size={20} color="#FFFFFF" />
    </div>
  )
}
