'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Plus, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function NewOpportunityPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    url: '',
    siteName: '',
    shortDescription: '',
    fullDescription: '',
    category: '',
    niche: '',
    language: 'en',
    country: '',
    linkType: 'GUEST_POST' as const,
    isFree: true,
    cost: 0,
    difficultyLevel: 3,
    domainAuthority: 0,
    domainRating: 0,
    estimatedTraffic: 0,
    spamScore: 0,
    referringDomains: 0,
    totalBacklinks: 0,
    trafficValue: 0,
    trustFlow: 0,
    citationFlow: 0,
    isDofollow: true,
    status: 'ACTIVE' as const,
  });

  const createOpportunity = trpc.admin.createOpportunity.useMutation({
    onSuccess: (data) => {
      router.push(`/admin/opportunities/${data.id}/edit`);
    },
  });

  const fetchMetrics = trpc.admin.fetchDomainMetrics.useMutation({
    onSuccess: (data) => {
      const metrics = data.metrics;
      setFormData({
        ...formData,
        domainAuthority: metrics.domainAuthority,
        domainRating: metrics.domainRating,
        referringDomains: metrics.referringDomains,
        totalBacklinks: metrics.totalBacklinks,
        trafficValue: metrics.trafficValue,
        trustFlow: metrics.trustFlow,
        citationFlow: metrics.citationFlow,
      });
      toast.success('Metrics fetched successfully!');
      setFetchingMetrics(false);
    },
    onError: (error) => {
      toast.error(`Failed to fetch metrics: ${error.message}`);
      setFetchingMetrics(false);
    },
  });

  const handleFetchMetrics = async () => {
    if (!formData.url) {
      toast.error('Please enter a URL first');
      return;
    }
    setFetchingMetrics(true);
    await fetchMetrics.mutateAsync({ url: formData.url });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createOpportunity.mutateAsync({
      ...formData,
      cost: formData.isFree ? undefined : formData.cost || undefined,
      domainAuthority: formData.domainAuthority || undefined,
      domainRating: formData.domainRating || undefined,
      estimatedTraffic: formData.estimatedTraffic || undefined,
      spamScore: formData.spamScore || undefined,
      referringDomains: formData.referringDomains || undefined,
      totalBacklinks: formData.totalBacklinks || undefined,
      trafficValue: formData.trafficValue || undefined,
      trustFlow: formData.trustFlow || undefined,
      citationFlow: formData.citationFlow || undefined,
      country: formData.country || undefined,
      fullDescription: formData.fullDescription || undefined,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin">
          <Button variant="outline" size="icon" className="border-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-black bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
            Add New Opportunity
          </h1>
          <p className="text-gray-600 text-sm">Create a new backlink opportunity with tutorial steps</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card className="border-2 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl">Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="siteName" className="font-semibold">Site Name *</Label>
                <Input
                  id="siteName"
                  required
                  value={formData.siteName}
                  onChange={(e) => setFormData({ ...formData, siteName: e.target.value })}
                  className="border-2 h-11"
                  placeholder="e.g., Medium, Reddit, etc."
                />
              </div>
              <div>
                <Label htmlFor="url" className="font-semibold">URL *</Label>
                <Input
                  id="url"
                  type="url"
                  required
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  className="border-2 h-11"
                  placeholder="https://example.com"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="shortDescription" className="font-semibold">Short Description *</Label>
              <Input
                id="shortDescription"
                required
                value={formData.shortDescription}
                onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                className="border-2 h-11"
                placeholder="Brief description of the opportunity"
              />
            </div>

            <div>
              <Label htmlFor="fullDescription" className="font-semibold">Full Description</Label>
              <Textarea
                id="fullDescription"
                value={formData.fullDescription}
                onChange={(e) => setFormData({ ...formData, fullDescription: e.target.value })}
                className="border-2 min-h-[100px]"
                placeholder="Detailed information about the opportunity..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="category" className="font-semibold">Category *</Label>
                <Input
                  id="category"
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="border-2 h-11"
                  placeholder="e.g., Technology"
                />
              </div>
              <div>
                <Label htmlFor="niche" className="font-semibold">Niche *</Label>
                <Input
                  id="niche"
                  required
                  value={formData.niche}
                  onChange={(e) => setFormData({ ...formData, niche: e.target.value })}
                  className="border-2 h-11"
                  placeholder="e.g., Web Development"
                />
              </div>
              <div>
                <Label htmlFor="linkType" className="font-semibold">Link Type *</Label>
                <Select
                  value={formData.linkType}
                  onValueChange={(value: any) => setFormData({ ...formData, linkType: value })}
                >
                  <SelectTrigger className="border-2 h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="language" className="font-semibold">Language</Label>
                <Input
                  id="language"
                  value={formData.language}
                  onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                  className="border-2 h-11"
                  placeholder="en"
                />
              </div>
              <div>
                <Label htmlFor="country" className="font-semibold">Country</Label>
                <Input
                  id="country"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  className="border-2 h-11"
                  placeholder="USA"
                />
              </div>
              <div>
                <Label htmlFor="status" className="font-semibold">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: any) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger className="border-2 h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                    <SelectItem value="NEEDS_REVIEW">Needs Review</SelectItem>
                    <SelectItem value="BROKEN">Broken</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SEO Metrics */}
        <Card className="border-2 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl">SEO Metrics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="domainAuthority" className="font-semibold">Domain Authority</Label>
                <Input
                  id="domainAuthority"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.domainAuthority}
                  onChange={(e) => setFormData({ ...formData, domainAuthority: parseInt(e.target.value) || 0 })}
                  className="border-2 h-11"
                />
              </div>
              <div>
                <Label htmlFor="domainRating" className="font-semibold">Domain Rating</Label>
                <Input
                  id="domainRating"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.domainRating}
                  onChange={(e) => setFormData({ ...formData, domainRating: parseInt(e.target.value) || 0 })}
                  className="border-2 h-11"
                />
              </div>
              <div>
                <Label htmlFor="estimatedTraffic" className="font-semibold">Est. Traffic</Label>
                <Input
                  id="estimatedTraffic"
                  type="number"
                  min="0"
                  value={formData.estimatedTraffic}
                  onChange={(e) => setFormData({ ...formData, estimatedTraffic: parseInt(e.target.value) || 0 })}
                  className="border-2 h-11"
                />
              </div>
              <div>
                <Label htmlFor="spamScore" className="font-semibold">Spam Score</Label>
                <Input
                  id="spamScore"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.spamScore}
                  onChange={(e) => setFormData({ ...formData, spamScore: parseInt(e.target.value) || 0 })}
                  className="border-2 h-11"
                />
              </div>
            </div>

            {/* Additional SEO Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
              <div>
                <Label htmlFor="referringDomains" className="font-semibold">Referring Domains</Label>
                <Input
                  id="referringDomains"
                  type="number"
                  min="0"
                  value={formData.referringDomains}
                  onChange={(e) => setFormData({ ...formData, referringDomains: parseInt(e.target.value) || 0 })}
                  className="border-2 h-11"
                  placeholder="e.g., 5800000"
                />
              </div>
              <div>
                <Label htmlFor="totalBacklinks" className="font-semibold">Total Backlinks</Label>
                <Input
                  id="totalBacklinks"
                  type="number"
                  min="0"
                  value={formData.totalBacklinks}
                  onChange={(e) => setFormData({ ...formData, totalBacklinks: parseInt(e.target.value) || 0 })}
                  className="border-2 h-11"
                  placeholder="e.g., 980000000"
                />
              </div>
              <div>
                <Label htmlFor="trafficValue" className="font-semibold">Traffic Value ($)</Label>
                <Input
                  id="trafficValue"
                  type="number"
                  min="0"
                  value={formData.trafficValue}
                  onChange={(e) => setFormData({ ...formData, trafficValue: parseInt(e.target.value) || 0 })}
                  className="border-2 h-11"
                  placeholder="e.g., 12500000"
                />
              </div>
              <div>
                <Label htmlFor="trustFlow" className="font-semibold">Trust Flow</Label>
                <Input
                  id="trustFlow"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.trustFlow}
                  onChange={(e) => setFormData({ ...formData, trustFlow: parseInt(e.target.value) || 0 })}
                  className="border-2 h-11"
                />
              </div>
              <div>
                <Label htmlFor="citationFlow" className="font-semibold">Citation Flow</Label>
                <Input
                  id="citationFlow"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.citationFlow}
                  onChange={(e) => setFormData({ ...formData, citationFlow: parseInt(e.target.value) || 0 })}
                  className="border-2 h-11"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pricing & Difficulty */}
        <Card className="border-2 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl">Pricing & Difficulty</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isFree"
                  checked={formData.isFree}
                  onChange={(e) => setFormData({ ...formData, isFree: e.target.checked })}
                  className="h-5 w-5 border-2"
                />
                <Label htmlFor="isFree" className="font-semibold cursor-pointer">Is Free</Label>
              </div>
              <div>
                <Label htmlFor="cost" className="font-semibold">Cost ($)</Label>
                <Input
                  id="cost"
                  type="number"
                  min="0"
                  disabled={formData.isFree}
                  value={formData.cost}
                  onChange={(e) => setFormData({ ...formData, cost: parseInt(e.target.value) || 0 })}
                  className="border-2 h-11"
                />
              </div>
              <div>
                <Label htmlFor="difficultyLevel" className="font-semibold">Difficulty (1-5)</Label>
                <Input
                  id="difficultyLevel"
                  type="number"
                  min="1"
                  max="5"
                  required
                  value={formData.difficultyLevel}
                  onChange={(e) => setFormData({ ...formData, difficultyLevel: parseInt(e.target.value) || 3 })}
                  className="border-2 h-11"
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isDofollow"
                  checked={formData.isDofollow}
                  onChange={(e) => setFormData({ ...formData, isDofollow: e.target.checked })}
                  className="h-5 w-5 border-2"
                />
                <Label htmlFor="isDofollow" className="font-semibold cursor-pointer">Is Dofollow</Label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex gap-4">
          <Link href="/admin" className="flex-1">
            <Button type="button" variant="outline" className="w-full h-12 border-2">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={createOpportunity.isPending}
            className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white shadow-lg h-12 font-semibold"
          >
            {createOpportunity.isPending ? (
              <>
                <Sparkles className="h-5 w-5 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="h-5 w-5 mr-2" />
                Create Opportunity
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
