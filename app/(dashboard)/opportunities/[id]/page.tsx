'use client';

import { use } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  ExternalLink,
  CheckCircle2,
  Clock,
  TrendingUp,
  Globe,
  Sparkles,
  Copy,
  AlertCircle,
  Star,
  ChevronRight,
  Image as ImageIcon,
  FileText
} from 'lucide-react';
import { trpc } from '@/lib/api/client';
import { toast } from 'sonner';

// Fake opportunity data with detailed tutorials
const OPPORTUNITIES = {
  '1': {
    id: '1',
    siteName: 'LinkedIn Pulse',
    url: 'https://www.linkedin.com/pulse',
    shortDescription: 'Publish articles on LinkedIn to reach professional audience',
    fullDescription: 'LinkedIn Pulse is a powerful platform for publishing long-form content that reaches millions of professionals worldwide. By creating high-quality articles, you can establish thought leadership, drive traffic to your website, and build valuable dofollow backlinks from one of the highest authority domains on the internet.',
    category: 'Professional Network',
    niche: 'Technology',
    language: 'en',
    country: 'US',
    linkType: 'ARTICLE_SUBMISSION',
    isFree: true,
    difficultyLevel: 2,
    domainAuthority: 98,
    domainRating: 99,
    estimatedTraffic: 1000000000,
    spamScore: 1,
    isDofollow: true,
    averageTime: '45 minutes',
    successRate: 95,
    instructions: [
      {
        stepOrder: 1,
        stepTitle: 'Create or Sign In to LinkedIn Account',
        stepDescription: 'Visit LinkedIn.com and either sign in to your existing professional account or create a new one. Make sure your profile is complete with a professional photo, headline, and work experience. A complete profile increases the credibility of your articles and improves engagement.',
        estimatedMinutes: 10,
        tips: [
          'Use a professional email address',
          'Complete all profile sections to 100%',
          'Add at least 50+ connections before publishing'
        ]
      },
      {
        stepOrder: 2,
        stepTitle: 'Navigate to LinkedIn Pulse Publishing',
        stepDescription: 'Click on "Write article" from your LinkedIn homepage. You can find this option in the "Start a post" section at the top of your feed, or by clicking on "Write article" in the dropdown menu next to the post button.',
        estimatedMinutes: 2,
        tips: [
          'Look for the pencil icon in the posting area',
          'Alternatively, visit linkedin.com/pulse-write',
          'Make sure you\'re on desktop for full editor features'
        ]
      },
      {
        stepOrder: 3,
        stepTitle: 'Write High-Quality Article',
        stepDescription: 'Create a comprehensive, valuable article (minimum 500 words) that provides genuine value to your target audience. Focus on your expertise, industry insights, or how-to guides. Use proper formatting with headings, bullet points, and images to improve readability.',
        estimatedMinutes: 30,
        tips: [
          'Aim for 800-1500 words for best engagement',
          'Use H2 and H3 headings to structure content',
          'Include relevant statistics and data',
          'Add 2-3 high-quality images',
          'Write a compelling headline (under 100 characters)'
        ]
      },
      {
        stepOrder: 4,
        stepTitle: 'Add Your Backlink Naturally',
        stepDescription: 'Include 1-2 contextual links to your website within the article content. Place links where they naturally fit and provide value to readers. You can link to relevant resources, tools, or related articles on your site. Avoid being overly promotional.',
        estimatedMinutes: 5,
        tips: [
          'Link in the first 300 words for maximum visibility',
          'Use descriptive anchor text, not "click here"',
          'Link to your best, most relevant content',
          'Don\'t overdo it - 1-2 links maximum'
        ]
      },
      {
        stepOrder: 5,
        stepTitle: 'Optimize with Tags and Hashtags',
        stepDescription: 'Add 3-5 relevant tags to your article to improve discoverability. LinkedIn uses these to suggest your content to interested readers. Choose tags that align with your industry and topic.',
        estimatedMinutes: 3,
        tips: [
          'Use industry-specific tags',
          'Include 3-5 hashtags in the article',
          'Research popular LinkedIn hashtags in your niche'
        ]
      },
      {
        stepOrder: 6,
        stepTitle: 'Publish and Share',
        stepDescription: 'Review your article for typos and formatting issues, then click "Publish". Once live, share your article to your LinkedIn feed with a brief introduction. Engage with commenters to boost visibility.',
        estimatedMinutes: 5,
        tips: [
          'Use Grammarly or similar tool to check spelling',
          'Preview before publishing',
          'Share to relevant LinkedIn groups',
          'Reply to all comments within 24 hours'
        ]
      },
      {
        stepOrder: 7,
        stepTitle: 'Monitor Performance',
        stepDescription: 'Check your article analytics after 24-48 hours. LinkedIn provides data on views, engagement, and reader demographics. Use these insights to optimize future articles.',
        estimatedMinutes: 10,
        tips: [
          'Track clicks on your backlink using UTM parameters',
          'Note the best time to publish for your audience',
          'Republish or update if performance is low'
        ]
      }
    ]
  },
  '2': {
    id: '2',
    siteName: 'Medium',
    url: 'https://medium.com',
    shortDescription: 'Publish stories and articles on Medium platform',
    fullDescription: 'Medium is one of the most popular blogging platforms with millions of monthly readers. It offers an excellent opportunity to reach a wide audience and earn high-quality dofollow backlinks. Medium articles often rank well in Google search results.',
    category: 'Blogging Platform',
    niche: 'Technology',
    language: 'en',
    country: 'US',
    linkType: 'ARTICLE_SUBMISSION',
    isFree: true,
    difficultyLevel: 2,
    domainAuthority: 96,
    domainRating: 95,
    estimatedTraffic: 300000000,
    spamScore: 2,
    isDofollow: true,
    averageTime: '40 minutes',
    successRate: 90,
    instructions: [
      {
        stepOrder: 1,
        stepTitle: 'Sign Up for Medium Account',
        stepDescription: 'Visit Medium.com and create a free account using Google, Facebook, or email. Choose a memorable username that represents your brand or expertise.',
        estimatedMinutes: 5,
        tips: [
          'Use Google sign-in for faster setup',
          'Choose a professional username',
          'Add a profile photo immediately'
        ]
      },
      {
        stepOrder: 2,
        stepTitle: 'Complete Your Profile',
        stepDescription: 'Fill out your bio with a compelling description of who you are and what you write about. Add your website URL in the profile link section. Follow some popular publications in your niche.',
        estimatedMinutes: 10,
        tips: [
          'Write a 150-200 character bio',
          'Include keywords related to your expertise',
          'Follow 10-20 relevant publications',
          'Add social media links'
        ]
      },
      {
        stepOrder: 3,
        stepTitle: 'Write Your Article',
        stepDescription: 'Click "Write" in the top right corner to start a new story. Write a comprehensive article (minimum 500 words) with proper formatting. Use the Medium editor tools for headings, lists, and quotes.',
        estimatedMinutes: 30,
        tips: [
          'Start with a captivating opening',
          'Use subheadings every 200-300 words',
          'Add relevant images with captions',
          'Keep paragraphs short (3-4 sentences)'
        ]
      },
      {
        stepOrder: 4,
        stepTitle: 'Insert Backlinks Strategically',
        stepDescription: 'Add 1-2 hyperlinks to your website within the article. Highlight text that naturally fits the link context and click the link icon. Medium allows dofollow links, making this very valuable.',
        estimatedMinutes: 5,
        tips: [
          'Link to cornerstone content on your site',
          'Use natural anchor text',
          'Place one link in the first half of the article',
          'Maximum 2 external links to your site'
        ]
      },
      {
        stepOrder: 5,
        stepTitle: 'Add Tags and Publish',
        stepDescription: 'Add up to 5 relevant tags to help readers find your article. Write a compelling subtitle (under the title). Click "Publish" and choose your distribution settings.',
        estimatedMinutes: 5,
        tips: [
          'Use all 5 tags - they\'re crucial for discovery',
          'Research trending tags in your niche',
          'Enable email distribution to followers'
        ]
      },
      {
        stepOrder: 6,
        stepTitle: 'Submit to Publications (Optional)',
        stepDescription: 'Consider submitting your article to relevant Medium publications for wider reach. Click "Add to publication" and browse suitable publications in your niche.',
        estimatedMinutes: 10,
        tips: [
          'Target publications with 10K+ followers',
          'Read submission guidelines carefully',
          'Some publications review within 24 hours'
        ]
      },
      {
        stepOrder: 7,
        stepTitle: 'Promote and Engage',
        stepDescription: 'Share your Medium article on social media. Respond to comments and claps. Engage with other writers to build your Medium presence.',
        estimatedMinutes: 15,
        tips: [
          'Share on Twitter with Medium\'s share button',
          'Post in relevant LinkedIn groups',
          'Clap for and comment on similar articles'
        ]
      }
    ]
  },
  // Add more opportunities here...
};

