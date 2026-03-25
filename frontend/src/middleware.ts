import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
    const token = request.cookies.get("token")?.value;
    const { pathname } = request.nextUrl;

    // Kalau sudah login dan buka /login, redirect ke dashboard
    if (token && pathname === "/login") {
        return NextResponse.redirect(new URL("/", request.url));
    }

    // Kalau belum login dan buka halaman selain /login, redirect ke /login
    if (!token && pathname !== "/login") {
        return NextResponse.redirect(new URL("/login", request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Proteksi semua route kecuali:
         * - _next/static (file statis)
         * - _next/image (optimasi gambar)
         * - favicon.ico
         * - api routes
         */
        "/((?!_next/static|_next/image|favicon.ico|api/).*)",
    ],
};
