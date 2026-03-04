import type { Metadata } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://rankdseo.com';

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  try {
    const opportunity = await prisma.backlinkOpportunity.findUnique({
      where: { slug: params.slug },
      select: {
        siteName: true,
        shortDescription: true,
        slug: true,
        domainAuthority: true,
        linkType: true,
        category: true,
        isFree: true,
      },
    });

    if (!opportunity) {
      return {
        title: 'Opportunity Not Found',
        description: 'The backlink opportunity you are looking for does not exist.',
      };
    }

    const title = `${opportunity.siteName} Backlink - DA ${opportunity.domainAuthority || 'N/A'} ${opportunity.linkType.replace(/_/g, ' ')} Opportunity`;
    const description = `Get a ${opportunity.isFree ? 'free ' : ''}${opportunity.linkType.replace(/_/g, ' ').toLowerCase()} backlink from ${opportunity.siteName} (DA ${opportunity.domainAuthority || 'N/A'}). ${opportunity.shortDescription}. Step-by-step guide with screenshots.`;

    return {
      title,
      description,
      keywords: [
        `${opportunity.siteName} backlink`,
        `${opportunity.siteName} SEO`,
        `${opportunity.category} backlinks`,
        `${opportunity.linkType.replace(/_/g, ' ').toLowerCase()} backlink`,
        'backlink opportunity',
        'link building',
        `DA ${opportunity.domainAuthority} backlink`,
        'free backlinks',
        'SEO guide',
      ],
      openGraph: {
        title: `${opportunity.siteName} Backlink Opportunity - RankdSEO`,
        description,
        url: `${baseUrl}/opportunities/${opportunity.slug}`,
        type: 'article',
        siteName: 'RankdSEO',
        images: [{ url: `${baseUrl}/logo.png`, alt: `${opportunity.siteName} Backlink Guide` }],
      },
      twitter: {
        card: 'summary',
        title: `${opportunity.siteName} Backlink - DA ${opportunity.domainAuthority || 'N/A'}`,
        description,
      },
      alternates: {
        canonical: `${baseUrl}/opportunities/${opportunity.slug}`,
      },
    };
  } catch {
    return {
      title: 'Backlink Opportunity',
      description: 'Discover high-quality backlink opportunities with step-by-step guides.',
    };
  }
}

export default function OpportunitySlugLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
