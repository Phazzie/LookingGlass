import { auth } from "./auth";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isAuthRoute = req.nextUrl.pathname.startsWith("/api/auth");
  const isLoginRoute = req.nextUrl.pathname === "/login";

  if (isAuthRoute) {
    return;
  }

  if (!isLoggedIn && !isLoginRoute) {
    return Response.redirect(new URL("/login", req.nextUrl));
  }
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
