'use client';

import { use } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  ArrowLeft, 
  Globe, 
  TrendingUp, 
  CheckCircle2,
  Clock,
  Circle,
  XCircle,
  AlertCircle,
  Sparkles,
  ExternalLink
} from 'lucide-react';

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  // Demo data for project detail
  const project = {
    name: 'TechStartup Website',
    domain: 'techstartup.io',
    niche: 'Technology',
    description: 'Building comprehensive backlink profile for our SaaS platform',
    color: '#3b82f6',
    opportunities: [
      {
        id: '1',
        name: 'LinkedIn Pulse',
        url: 'https://linkedin.com/pulse',
        status: 'APPROVED',
        da: 98,
        dr: 99,
        linkType: 'ARTICLE_SUBMISSION',
        isFree: true,
        isDofollow: true,
      },
      {
        id: '2',
        name: 'Medium',
        url: 'https://medium.com',
        status: 'IN_PROGRESS',
        da: 96,
        dr: 95,
        linkType: 'ARTICLE_SUBMISSION',
        isFree: true,
        isDofollow: true,
      },
      {
        id: '3',
        name: 'GitHub Profile',
        url: 'https://github.com',
        status: 'APPROVED',
        da: 95,
        dr: 94,
        linkType: 'PROFILE',
        isFree: true,
        isDofollow: true,
      },
      {
        id: '4',
        name: 'DEV Community',
        url: 'https://dev.to',
        status: 'IN_PROGRESS',
        da: 82,
        dr: 85,
        linkType: 'ARTICLE_SUBMISSION',
        isFree: true,
        isDofollow: true,
      },
      {
        id: '5',
        name: 'Product Hunt',
        url: 'https://producthunt.com',
        status: 'NOT_STARTED',
        da: 88,
        dr: 87,
        linkType: 'BUSINESS_LISTING',
        isFree: true,
        isDofollow: true,
      },
    ],
  };

  const stats = project.opportunities.reduce((acc, opp) => {
    acc[opp.status] = (acc[opp.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const progress = ((stats.APPROVED || 0) / project.opportunities.length) * 100;

  const getStatusConfig = (status: string) => {
    const configs = {
      NOT_STARTED: { label: 'Not Started', icon: Circle, color: 'gray', bg: 'bg-gray-100', text: 'text-gray-700' },
      IN_PROGRESS: { label: 'In Progress', icon: Clock, color: 'blue', bg: 'bg-blue-100', text: 'text-blue-700' },
      SUBMITTED: { label: 'Submitted', icon: AlertCircle, color: 'yellow', bg: 'bg-yellow-100', text: 'text-yellow-700' },
      APPROVED: { label: 'Approved', icon: CheckCircle2, color: 'green', bg: 'bg-green-100', text: 'text-green-700' },
      REJECTED: { label: 'Rejected', icon: XCircle, color: 'red', bg: 'bg-red-100', text: 'text-red-700' },
    };
    return configs[status as keyof typeof configs] || configs.NOT_STARTED;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Back Button */}
      <Link href="/projects">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Projects
        </Button>
      </Link>

      {/* Project Header */}
      <Card className="bg-gradient-to-br from-blue-600 to-purple-600 text-white border-0 shadow-2xl">
        <CardContent className="pt-8 pb-8">
          <div className="flex items-start justify-between">
            <div className="space-y-4 flex-1">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center">
                  <Sparkles className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold">{project.name}</h1>
                  <div className="flex items-center gap-2 mt-2 text-white/80">
                    <Globe className="h-4 w-4" />
                    <span>{project.domain}</span>
                  </div>
                </div>
              </div>
              
              <p className="text-white/90 text-lg max-w-2xl">{project.description}</p>
              
              <div className="flex items-center gap-3">
                <Badge className="bg-white/20 backdrop-blur border-white/30 text-white">
                  {project.niche}
                </Badge>
                <Badge className="bg-white/20 backdrop-blur border-white/30 text-white">
                  {project.opportunities.length} Opportunities
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-3xl font-bold text-gray-900">{project.opportunities.length}</p>
              </div>
              <TrendingUp className="h-10 w-10 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">In Progress</p>
                <p className="text-3xl font-bold text-blue-900">{stats.IN_PROGRESS || 0}</p>
              </div>
              <Clock className="h-10 w-10 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Approved</p>
                <p className="text-3xl font-bold text-green-900">{stats.APPROVED || 0}</p>
              </div>
              <CheckCircle2 className="h-10 w-10 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="pt-6">
            <div>
              <p className="text-sm font-medium text-purple-600 mb-2">Success Rate</p>
              <p className="text-3xl font-bold text-purple-900">{Math.round(progress)}%</p>
              <Progress value={progress} className="h-2 mt-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Opportunities List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Backlink Opportunities</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {project.opportunities.map((opp) => {
              const statusConfig = getStatusConfig(opp.status);
              const StatusIcon = statusConfig.icon;
              
              return (
                <div 
                  key={opp.id}
                  className="flex items-center justify-between p-4 rounded-xl border-2 hover:border-blue-300 transition-all bg-gradient-to-r from-white to-gray-50 hover:shadow-md"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className={`h-12 w-12 rounded-xl ${statusConfig.bg} flex items-center justify-center`}>
                      <StatusIcon className={`h-6 w-6 text-${statusConfig.color}-600`} />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-semibold text-lg text-gray-900">{opp.name}</h3>
                        <Badge className={`${statusConfig.bg} ${statusConfig.text} border-0`}>
                          {statusConfig.label}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <Globe className="h-3 w-3 text-gray-400" />
                          <span className="text-gray-600">{opp.url.replace('https://', '')}</span>
                        </div>
                        <Badge variant="outline" className="text-xs">DA: {opp.da}</Badge>
                        <Badge variant="outline" className="text-xs">DR: {opp.dr}</Badge>
                        {opp.isDofollow && (
                          <Badge variant="outline" className="text-xs bg-blue-50">Dofollow</Badge>
                        )}
                        {opp.isFree && (
                          <Badge variant="outline" className="text-xs bg-green-50">Free</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => window.open(opp.url, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
