'use client';

import { BookOpen, FileText, LayoutDashboard, GraduationCap, Settings, LogOut, ChevronRight, Share2, Flame, Award, Loader2, Users } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { usePathname } from 'next/navigation';
import { useSidebar } from '@/context/SidebarContext';
import { Menu, ChevronLeft } from 'lucide-react';

const navItems = [
  { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Study Materials', href: '/dashboard/materials', icon: BookOpen },
  { name: 'Research Papers', href: '/dashboard/papers', icon: FileText },
  { name: 'Question Papers', href: '/dashboard/question-papers', icon: GraduationCap },
  { name: 'Model Papers', href: '/dashboard/model-papers', icon: Award },
];

export default function Sidebar() {
  const { profile, logout, loading } = useAuth();
  const { isCollapsed, toggleSidebar } = useSidebar();
  const pathname = usePathname();

  return (
    <aside className={`fixed left-0 top-0 hidden h-screen ${isCollapsed ? 'w-20' : 'w-72'} flex-col gap-6 border-r border-border bg-card p-4 lg:flex z-40 transition-all duration-300 overflow-hidden`}>
      <Link href="/dashboard" className={`flex items-center hover:opacity-80 transition-opacity ${isCollapsed ? 'justify-center' : 'gap-3 px-2'}`}>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-500 shadow-lg shadow-green-500/20">
          <span className="text-xl font-black text-white">SH</span>
        </div>
        {!isCollapsed && <h1 className="text-2xl font-bold tracking-tight text-foreground font-outfit whitespace-nowrap">StudyHub</h1>}
      </Link>

      <div className="flex-1 overflow-y-auto mt-4 px-2">
        <nav className="flex flex-col gap-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                title={isCollapsed ? item.name : undefined}
                className={`group flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} rounded-xl px-4 py-3 transition-all ${
                  isActive 
                  ? 'bg-primary/10 text-primary border border-primary/20' 
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <item.icon className={`h-5 w-5 shrink-0 ${isActive ? 'text-primary' : ''}`} />
                  {!isCollapsed && <span className="font-medium whitespace-nowrap">{item.name}</span>}
                </div>
                {!isCollapsed && <ChevronRight className={`h-4 w-4 transition-all ${isActive ? 'opacity-100 translate-x-1' : 'opacity-0'}`} />}
              </Link>
            );
          })}
        </nav>
      </div>

      {!isCollapsed && (
        <div className="rounded-2xl bg-secondary p-4 border border-border relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 opacity-5 group-hover:scale-110 transition-transform">
            <Flame className="h-20 w-20 text-foreground" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <Flame className="h-5 w-5 text-orange-500 animate-pulse" />
              <span className="text-sm font-semibold text-foreground">
                {loading ? '...' : `${profile?.loginStreak || 0} Day Streak!`}
              </span>
            </div>
            <div className="h-1.5 w-full bg-border rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-orange-400 to-red-500 rounded-full transition-all duration-1000" 
                style={{ width: `${Math.min(((profile?.loginStreak || 1) / 30) * 100, 100)}%` }}
              />
            </div>
            <p className="text-[10px] text-muted-foreground mt-2 uppercase tracking-tighter font-bold">Log in tomorrow!</p>
          </div>
        </div>
      )}

      <div className="border-t border-border pt-4 flex flex-col gap-2">
        <Link 
          href="/dashboard/settings"
          title={isCollapsed ? 'Settings' : undefined}
          className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} rounded-xl px-4 py-3 text-muted-foreground transition-all hover:bg-secondary hover:text-foreground`}
        >
          <Settings className="h-5 w-5 shrink-0" />
          {!isCollapsed && <span className="font-medium text-sm whitespace-nowrap">Settings</span>}
        </Link>
      </div>
    </aside>
  );
}
