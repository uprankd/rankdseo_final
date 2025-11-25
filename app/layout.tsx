import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { TRPCProvider } from '@/lib/api/providers';
import { Toaster } from '@/components/ui/sonner';
import { SessionProvider } from 'next-auth/react';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'RankdSEO - Backlink Management Platform',
  description: 'Discover and manage high-quality backlink opportunities with step-by-step instructions',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <SessionProvider>
          <TRPCProvider>
            {children}
            <Toaster />
          </TRPCProvider>
        </SessionProvider>
      </body>
    </html>
  );
}