import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl

  // Si no está logueado e intenta entrar al dashboard u onboarding → login
  if (
    !user &&
    (pathname.startsWith("/dashboard") || pathname.startsWith("/onboarding"))
  ) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarding_completed")
      .eq("id", user.id)
      .single()

    const onboardingDone = profile?.onboarding_completed

    // Logueado sin onboarding → forzar onboarding
    if (!onboardingDone && pathname.startsWith("/dashboard")) {
      return NextResponse.redirect(new URL("/onboarding", request.url))
    }

    // Ya hizo onboarding e intenta ir al onboarding → dashboard
    if (onboardingDone && pathname.startsWith("/onboarding")) {
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }

    // Logueado e intenta ir al login o register → dashboard
    if (pathname.startsWith("/login") || pathname.startsWith("/register")) {
      if (onboardingDone) {
        return NextResponse.redirect(new URL("/dashboard", request.url))
      } else {
        return NextResponse.redirect(new URL("/onboarding", request.url))
      }
    }
  }

  return response
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/onboarding/:path*",
    "/(auth)/login",
    "/(auth)/register",
  ],
}

