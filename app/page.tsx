'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Check, ArrowRight, Search, TrendingUp, Target, Zap, Star, Crown, Sparkles, Globe, HelpCircle } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b-2 border-navy-200 bg-white/90 backdrop-blur-lg sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-3 group">
            <img src="/logo.png" alt="RankdSEO" className="h-24 w-auto" />
          </Link>
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="#features" className="text-sm font-semibold text-gray-700 hover:text-navy-500 transition-colors">
              Features
            </Link>
            <Link href="#pricing" className="text-sm font-semibold text-gray-700 hover:text-navy-500 transition-colors">
              Pricing
            </Link>
            <Link href="/signin" className="text-sm font-semibold text-gray-700 hover:text-navy-500 transition-colors">
              Sign In
            </Link>
            <Link href="/signup">
              <Button size="sm" className="bg-gradient-to-r from-navy-500 to-sky-500 hover:from-purple-700 hover:to-sky-600 shadow-lg">
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
          <div className="absolute top-20 left-10 w-72 h-72 bg-navy-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
          <div className="absolute top-40 right-10 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-gold-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>
        </div>

        <div className="relative max-w-7xl mx-auto text-center">
          <div className="flex justify-center mb-6">
            <Badge className="bg-gradient-to-r from-navy-500 to-sky-500 text-white border-0 px-6 py-2 text-base font-bold shadow-xl">
              <Sparkles className="h-4 w-4 mr-2" />
              1,000+ Curated Backlink Opportunities
            </Badge>
          </div>
          <h1 className="text-6xl md:text-7xl font-black mb-6 leading-tight">
            <span className="bg-gradient-to-r from-navy-500 via-sky-500 to-sky-600 bg-clip-text text-transparent">
              Build High-Quality
            </span>
            <br />
            <span className="bg-gradient-to-r from-blue-600 via-navy-500 to-sky-500 bg-clip-text text-transparent">
              Backlinks with Confidence
            </span>
          </h1>
          <p className="text-2xl text-gray-700 mb-10 max-w-3xl mx-auto font-medium leading-relaxed">
            Discover curated backlink opportunities with step-by-step instructions,
            track your progress, and <span className="text-navy-500 font-bold">boost your SEO performance</span>
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/signup">
              <Button size="lg" className="bg-gradient-to-r from-navy-500 via-sky-500 to-sky-600 hover:from-purple-700 hover:via-sky-600 hover:to-gold-600 text-white text-xl px-10 py-7 shadow-2xl transform hover:scale-105 transition-all">
                Start Free Trial
                <ArrowRight className="ml-3 h-6 w-6" />
              </Button>
            </Link>
            <Link href="#features">
              <Button size="lg" variant="outline" className="text-xl px-10 py-7 border-2 border-navy-300 hover:bg-navy-50">
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
            <Badge className="bg-navy-100 text-navy-600 mb-4 text-base px-4 py-2">
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
                  Access 1,000+ verified backlink opportunities across all niches and industries.
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

            <Card className="border-2 border-navy-200 hover:border-navy-400 transition-all hover:shadow-2xl hover:-translate-y-2 group">
              <CardContent className="pt-8">
                <div className="h-16 w-16 bg-gradient-to-br from-navy-500 to-sky-500 rounded-2xl flex items-center justify-center mb-6 shadow-xl group-hover:scale-110 transition-transform">
                  <TrendingUp className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-gray-800">Progress Tracking</h3>
                <p className="text-gray-600 leading-relaxed">
                  Monitor your backlink building progress with project management tools.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-gold-200 hover:border-gold-400 transition-all hover:shadow-2xl hover:-translate-y-2 group">
              <CardContent className="pt-8">
                <div className="h-16 w-16 bg-gradient-to-br from-gold-500 to-red-500 rounded-2xl flex items-center justify-center mb-6 shadow-xl group-hover:scale-110 transition-transform">
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

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
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

            {/* 1 Year Membership - Now with GREEN colors */}
            <Card className="border-2 border-green-200 hover:shadow-2xl transition-all hover:-translate-y-1">
              <CardContent className="pt-8">
                <h3 className="text-2xl font-black mb-2 text-gray-800">1 Year Membership</h3>
                <div className="mb-2">
                  <span className="text-4xl font-black bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">$99.99</span>
                  <span className="text-gray-600 text-base"> per Year</span>
                </div>
                <div className="mb-6">
                  <Badge className="bg-green-100 text-green-700 text-xs px-2 py-1 border-0">
                    Save 76%
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

            {/* Lifetime Membership */}
            <Card className="border-2 border-gold-300 hover:shadow-2xl transition-all hover:-translate-y-1 bg-gradient-to-b from-orange-50 to-white">
              <CardContent className="pt-8">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-2xl font-black text-gray-800">Lifetime</h3>
                  <Crown className="h-6 w-6 text-yellow-500" />
                </div>
                <div className="mb-2">
                  <span className="text-4xl font-black bg-gradient-to-r from-gold-600 to-sky-500 bg-clip-text text-transparent">$179.99</span>
                  <span className="text-gray-600 text-base"> now</span>
                </div>
                <div className="mb-6">
                  <Badge className="bg-gold-100 text-gold-700 text-xs px-2 py-1 border-0">
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
                  <Button variant="outline" className="w-full h-12 text-base font-semibold border-2 border-gold-400 hover:bg-gold-50">
                    Get Started
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-navy-500 via-sky-500 to-sky-600 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative max-w-5xl mx-auto text-center">
          <Sparkles className="h-16 w-16 mx-auto mb-6 animate-pulse" />
          <h2 className="text-5xl font-black mb-6">Ready to Build Better Backlinks?</h2>
          <p className="text-2xl mb-10 opacity-95 font-medium">Join thousands of SEO professionals using RankdSEO</p>
          <Link href="/signup">
            <Button size="lg" variant="secondary" className="text-xl px-12 py-8 bg-white text-navy-500 hover:bg-gray-100 shadow-2xl font-bold">
              Start Your Free Trial
              <ArrowRight className="ml-3 h-6 w-6" />
            </Button>
          </Link>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-4">
              <HelpCircle className="h-8 w-8 text-blue-600" />
              <h2 className="text-4xl font-bold text-gray-900">
                Frequently Asked Questions
              </h2>
            </div>
            <p className="text-lg text-gray-600">
              Everything you need to know about RankdSEO
            </p>
          </div>

          <Accordion type="single" collapsible className="space-y-4">
            <AccordionItem value="item-1" className="bg-white rounded-lg shadow-md border-2 border-gray-200 px-6">
              <AccordionTrigger className="text-left font-semibold text-gray-900 hover:text-blue-600">
                What is your refund policy?
              </AccordionTrigger>
              <AccordionContent className="text-gray-700 pt-2 pb-4">
                There are no refunds once the payment is made, due to the nature of the site.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2" className="bg-white rounded-lg shadow-md border-2 border-gray-200 px-6">
              <AccordionTrigger className="text-left font-semibold text-gray-900 hover:text-blue-600">
                Can I cancel my subscription when I wish to do so?
              </AccordionTrigger>
              <AccordionContent className="text-gray-700 pt-2 pb-4">
                You can cancel the subscription at any time.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3" className="bg-white rounded-lg shadow-md border-2 border-gray-200 px-6">
              <AccordionTrigger className="text-left font-semibold text-gray-900 hover:text-blue-600">
                What kind of backlinks are in the database?
              </AccordionTrigger>
              <AccordionContent className="text-gray-700 pt-2 pb-4">
                Mixed. There are profile links, website builders, posts, bookmarks, social posts, article submissions, etc.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4" className="bg-white rounded-lg shadow-md border-2 border-gray-200 px-6">
              <AccordionTrigger className="text-left font-semibold text-gray-900 hover:text-blue-600">
                Can I use the database as a guide for my VA (Virtual assistant) to build backlinks for me?
              </AccordionTrigger>
              <AccordionContent className="text-gray-700 pt-2 pb-4">
                That is a great idea since even a complete beginner could build backlinks with the help of our guides.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5" className="bg-white rounded-lg shadow-md border-2 border-gray-200 px-6">
              <AccordionTrigger className="text-left font-semibold text-gray-900 hover:text-blue-600">
                Are there any extra costs after buying the access?
              </AccordionTrigger>
              <AccordionContent className="text-gray-700 pt-2 pb-4">
                No. All the links on our database can be acquired for FREE.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-6" className="bg-white rounded-lg shadow-md border-2 border-gray-200 px-6">
              <AccordionTrigger className="text-left font-semibold text-gray-900 hover:text-blue-600">
                Will there be new links added in time?
              </AccordionTrigger>
              <AccordionContent className="text-gray-700 pt-2 pb-4">
                Links are added on a regular basis.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-7" className="bg-white rounded-lg shadow-md border-2 border-gray-200 px-6">
              <AccordionTrigger className="text-left font-semibold text-gray-900 hover:text-blue-600">
                Why would I pay for more than one month? Wouldn't I be able to build links within a month?
              </AccordionTrigger>
              <AccordionContent className="text-gray-700 pt-2 pb-4">
                <p className="mb-3">
                  If you got only one website, then you definitely can build the links in time. If you got more than one website, then you might not be able to make it in time.
                </p>
                <p className="mb-3">
                  The second benefit of having long-term access is to receive the latest link building opportunities and guides when they get published.
                </p>
                <p className="font-semibold text-blue-600">
                  For link sellers and agencies, long-term membership is the Best Option.
                </p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 bg-gray-900 text-gray-400">
        <div className="max-w-7xl mx-auto">
          {/* Footer Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            {/* Left Side - Logo and Links */}
            <div className="text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start space-x-3 mb-6">
                <div className="bg-white rounded-xl p-4 shadow-lg">
                  <img src="/logo.png" alt="RankdSEO" className="h-24 w-auto" />
                </div>
              </div>
              <div className="mb-4 flex items-center justify-center md:justify-start gap-6">
                <Link href="/privacy-policy" className="text-sm text-gray-400 hover:text-white transition-colors">
                  Privacy Policy
                </Link>
                <span className="text-gray-600">|</span>
                <Link href="/terms-and-conditions" className="text-sm text-gray-400 hover:text-white transition-colors">
                  Terms and Conditions
                </Link>
              </div>
            </div>

            {/* Right Side - Company Information */}
            <div className="text-center md:text-right">
              <h3 className="text-lg font-bold text-white mb-4">About Company</h3>
              <div className="space-y-2 text-sm">
                <p className="text-gray-300 font-semibold">SIA Uprankd</p>
                <p className="text-gray-400">Reg. No. 44103141201</p>
                <p className="text-gray-400">VAT No. LV44103141201</p>
                <p className="text-gray-400">
                  Brīvības iela 40-20B<br />
                  Rīga, LV-1050<br />
                  Latvia
                </p>
              </div>
            </div>
          </div>

          {/* Copyright - Centered at bottom */}
          <div className="text-center pt-8 border-t border-gray-800">
            <p className="text-sm">© 2026 RankdSEO. All rights reserved.</p>
          </div>
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
