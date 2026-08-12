import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Prevent crashing if environment variables are missing in Vercel
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("CRITICAL ERROR: Supabase environment variables are missing in Vercel. Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel Project Settings.");
    return response;
  }

  try {
    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
              response = NextResponse.next({
                request,
              });
              cookiesToSet.forEach(({ name, value, options }) =>
                response.cookies.set(name, value, options)
              );
            } catch (cookieErr) {
              console.warn("Middleware cookie write warning:", cookieErr);
            }
          },
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const isLoginPage = request.nextUrl.pathname.startsWith('/login');
    const isAdminPage = request.nextUrl.pathname.startsWith('/admin');

    if (isAdminPage && !user) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    if (isLoginPage && user) {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
  } catch (err) {
    console.error("Supabase Middleware Execution Error:", err);
  }

  return response;
}

export const config = {
  matcher: ['/admin/:path*', '/login'],
};
