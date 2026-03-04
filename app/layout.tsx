import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from './providers';
import { Toaster } from '@/components/ui/sonner';
import '@/lib/init'; // Initialize background jobs

const inter = Inter({ subsets: ['latin'] });

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://rankdseo.com';

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: 'RankdSEO - 1000+ Curated Backlink Opportunities with Step-by-Step Guides',
    template: '%s | RankdSEO',
  },
  description: 'Discover 1000+ curated, high-authority backlink opportunities with step-by-step screenshot tutorials. Build quality backlinks from DA 90+ sites like Google, Microsoft, LinkedIn, and more.',
  keywords: [
    'backlink opportunities',
    'SEO backlinks',
    'link building',
    'high authority backlinks',
    'dofollow backlinks',
    'backlink database',
    'SEO tools',
    'domain authority',
    'backlink building guide',
    'free backlinks',
    'profile backlinks',
    'guest posting',
    'link building strategy',
    'SEO link building',
    'backlink checker',
  ],
  authors: [{ name: 'RankdSEO', url: baseUrl }],
  creator: 'RankdSEO',
  publisher: 'SIA Uprankd',
  icons: {
    icon: '/favicon.png',
    apple: '/favicon.png',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: baseUrl,
    siteName: 'RankdSEO',
    title: 'RankdSEO - 1000+ Curated Backlink Opportunities',
    description: 'Discover curated, high-authority backlink opportunities with step-by-step screenshot tutorials. Build quality backlinks from DA 90+ sites.',
    images: [
      {
        url: `${baseUrl}/logo.png`,
        width: 800,
        height: 200,
        alt: 'RankdSEO - Backlink Management Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RankdSEO - 1000+ Curated Backlink Opportunities',
    description: 'Build quality backlinks from DA 90+ sites with step-by-step guides.',
    images: [`${baseUrl}/logo.png`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: baseUrl,
  },
  verification: {},
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 min-h-screen`}>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}