// @ts-nocheck -- template-only; the scaffold engine strips this line before writing to user projects so scaffolded output has normal TypeScript checking.
import { ClerkProvider } from '@clerk/nextjs';
import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

export const metadata: Metadata = {
  title: '{{projectName}}',
  description: 'Scaffolded by create-rell-app',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

// ClerkProvider wraps the entire app and manages the auth session. The
// Supabase client created in `lib/supabase/client.ts` pulls the Clerk token
// via the `accessToken` callback — see that file for the native 3P auth
// wiring. This root layout is a Server Component; Clerk's Next.js SDK is
// designed to be placed here.
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
