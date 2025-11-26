'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/lib/api/client';
import { 
  Search, 
  ExternalLink, 
  TrendingUp,
  Star,
  Zap,
  CheckCircle2,
  DollarSign,
  Globe,
  Sparkles
} from 'lucide-react';

export default function OpportunitiesPage() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const { data, isLoading } = trpc.opportunity.list.useQuery({
    limit: 50,
    search: debouncedSearch || undefined,
  });

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setTimeout(() => setDebouncedSearch(value), 500);
  };

  const getLinkTypeColor = (linkType: string) => {
    const colors: Record<string, string> = {
      PROFILE: 'from-blue-500 to-cyan-500',
      DIRECTORY: 'from-green-500 to-emerald-500',
      GUEST_POST: 'from-navy-500 to-sky-500',
      FORUM: 'from-orange-500 to-red-500',
      SOCIAL: 'from-indigo-500 to-purple-500',
      ARTICLE_SUBMISSION: 'from-yellow-500 to-orange-500',
      BUSINESS_LISTING: 'from-teal-500 to-green-500',
      Q_AND_A: 'from-pink-500 to-rose-500',
    };
    return colors[linkType] || 'from-gray-500 to-gray-600';
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="bg-gradient-to-br from-green-600 via-teal-600 to-cyan-600 rounded-3xl p-8 text-white shadow-2xl">
        <div className="flex items-start justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-yellow-300" />
              <Badge className="bg-white/20 backdrop-blur border-white/30 text-white">
                {data?.opportunities?.length || 0} Opportunities
              </Badge>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold">
              Backlink Opportunities
            </h1>
            <p className="text-lg text-white/90 max-w-2xl">
              Discover high-quality backlink sources with step-by-step instructions
            </p>
          </div>
          <div className="hidden md:block">
            <div className="h-24 w-24 bg-white/10 backdrop-blur rounded-3xl flex items-center justify-center">
              <TrendingUp className="h-12 w-12 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <Card className="border-2 shadow-lg">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Search by name, category, or niche... (e.g., LinkedIn, Technology)"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-12 h-14 text-lg border-2 focus:border-blue-500"
            />
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {isLoading ? (
        <div className="text-center py-16">
          <div className="relative">
            <div className="h-16 w-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
            <Sparkles className="h-6 w-6 text-blue-600 absolute top-5 left-1/2 transform -translate-x-1/2 animate-pulse" />
          </div>
          <p className="text-gray-600 font-medium">Discovering opportunities...</p>
        </div>
      ) : !data?.opportunities || data.opportunities.length === 0 ? (
        <Card className="border-2 border-dashed">
          <CardContent className="text-center py-16">
            <Search className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">No opportunities found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {data.opportunities.map((opp) => {
            const gradient = getLinkTypeColor(opp.linkType);
            return (
              <Card 
                key={opp.id} 
                className="group hover:shadow-2xl transition-all duration-300 border-2 hover:border-blue-400 hover:-translate-y-1 bg-white overflow-hidden"
              >
                {/* Gradient Header */}
                <div className={`h-3 bg-gradient-to-r ${gradient}`}></div>
                
                <CardContent className="pt-6 space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`h-10 w-10 rounded-xl bg-gradient-to-r ${gradient} flex items-center justify-center shadow-lg`}>
                          <Globe className="h-5 w-5 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                          {opp.siteName}
                        </h3>
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                        {opp.shortDescription}
                      </p>
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      {opp.isFree ? (
                        <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 shadow-md">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Free
                        </Badge>
                      ) : (
                        <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white border-0 shadow-md">
                          <DollarSign className="h-3 w-3 mr-1" />
                          ${((opp.cost || 0) / 100).toFixed(0)}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Metrics Row */}
                  <div className="flex flex-wrap gap-2">
                    {opp.domainAuthority && (
                      <div className="flex items-center gap-1 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200">
                        <Star className="h-3 w-3 text-blue-600" />
                        <span className="text-xs font-bold text-blue-900">DA {opp.domainAuthority}</span>
                      </div>
                    )}
                    {opp.domainRating && (
                      <div className="flex items-center gap-1 bg-navy-50 px-3 py-1.5 rounded-lg border border-navy-200">
                        <TrendingUp className="h-3 w-3 text-navy-500" />
                        <span className="text-xs font-bold text-purple-900">DR {opp.domainRating}</span>
                      </div>
                    )}
                    {opp.isDofollow && (
                      <div className="flex items-center gap-1 bg-green-50 px-3 py-1.5 rounded-lg border border-green-200">
                        <Zap className="h-3 w-3 text-green-600" />
                        <span className="text-xs font-bold text-green-900">Dofollow</span>
                      </div>
                    )}
                  </div>

                  {/* Category & Type */}
                  <div className="flex flex-wrap gap-2">
                    <Badge className={`bg-gradient-to-r ${gradient} text-white border-0`}>
                      {opp.linkType.replace(/_/g, ' ')}
                    </Badge>
                    <Badge variant="secondary" className="font-medium">
                      {opp.category}
                    </Badge>
                    <Badge variant="outline" className="font-medium">
                      {opp.niche}
                    </Badge>
                  </div>

                  {/* Traffic Estimate */}
                  {opp.estimatedTraffic && opp.estimatedTraffic > 0 && (
                    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 px-3 py-2 rounded-lg border border-yellow-200">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-600">Est. Monthly Traffic</span>
                        <span className="text-sm font-bold text-orange-900">
                          {(opp.estimatedTraffic / 1000000).toFixed(1)}M
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Link href={`/opportunities/${opp.id}`} className="flex-1">
                      <Button 
                        variant="default" 
                        className={`w-full bg-gradient-to-r ${gradient} hover:opacity-90 shadow-md`}
                        size="sm"
                      >
                        View Details
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-2"
                      onClick={() => window.open(opp.url, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Plan Limit Info */}
      {data?.planLimit && (
        <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-purple-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="h-12 w-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="font-bold text-gray-900">
                    Viewing {data.opportunities.length} of {data.planLimit} opportunities
                  </p>
                  <p className="text-sm text-gray-600">
                    Upgrade to unlock more opportunities
                  </p>
                </div>
              </div>
              {data.planLimit < 999999 && (
                <Link href="/pricing">
                  <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg">
                    <Sparkles className="h-4 w-4 mr-2" />
                    Upgrade Plan
                  </Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
