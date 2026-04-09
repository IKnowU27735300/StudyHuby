'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, Bell, User, ChevronDown, LogIn, LogOut, Settings, Menu, ChevronLeft } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useSidebar } from '@/context/SidebarContext';
import Link from 'next/link';

export default function TopBar() {
  const { user, profile, loginWithGoogle, logout, loading } = useAuth();
  const { isCollapsed, toggleSidebar } = useSidebar();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown if clicked outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef]);

  return (
    <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-border bg-background/80 px-8 backdrop-blur-md transition-colors">
      <div className="flex items-center gap-6 flex-1 max-w-xl">
        <button 
          onClick={toggleSidebar}
          className="hidden lg:flex items-center justify-center h-11 w-11 rounded-2xl bg-secondary border border-border text-muted-foreground hover:text-foreground hover:border-primary/50 transition-all"
        >
          {isCollapsed ? <Menu className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </button>
        <div className="relative group flex-1">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
          <input
            type="text"
            placeholder="Search study materials, papers..."
            className="h-11 w-full rounded-2xl bg-secondary pl-11 pr-4 text-sm text-foreground border border-border focus:border-primary/50 focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-6">
        <button className="relative rounded-xl p-2.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
          <Bell className="h-5 w-5" />
          <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-rose-500 border-2 border-background" />
        </button>

        {user ? (
          <div className="relative" ref={dropdownRef}>
            <div 
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-3 pl-4 border-l border-border group cursor-pointer"
            >
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-foreground">{user.displayName || 'Learner'}</p>
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">
                  {profile?.course ? `${profile.course} · Sem ${profile.semester}` : 'Completing Profile...'}
                </p>
              </div>
              <div className="relative h-10 w-10 rounded-xl bg-gradient-to-tr from-primary to-purple-500 p-[2px] shadow-lg shadow-primary/20 transition-transform group-hover:scale-105">
                <div className="h-full w-full rounded-[10px] bg-card flex items-center justify-center overflow-hidden">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="Avatar" className="h-full w-full object-cover" />
                  ) : (
                    <User className="h-6 w-6 text-foreground" />
                  )}
                </div>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            </div>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <div className="absolute right-0 mt-3 w-56 origin-top-right rounded-2xl bg-card border border-border shadow-2xl p-2 z-50">
                <div className="px-3 py-2 border-b border-border mb-2">
                  <p className="text-sm font-medium text-foreground truncate">{user.displayName}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </div>
                
                <Link 
                  href="/dashboard/settings" 
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                >
                  <Settings className="h-4 w-4" />
                  Profile & Settings
                </Link>
                
                <button 
                  onClick={() => {
                    setDropdownOpen(false);
                    logout();
                  }}
                  className="flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-rose-500 hover:bg-rose-500/10 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Logout Session
                </button>
              </div>
            )}
          </div>
        ) : (
          <button 
            onClick={() => loginWithGoogle()}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
          >
            <LogIn className="h-4 w-4" />
            Sign In with Google
          </button>
        )}
      </div>
    </header>
  );
}
