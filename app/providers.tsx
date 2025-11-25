'use client';

import { SessionProvider } from 'next-auth/react';
import { TRPCProvider } from '@/lib/api/providers';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <TRPCProvider>
        {children}
      </TRPCProvider>
    </SessionProvider>
  );
}
