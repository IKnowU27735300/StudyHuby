'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, Bell, User, ChevronDown, LogIn, LogOut, Settings, Menu, ChevronLeft, Loader2, Check, Filter, BookOpen, Code2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useSidebar } from '@/context/SidebarContext';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, updateDoc, doc, limit } from 'firebase/firestore';
import { useCollection } from 'react-firebase-hooks/firestore';
import { FileText, Award, GraduationCap as QAIcon, User as UserIcon } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export type SearchCategory = 'MATERIALS' | 'QUESTION_PAPERS' | 'MODEL_PAPERS' | 'RESEARCH_PAPERS' | 'ACCOUNTS';

const CATEGORIES: { label: string; value: SearchCategory; icon: any }[] = [
  { label: 'Study Material', value: 'MATERIALS', icon: BookOpen },
  { label: 'Question Paper', value: 'QUESTION_PAPERS', icon: QAIcon },
  { label: 'Model Paper', value: 'MODEL_PAPERS', icon: Award },
  { label: 'Research Paper', value: 'RESEARCH_PAPERS', icon: FileText },
  { label: 'Accounts', value: 'ACCOUNTS', icon: UserIcon },
];

export default function TopBar() {
  const { user, profile, loginWithGoogle, logout, loading } = useAuth();
  const { isCollapsed, toggleSidebar } = useSidebar();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [categories, setCategories] = useState<SearchCategory[]>((searchParams.get('c')?.split(',') as SearchCategory[]) || ['MATERIALS']);
  const [searchValue, setSearchValue] = useState(searchParams.get('q') || '');
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);

  // Sync search to URL
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (searchValue !== searchParams.get('q') || categories.join(',') !== searchParams.get('c')) {
        const params = new URLSearchParams();
        if (searchValue) params.set('q', searchValue);
        if (categories.length > 0) params.set('c', categories.join(','));
        router.push(`/dashboard?${params.toString()}`);
      }
    }, 500);
    return () => clearTimeout(timeout);
  }, [searchValue, categories]);

  const toggleCategory = (cat: SearchCategory) => {
    setCategories(prev => 
      prev.includes(cat) 
        ? (prev.length > 1 ? prev.filter(c => c !== cat) : prev) 
        : [...prev, cat]
    );
  };

  const [notifValue] = useCollection(
    user ? query(
      collection(db, 'notifications'),
      where('userId', 'in', [user.uid, 'GLOBAL_ALERTS']),
      orderBy('createdAt', 'desc'),
      limit(15)
    ) : null
  );

  const notifications = notifValue?.docs.map(doc => ({ id: doc.id, ...doc.data() } as any)) || [];
  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllAsRead = async () => {
    if (!user) return;
    notifications.forEach(async (n) => {
      if (!n.read) {
        await updateDoc(doc(db, 'notifications', n.id), { read: true });
      }
    });
  };

  // Close dropdown if clicked outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotifOpen(false);
      }
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setFilterOpen(false);
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
        <div className="flex items-center gap-2 flex-1">
          <div className="relative group flex-1">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
            <input
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder={`Search ${categories.map(c => c.toLowerCase().replace('_', ' ')).join(', ')}...`}
              className="h-11 w-full rounded-2xl bg-secondary pl-11 pr-4 text-sm text-foreground border border-border focus:border-primary/50 focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all"
            />
          </div>
          <div className="relative" ref={filterRef}>
            <button 
              onClick={() => setFilterOpen(!filterOpen)}
              className={`h-11 px-4 rounded-2xl border flex items-center gap-2 text-xs font-bold transition-all ${filterOpen ? 'bg-primary text-white border-primary' : 'bg-secondary text-muted-foreground border-border hover:bg-muted'}`}
            >
              <Filter className="h-4 w-4" />
              <span className="hidden sm:inline">Filter</span>
            </button>
            
            {filterOpen && (
              <div className="absolute top-full left-0 mt-3 w-56 glass bg-card border border-border rounded-2xl shadow-2xl z-50 p-2 animate-in fade-in zoom-in-95 duration-200">
                <p className="px-3 py-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Select Category</p>
                <div className="flex flex-col gap-1">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.value}
                      onClick={() => toggleCategory(cat.value)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${categories.includes(cat.value) ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`h-4 w-4 rounded border flex items-center justify-center transition-colors ${categories.includes(cat.value) ? 'bg-primary border-primary' : 'border-border'}`}>
                           {categories.includes(cat.value) && <Check className="h-3 w-3 text-white" />}
                        </div>
                        {cat.label}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <a 
          href="https://github.com/IKnowU27735300?tab=repositories" 
          target="_blank" 
          rel="noopener noreferrer"
          className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary border border-border text-muted-foreground hover:text-foreground hover:border-primary/50 transition-all text-xs font-bold"
        >
          <Code2 className="h-4 w-4" />
          Contribute
        </a>
        <div className="relative" ref={notifRef}>
          <button 
            onClick={() => {
              setNotifOpen(!notifOpen);
              if (!notifOpen) markAllAsRead();
            }}
            className="relative rounded-xl p-2.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute right-2 top-2 h-4 w-4 rounded-full bg-rose-500 border-2 border-background text-[10px] font-black text-white flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 mt-3 w-80 origin-top-right rounded-2xl bg-card border border-border shadow-2xl z-50 overflow-hidden flex flex-col">
               <div className="p-4 border-b border-border flex justify-between items-center bg-secondary/50">
                  <h4 className="text-sm font-black font-outfit uppercase tracking-widest px-1">Notifications</h4>
                  <span className="text-[10px] font-bold text-muted-foreground">{notifications.length} Recent</span>
               </div>
               <div className="max-h-[400px] overflow-y-auto">
                  {notifications.length > 0 ? (
                    notifications.map((n) => (
                      <div key={n.id} className={`p-4 border-b border-border/50 flex gap-4 transition-colors hover:bg-secondary/30 ${!n.read && n.userId !== 'GLOBAL_ALERTS' ? 'bg-primary/5' : ''}`}>
                         <div className={`h-10 w-10 shrink-0 rounded-xl flex items-center justify-center ${n.type === 'FOLLOW' ? 'bg-blue-500/10 text-blue-500' : 'bg-primary/10 text-primary'}`}>
                            {n.type === 'FOLLOW' ? <User className="h-5 w-5" /> : <BookOpen className="h-5 w-5" />}
                         </div>
                         <div className="flex-1">
                            <p className="text-xs font-semibold text-foreground leading-snug">{n.message}</p>
                            <p className="text-[10px] text-muted-foreground font-medium mt-1">
                               {n.createdAt?.seconds ? new Date(n.createdAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                            </p>
                         </div>
                         {!n.read && <div className="h-2 w-2 rounded-full bg-primary mt-2" />}
                      </div>
                    ))
                  ) : (
                    <div className="p-12 text-center text-muted-foreground">
                       <Bell className="h-8 w-8 mx-auto mb-3 opacity-20" />
                       <p className="text-xs font-medium">All caught up!</p>
                    </div>
                  )}
               </div>
               <div className="p-3 bg-secondary/30 text-center">
                  <button className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline">View All Alerts</button>
               </div>
            </div>
          )}
        </div>

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
