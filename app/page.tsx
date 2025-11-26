'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, ArrowRight, Search, TrendingUp, Target, Zap, Star, Crown, Sparkles, Globe } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b-2 border-purple-200 bg-white/90 backdrop-blur-lg sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="h-12 w-12 bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500 rounded-2xl flex items-center justify-center shadow-xl">
                <Crown className="h-7 w-7 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 h-4 w-4 bg-yellow-400 rounded-full border-2 border-white animate-pulse"></div>
            </div>
            <span className="text-2xl font-black bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 bg-clip-text text-transparent">RankdSEO</span>
          </div>
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="#features" className="text-sm font-semibold text-gray-700 hover:text-purple-600 transition-colors">
              Features
            </Link>
            <Link href="#pricing" className="text-sm font-semibold text-gray-700 hover:text-purple-600 transition-colors">
              Pricing
            </Link>
            <Link href="/signin" className="text-sm font-semibold text-gray-700 hover:text-purple-600 transition-colors">
              Sign In
            </Link>
            <Link href="/signup">
              <Button size="sm" className="bg-gradient-to-r from-navy-500 to-sky-500 hover:from-purple-700 hover:to-pink-700 shadow-lg">
                Get Started
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 px-4 overflow-hidden">
        {/* Decorative Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
          <div className="absolute top-40 right-10 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-orange-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>
        </div>

        <div className="relative max-w-7xl mx-auto text-center">
          <div className="flex justify-center mb-6">
            <Badge className="bg-gradient-to-r from-navy-500 to-sky-500 text-white border-0 px-6 py-2 text-base font-bold shadow-xl">
              <Sparkles className="h-4 w-4 mr-2" />
              10,000+ Curated Backlink Opportunities
            </Badge>
          </div>
          <h1 className="text-6xl md:text-7xl font-black mb-6 leading-tight">
            <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 bg-clip-text text-transparent">
              Build High-Quality
            </span>
            <br />
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Backlinks with Confidence
            </span>
          </h1>
          <p className="text-2xl text-gray-700 mb-10 max-w-3xl mx-auto font-medium leading-relaxed">
            Discover curated backlink opportunities with step-by-step instructions,
            track your progress, and <span className="text-purple-600 font-bold">boost your SEO performance</span>
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/signup">
              <Button size="lg" className="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 hover:from-purple-700 hover:via-pink-700 hover:to-orange-600 text-white text-xl px-10 py-7 shadow-2xl transform hover:scale-105 transition-all">
                Start Free Trial
                <ArrowRight className="ml-3 h-6 w-6" />
              </Button>
            </Link>
            <Link href="#features">
              <Button size="lg" variant="outline" className="text-xl px-10 py-7 border-2 border-purple-300 hover:bg-purple-50">
                Learn More
              </Button>
            </Link>
          </div>
          <p className="text-sm text-gray-600 mt-6 flex items-center justify-center gap-2">
            <Check className="h-4 w-4 text-green-600" />
            No credit card required
            <Check className="h-4 w-4 text-green-600" />
            Free forever plan
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="bg-purple-100 text-purple-700 mb-4 text-base px-4 py-2">
              <Star className="h-4 w-4 mr-2" />
              Features
            </Badge>
            <h2 className="text-5xl font-black mb-4 bg-gradient-to-r from-navy-500 to-sky-500 bg-clip-text text-transparent">
              Everything You Need
            </h2>
            <p className="text-xl text-gray-600">Powerful features to streamline your SEO workflow</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="border-2 border-blue-200 hover:border-blue-400 transition-all hover:shadow-2xl hover:-translate-y-2 group">
              <CardContent className="pt-8">
                <div className="h-16 w-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mb-6 shadow-xl group-hover:scale-110 transition-transform">
                  <Search className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-gray-800">Curated Opportunities</h3>
                <p className="text-gray-600 leading-relaxed">
                  Access 10,000+ verified backlink opportunities across all niches and industries.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-green-200 hover:border-green-400 transition-all hover:shadow-2xl hover:-translate-y-2 group">
              <CardContent className="pt-8">
                <div className="h-16 w-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mb-6 shadow-xl group-hover:scale-110 transition-transform">
                  <Target className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-gray-800">Step-by-Step Guides</h3>
                <p className="text-gray-600 leading-relaxed">
                  Detailed instructions for each opportunity to ensure successful backlink creation.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-purple-200 hover:border-purple-400 transition-all hover:shadow-2xl hover:-translate-y-2 group">
              <CardContent className="pt-8">
                <div className="h-16 w-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mb-6 shadow-xl group-hover:scale-110 transition-transform">
                  <TrendingUp className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-gray-800">Progress Tracking</h3>
                <p className="text-gray-600 leading-relaxed">
                  Monitor your backlink building progress with project management tools.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-orange-200 hover:border-orange-400 transition-all hover:shadow-2xl hover:-translate-y-2 group">
              <CardContent className="pt-8">
                <div className="h-16 w-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center mb-6 shadow-xl group-hover:scale-110 transition-transform">
                  <Zap className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-gray-800">SEO Metrics</h3>
                <p className="text-gray-600 leading-relaxed">
                  View DA, DR, traffic estimates, and spam scores for informed decisions.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="bg-gradient-to-r from-green-500 to-teal-500 text-white mb-4 text-base px-4 py-2 border-0">
              <Crown className="h-4 w-4 mr-2" />
              Pricing
            </Badge>
            <h2 className="text-5xl font-black mb-4 bg-gradient-to-r from-navy-500 to-sky-500 bg-clip-text text-transparent">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600">Choose the plan that fits your needs</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
            {/* Monthly Membership */}
            <Card className="border-2 border-blue-200 hover:shadow-2xl transition-all hover:-translate-y-1">
              <CardContent className="pt-8">
                <h3 className="text-2xl font-black mb-2 text-gray-800">Monthly Membership</h3>
                <div className="mb-6">
                  <span className="text-4xl font-black bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">$34.99</span>
                  <span className="text-gray-600 text-base"> per Month</span>
                </div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 text-sm">Unlimited opportunities</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 text-sm">100 projects</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 text-sm">CSV export</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 text-sm">API access</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 text-sm">Priority email support</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 text-sm">Auto link verification</span>
                  </li>
                </ul>
                <Link href="/signup">
                  <Button variant="outline" className="w-full h-12 text-base font-semibold border-2 border-blue-300 hover:bg-blue-50">
                    Get Started
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* 3 Month Membership */}
            <Card className="border-2 border-green-200 hover:shadow-2xl transition-all hover:-translate-y-1">
              <CardContent className="pt-8">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-2xl font-black text-gray-800">3 Month Membership</h3>
                </div>
                <div className="mb-2">
                  <span className="text-4xl font-black bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">$59.99</span>
                  <span className="text-gray-600 text-base"> every 3 Months</span>
                </div>
                <div className="mb-6">
                  <Badge className="bg-green-100 text-green-700 text-xs px-2 py-1 border-0">
                    Save 43%
                  </Badge>
                </div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 text-sm">Unlimited opportunities</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 text-sm">100 projects</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 text-sm">CSV export</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 text-sm">API access</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 text-sm">Priority email support</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 text-sm">Auto link verification</span>
                  </li>
                </ul>
                <Link href="/signup">
                  <Button variant="outline" className="w-full h-12 text-base font-semibold border-2 border-green-300 hover:bg-green-50">
                    Get Started
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* 1 Year Membership */}
            <Card className="border-4 border-purple-400 relative hover:shadow-2xl transition-all bg-gradient-to-b from-purple-50 to-white">
              <div className="absolute -top-5 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-gradient-to-r from-navy-500 to-sky-500 text-white text-sm px-6 py-2 shadow-xl border-0">
                  <Star className="h-4 w-4 mr-2" />
                  Popular
                </Badge>
              </div>
              <CardContent className="pt-10">
                <h3 className="text-2xl font-black mb-2 text-gray-800">1 Year Membership</h3>
                <div className="mb-2">
                  <span className="text-4xl font-black bg-gradient-to-r from-navy-500 to-sky-500 bg-clip-text text-transparent">$99.99</span>
                  <span className="text-gray-600 text-base"> per Year</span>
                </div>
                <div className="mb-6">
                  <Badge className="bg-purple-100 text-purple-700 text-xs px-2 py-1 border-0">
                    Save 76%
                  </Badge>
                </div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 font-semibold text-sm">Unlimited opportunities</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 font-semibold text-sm">100 projects</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 font-semibold text-sm">CSV export</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 font-semibold text-sm">API access</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 font-semibold text-sm">Priority email support</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 font-semibold text-sm">Auto link verification</span>
                  </li>
                </ul>
                <Link href="/signup">
                  <Button className="w-full h-12 text-base font-semibold bg-gradient-to-r from-navy-500 to-sky-500 hover:from-purple-700 hover:to-pink-700 shadow-xl">
                    Get Started
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Lifetime Membership */}
            <Card className="border-2 border-orange-300 hover:shadow-2xl transition-all hover:-translate-y-1 bg-gradient-to-b from-orange-50 to-white">
              <CardContent className="pt-8">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-2xl font-black text-gray-800">Lifetime</h3>
                  <Crown className="h-6 w-6 text-yellow-500" />
                </div>
                <div className="mb-2">
                  <span className="text-4xl font-black bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent">$179.99</span>
                  <span className="text-gray-600 text-base"> now</span>
                </div>
                <div className="mb-6">
                  <Badge className="bg-orange-100 text-orange-700 text-xs px-2 py-1 border-0">
                    99 Years
                  </Badge>
                </div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 text-sm">Unlimited opportunities</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 text-sm">Unlimited projects</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 text-sm">CSV export</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 text-sm">API access</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 text-sm">Priority email support</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 text-sm">Auto link verification</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 text-sm font-semibold">Pay once, use forever</span>
                  </li>
                </ul>
                <Link href="/signup">
                  <Button variant="outline" className="w-full h-12 text-base font-semibold border-2 border-orange-400 hover:bg-orange-50">
                    Get Started
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative max-w-5xl mx-auto text-center">
          <Sparkles className="h-16 w-16 mx-auto mb-6 animate-pulse" />
          <h2 className="text-5xl font-black mb-6">Ready to Build Better Backlinks?</h2>
          <p className="text-2xl mb-10 opacity-95 font-medium">Join thousands of SEO professionals using RankdSEO</p>
          <Link href="/signup">
            <Button size="lg" variant="secondary" className="text-xl px-12 py-8 bg-white text-purple-600 hover:bg-gray-100 shadow-2xl font-bold">
              Start Your Free Trial
              <ArrowRight className="ml-3 h-6 w-6" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 bg-gray-900 text-gray-400">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <div className="h-12 w-12 bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500 rounded-2xl flex items-center justify-center shadow-xl">
              <Crown className="h-7 w-7 text-white" />
            </div>
            <span className="text-2xl font-black bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">RankdSEO</span>
          </div>
          <p className="text-sm">© 2024 RankdSEO. All rights reserved.</p>
        </div>
      </footer>

      <style jsx global>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}
