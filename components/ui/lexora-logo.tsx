"use client"

interface LexoraLogoProps {
  size?: "hero" | "large" | "medium" | "small"
  theme?: "light" | "dark" | "gold"
}

export function LexoraLogo({ size = "medium", theme = "light" }: LexoraLogoProps) {
  const sizes = {
    hero: { fontSize: "42px", letterSpacing: "-0.04em" },
    large: { fontSize: "34px", letterSpacing: "-0.04em" },
    medium: { fontSize: "28px", letterSpacing: "-0.04em" },
    small: { fontSize: "20px", letterSpacing: "-0.03em" },
  }

  const colors = {
    light: { base: "#F7F6F2", accent: "#C9A84C" },
    dark: { base: "#0D0D0F", accent: "#C9A84C" },
    gold: { base: "#0D0D0F", accent: "#0D0D0F" },
  }

  const { fontSize, letterSpacing } = sizes[size]
  const { base, accent } = colors[theme]

  return (
    <span
      style={{
        fontFamily: "'Instrument Serif', Georgia, serif",
        fontSize,
        fontWeight: 400,
        letterSpacing,
        lineHeight: 1,
        color: base,
        userSelect: "none",
      }}
    >
      Lex<span style={{ color: accent }}>o</span>ra
    </span>
  )
}

export function LexoraFavicon() {
  return (
    <div
      style={{
        background: "#0D0D0F",
        width: "32px",
        height: "32px",
        borderRadius: "8px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <span
        style={{
          fontFamily: "'Instrument Serif', Georgia, serif",
          fontSize: "20px",
          fontWeight: 400,
          color: "#C9A84C",
          fontStyle: "italic",
          lineHeight: 1,
          marginTop: "2px",
        }}
      >
        L
      </span>
    </div>
  )
}

