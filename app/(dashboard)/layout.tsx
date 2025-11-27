'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { LayoutDashboard, FolderOpen, Database, LogOut, Menu, X, Settings, Sparkles, Crown, Shield, TrendingUp } from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/signin');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="h-20 w-20 border-4 border-navy-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
            <Sparkles className="h-8 w-8 text-navy-500 absolute top-6 left-1/2 transform -translate-x-1/2 animate-pulse" />
          </div>
          <p className="text-gray-700 font-semibold text-lg">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/signin' });
  };

  const navItems = [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', gradient: 'from-blue-500 to-cyan-500' },
    { href: '/projects', icon: FolderOpen, label: 'Projects', gradient: 'from-navy-500 to-sky-500' },
    { href: '/opportunities', icon: Database, label: 'Opportunities', gradient: 'from-green-500 to-teal-500' },
    { href: '/analytics', icon: TrendingUp, label: 'Analytics', gradient: 'from-gold-500 to-yellow-500' },
    ...(session?.user?.role === 'ADMIN' ? [
      { href: '/admin', icon: Shield, label: 'Admin Panel', gradient: 'from-red-500 to-gold-500' },
      { href: '/admin/users', icon: Users, label: 'Manage Users', gradient: 'from-purple-500 to-pink-500' }
    ] : []),
  ];

  const isActive = (href: string) => pathname === href;

  return (
    <div className="min-h-screen">
      {/* Header - Full Width */}
      <header className="bg-white/90 backdrop-blur-lg border-b-2 border-navy-200 sticky top-0 z-50 shadow-lg">
        <div className="max-w-[1600px] mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden hover:bg-navy-50"
            >
              {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            <Link href="/dashboard" className="flex items-center space-x-3">
              <div className="relative">
                <div className="h-12 w-12 bg-gradient-to-br from-navy-500 via-sky-500 to-sky-600 rounded-2xl flex items-center justify-center shadow-xl transform hover:rotate-6 transition-transform">
                  <Crown className="h-7 w-7 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 h-4 w-4 bg-yellow-400 rounded-full border-2 border-white animate-pulse"></div>
              </div>
              <div className="hidden sm:block">
                <span className="text-2xl font-black bg-gradient-to-r from-navy-500 via-sky-500 to-sky-600 bg-clip-text text-transparent">
                  RankdSEO
                </span>
                <div className="flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-yellow-500" />
                  <span className="text-xs font-bold bg-gradient-to-r from-navy-500 to-sky-500 bg-clip-text text-transparent">Premium Platform</span>
                </div>
              </div>
            </Link>
          </div>

          <div className="flex items-center space-x-3">
            <div className="hidden md:flex items-center space-x-3 bg-gradient-to-r from-paleblue-50 to-pink-50 px-4 py-2 rounded-2xl border-2 border-navy-200">
              <Avatar className="h-10 w-10 border-3 border-white shadow-lg ring-2 ring-purple-200">
                <AvatarFallback className="bg-gradient-to-br from-navy-500 via-sky-500 to-sky-600 text-white font-bold text-lg">
                  {session.user.name?.charAt(0) || session.user.email?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="hidden lg:block">
                <p className="text-sm font-bold text-gray-800">{session.user.name}</p>
                <p className="text-xs text-gray-600">{session.user.email}</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleSignOut}
              className="border-2 border-red-200 hover:bg-red-50 hover:text-red-600 hover:border-red-400 font-semibold"
            >
              <LogOut className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content Area - Boxed on Desktop */}
      <div className="max-w-[1600px] mx-auto px-0 lg:px-6 py-0 lg:py-6">
        <div className="flex gap-6">
          {/* Sidebar - Boxed */}
          <aside
            className={`${
              isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
            } fixed lg:sticky top-[89px] left-0 z-30 w-72 h-[calc(100vh-89px)] lg:h-auto bg-white lg:rounded-3xl border-r-2 lg:border-2 border-navy-200 transition-transform lg:translate-x-0 shadow-2xl overflow-y-auto`}
          >
            <nav className="p-6 space-y-3">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link key={item.href} href={item.href}>
                    <Button
                      variant={active ? 'default' : 'ghost'}
                      className={`w-full justify-start group transition-all h-14 text-base ${
                        active
                          ? `bg-gradient-to-r ${item.gradient} text-white shadow-xl transform scale-105`
                          : 'hover:bg-gradient-to-r hover:from-paleblue-50 hover:to-pink-50 hover:scale-105'
                      }`}
                    >
                      <Icon className={`h-6 w-6 mr-3 ${active ? 'text-white' : 'text-gray-600'}`} />
                      <span className="font-semibold">{item.label}</span>
                    </Button>
                  </Link>
                );
              })}
              
              <div className="pt-6 mt-6 border-t-2 border-gray-200">
                <Link href="/settings">
                  <Button variant="ghost" className="w-full justify-start hover:bg-gradient-to-r hover:from-paleblue-50 hover:to-pink-50 h-14 text-base">
                    <Settings className="h-6 w-6 mr-3 text-gray-600" />
                    <span className="font-semibold">Settings</span>
                  </Button>
                </Link>
              </div>

              {/* Plan Badge */}
              <div className="pt-6">
                <div className="bg-gradient-to-br from-gold-400 via-gold-500 to-gold-600 p-6 rounded-2xl border-2 border-gold-300 shadow-xl">
                  <div className="flex items-center justify-between mb-3">
                    <Badge className="bg-white/90 backdrop-blur text-gold-600 border-0 font-bold text-sm px-3 py-1">
                      <Crown className="h-4 w-4 mr-1" />
                      Pro Plan
                    </Badge>
                    <Sparkles className="h-5 w-5 text-white animate-pulse" />
                  </div>
                  <p className="text-white/95 text-sm font-semibold mb-4">Unlimited access to all premium features</p>
                  <Button size="sm" variant="outline" className="w-full bg-white/20 backdrop-blur border-white/30 text-white hover:bg-white/30 font-semibold">
                    Manage Plan
                  </Button>
                </div>
              </div>
            </nav>
          </aside>

          {/* Main Content - Boxed */}
          <main className="flex-1 min-h-[calc(100vh-89px)] lg:min-h-0">
            <div className="bg-white lg:rounded-3xl border-0 lg:border-2 border-navy-200 shadow-2xl p-6 lg:p-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}