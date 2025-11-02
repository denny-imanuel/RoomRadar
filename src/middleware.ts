import { type NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  // Simple middleware to redirect root to login if not authenticated
  // In a real app, you'd check for a valid session token
  const hasAuthCookie = request.cookies.has('firebase-auth-cookie'); // Example cookie name
  const url = request.nextUrl.clone();

  if (url.pathname === '/') {
     url.pathname = '/login';
     return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
