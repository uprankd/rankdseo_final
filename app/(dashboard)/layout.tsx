'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { LayoutDashboard, FolderOpen, Database, LogOut, Menu, X, Settings, Sparkles, Crown, Shield, TrendingUp, Users, Tag, BarChart3, FileText, Eye, ClipboardList, Flag, HelpCircle, Headphones, HardDrive, Mail } from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';
import { trpc } from '@/lib/api/client';
import { AlertTriangle } from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const isDemoUser = session?.user?.email === 'demo@rankdseo.com';
  const isAdmin = session?.user?.role === 'ADMIN';

  const { data: subStatus } = trpc.opportunity.getSubscriptionStatus.useQuery(undefined, {
    enabled: status === 'authenticated' && !isDemoUser,
    refetchInterval: 5 * 60 * 1000, // recheck every 5 min
  });

  const isExpired = subStatus?.expired === true && !isAdmin && !isDemoUser;
  const isOnSettingsPage = pathname === '/settings';

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/signin');
    }
    // Redirect demo user away from non-opportunity pages
    if (isDemoUser && pathname !== '/opportunities' && !pathname?.startsWith('/opportunities/') && pathname !== '/activity-log') {
      router.push('/opportunities');
    }
  }, [status, router, isDemoUser, pathname]);

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

  const allNavItems = [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', gradient: 'from-blue-500 to-cyan-500' },
    { href: '/projects', icon: FolderOpen, label: 'Projects', gradient: 'from-navy-500 to-sky-500' },
    { href: '/opportunities', icon: Database, label: 'Opportunities', gradient: 'from-green-500 to-teal-500' },
    { href: '/analytics', icon: TrendingUp, label: 'Analytics', gradient: 'from-gold-500 to-yellow-500' },
    { href: '/activity-log', icon: ClipboardList, label: 'Activity Log', gradient: 'from-teal-500 to-cyan-500' },
    ...(session?.user?.role === 'ADMIN' ? [
      { href: '/admin', icon: Shield, label: 'Admin Panel', gradient: 'from-red-500 to-gold-500' },
      { href: '/admin/statistics', icon: BarChart3, label: 'Statistics', gradient: 'from-blue-500 to-indigo-500' },
      { href: '/admin/users', icon: Users, label: 'Manage Users', gradient: 'from-purple-500 to-pink-500' },
      { href: '/admin/invoices', icon: FileText, label: 'Invoices', gradient: 'from-green-500 to-emerald-500' },
      { href: '/admin/coupons', icon: Tag, label: 'Coupons', gradient: 'from-orange-500 to-red-500' },
      { href: '/admin/unpaid-users', icon: Mail, label: 'Unpaid Users', gradient: 'from-orange-500 to-amber-500' },
      { href: '/admin/activity-log', icon: ClipboardList, label: 'Manage Log', gradient: 'from-teal-500 to-cyan-500' },
      { href: '/admin/reports', icon: Flag, label: 'Reports', gradient: 'from-red-500 to-pink-500' },
      { href: '/admin/help', icon: Headphones, label: 'Help Desk', gradient: 'from-violet-500 to-purple-500' },
      { href: '/admin/backups', icon: HardDrive, label: 'Backups', gradient: 'from-slate-500 to-zinc-500' }
    ] : []),
  ];

  // Demo user only sees Opportunities and Activity Log
  const navItems = isDemoUser 
    ? allNavItems.filter(item => item.href === '/opportunities' || item.href === '/activity-log')
    : allNavItems;

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
              <img src="/logo.png" alt="RankdSEO" className="h-24 w-auto" />
            </Link>
          </div>

          <div className="flex items-center space-x-3">
            {isDemoUser ? (
              <>
                <Badge className="bg-sky-100 text-sky-700 border-sky-200 font-semibold px-3 py-1" data-testid="demo-badge">
                  <Eye className="h-3 w-3 mr-1" />
                  Preview Mode
                </Badge>
                <Link href="/signup">
                  <Button size="sm" className="bg-gradient-to-r from-navy-500 to-sky-500 hover:from-purple-700 hover:to-sky-600 shadow-lg font-semibold" data-testid="demo-signup-btn">
                    <Sparkles className="h-4 w-4 mr-2" />
                    Sign Up for Full Access
                  </Button>
                </Link>
              </>
            ) : (
              <>
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
              </>
            )}
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
            } fixed lg:sticky top-[89px] lg:top-[105px] left-0 z-30 w-72 h-[calc(100vh-89px)] lg:h-[calc(100vh-120px)] lg:shrink-0 bg-white lg:rounded-3xl border-r-2 lg:border-2 border-navy-200 transition-transform lg:translate-x-0 shadow-2xl overflow-y-auto`}
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
              
              {!isDemoUser && (
                <div className="pt-6 mt-6 border-t-2 border-gray-200">
                  <Link href="/settings">
                    <Button variant="ghost" className="w-full justify-start hover:bg-gradient-to-r hover:from-paleblue-50 hover:to-pink-50 h-14 text-base">
                      <Settings className="h-6 w-6 mr-3 text-gray-600" />
                      <span className="font-semibold">Settings</span>
                    </Button>
                  </Link>
                  <Link href="/help">
                    <Button variant={pathname === '/help' ? 'default' : 'ghost'} className={`w-full justify-start h-14 text-base ${pathname === '/help' ? 'bg-gradient-to-r from-violet-500 to-purple-500 text-white shadow-xl transform scale-105' : 'hover:bg-gradient-to-r hover:from-paleblue-50 hover:to-pink-50 hover:scale-105'}`} data-testid="sidebar-help-btn">
                      <HelpCircle className={`h-6 w-6 mr-3 ${pathname === '/help' ? 'text-white' : 'text-gray-600'}`} />
                      <span className="font-semibold">Help</span>
                    </Button>
                  </Link>
                </div>
              )}

              {/* Plan Badge */}
              {isDemoUser ? (
                <div className="pt-6">
                  <div className="bg-gradient-to-br from-sky-400 via-sky-500 to-blue-600 p-6 rounded-2xl border-2 border-sky-300 shadow-xl">
                    <div className="flex items-center justify-between mb-3">
                      <Badge className="bg-white/90 backdrop-blur text-sky-600 border-0 font-bold text-sm px-3 py-1">
                        <Eye className="h-4 w-4 mr-1" />
                        Preview
                      </Badge>
                    </div>
                    <p className="text-white/95 text-sm font-semibold mb-4">Sign up to unlock all 1300+ opportunities</p>
                    <Link href="/signup">
                      <Button size="sm" variant="outline" className="w-full bg-white/20 backdrop-blur border-white/30 text-white hover:bg-white/30 font-semibold" data-testid="demo-sidebar-signup-btn">
                        Get Full Access
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : isExpired ? (
                <div className="pt-6">
                  <div className="bg-gradient-to-br from-red-400 via-red-500 to-red-600 p-6 rounded-2xl border-2 border-red-300 shadow-xl">
                    <div className="flex items-center justify-between mb-3">
                      <Badge className="bg-white/90 backdrop-blur text-red-600 border-0 font-bold text-sm px-3 py-1">
                        <AlertTriangle className="h-4 w-4 mr-1" />
                        Expired
                      </Badge>
                    </div>
                    <p className="text-white/95 text-sm font-semibold mb-4">Your membership has expired</p>
                    <Link href="/settings?tab=subscription">
                      <Button size="sm" variant="outline" className="w-full bg-white/20 backdrop-blur border-white/30 text-white hover:bg-white/30 font-semibold" data-testid="sidebar-renew-btn">
                        Renew Now
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : (
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
              )}
            </nav>
          </aside>

          {/* Main Content - Boxed */}
          <main className="flex-1 min-h-[calc(100vh-89px)] lg:min-h-0">
            <div className="bg-white lg:rounded-3xl border-0 lg:border-2 border-navy-200 shadow-2xl p-6 lg:p-8">
              {isExpired && !isOnSettingsPage ? (
                <div className="flex flex-col items-center justify-center py-20 text-center" data-testid="subscription-expired-block">
                  <div className="h-20 w-20 rounded-full bg-red-100 flex items-center justify-center mb-6">
                    <AlertTriangle className="h-10 w-10 text-red-500" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Membership Has Expired</h2>
                  <p className="text-gray-600 mb-1">
                    Your <strong>{subStatus?.plan || 'subscription'}</strong> expired on{' '}
                    <strong>{subStatus?.expiresAt ? new Date(subStatus.expiresAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}</strong>.
                  </p>
                  <p className="text-gray-500 text-sm mb-8">Go to Settings to choose a new plan and renew your membership.</p>
                  <div className="flex gap-3">
                    <Link href="/settings?tab=subscription">
                      <Button className="bg-gradient-to-r from-navy-600 to-sky-500 text-white font-semibold px-8" data-testid="renew-membership-btn">
                        Renew Membership
                      </Button>
                    </Link>
                    <Button variant="outline" onClick={handleSignOut} data-testid="expired-signout-btn">
                      Sign Out
                    </Button>
                  </div>
                </div>
              ) : children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}