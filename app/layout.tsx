import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Lexora - Business Intelligence",
  description: "Business Intelligence para tu empresa. Análisis impulsado por IA.",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48'><rect fill='%232563EB' width='48' height='48' rx='10'/><rect x='4' y='28' width='8' height='16' fill='white' rx='1'/><rect x='16' y='20' width='8' height='24' fill='white' rx='1'/><rect x='28' y='12' width='8' height='32' fill='white' rx='1'/><path d='M8 32 L38 6' stroke='white' stroke-width='2.5' stroke-linecap='round'/><path d='M30 4 L40 4 L40 14' stroke='white' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round' fill='none'/></svg>",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased min-h-screen">
        {children}
      </body>
    </html>
  )
}
