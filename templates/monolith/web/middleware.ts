import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Protected routes match any path inside the `(dashboard)` route group.
// The matcher also catches `/dashboard/...` rewrites automatically — route
// groups are purely organizational and don't appear in the URL.
//
// There are NO bypass paths here. NFR7 of the PRD requires auth middleware
// to reject unauthenticated requests to protected routes with no escape
// hatches. Add new protected areas to this list rather than disabling auth
// for specific files.
const isProtectedRoute = createRouteMatcher(['/(dashboard)(.*)', '/dashboard(.*)']);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    // `auth.protect()` throws if the request is not authenticated, and
    // Clerk's middleware translates the throw into a 302 redirect to the
    // configured sign-in URL.
    await auth.protect();
  }
});

export const config = {
  // Canonical Clerk + Next.js matcher: skip Next.js internals and files
  // with file extensions (static assets). Everything else runs through
  // the middleware so Clerk can attach session context.
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
