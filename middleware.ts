import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/constants/branding";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const isLoggedIn = Boolean(token);

  if (pathname.startsWith("/login")) {
    if (isLoggedIn) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  const isProtected =
    pathname === "/" ||
    pathname.startsWith("/mine") ||
    pathname.startsWith("/orders") ||
    pathname.startsWith("/manage") ||
    pathname.startsWith("/categories") ||
    pathname.startsWith("/users");

  if (isProtected && !isLoggedIn) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/mine",
    "/orders/:path*",
    "/manage/:path*",
    "/categories/:path*",
    "/users/:path*",
  ],
};
