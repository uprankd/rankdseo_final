'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { LayoutDashboard, FolderOpen, Database, LogOut, Menu, X, Settings, Sparkles } from 'lucide-react';
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="text-center">
          <div className="relative">
            <div className="h-16 w-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
            <Sparkles className="h-6 w-6 text-blue-600 absolute top-5 left-1/2 transform -translate-x-1/2 animate-pulse" />
          </div>
          <p className="text-gray-600 font-medium">Loading your dashboard...</p>
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
    { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', color: 'blue' },
    { href: '/projects', icon: FolderOpen, label: 'Projects', color: 'purple' },
    { href: '/opportunities', icon: Database, label: 'Opportunities', color: 'green' },
  ];

  const isActive = (href: string) => pathname === href;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden hover:bg-blue-50"
            >
              {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            <Link href="/dashboard" className="flex items-center space-x-2">
              <div className="h-10 w-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">R</span>
              </div>
              <div className="hidden sm:block">
                <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  RankdSEO
                </span>
                <div className="flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-yellow-500" />
                  <span className="text-xs text-gray-500">Pro Platform</span>
                </div>
              </div>
            </Link>
          </div>

          <div className="flex items-center space-x-3">
            <div className="hidden md:flex items-center space-x-2 bg-gradient-to-r from-blue-50 to-purple-50 px-4 py-2 rounded-full">
              <Avatar className="h-8 w-8 border-2 border-white shadow">
                <AvatarFallback className="bg-gradient-to-br from-blue-600 to-purple-600 text-white text-sm">
                  {session.user.name?.charAt(0) || session.user.email?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="hidden lg:block">
                <p className="text-sm font-medium text-gray-700">{session.user.name}</p>
                <p className="text-xs text-gray-500">{session.user.email}</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleSignOut}
              className="border-red-200 hover:bg-red-50 hover:text-red-600 hover:border-red-300"
            >
              <LogOut className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } fixed lg:sticky top-[73px] left-0 z-30 w-64 h-[calc(100vh-73px)] bg-white/80 backdrop-blur-md border-r border-gray-200 transition-transform lg:translate-x-0 shadow-lg lg:shadow-none overflow-y-auto`}
        >
          <nav className="p-4 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={active ? 'default' : 'ghost'}
                    className={`w-full justify-start group transition-all ${
                      active
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                        : 'hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50'
                    }`}
                  >
                    <Icon className={`h-5 w-5 mr-3 ${active ? 'text-white' : `text-${item.color}-600`}`} />
                    <span className="font-medium">{item.label}</span>
                  </Button>
                </Link>
              );
            })}
            
            <div className="pt-6 mt-6 border-t border-gray-200">
              <Link href="/settings">
                <Button variant="ghost" className="w-full justify-start hover:bg-gray-50">
                  <Settings className="h-5 w-5 mr-3 text-gray-600" />
                  <span className="font-medium">Settings</span>
                </Button>
              </Link>
            </div>

            {/* Plan Badge */}
            <div className="pt-4">
              <div className="bg-gradient-to-br from-yellow-50 to-orange-50 p-4 rounded-xl border border-yellow-200">
                <div className="flex items-center justify-between mb-2">
                  <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0">
                    Pro Plan
                  </Badge>
                  <Sparkles className="h-4 w-4 text-yellow-600" />
                </div>
                <p className="text-xs text-gray-600 mb-3">Unlimited access to all features</p>
                <Button size="sm" variant="outline" className="w-full text-xs border-orange-300 hover:bg-orange-50">
                  Manage Plan
                </Button>
              </div>
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 lg:p-8 min-h-[calc(100vh-73px)]">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
