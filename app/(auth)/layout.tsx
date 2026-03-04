import type { Metadata } from 'next';

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://rankdseo.com';

export const metadata: Metadata = {
  title: 'Sign In - Access Your Backlink Dashboard',
  description: 'Sign in to RankdSEO to manage your backlink opportunities, track projects, and monitor your SEO progress.',
  robots: { index: false, follow: false },
  alternates: { canonical: `${baseUrl}/signin` },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
