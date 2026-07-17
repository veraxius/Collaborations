import { ImageResponse } from "next/og";

export const alt = "FleetGuard — Never miss a DOT deadline again.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Fetches Barlow Condensed 700 as TTF (Google serves TTF when no browser
 * user-agent is sent). Falls back to the default font if unavailable.
 */
async function loadBarlowCondensed(): Promise<ArrayBuffer | null> {
  try {
    const css = await fetch(
      "https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700"
    ).then((res) => res.text());
    const url = css.match(/src: url\((.+?)\) format\(/)?.[1];
    if (!url) return null;
    return await fetch(url).then((res) => res.arrayBuffer());
  } catch {
    return null;
  }
}

export default async function OpengraphImage() {
  const fontData = await loadBarlowCondensed();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#101820",
          padding: "72px 80px",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 56,
            fontWeight: 700,
            color: "#F6F5F2",
            fontFamily: fontData ? "Barlow Condensed" : "sans-serif",
            letterSpacing: "-0.01em",
          }}
        >
          FleetGuard
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 88,
            fontWeight: 700,
            lineHeight: 1.05,
            color: "#F6F5F2",
            fontFamily: fontData ? "Barlow Condensed" : "sans-serif",
            maxWidth: 900,
          }}
        >
          Never miss a DOT deadline again.
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 40,
            color: "#FFB100",
            fontFamily: "monospace",
            letterSpacing: "0.05em",
          }}
        >
          30 · 15 · 7 · 1 · TODAY
        </div>
      </div>
    ),
    {
      ...size,
      fonts: fontData
        ? [
            {
              name: "Barlow Condensed",
              data: fontData,
              weight: 700,
              style: "normal",
            },
          ]
        : undefined,
    }
  );
}