export default function OpportunityDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  
  // Get real data from API with proper caching disabled
  const { data: opportunity, isLoading } = trpc.opportunity.getById.useQuery(
    { id },
    {
      enabled: !!id,
      refetchOnMount: true,
      refetchOnWindowFocus: false,
      staleTime: 0, // Don't cache to ensure fresh data for each opportunity
    }
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="h-16 w-16 border-4 border-navy-200 border-t-navy-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-semibold">Loading opportunity details...</p>
        </div>
      </div>
    );
  }

  if (!opportunity) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600 font-semibold">Opportunity not found</p>
          <Link href="/opportunities">
            <Button className="mt-4" variant="outline">
              Back to Opportunities
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const getLinkTypeColor = (linkType: string) => {
    const colors: Record<string, string> = {
      PROFILE: 'from-blue-500 to-cyan-500',
      DIRECTORY: 'from-green-500 to-emerald-500',
      GUEST_POST: 'from-navy-500 to-sky-500',
      FORUM: 'from-gold-500 to-red-500',
      SOCIAL: 'from-indigo-500 to-purple-500',
      ARTICLE_SUBMISSION: 'from-yellow-500 to-gold-500',
      BUSINESS_LISTING: 'from-teal-500 to-green-500',
      Q_AND_A: 'from-pink-500 to-rose-500',
    };
    return colors[linkType] || 'from-gray-500 to-gray-600';
  };

  const gradient = getLinkTypeColor(opportunity.linkType);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Back Button */}
      <Link href="/opportunities">
        <Button variant="ghost" size="sm" className="hover:bg-navy-50">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Opportunities
        </Button>
      </Link>

      {/* Hero Section */}
      <Card className={`bg-gradient-to-br ${gradient} text-white border-0 shadow-2xl overflow-hidden`}>
        <CardContent className="pt-8 pb-8">
          <div className="flex flex-col lg:flex-row items-start justify-between gap-6">
            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-3">
                <div className={`h-20 w-20 bg-white/20 backdrop-blur rounded-3xl flex items-center justify-center`}>
                  <Globe className="h-10 w-10 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-black">{opportunity.siteName}</h1>
                  <div className="flex items-center gap-2 mt-2 text-white/90">
                    <Link2 className="h-4 w-4" />
                    <a href={opportunity.websiteUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
                      {opportunity.websiteUrl}
                    </a>
                  </div>
                </div>
              </div>
              
              <p className="text-white/95 text-lg leading-relaxed">{opportunity.fullDescription}</p>
              
              <div className="flex flex-wrap items-center gap-3">
                <Badge className="bg-white/20 backdrop-blur border-white/30 text-white text-base px-4 py-2">
                  {opportunity.linkType.replace(/_/g, ' ')}
                </Badge>
                <Badge className="bg-white/20 backdrop-blur border-white/30 text-white text-base px-4 py-2">
                  {opportunity.category}
                </Badge>
                {opportunity.isFree ? (
                  <Badge className="bg-green-500/90 backdrop-blur text-white border-0 text-base px-4 py-2">
                    <CheckCircle2 className="h-4 w-4 mr-1" />
                    Free
                  </Badge>
                ) : (
                  <Badge className="bg-gold-500/90 backdrop-blur text-white border-0 text-base px-4 py-2">
                    ${((opportunity.cost || 0) / 100).toFixed(0)}
                  </Badge>
                )}
                {opportunity.isDofollow && (
                  <Badge className="bg-blue-500/90 backdrop-blur text-white border-0 text-base px-4 py-2">
                    Dofollow
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <Button
                size="lg"
                className="bg-white text-gray-900 hover:bg-gray-100 shadow-xl font-bold text-lg"
                onClick={() => window.open(opportunity.websiteUrl, '_blank')}
              >
                Visit Website
                <ExternalLink className="h-5 w-5 ml-2" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-white/50 text-white hover:bg-white/20 font-bold text-lg"
                onClick={() => copyToClipboard(opportunity.websiteUrl)}
              >
                Copy URL
                <Copy className="h-5 w-5 ml-2" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SEO Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white">
          <CardContent className="pt-6">
            <div className="text-center">
              <TrendingUp className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600 mb-1">Domain Authority</p>
              <p className="text-4xl font-black text-blue-900">{opportunity.domainAuthority}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-navy-200 bg-gradient-to-br from-paleblue-50 to-white">
          <CardContent className="pt-6">
            <div className="text-center">
              <Star className="h-8 w-8 text-navy-500 mx-auto mb-2" />
              <p className="text-sm text-gray-600 mb-1">Domain Rating</p>
              <p className="text-4xl font-black text-purple-900">{opportunity.domainRating}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-white">
          <CardContent className="pt-6">
            <div className="text-center">
              <Clock className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600 mb-1">Average Time</p>
              <p className="text-2xl font-black text-green-900">{opportunity.averageTime}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-gold-200 bg-gradient-to-br from-orange-50 to-white">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="h-8 w-8 text-gold-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600 mb-1">Difficulty</p>
              <div className="flex items-center justify-center gap-1 mt-2">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-5 w-5 ${
                      i < opportunity.difficultyLevel ? 'text-gold-500 fill-orange-500' : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-pink-200 bg-gradient-to-br from-pink-50 to-white">
          <CardContent className="pt-6">
            <div className="text-center">
              <Sparkles className="h-8 w-8 text-pink-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600 mb-1">Success Rate</p>
              <p className="text-4xl font-black text-pink-900">{opportunity.successRate}%</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Step-by-Step Instructions */}
      <Card className="border-2 border-gray-200 shadow-xl">
        <CardHeader className="bg-gradient-to-r from-paleblue-50 to-pink-50 border-b-2 border-navy-200">
          <CardTitle className="text-3xl flex items-center gap-3">
            <FileText className="h-8 w-8 text-navy-500" />
            Step-by-Step Tutorial
          </CardTitle>
          <p className="text-gray-600 mt-2">Follow these detailed instructions to create your backlink</p>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-6">
            {opportunity.instructions.map((instruction, index) => (
              <div
                key={instruction.stepOrder}
                className="relative pl-8 pb-8 border-l-4 border-navy-200 last:border-l-0 last:pb-0"
              >
                {/* Step Number Badge */}
                <div className={`absolute left-0 top-0 -translate-x-1/2 h-14 w-14 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center shadow-xl border-4 border-white`}>
                  <span className="text-white font-black text-xl">{instruction.stepOrder}</span>
                </div>

                {/* Step Content */}
                <div className="ml-6">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-2xl font-bold text-gray-900">{instruction.stepTitle}</h3>
                    <Badge variant="outline" className="ml-4 flex-shrink-0">
                      <Clock className="h-3 w-3 mr-1" />
                      {instruction.estimatedMinutes} min
                    </Badge>
                  </div>

                  <p className="text-gray-700 leading-relaxed mb-4 text-lg">
                    {instruction.stepDescription}
                  </p>

                  {/* Tips Section */}
                  {instruction.tips && instruction.tips.length > 0 && (
                    <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-5 rounded-xl border-2 border-blue-200">
                      <div className="flex items-center gap-2 mb-3">
                        <Sparkles className="h-5 w-5 text-blue-600" />
                        <span className="font-bold text-blue-900">Pro Tips:</span>
                      </div>
                      <ul className="space-y-2">
                        {instruction.tips.map((tip, tipIndex) => (
                          <li key={tipIndex} className="flex items-start gap-2 text-gray-700">
                            <ChevronRight className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Screenshot */}
                  {instruction.screenshotUrl ? (
                    <div className="mt-4">
                      <img 
                        src={instruction.screenshotUrl} 
                        alt={`Step ${instruction.stepOrder}: ${instruction.stepTitle}`}
                        className="w-full rounded-xl border-4 border-navy-200 shadow-2xl hover:shadow-3xl transition-shadow cursor-pointer"
                        onClick={() => window.open(instruction.screenshotUrl, '_blank')}
                      />
                    </div>
                  ) : (
                    <div className="mt-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl p-8 border-2 border-dashed border-gray-300">
                      <div className="flex flex-col items-center justify-center text-gray-500">
                        <ImageIcon className="h-16 w-16 mb-3" />
                        <p className="font-semibold">Screenshot Coming Soon</p>
                        <p className="text-sm">{instruction.stepTitle}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

    </div>
  );
}

// Add GitHub opportunity
OPPORTUNITIES['3'] = {
  id: '3',
  siteName: 'GitHub Profile',
  url: 'https://github.com',
  shortDescription: 'Add your website to your GitHub developer profile',
  fullDescription: 'GitHub is the world\'s leading platform for code hosting and version control. With over 100 million developers, adding your website link to your GitHub profile is an easy way to get a high-authority dofollow backlink.',
  category: 'Developer Platform',
  niche: 'Technology',
  language: 'en',
  country: 'US',
  linkType: 'PROFILE',
  isFree: true,
  difficultyLevel: 1,
  domainAuthority: 95,
  domainRating: 94,
  estimatedTraffic: 500000000,
  spamScore: 0,
  isDofollow: true,
  averageTime: '10 minutes',
  successRate: 99,
  instructions: [
    {
      stepOrder: 1,
      stepTitle: 'Create GitHub Account',
      stepDescription: 'Visit github.com and sign up for a free account. Use your professional email address and choose a username that represents your brand or real name.',
      estimatedMinutes: 3,
      tips: [
        'Choose a professional username',
        'Use the same username across platforms',
        'Enable two-factor authentication for security'
      ]
    },
    {
      stepOrder: 2,
      stepTitle: 'Complete Your Profile',
      stepDescription: 'Click on your profile picture in the top right, then select "Your profile". Click "Edit profile" to access the profile settings.',
      estimatedMinutes: 2,
      tips: [
        'Add a professional profile picture',
        'Use a clear headshot or logo',
        'Match your profile photo to other platforms'
      ]
    },
    {
      stepOrder: 3,
      stepTitle: 'Add Your Website URL',
      stepDescription: 'In the profile edit page, find the "Website" or "Blog" field. Enter your complete website URL including https://. This link will be displayed prominently on your profile.',
      estimatedMinutes: 2,
      tips: [
        'Use your main domain (not subdomain)',
        'Include https:// for security',
        'Test the link after saving'
      ]
    },
    {
      stepOrder: 4,
      stepTitle: 'Add Bio and Location',
      stepDescription: 'Write a compelling bio (160 characters max) that describes what you do. Add your location and company information for additional credibility.',
      estimatedMinutes: 5,
      tips: [
        'Include relevant keywords in your bio',
        'Mention your specialization',
        'Keep it professional and concise'
      ]
    },
    {
      stepOrder: 5,
      stepTitle: 'Create README Profile (Bonus)',
      stepDescription: 'Create a special repository with your username to add a README to your profile. This allows you to add another link and showcase your work.',
      estimatedMinutes: 10,
      tips: [
        'Repository name must match your username',
        'Add profile stats and badges',
        'Include social media links',
        'Showcase your best projects'
      ]
    }
  ]
};
