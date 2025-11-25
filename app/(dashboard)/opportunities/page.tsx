'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/lib/api/client';
import { Search, ExternalLink, TrendingUp } from 'lucide-react';

export default function OpportunitiesPage() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const { data, isLoading } = trpc.opportunity.list.useQuery({
    limit: 50,
    search: debouncedSearch || undefined,
  });

  // Simple debounce for search
  const handleSearchChange = (value: string) => {
    setSearch(value);
    setTimeout(() => setDebouncedSearch(value), 500);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Backlink Opportunities</h1>
          <p className="text-gray-600 mt-1">
            Browse {data?.opportunities?.length || 0} curated opportunities
          </p>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search opportunities by name, category, or niche..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading opportunities...</p>
        </div>
      ) : !data?.opportunities || data.opportunities.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-gray-600">No opportunities found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {data.opportunities.map((opp) => (
            <Card key={opp.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {/* Header */}
                  <div>
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-lg font-semibold">{opp.siteName}</h3>
                      {opp.isFree ? (
                        <Badge variant="secondary" className="bg-green-100 text-green-700">
                          Free
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                          ${((opp.cost || 0) / 100).toFixed(0)}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{opp.shortDescription}</p>
                  </div>

                  {/* Metrics */}
                  <div className="flex flex-wrap gap-2">
                    {opp.domainAuthority && (
                      <Badge variant="outline" className="text-xs">
                        DA: {opp.domainAuthority}
                      </Badge>
                    )}
                    {opp.domainRating && (
                      <Badge variant="outline" className="text-xs">
                        DR: {opp.domainRating}
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-xs">
                      {opp.linkType.replace(/_/g, ' ')}
                    </Badge>
                    {opp.isDofollow && (
                      <Badge variant="outline" className="text-xs bg-blue-50">
                        Dofollow
                      </Badge>
                    )}
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {opp.category}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {opp.niche}
                    </Badge>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Link href={`/opportunities/${opp.id}`} className="flex-1">
                      <Button variant="default" className="w-full" size="sm">
                        View Details
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(opp.url, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Plan Limit Info */}
      {data?.planLimit && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                <span className="text-sm text-gray-600">
                  Viewing {data.opportunities.length} of {data.planLimit} available opportunities
                </span>
              </div>
              {data.planLimit < 999999 && (
                <Link href="/pricing">
                  <Button size="sm" variant="outline">
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
