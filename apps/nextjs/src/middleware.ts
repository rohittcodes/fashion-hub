import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { initAuth } from "@acme/auth";

import { env } from "~/env";

const auth = initAuth({
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  baseUrl: env.AUTH_BASE_URL ?? "http://localhost:3000",
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  productionUrl: env.AUTH_PRODUCTION_URL ?? "http://localhost:3000",
  secret: env.AUTH_SECRET,
  discordClientId: env.AUTH_DISCORD_ID,
  discordClientSecret: env.AUTH_DISCORD_SECRET,
});

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin")) {
    try {
      // Get session from the request
      const session = await auth.api.getSession({
        headers: request.headers,
      });

      // Check if user is authenticated
      if (!session?.user) {
        return NextResponse.redirect(new URL("/", request.url));
      }

      // Check if user has admin role
      if (session.user.role !== "admin") {
        return NextResponse.redirect(new URL("/", request.url));
      }

      // User is authenticated and has admin role, allow access
      return NextResponse.next();
    } catch (error) {
      console.error("Middleware auth error:", error);
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  // For non-admin routes, continue normally
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
