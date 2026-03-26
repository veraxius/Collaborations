"use client"

import { useEffect, useState } from "react"

const TYPED_LETTERS = ["e", "x", "o", "r", "a"] as const
const L_FADE_IN_MS = 300
const LETTER_STEP_MS = 120
const SUBTITLE_DELAY_AFTER_WORD_MS = 200

export function LexoraLogoAnimated() {
  const [showL, setShowL] = useState(false)
  const [visibleLetters, setVisibleLetters] = useState(0)
  const [showSubtitle, setShowSubtitle] = useState(false)

  useEffect(() => {
    const timeouts: ReturnType<typeof setTimeout>[] = []

    timeouts.push(
      setTimeout(() => {
        setShowL(true)
      }, 0)
    )

    TYPED_LETTERS.forEach((_, index) => {
      const timeout = setTimeout(() => {
        setVisibleLetters(index + 1)
      }, L_FADE_IN_MS + index * LETTER_STEP_MS)
      timeouts.push(timeout)
    })

    const subtitleTimeout = setTimeout(() => {
      setShowSubtitle(true)
    }, L_FADE_IN_MS + (TYPED_LETTERS.length - 1) * LETTER_STEP_MS + SUBTITLE_DELAY_AFTER_WORD_MS)
    timeouts.push(subtitleTimeout)

    return () => {
      timeouts.forEach(clearTimeout)
    }
  }, [])

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        marginTop: "-36px",
        marginBottom: "32px",
      }}
    >
      <div
        style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: "clamp(58px, 10vw, 84px)",
          fontWeight: 700,
          letterSpacing: "-0.04em",
          lineHeight: 1,
          color: "#F0EDE8",
        }}
      >
        <span
          style={{
            opacity: showL ? 1 : 0,
            transition: "opacity 0.3s ease",
            color: "#F0EDE8",
          }}
        >
          L
        </span>
        {TYPED_LETTERS.map((letter, index) => (
          <span
            key={`${letter}-${index}`}
            style={{
              opacity: visibleLetters > index ? 1 : 0,
              transition: "opacity 0.15s ease",
              color: letter === "o" ? "#E8C97A" : "#F0EDE8",
            }}
          >
            {letter}
          </span>
        ))}
      </div>

      <div
        style={{
          marginTop: "10px",
          opacity: showSubtitle ? 1 : 0,
          transition: "opacity 0.5s ease",
          color: "rgba(240,237,232,0.58)",
          fontSize: "10px",
          fontWeight: 500,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          textAlign: "center",
        }}
      >
        Business Intelligence
      </div>
    </div>
  )
}

