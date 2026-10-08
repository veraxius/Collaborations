import { NextResponse, type NextRequest } from "next/server"

/**
 * Auth for the product is a JWT in localStorage, checked client-side in
 * app/app/layout.tsx. This middleware does two things:
 *  1. Hard-blocks legacy routes from a previous product (unauthenticated
 *     AI/scraping endpoints and the old dashboard). Remove those folders and
 *     this block when ready.
 *  2. On private (white-label) installs, hides the public marketing site and
 *     sends visitors straight to the login screen.
 */
const LEGACY = [
  "/dashboard",
  "/onboarding",
  "/auth",
  "/api/analyze",
  "/api/translate",
  "/api/ai-chat",
  "/api/dashboard",
  "/api/onboarding",
  "/api/tareas",
  "/api/ai/analizar",
  "/api/ai/chat",
  "/api/ai/recomendaciones",
  "/api/ai/resumen",
  "/api/ai/score",
  "/api/ai/tareas",
]

const MARKETING = ["/", "/pricing", "/faq", "/contact", "/guides", "/tools", "/enterprise", "/signup"]

const startsWithPath = (pathname: string, base: string) =>
  pathname === base || pathname.startsWith(`${base}/`)

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (LEGACY.some((p) => startsWithPath(pathname, p))) {
    return new NextResponse("Not found", { status: 404 })
  }

  if (
    process.env.NEXT_PUBLIC_DEPLOYMENT_MODE === "private" &&
    MARKETING.some((p) => (p === "/" ? pathname === "/" : startsWithPath(pathname, p)))
  ) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/",
    "/pricing",
    "/faq",
    "/contact",
    "/guides/:path*",
    "/tools/:path*",
    "/enterprise",
    "/signup",
    "/dashboard/:path*",
    "/onboarding/:path*",
    "/auth/:path*",
    "/api/analyze/:path*",
    "/api/translate/:path*",
    "/api/ai-chat/:path*",
    "/api/dashboard/:path*",
    "/api/onboarding/:path*",
    "/api/tareas/:path*",
    "/api/ai/analizar",
    "/api/ai/chat",
    "/api/ai/recomendaciones",
    "/api/ai/resumen",
    "/api/ai/score",
    "/api/ai/tareas",
  ],
}
