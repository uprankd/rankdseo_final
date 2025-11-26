'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { trpc } from '@/lib/api/client';
import {
  ArrowLeft,
  Globe,
  Clock,
  CheckCircle2,
  XCircle,
  Circle,
  Sparkles,
  ExternalLink,
  Link as LinkIcon,
  FileText,
  Target,
  BarChart3,
  PlayCircle,
  Edit,
  Save,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Lightbulb,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

// Demo data for the three demo projects
const DEMO_PROJECT_DATA: Record<string, any> = {
  'demo-1': {
    id: 'demo-1',
    name: 'TechStartup Website',
    domain: 'techstartup.io',
    niche: 'Technology',
    targetCountry: 'United States',
    targetLanguage: 'English',
    color: '#3b82f6',
    description: 'Building high-quality backlinks for our innovative SaaS platform. Focus on tech publications, developer communities, and startup directories.',
    createdAt: '2024-11-15T10:00:00Z',
    opportunities: [
      {
        id: 'opp-1',
        projectOpportunityId: 'po-1',
        siteName: 'Medium',
        category: 'Content Platform',
        status: 'APPROVED',
        priority: 5,
        domainAuthority: 96,
        linkUrl: 'https://medium.com/@techstartup/article',
        submittedAt: '2024-11-18T14:30:00Z',
        approvedAt: '2024-11-20T09:15:00Z',
        notes: 'Published article about startup journey. Great engagement!',
      },
      {
        id: 'opp-2',
        projectOpportunityId: 'po-2',
        siteName: 'Product Hunt',
        category: 'Startup Platform',
        status: 'APPROVED',
        priority: 5,
        domainAuthority: 89,
        linkUrl: 'https://producthunt.com/posts/techstartup',
        submittedAt: '2024-11-16T08:00:00Z',
        approvedAt: '2024-11-16T18:30:00Z',
        notes: 'Featured on homepage! Got 250+ upvotes',
      },
      {
        id: 'opp-3',
        projectOpportunityId: 'po-3',
        siteName: 'DEV Community',
        category: 'Technology',
        status: 'IN_PROGRESS',
        priority: 4,
        domainAuthority: 80,
        notes: 'Draft article ready, reviewing before publish',
      },
      {
        id: 'opp-4',
        projectOpportunityId: 'po-4',
        siteName: 'Crunchbase',
        category: 'Business Directory',
        status: 'IN_PROGRESS',
        priority: 5,
        domainAuthority: 92,
        notes: 'Profile created, adding team and funding info',
      },
      {
        id: 'opp-5',
        projectOpportunityId: 'po-5',
        siteName: 'GitHub',
        category: 'Technology',
        status: 'APPROVED',
        priority: 4,
        domainAuthority: 95,
        linkUrl: 'https://github.com/techstartup/open-source-tool',
        submittedAt: '2024-11-10T11:00:00Z',
        approvedAt: '2024-11-10T11:05:00Z',
        notes: 'Open source project repository with backlink',
      },
      {
        id: 'opp-6',
        projectOpportunityId: 'po-6',
        siteName: 'HackerNoon',
        category: 'Technology Blog',
        status: 'IN_PROGRESS',
        priority: 3,
        domainAuthority: 76,
        notes: 'Submitted guest post, awaiting editor review',
      },
      {
        id: 'opp-7',
        projectOpportunityId: 'po-7',
        siteName: 'Reddit',
        category: 'Social Network',
        status: 'NOT_STARTED',
        priority: 3,
        domainAuthority: 91,
        notes: 'Plan to engage in r/startups community',
      },
      {
        id: 'opp-8',
        projectOpportunityId: 'po-8',
        siteName: 'Quora',
        category: 'Q&A Platform',
        status: 'NOT_STARTED',
        priority: 3,
        domainAuthority: 93,
        notes: 'Answer tech startup questions',
      },
      {
        id: 'opp-9',
        projectOpportunityId: 'po-9',
        siteName: 'AngelList',
        category: 'Startup Platform',
        status: 'NOT_STARTED',
        priority: 4,
        domainAuthority: 88,
        notes: 'Create comprehensive startup profile',
      },
      {
        id: 'opp-10',
        projectOpportunityId: 'po-10',
        siteName: 'SlideShare',
        category: 'Content Platform',
        status: 'IN_PROGRESS',
        priority: 3,
        domainAuthority: 95,
        notes: 'Creating pitch deck presentation',
      },
      {
        id: 'opp-11',
        projectOpportunityId: 'po-11',
        siteName: 'Behance',
        category: 'Creative',
        status: 'NOT_STARTED',
        priority: 2,
        domainAuthority: 92,
        notes: 'Showcase product design portfolio',
      },
      {
        id: 'opp-12',
        projectOpportunityId: 'po-12',
        siteName: 'Pinterest',
        category: 'Social Media',
        status: 'IN_PROGRESS',
        priority: 3,
        domainAuthority: 94,
        notes: 'Creating tech infographic pins',
      },
      {
        id: 'opp-13',
        projectOpportunityId: 'po-13',
        siteName: 'YouTube',
        category: 'Video Platform',
        status: 'NOT_STARTED',
        priority: 4,
        domainAuthority: 100,
        notes: 'Product demo video channel',
      },
      {
        id: 'opp-14',
        projectOpportunityId: 'po-14',
        siteName: 'TED',
        category: 'Content Platform',
        status: 'NOT_STARTED',
        priority: 5,
        domainAuthority: 94,
        notes: 'Apply for TEDx talk on innovation',
      },
      {
        id: 'opp-15',
        projectOpportunityId: 'po-15',
        siteName: 'Instructables',
        category: 'DIY Community',
        status: 'APPROVED',
        priority: 2,
        domainAuthority: 84,
        linkUrl: 'https://instructables.com/techstartup-tutorial',
        submittedAt: '2024-11-19T10:00:00Z',
        approvedAt: '2024-11-19T15:30:00Z',
        notes: 'Tutorial on building SaaS products',
      },
    ],
  },
  'demo-2': {
    id: 'demo-2',
    name: 'E-Commerce Store',
    domain: 'mystore.com',
    niche: 'E-commerce',
    targetCountry: 'United States',
    targetLanguage: 'English',
    color: '#8b5cf6',
    description: 'Comprehensive SEO and backlink campaign for our online retail platform. Targeting shopping directories, review sites, and lifestyle blogs.',
    createdAt: '2024-11-10T12:00:00Z',
    opportunities: [
      {
        id: 'opp-16',
        projectOpportunityId: 'po-16',
        siteName: 'Trustpilot',
        category: 'Review Platform',
        status: 'APPROVED',
        priority: 5,
        domainAuthority: 91,
        linkUrl: 'https://trustpilot.com/review/mystore.com',
        submittedAt: '2024-11-12T10:00:00Z',
        approvedAt: '2024-11-12T10:15:00Z',
        notes: 'Business profile verified. 4.8 star rating!',
      },
      {
        id: 'opp-17',
        projectOpportunityId: 'po-17',
        siteName: 'Yelp',
        category: 'Local Directory',
        status: 'APPROVED',
        priority: 4,
        domainAuthority: 93,
        linkUrl: 'https://yelp.com/biz/mystore',
        submittedAt: '2024-11-13T09:30:00Z',
        approvedAt: '2024-11-13T09:45:00Z',
        notes: 'Claimed business listing with photos',
      },
      {
        id: 'opp-18',
        projectOpportunityId: 'po-18',
        siteName: 'Pinterest',
        category: 'Social Media',
        status: 'IN_PROGRESS',
        priority: 4,
        domainAuthority: 94,
        notes: 'Creating product pins with links to store',
      },
      {
        id: 'opp-19',
        projectOpportunityId: 'po-19',
        siteName: 'Reddit',
        category: 'Social Network',
        status: 'IN_PROGRESS',
        priority: 3,
        domainAuthority: 91,
        notes: 'Engaging in r/ecommerce community',
      },
      {
        id: 'opp-20',
        projectOpportunityId: 'po-20',
        siteName: 'Product Hunt',
        category: 'Startup Platform',
        status: 'APPROVED',
        priority: 5,
        domainAuthority: 89,
        linkUrl: 'https://producthunt.com/posts/mystore-launch',
        submittedAt: '2024-11-14T08:00:00Z',
        approvedAt: '2024-11-14T18:00:00Z',
        notes: 'Product launch - 180 upvotes',
      },
      {
        id: 'opp-21',
        projectOpportunityId: 'po-21',
        siteName: 'Medium',
        category: 'Content Platform',
        status: 'IN_PROGRESS',
        priority: 4,
        domainAuthority: 96,
        notes: 'Writing e-commerce success story',
      },
      {
        id: 'opp-22',
        projectOpportunityId: 'po-22',
        siteName: 'Instagram',
        category: 'Social Media',
        status: 'IN_PROGRESS',
        priority: 4,
        domainAuthority: 99,
        notes: 'Building product showcase feed',
      },
      {
        id: 'opp-23',
        projectOpportunityId: 'po-23',
        siteName: 'YouTube',
        category: 'Video Platform',
        status: 'IN_PROGRESS',
        priority: 5,
        domainAuthority: 100,
        notes: 'Product demo and unboxing videos',
      },
      {
        id: 'opp-24',
        projectOpportunityId: 'po-24',
        siteName: 'Facebook',
        category: 'Social Media',
        status: 'IN_PROGRESS',
        priority: 4,
        domainAuthority: 96,
        notes: 'Business page with customer reviews',
      },
      {
        id: 'opp-25',
        projectOpportunityId: 'po-25',
        siteName: 'Twitter',
        category: 'Social Media',
        status: 'IN_PROGRESS',
        priority: 3,
        domainAuthority: 94,
        notes: 'Daily product updates and promotions',
      },
      {
        id: 'opp-26',
        projectOpportunityId: 'po-26',
        siteName: 'Goodreads',
        category: 'Books & Publishing',
        status: 'NOT_STARTED',
        priority: 2,
        domainAuthority: 94,
        notes: 'List products in book accessories',
      },
      {
        id: 'opp-27',
        projectOpportunityId: 'po-27',
        siteName: 'Tumblr',
        category: 'Microblogging',
        status: 'NOT_STARTED',
        priority: 2,
        domainAuthority: 99,
        notes: 'Product lifestyle blog',
      },
      {
        id: 'opp-28',
        projectOpportunityId: 'po-28',
        siteName: 'Scoop.it',
        category: 'Content Curation',
        status: 'NOT_STARTED',
        priority: 2,
        domainAuthority: 76,
        notes: 'Curate shopping trends content',
      },
      {
        id: 'opp-29',
        projectOpportunityId: 'po-29',
        siteName: 'Crunchbase',
        category: 'Business Directory',
        status: 'NOT_STARTED',
        priority: 4,
        domainAuthority: 92,
        notes: 'Add company profile',
      },
      {
        id: 'opp-30',
        projectOpportunityId: 'po-30',
        siteName: 'SlideShare',
        category: 'Content Platform',
        status: 'NOT_STARTED',
        priority: 3,
        domainAuthority: 95,
        notes: 'E-commerce trends presentation',
      },
      {
        id: 'opp-31',
        projectOpportunityId: 'po-31',
        siteName: 'Quora',
        category: 'Q&A Platform',
        status: 'NOT_STARTED',
        priority: 3,
        domainAuthority: 93,
        notes: 'Answer shopping questions',
      },
      {
        id: 'opp-32',
        projectOpportunityId: 'po-32',
        siteName: 'DEV Community',
        category: 'Technology',
        status: 'NOT_STARTED',
        priority: 2,
        domainAuthority: 80,
        notes: 'Tech behind e-commerce platform',
      },
      {
        id: 'opp-33',
        projectOpportunityId: 'po-33',
        siteName: 'GitHub',
        category: 'Technology',
        status: 'NOT_STARTED',
        priority: 2,
        domainAuthority: 95,
        notes: 'Open source shopping tools',
      },
      {
        id: 'opp-34',
        projectOpportunityId: 'po-34',
        siteName: 'HackerNoon',
        category: 'Technology Blog',
        status: 'NOT_STARTED',
        priority: 3,
        domainAuthority: 76,
        notes: 'E-commerce tech article',
      },
      {
        id: 'opp-35',
        projectOpportunityId: 'po-35',
        siteName: 'AngelList',
        category: 'Startup Platform',
        status: 'NOT_STARTED',
        priority: 3,
        domainAuthority: 88,
        notes: 'Company profile for investors',
      },
      {
        id: 'opp-36',
        projectOpportunityId: 'po-36',
        siteName: 'Behance',
        category: 'Creative',
        status: 'APPROVED',
        priority: 3,
        domainAuthority: 92,
        linkUrl: 'https://behance.net/mystore-design',
        submittedAt: '2024-11-15T11:00:00Z',
        approvedAt: '2024-11-15T16:00:00Z',
        notes: 'Showcase product photography',
      },
      {
        id: 'opp-37',
        projectOpportunityId: 'po-37',
        siteName: 'TED',
        category: 'Content Platform',
        status: 'NOT_STARTED',
        priority: 4,
        domainAuthority: 94,
        notes: 'Apply for retail innovation talk',
      },
    ],
  },
  'demo-3': {
    id: 'demo-3',
    name: 'Health Blog',
    domain: 'healthblog.net',
    niche: 'Health & Wellness',
    targetCountry: 'United States',
    targetLanguage: 'English',
    color: '#10b981',
    description: 'Organic traffic growth strategy through quality backlinks. Focus on health directories, wellness communities, and medical information sites.',
    createdAt: '2024-11-08T15:00:00Z',
    opportunities: [
      {
        id: 'opp-38',
        projectOpportunityId: 'po-38',
        siteName: 'Medium',
        category: 'Content Platform',
        status: 'APPROVED',
        priority: 5,
        domainAuthority: 96,
        linkUrl: 'https://medium.com/@healthblog/wellness-tips',
        submittedAt: '2024-11-09T11:00:00Z',
        approvedAt: '2024-11-10T14:20:00Z',
        notes: 'Article on wellness trends - 5K views',
      },
      {
        id: 'opp-39',
        projectOpportunityId: 'po-39',
        siteName: 'Quora',
        category: 'Q&A Platform',
        status: 'APPROVED',
        priority: 4,
        domainAuthority: 93,
        linkUrl: 'https://quora.com/profile/HealthBlog',
        submittedAt: '2024-11-11T16:00:00Z',
        approvedAt: '2024-11-11T16:30:00Z',
        notes: 'Answered 15+ health questions with links',
      },
      {
        id: 'opp-40',
        projectOpportunityId: 'po-40',
        siteName: 'Goodreads',
        category: 'Books & Publishing',
        status: 'APPROVED',
        priority: 3,
        domainAuthority: 94,
        linkUrl: 'https://goodreads.com/author/healthblog',
        submittedAt: '2024-11-14T10:00:00Z',
        approvedAt: '2024-11-14T10:15:00Z',
        notes: 'Author profile for health book recommendations',
      },
      {
        id: 'opp-41',
        projectOpportunityId: 'po-41',
        siteName: 'Pinterest',
        category: 'Social Media',
        status: 'IN_PROGRESS',
        priority: 4,
        domainAuthority: 94,
        notes: 'Creating health infographic pins',
      },
      {
        id: 'opp-42',
        projectOpportunityId: 'po-42',
        siteName: 'Tumblr',
        category: 'Microblogging',
        status: 'IN_PROGRESS',
        priority: 2,
        domainAuthority: 99,
        notes: 'Setting up wellness blog on Tumblr',
      },
      {
        id: 'opp-43',
        projectOpportunityId: 'po-43',
        siteName: 'YouTube',
        category: 'Video Platform',
        status: 'APPROVED',
        priority: 5,
        domainAuthority: 100,
        linkUrl: 'https://youtube.com/c/healthblog',
        submittedAt: '2024-11-12T09:00:00Z',
        approvedAt: '2024-11-12T09:30:00Z',
        notes: 'Wellness tips video channel - 2K subscribers',
      },
      {
        id: 'opp-44',
        projectOpportunityId: 'po-44',
        siteName: 'Reddit',
        category: 'Social Network',
        status: 'IN_PROGRESS',
        priority: 4,
        domainAuthority: 91,
        notes: 'Active in r/health and r/fitness',
      },
      {
        id: 'opp-45',
        projectOpportunityId: 'po-45',
        siteName: 'Instructables',
        category: 'DIY Community',
        status: 'APPROVED',
        priority: 3,
        domainAuthority: 84,
        linkUrl: 'https://instructables.com/wellness-guide',
        submittedAt: '2024-11-13T14:00:00Z',
        approvedAt: '2024-11-13T18:00:00Z',
        notes: 'DIY wellness routine guide',
      },
      {
        id: 'opp-46',
        projectOpportunityId: 'po-46',
        siteName: 'SlideShare',
        category: 'Content Platform',
        status: 'IN_PROGRESS',
        priority: 3,
        domainAuthority: 95,
        notes: 'Health statistics presentation',
      },
      {
        id: 'opp-47',
        projectOpportunityId: 'po-47',
        siteName: 'DEV Community',
        category: 'Technology',
        status: 'NOT_STARTED',
        priority: 2,
        domainAuthority: 80,
        notes: 'Health tech innovations article',
      },
      {
        id: 'opp-48',
        projectOpportunityId: 'po-48',
        siteName: 'TED',
        category: 'Content Platform',
        status: 'NOT_STARTED',
        priority: 5,
        domainAuthority: 94,
        notes: 'Apply for wellness innovation talk',
      },
      {
        id: 'opp-49',
        projectOpportunityId: 'po-49',
        siteName: 'Twitter',
        category: 'Social Media',
        status: 'APPROVED',
        priority: 4,
        domainAuthority: 94,
        linkUrl: 'https://twitter.com/healthblog',
        submittedAt: '2024-11-09T08:00:00Z',
        approvedAt: '2024-11-09T08:15:00Z',
        notes: 'Daily health tips - 5K followers',
      },
    ],
  },
};

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  // Check if it's a demo project
  const isDemoProject = projectId.startsWith('demo-');
  const demoData = isDemoProject ? DEMO_PROJECT_DATA[projectId] : null;

  // Fetch real project data if not demo
  const utils = trpc.useUtils();
  const { data: project, isLoading } = trpc.project.getById.useQuery(
    { id: projectId },
    { enabled: !isDemoProject }
  );

  const updateStatus = trpc.project.updateOpportunityStatus.useMutation({
    onSuccess: (data) => {
      // Check if it was auto-approved
      if (data.status === 'APPROVED') {
        toast.success('✅ Link verified and auto-approved!', {
          description: 'The backlink is live and working',
        });
      } else {
        toast.success('✅ Status updated!');
      }
      utils.project.getById.invalidate({ id: projectId });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const verifyLink = trpc.project.verifyLink.useMutation({
    onSuccess: (data) => {
      if (data.isLive) {
        toast.success('✅ Link is working!', {
          description: data.changed ? 'Status updated to Approved' : 'Backlink is live',
        });
      } else {
        toast.error('❌ Link is not working', {
          description: data.changed ? 'Status changed to Rejected' : data.errorMessage || 'Link verification failed',
        });
      }
      utils.project.getById.invalidate({ id: projectId });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [editingNotes, setEditingNotes] = useState<Record<string, string>>({});
  const [editingUrls, setEditingUrls] = useState<Record<string, string>>({});
  const [expandedTutorials, setExpandedTutorials] = useState<Record<string, boolean>>({});

  // Use demo data or real data
  const projectData = isDemoProject ? demoData : project;

  if (isLoading && !isDemoProject) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="relative">
          <div className="h-20 w-20 border-4 border-navy-200 border-t-purple-600 rounded-full animate-spin"></div>
          <Sparkles className="h-8 w-8 text-navy-500 absolute top-6 left-6 animate-pulse" />
        </div>
      </div>
    );
  }

  if (!projectData) {
    return (
      <div className="text-center py-20">
        <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Project Not Found</h2>
        <p className="text-gray-600 mb-6">The project you're looking for doesn't exist.</p>
        <Link href="/projects">
          <Button className="bg-gradient-to-r from-blue-600 to-purple-600">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Projects
          </Button>
        </Link>
      </div>
    );
  }

  // Transform real project opportunities to match demo format
  let opportunities = projectData.opportunities || [];
  
  // If this is a real project, transform the data structure
  if (!isDemoProject && projectData?.opportunities) {
    opportunities = projectData.opportunities.map((po: any) => ({
      id: po.id,
      projectOpportunityId: po.id,
      opportunityId: po.opportunityId, // Store the actual opportunity ID
      siteName: po.opportunity?.siteName || 'Unknown',
      category: po.opportunity?.category || 'General',
      status: po.status,
      priority: po.priority,
      domainAuthority: po.opportunity?.domainAuthority,
      linkUrl: po.linkUrl,
      submittedAt: po.submittedAt,
      approvedAt: po.approvedAt,
      notes: po.notes,
    }));
  }
  
  const filteredOpportunities =
    selectedStatus === 'all'
      ? opportunities
      : opportunities.filter((opp: any) => opp.status === selectedStatus);

  const stats = opportunities.reduce(
    (acc: any, opp: any) => {
      if (opp.status === 'NOT_STARTED') acc.notStarted++;
      else if (opp.status === 'IN_PROGRESS') acc.inProgress++;
      else if (opp.status === 'SUBMITTED') acc.submitted++;
      else if (opp.status === 'APPROVED') acc.approved++;
      else if (opp.status === 'REJECTED') acc.rejected++;
      return acc;
    },
    { notStarted: 0, inProgress: 0, submitted: 0, approved: 0, rejected: 0 }
  );

  const totalOpportunities = opportunities.length;
  const progress = totalOpportunities > 0 ? (stats.approved / totalOpportunities) * 100 : 0;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'NOT_STARTED':
        return <Badge variant="secondary" className="bg-gray-100 text-gray-700 border-2">Not Started</Badge>;
      case 'IN_PROGRESS':
        return <Badge className="bg-blue-100 text-blue-700 border-2 border-blue-300 font-semibold">In Progress</Badge>;
      case 'SUBMITTED':
        return <Badge className="bg-yellow-100 text-yellow-700 border-2 border-yellow-300 font-semibold">Submitted</Badge>;
      case 'APPROVED':
        return <Badge className="bg-green-100 text-green-700 border-2 border-green-300 font-semibold">✓ Approved</Badge>;
      case 'REJECTED':
        return <Badge className="bg-red-100 text-red-700 border-2 border-red-300 font-semibold">Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'NOT_STARTED':
        return <Circle className="h-5 w-5 text-gray-400" />;
      case 'IN_PROGRESS':
        return <PlayCircle className="h-5 w-5 text-blue-600" />;
      case 'SUBMITTED':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'APPROVED':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'REJECTED':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Circle className="h-5 w-5" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/projects">
          <Button variant="outline" size="icon" className="border-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div
              className="h-14 w-14 rounded-2xl flex items-center justify-center shadow-lg"
              style={{ backgroundColor: projectData.color || '#3b82f6' }}
            >
              <Globe className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black bg-gradient-to-r from-blue-600 via-navy-500 to-sky-500 bg-clip-text text-transparent">
                {projectData.name}
              </h1>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                {projectData.domain && (
                  <span className="flex items-center gap-1">
                    <Globe className="h-4 w-4" />
                    {projectData.domain}
                  </span>
                )}
                {projectData.niche && (
                  <Badge className="bg-gradient-to-r from-navy-500 to-sky-500 text-white border-0">
                    {projectData.niche}
                  </Badge>
                )}
                {isDemoProject && (
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 border-2 border-yellow-300 font-semibold">
                    Demo Project
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
        {!isDemoProject && (
          <Link href={`/projects/${projectId}/edit`}>
            <Button className="bg-gradient-to-r from-navy-500 to-sky-500 hover:from-purple-600 hover:to-sky-500 shadow-lg">
              <Edit className="h-5 w-5 mr-2" />
              Manage Opportunities
            </Button>
          </Link>
        )}
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card className="border-2 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">Total Links</p>
                <p className="text-3xl font-bold text-blue-900">{totalOpportunities}</p>
              </div>
              <BarChart3 className="h-10 w-10 text-blue-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 shadow-lg bg-gradient-to-br from-gray-50 to-gray-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">To Do</p>
                <p className="text-3xl font-bold text-gray-900">{stats.notStarted}</p>
              </div>
              <Circle className="h-10 w-10 text-gray-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 shadow-lg bg-gradient-to-br from-blue-50 to-cyan-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">In Progress</p>
                <p className="text-3xl font-bold text-blue-900">{stats.inProgress}</p>
              </div>
              <PlayCircle className="h-10 w-10 text-blue-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 shadow-lg bg-gradient-to-br from-yellow-50 to-yellow-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-700">Submitted</p>
                <p className="text-3xl font-bold text-yellow-900">{stats.submitted}</p>
              </div>
              <Clock className="h-10 w-10 text-yellow-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 shadow-lg bg-gradient-to-br from-green-50 to-green-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">Completed</p>
                <p className="text-3xl font-bold text-green-900">{stats.approved}</p>
              </div>
              <CheckCircle2 className="h-10 w-10 text-green-600 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Project Info Card */}
      <Card className="border-2 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-6 w-6 text-navy-500" />
            Project Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {projectData.description && (
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-1">Description</p>
              <p className="text-gray-600">{projectData.description}</p>
            </div>
          )}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {projectData.targetCountry && (
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-1">Target Country</p>
                <p className="text-gray-900">{projectData.targetCountry}</p>
              </div>
            )}
            {projectData.targetLanguage && (
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-1">Language</p>
                <p className="text-gray-900">{projectData.targetLanguage}</p>
              </div>
            )}
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-1">Created</p>
              <p className="text-gray-900">
                {new Date(projectData.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-1">Progress</p>
              <div className="flex items-center gap-2">
                <Progress value={progress} className="h-2 flex-1" />
                <span className="text-sm font-bold text-gray-900">{Math.round(progress)}%</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Opportunities List */}
      <Card className="border-2 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Target className="h-6 w-6 text-blue-600" />
              Backlink Opportunities ({filteredOpportunities.length})
            </CardTitle>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-48 border-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="NOT_STARTED">Not Started</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="SUBMITTED">Submitted</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {filteredOpportunities.length === 0 ? (
            <div className="text-center py-12">
              <Target className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 font-semibold text-lg">No opportunities found</p>
              <p className="text-gray-500 text-sm">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOpportunities.map((opp: any) => {
                const oppId = opp.projectOpportunityId || opp.id;
                const currentNotes = editingNotes[oppId] !== undefined ? editingNotes[oppId] : (opp.notes || '');
                const currentUrl = editingUrls[oppId] !== undefined ? editingUrls[oppId] : (opp.linkUrl || '');

                return (
                  <div
                    key={oppId}
                    className="border-2 rounded-2xl p-5 bg-gradient-to-br from-white to-gray-50 hover:shadow-lg transition-all"
                  >
                    <div className="space-y-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex gap-4 flex-1">
                          {getStatusIcon(opp.status)}
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2 flex-wrap">
                              <h3 className="text-lg font-bold text-gray-800">{opp.siteName}</h3>
                              {opp.domainAuthority && (
                                <Badge variant="outline" className="border-2 font-semibold">
                                  DA: {opp.domainAuthority}
                                </Badge>
                              )}
                              <Badge className="bg-navy-100 text-navy-600 border-2 border-navy-300">
                                {opp.category}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>

                      {!isDemoProject && (
                        <div className="space-y-3 pl-9">
                          {/* Status Selector */}
                          <div className="flex items-center gap-3">
                            <Label className="text-sm font-semibold w-20">Status:</Label>
                            <div className="flex-1">
                              <Select
                                value={opp.status}
                                onValueChange={(value) => {
                                  // Show info toast when submitting with URL
                                  if (value === 'SUBMITTED' && currentUrl) {
                                    toast.info('🔍 Verifying link...', {
                                      description: 'Checking if your backlink is live',
                                    });
                                  }
                                  updateStatus.mutate({
                                    projectId,
                                    opportunityId: opp.opportunityId,
                                    status: value as any,
                                    notes: currentNotes || undefined,
                                    linkUrl: currentUrl || undefined,
                                  });
                                }}
                              >
                                <SelectTrigger className="w-48 border-2">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="NOT_STARTED">Not Started</SelectItem>
                                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                                  <SelectItem value="SUBMITTED">
                                    Submitted {currentUrl && '(auto-verifies)'}
                                  </SelectItem>
                                  <SelectItem value="APPROVED">✓ Approved</SelectItem>
                                  <SelectItem value="REJECTED">Rejected</SelectItem>
                                </SelectContent>
                              </Select>
                              {currentUrl && (
                                <p className="text-xs text-gray-500 mt-1">
                                  💡 Tip: Set to "Submitted" to auto-verify your link
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Link URL Input */}
                          <div className="flex items-start gap-3">
                            <Label className="text-sm font-semibold w-20 pt-2">Link URL:</Label>
                            <div className="flex-1 flex gap-2">
                              <Input
                                placeholder="https://example.com/your-backlink"
                                value={currentUrl}
                                onChange={(e) => setEditingUrls({ ...editingUrls, [oppId]: e.target.value })}
                                className="border-2"
                              />
                              <Button
                                size="sm"
                                onClick={() => {
                                  updateStatus.mutate({
                                    projectId,
                                    opportunityId: opp.opportunityId,
                                    status: opp.status,
                                    linkUrl: currentUrl || undefined,
                                    notes: currentNotes || undefined,
                                  });
                                }}
                                disabled={updateStatus.isPending}
                                className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
                              >
                                <Save className="h-4 w-4" />
                              </Button>
                              {currentUrl && (opp.status === 'APPROVED' || opp.status === 'SUBMITTED') && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    toast.info('🔍 Re-verifying link...');
                                    verifyLink.mutate({
                                      projectId,
                                      opportunityId: opp.opportunityId,
                                    });
                                  }}
                                  disabled={verifyLink.isPending}
                                  className="border-2 border-navy-300 hover:bg-navy-50"
                                  title="Check if link is still working"
                                >
                                  <CheckCircle2 className="h-4 w-4 mr-1" />
                                  Re-verify
                                </Button>
                              )}
                            </div>
                          </div>

                          {/* Notes Input */}
                          <div className="flex items-start gap-3">
                            <Label className="text-sm font-semibold w-20 pt-2">Notes:</Label>
                            <div className="flex-1 flex gap-2">
                              <Textarea
                                placeholder="Add notes about progress, issues, or next steps..."
                                value={currentNotes}
                                onChange={(e) => setEditingNotes({ ...editingNotes, [oppId]: e.target.value })}
                                className="border-2 min-h-[80px]"
                              />
                              <Button
                                size="sm"
                                onClick={() => {
                                  updateStatus.mutate({
                                    projectId,
                                    opportunityId: opp.opportunityId,
                                    status: opp.status,
                                    notes: currentNotes || undefined,
                                    linkUrl: currentUrl || undefined,
                                  });
                                }}
                                disabled={updateStatus.isPending}
                                className="bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600"
                              >
                                <Save className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          {/* Timestamps */}
                          {(opp.submittedAt || opp.approvedAt) && (
                            <div className="flex gap-4 text-xs text-gray-600 pl-24">
                              {opp.submittedAt && (
                                <span className="font-semibold">✅ Submitted: {new Date(opp.submittedAt).toLocaleDateString()}</span>
                              )}
                              {opp.approvedAt && (
                                <span className="font-semibold text-green-600">🎉 Approved: {new Date(opp.approvedAt).toLocaleDateString()}</span>
                              )}
                            </div>
                          )}

                          {/* Tutorial Button */}
                          {opp.opportunityId && (
                            <div className="pl-0">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setExpandedTutorials({
                                    ...expandedTutorials,
                                    [oppId]: !expandedTutorials[oppId],
                                  });
                                }}
                                className="border-2 border-navy-300 hover:bg-navy-50 w-full justify-between"
                              >
                                <span className="flex items-center gap-2">
                                  <BookOpen className="h-4 w-4" />
                                  View Step-by-Step Tutorial
                                </span>
                                {expandedTutorials[oppId] ? (
                                  <ChevronUp className="h-4 w-4" />
                                ) : (
                                  <ChevronDown className="h-4 w-4" />
                                )}
                              </Button>

                              {/* Tutorial Content */}
                              {expandedTutorials[oppId] && (
                                <TutorialSection opportunityId={opp.opportunityId} />
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Demo project - read-only view */}
                      {isDemoProject && (
                        <div className="pl-9 space-y-2">
                          {getStatusBadge(opp.status)}
                          {opp.notes && (
                            <p className="text-sm text-gray-700 bg-blue-50 rounded-lg p-3 border-2 border-blue-200">
                              📝 <span className="font-semibold">Notes:</span> {opp.notes}
                            </p>
                          )}
                          {opp.linkUrl && (
                            <a
                              href={opp.linkUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium"
                            >
                              <LinkIcon className="h-4 w-4" />
                              {opp.linkUrl}
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                          {(opp.submittedAt || opp.approvedAt) && (
                            <div className="flex gap-4 text-xs text-gray-600">
                              {opp.submittedAt && (
                                <span className="font-semibold">✅ Submitted: {new Date(opp.submittedAt).toLocaleDateString()}</span>
                              )}
                              {opp.approvedAt && (
                                <span className="font-semibold text-green-600">🎉 Approved: {new Date(opp.approvedAt).toLocaleDateString()}</span>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
