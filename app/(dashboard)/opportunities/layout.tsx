import type { Metadata } from 'next';

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://rankdseo.com';

export const metadata: Metadata = {
  title: 'Opportunities - Browse 1000+ High-Authority Backlink Sites',
  description: 'Browse our curated database of 1000+ backlink opportunities sorted by domain authority. Filter by category, link type, and more. Get step-by-step guides for each site.',
  keywords: [
    'backlink database',
    'high authority backlinks',
    'backlink opportunities list',
    'SEO link building',
    'free backlinks',
    'DA 90 backlinks',
  ],
  openGraph: {
    title: 'Browse 1000+ Backlink Opportunities - RankdSEO',
    description: 'Curated database of high-authority backlink sites with step-by-step tutorials.',
    url: `${baseUrl}/opportunities`,
    type: 'website',
  },
  alternates: {
    canonical: `${baseUrl}/opportunities`,
  },
};

export default function OpportunitiesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
