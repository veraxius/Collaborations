import { NextResponse, type NextRequest } from "next/server"

/**
 * Auth is JWT in localStorage (client-side). Middleware only redirects
 * the root. Protected /app routes check auth in the client layout.
 */
export function middleware(request: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: [],
}
