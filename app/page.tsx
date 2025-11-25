'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, ArrowRight, Search, TrendingUp, Target, Zap } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 bg-blue-600 rounded flex items-center justify-center">
              <span className="text-white font-bold">R</span>
            </div>
            <span className="text-xl font-bold">RankdSEO</span>
          </div>
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="#features" className="text-sm font-medium hover:text-blue-600">
              Features
            </Link>
            <Link href="#pricing" className="text-sm font-medium hover:text-blue-600">
              Pricing
            </Link>
            <Link href="/signin" className="text-sm font-medium hover:text-blue-600">
              Sign In
            </Link>
            <Link href="/signup">
              <Button size="sm">Get Started</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <Badge className="mb-4" variant="secondary">
            10,000+ Curated Backlink Opportunities
          </Badge>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
            Build High-Quality Backlinks with Confidence
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Discover curated backlink opportunities with step-by-step instructions,
            track your progress, and boost your website's SEO performance.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" className="text-lg px-8">
                Start Free Trial <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="#features">
              <Button size="lg" variant="outline" className="text-lg px-8">
                Learn More
              </Button>
            </Link>
          </div>
          <p className="text-sm text-gray-500 mt-4">No credit card required • Free forever plan</p>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-white">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Everything You Need to Build Better Backlinks</h2>
            <p className="text-xl text-gray-600">Powerful features to streamline your SEO workflow</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card>
              <CardContent className="pt-6">
                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <Search className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Curated Opportunities</h3>
                <p className="text-gray-600">
                  Access 10,000+ verified backlink opportunities across all niches and industries.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <Target className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Step-by-Step Guides</h3>
                <p className="text-gray-600">
                  Detailed instructions for each opportunity to ensure successful backlink creation.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Progress Tracking</h3>
                <p className="text-gray-600">
                  Monitor your backlink building progress with project management tools.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                  <Zap className="h-6 w-6 text-orange-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">SEO Metrics</h3>
                <p className="text-gray-600">
                  View DA, DR, traffic estimates, and spam scores for informed decisions.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Simple, Transparent Pricing</h2>
            <p className="text-xl text-gray-600">Choose the plan that fits your needs</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Free Plan */}
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-2xl font-bold mb-2">Free</h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold">$0</span>
                  <span className="text-gray-600">/month</span>
                </div>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-600 mr-2" />
                    <span>50 opportunities</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-600 mr-2" />
                    <span>1 project</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-600 mr-2" />
                    <span>Basic filtering</span>
                  </li>
                </ul>
                <Link href="/signup">
                  <Button variant="outline" className="w-full">Get Started</Button>
                </Link>
              </CardContent>
            </Card>

            {/* Basic Plan */}
            <Card className="border-blue-600 border-2 relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-blue-600">Popular</Badge>
              </div>
              <CardContent className="pt-6">
                <h3 className="text-2xl font-bold mb-2">Basic</h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold">$29</span>
                  <span className="text-gray-600">/month</span>
                </div>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-600 mr-2" />
                    <span>1,000 opportunities</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-600 mr-2" />
                    <span>5 projects</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-600 mr-2" />
                    <span>Advanced filtering</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-600 mr-2" />
                    <span>Priority support</span>
                  </li>
                </ul>
                <Link href="/signup">
                  <Button className="w-full">Get Started</Button>
                </Link>
              </CardContent>
            </Card>

            {/* Pro Plan */}
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-2xl font-bold mb-2">Pro</h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold">$99</span>
                  <span className="text-gray-600">/month</span>
                </div>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-600 mr-2" />
                    <span>Unlimited opportunities</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-600 mr-2" />
                    <span>Unlimited projects</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-600 mr-2" />
                    <span>CSV export</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-600 mr-2" />
                    <span>API access</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-600 mr-2" />
                    <span>Priority + Phone support</span>
                  </li>
                </ul>
                <Link href="/signup">
                  <Button variant="outline" className="w-full">Get Started</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-blue-600 text-white">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to Build Better Backlinks?</h2>
          <p className="text-xl mb-8 opacity-90">Join thousands of SEO professionals using RankdSEO</p>
          <Link href="/signup">
            <Button size="lg" variant="secondary" className="text-lg px-8">
              Start Your Free Trial <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 bg-gray-900 text-gray-400">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="h-8 w-8 bg-blue-600 rounded flex items-center justify-center">
              <span className="text-white font-bold">R</span>
            </div>
            <span className="text-xl font-bold text-white">RankdSEO</span>
          </div>
          <p className="text-sm">© 2024 RankdSEO. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}