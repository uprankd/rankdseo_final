'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
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
  Sparkles,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Filter,
  X
} from 'lucide-react';

export default function OpportunitiesPage() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortBy, setSortBy] = useState<'domainAuthority' | 'domainRating' | 'referringDomains' | 'totalBacklinks' | 'trustFlow' | 'citationFlow' | 'none'>('none');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Range filters state
  const [filters, setFilters] = useState({
    domainAuthority: { min: 0, max: 100 },
    domainRating: { min: 0, max: 100 },
    referringDomains: { min: 0, max: 10000000 },
    totalBacklinks: { min: 0, max: 1000000000 },
    trustFlow: { min: 0, max: 100 },
    citationFlow: { min: 0, max: 100 },
    difficulty: { min: 1, max: 5 },
    spamScore: { min: 0, max: 100 },
    trafficValue: { min: 0, max: 10000000 },
    estTraffic: { min: 0, max: 10000000 },
    cost: { min: 0, max: 10000 },
  });

  // Select/checkbox filters
  const [selectFilters, setSelectFilters] = useState({
    category: 'all',
    linkType: 'all',
    language: 'all',
    country: 'all',
    status: 'all',
    isFree: false,
    isDofollow: false,
  });

  const { data, isLoading } = trpc.opportunity.list.useQuery({
    limit: 100,
    search: debouncedSearch || undefined,
  });

  // Get current subscription to check if user has unlimited access
  const { data: subscriptionData } = trpc.subscription.getCurrent.useQuery();

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setTimeout(() => setDebouncedSearch(value), 500);
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

  // Format large numbers for display
  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  // Check if user has unlimited access (admin or lifetime subscriber)
  const hasUnlimitedAccess = subscriptionData?.plan?.interval === 'lifetime' || data?.planLimit === 999999;

  // Check if filters are at default values (not actively being used)
  const filtersAreDefault = 
    filters.domainAuthority.min === 0 && filters.domainAuthority.max === 100 &&
    filters.domainRating.min === 0 && filters.domainRating.max === 100 &&
    filters.referringDomains.min === 0 && filters.referringDomains.max === 10000000 &&
    filters.totalBacklinks.min === 0 && filters.totalBacklinks.max === 1000000000 &&
    filters.trustFlow.min === 0 && filters.trustFlow.max === 100 &&
    filters.citationFlow.min === 0 && filters.citationFlow.max === 100 &&
    filters.difficulty.min === 1 && filters.difficulty.max === 5 &&
    filters.spamScore.min === 0 && filters.spamScore.max === 100 &&
    filters.trafficValue.min === 0 && filters.trafficValue.max === 10000000 &&
    filters.estTraffic.min === 0 && filters.estTraffic.max === 10000000 &&
    filters.cost.min === 0 && filters.cost.max === 10000 &&
    selectFilters.category === 'all' &&
    selectFilters.linkType === 'all' &&
    selectFilters.language === 'all' &&
    selectFilters.country === 'all' &&
    selectFilters.status === 'all' &&
    !selectFilters.isFree &&
    !selectFilters.isDofollow;

  // Filter and sort opportunities based on selected metrics
  const sortedOpportunities = useMemo(() => {
    if (!data?.opportunities) return [];
    
    let opps = [...data.opportunities];
    
    // Skip filtering for unlimited users ONLY if filters are at default values
    const shouldSkipFiltering = hasUnlimitedAccess && filtersAreDefault;
    
    if (!shouldSkipFiltering) {
      // Apply range filters
      opps = opps.filter(opp => {
        const da = opp.domainAuthority || 0;
        const dr = opp.domainRating || 0;
        const rd = opp.referringDomains || 0;
        const bl = opp.totalBacklinks || 0;
        const tf = opp.trustFlow || 0;
        const cf = opp.citationFlow || 0;
        const difficulty = opp.difficultyLevel || 1; // Note: field is difficultyLevel in DB
        const spamScore = opp.spamScore || 0;
        const trafficValue = opp.trafficValue || 0;
        const estTraffic = opp.estimatedTraffic || 0; // Note: field is estimatedTraffic in DB
        const cost = opp.cost || 0;
        
        const rangeMatch = (
          da >= filters.domainAuthority.min && da <= filters.domainAuthority.max &&
          dr >= filters.domainRating.min && dr <= filters.domainRating.max &&
          rd >= filters.referringDomains.min && rd <= filters.referringDomains.max &&
          bl >= filters.totalBacklinks.min && bl <= filters.totalBacklinks.max &&
          tf >= filters.trustFlow.min && tf <= filters.trustFlow.max &&
          cf >= filters.citationFlow.min && cf <= filters.citationFlow.max &&
          difficulty >= filters.difficulty.min && difficulty <= filters.difficulty.max &&
          spamScore >= filters.spamScore.min && spamScore <= filters.spamScore.max &&
          trafficValue >= filters.trafficValue.min && trafficValue <= filters.trafficValue.max &&
          estTraffic >= filters.estTraffic.min && estTraffic <= filters.estTraffic.max &&
          cost >= filters.cost.min && cost <= filters.cost.max
        );

        // Apply select/checkbox filters
        const categoryMatch = selectFilters.category === 'all' || opp.category === selectFilters.category;
        const linkTypeMatch = selectFilters.linkType === 'all' || opp.linkType === selectFilters.linkType;
        const languageMatch = selectFilters.language === 'all' || opp.language === selectFilters.language;
        const countryMatch = selectFilters.country === 'all' || !opp.country || opp.country === selectFilters.country;
        const statusMatch = selectFilters.status === 'all' || opp.status === selectFilters.status;
        const freeMatch = !selectFilters.isFree || opp.isFree === true;
        const dofollowMatch = !selectFilters.isDofollow || opp.isDofollow === true;
        
        return rangeMatch && categoryMatch && linkTypeMatch && languageMatch && countryMatch && statusMatch && freeMatch && dofollowMatch;
      });
    }
    
    // Apply sorting
    if (sortBy === 'none') return opps;
    
    return opps.sort((a, b) => {
      const aValue = a[sortBy] || 0;
      const bValue = b[sortBy] || 0;
      
      if (sortOrder === 'desc') {
        return bValue - aValue;
      } else {
        return aValue - bValue;
      }
    });
  }, [data?.opportunities, sortBy, sortOrder, filters, selectFilters, hasUnlimitedAccess, filtersAreDefault]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="bg-gradient-to-br from-green-600 via-teal-600 to-cyan-600 rounded-3xl p-8 text-white shadow-2xl">
        <div className="flex items-start justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-yellow-300" />
              <Badge className="bg-white/20 backdrop-blur border-white/30 text-white">
                {data?.totalCount || 0} Opportunities
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

      {/* Sorting Filters */}
      <Card className="border-2 shadow-lg bg-gradient-to-r from-blue-50 to-purple-50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <ArrowUpDown className="h-5 w-5 text-gray-600" />
              <span className="text-sm font-semibold text-gray-700">Sort By:</span>
            </div>
            
            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger className="w-[200px] border-2 bg-white">
                <SelectValue placeholder="Select metric" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Default Order</SelectItem>
                <SelectItem value="domainAuthority">Domain Authority (DA)</SelectItem>
                <SelectItem value="domainRating">Domain Rating (DR)</SelectItem>
                <SelectItem value="referringDomains">Referring Domains (RD)</SelectItem>
                <SelectItem value="totalBacklinks">Total Backlinks (BL)</SelectItem>
                <SelectItem value="trustFlow">Trust Flow (TF)</SelectItem>
                <SelectItem value="citationFlow">Citation Flow (CF)</SelectItem>
              </SelectContent>
            </Select>

            {sortBy !== 'none' && (
              <>
                <Button
                  variant={sortOrder === 'desc' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSortOrder('desc')}
                  className="gap-2"
                >
                  <ArrowDown className="h-4 w-4" />
                  High to Low
                </Button>
                <Button
                  variant={sortOrder === 'asc' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSortOrder('asc')}
                  className="gap-2"
                >
                  <ArrowUp className="h-4 w-4" />
                  Low to High
                </Button>
              </>
            )}

            {sortBy !== 'none' && (
              <Badge className="bg-green-500 text-white">
                Sorted by {sortBy === 'domainAuthority' ? 'DA' : sortBy === 'domainRating' ? 'DR' : sortBy === 'referringDomains' ? 'RD' : sortBy === 'totalBacklinks' ? 'BL' : sortBy === 'trustFlow' ? 'TF' : 'CF'} ({sortOrder === 'desc' ? 'High to Low' : 'Low to High'})
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Range Filters */}
      <Card className="border-2 shadow-lg bg-gradient-to-r from-green-50 to-teal-50">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="h-5 w-5 text-gray-600" />
              <span className="text-sm font-semibold text-gray-700">Filter by Range:</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setFilters({
                    domainAuthority: { min: 0, max: 100 },
                    domainRating: { min: 0, max: 100 },
                    referringDomains: { min: 0, max: 10000000 },
                    totalBacklinks: { min: 0, max: 1000000000 },
                    trustFlow: { min: 0, max: 100 },
                    citationFlow: { min: 0, max: 100 },
                    difficulty: { min: 1, max: 5 },
                    spamScore: { min: 0, max: 100 },
                    trafficValue: { min: 0, max: 10000000 },
                    estTraffic: { min: 0, max: 10000000 },
                    cost: { min: 0, max: 10000 },
                  });
                  setSelectFilters({
                    category: 'all',
                    linkType: 'all',
                    language: 'all',
                    country: 'all',
                    status: 'all',
                    isFree: false,
                    isDofollow: false,
                  });
                }}
                className="ml-auto"
              >
                <X className="h-4 w-4 mr-2" />
                Reset All Filters
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* DA Filter */}
              <div className="space-y-2 bg-white p-4 rounded-lg border-2">
                <Label className="text-sm font-semibold flex items-center gap-2">
                  <Star className="h-4 w-4 text-blue-600" />
                  Domain Authority (DA)
                </Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={filters.domainAuthority.min}
                    onChange={(e) => setFilters({...filters, domainAuthority: {...filters.domainAuthority, min: parseInt(e.target.value) || 0}})}
                    className="border-2"
                    min="0"
                    max="100"
                  />
                  <Input
                    type="number"
                    placeholder="Max"
                    value={filters.domainAuthority.max}
                    onChange={(e) => setFilters({...filters, domainAuthority: {...filters.domainAuthority, max: parseInt(e.target.value) || 100}})}
                    className="border-2"
                    min="0"
                    max="100"
                  />
                </div>
              </div>

              {/* DR Filter */}
              <div className="space-y-2 bg-white p-4 rounded-lg border-2">
                <Label className="text-sm font-semibold flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-navy-500" />
                  Domain Rating (DR)
                </Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={filters.domainRating.min}
                    onChange={(e) => setFilters({...filters, domainRating: {...filters.domainRating, min: parseInt(e.target.value) || 0}})}
                    className="border-2"
                    min="0"
                    max="100"
                  />
                  <Input
                    type="number"
                    placeholder="Max"
                    value={filters.domainRating.max}
                    onChange={(e) => setFilters({...filters, domainRating: {...filters.domainRating, max: parseInt(e.target.value) || 100}})}
                    className="border-2"
                    min="0"
                    max="100"
                  />
                </div>
              </div>

              {/* RD Filter */}
              <div className="space-y-2 bg-white p-4 rounded-lg border-2">
                <Label className="text-sm font-semibold flex items-center gap-2">
                  <Globe className="h-4 w-4 text-purple-600" />
                  Referring Domains (RD)
                </Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={filters.referringDomains.min}
                    onChange={(e) => setFilters({...filters, referringDomains: {...filters.referringDomains, min: parseInt(e.target.value) || 0}})}
                    className="border-2"
                    min="0"
                  />
                  <Input
                    type="number"
                    placeholder="Max"
                    value={filters.referringDomains.max}
                    onChange={(e) => setFilters({...filters, referringDomains: {...filters.referringDomains, max: parseInt(e.target.value) || 10000000}})}
                    className="border-2"
                    min="0"
                  />
                </div>
              </div>

              {/* BL Filter */}
              <div className="space-y-2 bg-white p-4 rounded-lg border-2">
                <Label className="text-sm font-semibold flex items-center gap-2">
                  <ExternalLink className="h-4 w-4 text-indigo-600" />
                  Total Backlinks (BL)
                </Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={filters.totalBacklinks.min}
                    onChange={(e) => setFilters({...filters, totalBacklinks: {...filters.totalBacklinks, min: parseInt(e.target.value) || 0}})}
                    className="border-2"
                    min="0"
                  />
                  <Input
                    type="number"
                    placeholder="Max"
                    value={filters.totalBacklinks.max}
                    onChange={(e) => setFilters({...filters, totalBacklinks: {...filters.totalBacklinks, max: parseInt(e.target.value) || 1000000000}})}
                    className="border-2"
                    min="0"
                  />
                </div>
              </div>

              {/* TF Filter */}
              <div className="space-y-2 bg-white p-4 rounded-lg border-2">
                <Label className="text-sm font-semibold flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-cyan-600" />
                  Trust Flow (TF)
                </Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={filters.trustFlow.min}
                    onChange={(e) => setFilters({...filters, trustFlow: {...filters.trustFlow, min: parseInt(e.target.value) || 0}})}
                    className="border-2"
                    min="0"
                    max="100"
                  />
                  <Input
                    type="number"
                    placeholder="Max"
                    value={filters.trustFlow.max}
                    onChange={(e) => setFilters({...filters, trustFlow: {...filters.trustFlow, max: parseInt(e.target.value) || 100}})}
                    className="border-2"
                    min="0"
                    max="100"
                  />
                </div>
              </div>

              {/* CF Filter */}
              <div className="space-y-2 bg-white p-4 rounded-lg border-2">
                <Label className="text-sm font-semibold flex items-center gap-2">
                  <Star className="h-4 w-4 text-emerald-600" />
                  Citation Flow (CF)
                </Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={filters.citationFlow.min}
                    onChange={(e) => setFilters({...filters, citationFlow: {...filters.citationFlow, min: parseInt(e.target.value) || 0}})}
                    className="border-2"
                    min="0"
                    max="100"
                  />
                  <Input
                    type="number"
                    placeholder="Max"
                    value={filters.citationFlow.max}
                    onChange={(e) => setFilters({...filters, citationFlow: {...filters.citationFlow, max: parseInt(e.target.value) || 100}})}
                    className="border-2"
                    min="0"
                    max="100"
                  />
                </div>
              </div>

              {/* Difficulty Filter */}
              <div className="space-y-2 bg-white p-4 rounded-lg border-2">
                <Label className="text-sm font-semibold flex items-center gap-2">
                  <Zap className="h-4 w-4 text-yellow-600" />
                  Difficulty (1-5)
                </Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={filters.difficulty.min}
                    onChange={(e) => setFilters({...filters, difficulty: {...filters.difficulty, min: parseInt(e.target.value) || 1}})}
                    className="border-2"
                    min="1"
                    max="5"
                  />
                  <Input
                    type="number"
                    placeholder="Max"
                    value={filters.difficulty.max}
                    onChange={(e) => setFilters({...filters, difficulty: {...filters.difficulty, max: parseInt(e.target.value) || 5}})}
                    className="border-2"
                    min="1"
                    max="5"
                  />
                </div>
              </div>

              {/* Spam Score Filter */}
              <div className="space-y-2 bg-white p-4 rounded-lg border-2">
                <Label className="text-sm font-semibold flex items-center gap-2">
                  <Globe className="h-4 w-4 text-red-600" />
                  Spam Score
                </Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={filters.spamScore.min}
                    onChange={(e) => setFilters({...filters, spamScore: {...filters.spamScore, min: parseInt(e.target.value) || 0}})}
                    className="border-2"
                    min="0"
                    max="100"
                  />
                  <Input
                    type="number"
                    placeholder="Max"
                    value={filters.spamScore.max}
                    onChange={(e) => setFilters({...filters, spamScore: {...filters.spamScore, max: parseInt(e.target.value) || 100}})}
                    className="border-2"
                    min="0"
                    max="100"
                  />
                </div>
              </div>

              {/* Traffic Value Filter */}
              <div className="space-y-2 bg-white p-4 rounded-lg border-2">
                <Label className="text-sm font-semibold flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  Traffic Value ($)
                </Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={filters.trafficValue.min}
                    onChange={(e) => setFilters({...filters, trafficValue: {...filters.trafficValue, min: parseInt(e.target.value) || 0}})}
                    className="border-2"
                    min="0"
                  />
                  <Input
                    type="number"
                    placeholder="Max"
                    value={filters.trafficValue.max}
                    onChange={(e) => setFilters({...filters, trafficValue: {...filters.trafficValue, max: parseInt(e.target.value) || 10000000}})}
                    className="border-2"
                    min="0"
                  />
                </div>
              </div>

              {/* Est. Traffic Filter */}
              <div className="space-y-2 bg-white p-4 rounded-lg border-2">
                <Label className="text-sm font-semibold flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-purple-600" />
                  Est. Traffic
                </Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={filters.estTraffic.min}
                    onChange={(e) => setFilters({...filters, estTraffic: {...filters.estTraffic, min: parseInt(e.target.value) || 0}})}
                    className="border-2"
                    min="0"
                  />
                  <Input
                    type="number"
                    placeholder="Max"
                    value={filters.estTraffic.max}
                    onChange={(e) => setFilters({...filters, estTraffic: {...filters.estTraffic, max: parseInt(e.target.value) || 10000000}})}
                    className="border-2"
                    min="0"
                  />
                </div>
              </div>

              {/* Cost Filter */}
              <div className="space-y-2 bg-white p-4 rounded-lg border-2">
                <Label className="text-sm font-semibold flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-orange-600" />
                  Cost ($)
                </Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={filters.cost.min}
                    onChange={(e) => setFilters({...filters, cost: {...filters.cost, min: parseInt(e.target.value) || 0}})}
                    className="border-2"
                    min="0"
                  />
                  <Input
                    type="number"
                    placeholder="Max"
                    value={filters.cost.max}
                    onChange={(e) => setFilters({...filters, cost: {...filters.cost, max: parseInt(e.target.value) || 10000}})}
                    className="border-2"
                    min="0"
                  />
                </div>
              </div>
            </div>

            {/* Select/Dropdown Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t-2">
              {/* Category Filter */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Category</Label>
                <Select value={selectFilters.category} onValueChange={(value) => setSelectFilters({...selectFilters, category: value})}>
                  <SelectTrigger className="border-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="Design Community">Design Community</SelectItem>
                    <SelectItem value="Tech">Tech</SelectItem>
                    <SelectItem value="Business">Business</SelectItem>
                    <SelectItem value="Marketing">Marketing</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Link Type Filter */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">
                  Link Type
                  {selectFilters.linkType !== 'all' && (
                    <Badge variant="secondary" className="ml-2 text-xs">
                      Active: {selectFilters.linkType}
                    </Badge>
                  )}
                </Label>
                <Select value={selectFilters.linkType} onValueChange={(value) => {
                  console.log('Link Type changed to:', value);
                  setSelectFilters({...selectFilters, linkType: value});
                }}>
                  <SelectTrigger className="border-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="PROFILE">Profile</SelectItem>
                    <SelectItem value="DIRECTORY">Directory</SelectItem>
                    <SelectItem value="GUEST_POST">Guest Post</SelectItem>
                    <SelectItem value="FORUM">Forum</SelectItem>
                    <SelectItem value="SOCIAL">Social</SelectItem>
                    <SelectItem value="ARTICLE_SUBMISSION">Article Submission</SelectItem>
                    <SelectItem value="BLOG_COMMENT">Blog Comment</SelectItem>
                    <SelectItem value="WEB_2_0">Web 2.0</SelectItem>
                    <SelectItem value="Q_AND_A">Q&A</SelectItem>
                    <SelectItem value="BUSINESS_LISTING">Business Listing</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Language Filter */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Language</Label>
                <Select value={selectFilters.language} onValueChange={(value) => setSelectFilters({...selectFilters, language: value})}>
                  <SelectTrigger className="border-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Languages</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                    <SelectItem value="de">German</SelectItem>
                    <SelectItem value="pt">Portuguese</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Country Filter */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Country</Label>
                <Select value={selectFilters.country} onValueChange={(value) => setSelectFilters({...selectFilters, country: value})}>
                  <SelectTrigger className="border-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Countries</SelectItem>
                    <SelectItem value="US">United States</SelectItem>
                    <SelectItem value="UK">United Kingdom</SelectItem>
                    <SelectItem value="CA">Canada</SelectItem>
                    <SelectItem value="AU">Australia</SelectItem>
                    <SelectItem value="DE">Germany</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Status Filter */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Status</Label>
                <Select value={selectFilters.status} onValueChange={(value) => setSelectFilters({...selectFilters, status: value})}>
                  <SelectTrigger className="border-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Checkboxes */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold">Options</Label>
                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectFilters.isFree}
                      onChange={(e) => setSelectFilters({...selectFilters, isFree: e.target.checked})}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">Free Only</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectFilters.isDofollow}
                      onChange={(e) => setSelectFilters({...selectFilters, isDofollow: e.target.checked})}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">Dofollow Only</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Active Filters Summary */}
            <div className="flex items-center gap-2 pt-2">
              <Badge variant="outline" className="text-sm">
                Showing {sortedOpportunities.length} of {data?.totalCount || 0} opportunities
              </Badge>
            </div>
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
      ) : !sortedOpportunities || sortedOpportunities.length === 0 ? (
        <Card className="border-2 border-dashed">
          <CardContent className="text-center py-16">
            <Search className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">No opportunities found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {sortedOpportunities.map((opp) => {
            const gradient = getLinkTypeColor(opp.linkType);
            return (
              <Card 
                key={opp.id} 
                className="group hover:shadow-xl transition-all duration-200 border-2 hover:border-navy-400 bg-white"
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    {/* Icon */}
                    <div className={`h-12 w-12 rounded-xl bg-gradient-to-r ${gradient} flex items-center justify-center shadow-md flex-shrink-0`}>
                      <Globe className="h-6 w-6 text-white" />
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-bold text-gray-900 group-hover:text-navy-600 transition-colors truncate">
                            {opp.siteName}
                          </h3>
                          <p className="text-sm text-gray-600 line-clamp-1 mt-1">
                            {opp.shortDescription}
                          </p>
                        </div>

                        {/* Price Badge */}
                        <div className="flex-shrink-0">
                          {opp.isFree ? (
                            <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 shadow-md">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Free
                            </Badge>
                          ) : (
                            <Badge className="bg-gradient-to-r from-gold-500 to-red-500 text-white border-0 shadow-md">
                              <DollarSign className="h-3 w-3 mr-1" />
                              ${((opp.cost || 0) / 100).toFixed(0)}
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Metrics & Info Row */}
                      <div className="flex items-center gap-3 mt-3 flex-wrap">
                        {/* Metrics */}
                        {opp.domainAuthority && (
                          <div className="flex items-center gap-1 bg-blue-50 px-2 py-1 rounded border border-blue-200">
                            <Star className="h-3 w-3 text-blue-600" />
                            <span className="text-xs font-bold text-blue-900">DA {opp.domainAuthority}</span>
                          </div>
                        )}
                        {opp.domainRating && (
                          <div className="flex items-center gap-1 bg-navy-50 px-2 py-1 rounded border border-navy-200">
                            <TrendingUp className="h-3 w-3 text-navy-500" />
                            <span className="text-xs font-bold text-navy-900">DR {opp.domainRating}</span>
                          </div>
                        )}
                        {opp.referringDomains && (
                          <div className="flex items-center gap-1 bg-purple-50 px-2 py-1 rounded border border-purple-200">
                            <Globe className="h-3 w-3 text-purple-600" />
                            <span className="text-xs font-bold text-purple-900">RD {formatNumber(opp.referringDomains)}</span>
                          </div>
                        )}
                        {opp.totalBacklinks && (
                          <div className="flex items-center gap-1 bg-indigo-50 px-2 py-1 rounded border border-indigo-200">
                            <ExternalLink className="h-3 w-3 text-indigo-600" />
                            <span className="text-xs font-bold text-indigo-900">BL {formatNumber(opp.totalBacklinks)}</span>
                          </div>
                        )}
                        {opp.trustFlow && (
                          <div className="flex items-center gap-1 bg-cyan-50 px-2 py-1 rounded border border-cyan-200">
                            <CheckCircle2 className="h-3 w-3 text-cyan-600" />
                            <span className="text-xs font-bold text-cyan-900">TF {opp.trustFlow}</span>
                          </div>
                        )}
                        {opp.citationFlow && (
                          <div className="flex items-center gap-1 bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
                            <Star className="h-3 w-3 text-emerald-600" />
                            <span className="text-xs font-bold text-emerald-900">CF {opp.citationFlow}</span>
                          </div>
                        )}
                        {opp.isDofollow && (
                          <div className="flex items-center gap-1 bg-green-50 px-2 py-1 rounded border border-green-200">
                            <Zap className="h-3 w-3 text-green-600" />
                            <span className="text-xs font-bold text-green-900">Dofollow</span>
                          </div>
                        )}

                        {/* Type & Category */}
                        <Badge className={`bg-gradient-to-r ${gradient} text-white border-0 text-xs`}>
                          {opp.linkType.replace(/_/g, ' ')}
                        </Badge>
                        <Badge variant="secondary" className="font-medium text-xs">
                          {opp.category}
                        </Badge>
                        <Badge variant="outline" className="font-medium text-xs">
                          {opp.niche}
                        </Badge>

                        {/* Traffic */}
                        {opp.estimatedTraffic && opp.estimatedTraffic > 0 && (
                          <div className="text-xs font-semibold text-gold-700">
                            📊 {(opp.estimatedTraffic / 1000000).toFixed(1)}M visits/mo
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 flex-shrink-0">
                      <Link href={`/opportunities/${opp.id}`}>
                        <Button 
                          variant="default" 
                          className={`bg-gradient-to-r ${gradient} hover:opacity-90 shadow-md`}
                          size="sm"
                        >
                          View Details
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-2"
                        onClick={() => window.open(opp.websiteUrl, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
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
