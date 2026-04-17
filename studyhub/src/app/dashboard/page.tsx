'use client';

import { useState, useEffect, useMemo } from 'react';
import { FileUp, TrendingUp, Users, BookMarked, Clock, ArrowUpRight, ShieldCheck, Sparkles, Loader2, Search, Eye, Download, Filter, BookOpen, FileText, Award, GraduationCap as QAIcon, MapPin, User as UserIcon, Check } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useCollection } from 'react-firebase-hooks/firestore';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, where } from 'firebase/firestore';
import { globalSearch, SearchCategory } from '@/app/actions/search';
import { downloadMaterial } from '@/app/actions/materials';
import { incrementDownloads } from '@/app/actions/user';
import { toast } from 'react-hot-toast';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import FileViewerModal from '@/components/FileViewerModal';

const CATEGORIES: { label: string; value: SearchCategory; icon: any }[] = [
  { label: 'Materials', value: 'MATERIALS', icon: BookOpen },
  { label: 'Q-Papers', value: 'QUESTION_PAPERS', icon: QAIcon },
  { label: 'Models', value: 'MODEL_PAPERS', icon: Award },
  { label: 'Research', value: 'RESEARCH_PAPERS', icon: FileText },
  { label: 'Accounts', value: 'ACCOUNTS', icon: UserIcon },
];

export default function DashboardPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [categories, setCategories] = useState<SearchCategory[]>((searchParams.get('c')?.split(',') as SearchCategory[]) || ['MATERIALS']);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // File Viewer State
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerData, setViewerData] = useState<{ url: string | null; name: string; mimeType: string; id?: string }>({
    url: null,
    name: '',
    mimeType: '',
  });

  // Sync with URL if it changes globally
  useEffect(() => {
    const q = searchParams.get('q');
    const c = searchParams.get('c');
    if (q !== null) setSearchTerm(q);
    if (c !== null) setCategories(c.split(',') as SearchCategory[]);
  }, [searchParams]);
  
  // Real-time activity feed from Firestore (Unified)
  // Removing orderBy to ensure data loads even if indices aren't fully propagated
  const [snapMaterials, loadingM] = useCollection(collection(db, 'material_index'));
  const [snapQuestions, loadingQ] = useCollection(collection(db, 'question_papers'));
  const [snapModels, loadingMo] = useCollection(collection(db, 'model_papers'));
  const [snapResearch, loadingR] = useCollection(collection(db, 'research_papers'));

  const loadingActivities = loadingM || loadingQ || loadingMo || loadingR;

  const activitiesList = useMemo(() => {
    const all: any[] = [
      ...(snapMaterials?.docs.map(d => {
        const data = d.data();
        return { 
          ...data, 
          id: d.id, 
          _type: 'MATERIALS',
          title: data.fileName,     // Standardize name
          subject: data.category    // Standardize category
        };
      }) || []),
      ...(snapQuestions?.docs.map(d => ({ ...d.data(), id: d.id, _type: 'QUESTION_PAPERS' })) || []),
      ...(snapModels?.docs.map(d => ({ ...d.data(), id: d.id, _type: 'MODEL_PAPERS' })) || []),
      ...(snapResearch?.docs.map(d => ({ ...d.data(), id: d.id, _type: 'RESEARCH_PAPERS' })) || []),
    ];
    
    // Robust sort handling both Firestore Timestamps and JSON dates
    return all.sort((a, b) => {
      const timeA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : new Date(a.createdAt).getTime() || 0;
      const timeB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : new Date(b.createdAt).getTime() || 0;
      return timeB - timeA;
    });
  }, [snapMaterials, snapQuestions, snapModels, snapResearch]);

  // Real-time user count (Active in last 15 mins)
  // Memoize it to avoid infinite re-renders since Date.now() changes every millisecond
  const activeUserQuery = useMemo(() => {
    const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000);
    // Round to the nearest minute to keep the query stable
    fifteenMinsAgo.setSeconds(0, 0);
    return query(collection(db, 'users'), where('lastSeen', '>=', fifteenMinsAgo));
  }, []); // Only re-calculate on mount or if we want to refresh it periodically

  const [userDocs] = useCollection(activeUserQuery);
  // Fallback to 1 (current user) if the list is empty and user is logged in
  const activeUserCount = Math.max(userDocs?.docs.length || 0, user ? 1 : 0);

  const handleSearch = async (query: string, cats: SearchCategory[]) => {
    if (!query) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const result = await globalSearch(query, cats as any, user?.uid);
      if (result.success) {
        setSearchResults(result.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      handleSearch(searchTerm, categories);
    }, 500);
    return () => clearTimeout(timeout);
  }, [searchTerm, categories]);

  const displayMaterials = searchTerm ? searchResults : activitiesList.slice(0, 5);

  const stats = [
    { label: 'Total Contributions', value: profile?.contributionCount || 0, icon: FileUp, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Login Streak', value: `${profile?.loginStreak || 0} Days`, icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: 'Library Size', value: activitiesList.length, icon: BookMarked, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { label: 'Active Users', value: activeUserCount, icon: Users, color: 'text-orange-500', bg: 'bg-orange-500/10' },
  ];

  if (authLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
      </div>
    );
  }


  const formatFileSize = (bytes: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const handleDownload = async (id: string, title: string) => {
    const toastId = toast.loading(`Preparing ${title}...`);
    try {
      const result = await downloadMaterial(id);
      const blob = new Blob([new Uint8Array(result.content)], { type: result.mimeType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', result.fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();

      // Real-time stats update: Increment the uploader's download count
      if (id) {
        const activity = activitiesList.find(d => d.id === id);
        if (activity) {
          const uploaderUid = activity.userId;
          if (uploaderUid) await incrementDownloads(uploaderUid);
        }
      }

      toast.success('Download started!', { id: toastId });
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to download file', { id: toastId });
    }
  };

  const handleOpenViewer = async (data: any) => {
    setViewerData({
      url: data.url || null,
      name: data.title || data.subject || 'Document',
      mimeType: data.mimeType || (data.url?.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg'),
      id: data.mongodbId || data.id
    });
    setViewerOpen(true);

    // If it's a MongoDB material and doesn't have a URL, fetch it
    if (!data.url && data._type === 'MATERIALS') {
      try {
        const result = await downloadMaterial(data.id);
        const blob = new Blob([new Uint8Array(result.content)], { type: result.mimeType });
        const url = window.URL.createObjectURL(blob);
        setViewerData(prev => ({ ...prev, url, mimeType: result.mimeType }));
      } catch (err) {
        toast.error('Failed to load preview');
        setViewerOpen(false);
      }
    }
  };

  // Calculate Trust Score based on downloads
  // Starts after 10 downloads, 10% per 10 downloads.
  const totalDownloads = profile?.totalDownloads || 0;
  const trustScore = totalDownloads < 10 ? 0 : Math.min(100, Math.floor(totalDownloads));
  
  // Levels: L1:100, L2:500, L3:1000, L4:1500, L5:2000
  const calculateLevel = (d: number) => {
    if (d >= 2000) return 5;
    if (d >= 1500) return 4;
    if (d >= 1000) return 3;
    if (d >= 500) return 2;
    if (d >= 100) return 1;
    return 0;
  };
  const currentLevel = calculateLevel(totalDownloads);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-black text-primary uppercase tracking-[0.2em] animate-pulse">
              Live Campus Feed
            </span>
          </div>
          <h2 className="text-4xl font-black font-outfit text-foreground leading-none">
            Welcome, {user?.displayName?.split(' ')[0] || 'Learner'}! <Wave />
          </h2>
          <p className="text-muted-foreground mt-3 font-medium">
            {profile?.college || 'Join your college community to start sharing.'}
          </p>
        </div>
        
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="glass bg-card group rounded-3xl p-6 transition-all hover:scale-[1.02] hover:shadow-2xl hover:shadow-primary/5 cursor-default relative overflow-hidden border border-border">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
               <stat.icon className="h-16 w-16 text-foreground" />
            </div>
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className={`p-3 rounded-2xl ${stat.bg} border border-border`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
            </div>
            <div className="relative z-10">
              <p className="text-4xl font-black text-foreground mb-1 font-outfit tracking-tighter">{stat.value}</p>
              <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 glass bg-card rounded-[2.5rem] p-8 md:p-10 border border-border relative overflow-hidden flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 relative z-10">
            <div>
              <h3 className="text-2xl font-black font-outfit text-foreground">{searchTerm ? 'Search Results' : 'Recent Activity'}</h3>
              <p className="text-xs text-muted-foreground font-medium mt-1">Updates from your campus library</p>
            </div>
          </div>
          
          <div className="flex flex-col gap-4 relative z-10 flex-1">
            {loadingActivities || isSearching ? (
              [1, 2, 3].map(i => <div key={i} className="h-20 w-full animate-pulse bg-secondary rounded-2xl" />)
            ) : displayMaterials.length ? (
              displayMaterials.map((data: any) => (
                (data._type === 'ACCOUNTS' || (!searchTerm && categories.includes('ACCOUNTS'))) && data.id ? (
                  <Link href={`/dashboard/profile/${data.id}`} key={data.id} className="group flex items-center justify-between p-4 rounded-[2rem] bg-secondary/50 hover:bg-primary/5 transition-all border border-transparent hover:border-primary/20 gap-4">
                    <div className="flex items-center gap-4">
                      <div className="h-14 w-14 shrink-0 rounded-[1.2rem] border border-border overflow-hidden bg-background">
                         {data.avatarUrl ? <img src={data.avatarUrl} className="h-full w-full object-cover" /> : <UserIcon className="h-6 w-6 m-4 text-muted-foreground" />}
                      </div>
                      <div>
                        <h4 className="font-bold text-foreground group-hover:text-primary transition-colors text-lg">{data.name}</h4>
                        <div className="flex items-center gap-2 mt-0.5">
                           <MapPin className="h-3 w-3 text-primary" />
                           <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">{data.college || 'Universal Campus'}</span>
                        </div>
                      </div>
                    </div>
                    <ArrowUpRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
                  </Link>
                ) : (
                  <div key={data.id || Math.random()} className="group flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-[2rem] bg-secondary/50 hover:bg-secondary transition-all border border-transparent hover:border-border gap-4">
                    <div className="flex items-center gap-4">
                      <div className="h-14 w-14 shrink-0 rounded-2xl bg-background border border-border flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform text-muted-foreground group-hover:text-primary transition-colors">
                        {data._type === 'MATERIALS' ? <BookOpen /> : data._type === 'RESEARCH_PAPERS' ? <FileText /> : data._type === 'ACCOUNTS' ? <UserIcon /> : <Award />}
                      </div>
                      <div>
                        <h4 className="font-bold text-foreground group-hover:text-primary transition-colors text-lg line-clamp-1">{data.title || data.subject}</h4>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest bg-background px-2 py-0.5 rounded border border-border">{data.code || data.subjectCode || 'RES'}</span>
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">
                            {data.createdAt?.seconds ? new Date(data.createdAt.seconds * 1000).toLocaleDateString() : 'Shared recently'} • {data.uploader || data.journal || 'Global Academic'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button 
                        onClick={() => handleOpenViewer(data)}
                        className="h-10 px-4 rounded-xl bg-background border border-border text-foreground text-xs font-bold hover:bg-muted transition-colors flex items-center gap-2"
                      >
                        <Eye className="h-4 w-4" /> View
                      </button>
                      <button 
                        onClick={() => handleDownload(data.mongodbId || data.id, data.title || data.subject)}
                        className="h-10 px-4 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/90 transition-colors flex items-center gap-2 shadow-lg shadow-primary/20"
                      >
                        <Download className="h-4 w-4" /> DL
                      </button>
                    </div>
                  </div>
                )
              ))
            ) : (
              <div className="py-12 text-center border-2 border-dashed border-border rounded-[2rem] bg-secondary/30 text-muted-foreground">
                <Search className="h-10 w-10 mx-auto mb-4 opacity-50" />
                <p className="font-medium">No results found for your search in {categories.map(c => c.toLowerCase().replace('_', ' ')).join(' & ')}.</p>
              </div>
            )}
          </div>
        </div>

        <div className="glass bg-card rounded-[2.5rem] p-10 bg-gradient-to-br from-secondary/50 to-primary/5 border border-border flex flex-col">
          <div className="flex items-center gap-3 mb-8">
            <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center">
               <ShieldCheck className="h-5 w-5 text-primary" />
            </div>
            <h3 className="text-xl font-black font-outfit text-foreground">Trust Score</h3>
          </div>
          
          <div className="flex-1 flex flex-col items-center justify-center text-center -mt-4">
             <div className="relative h-48 w-48 flex items-center justify-center mb-8 drop-shadow-xl">
                <svg className="h-full w-full rotate-[-90deg]">
                   <circle cx="96" cy="96" r="80" className="stroke-secondary fill-none" strokeWidth="16" />
                   <circle 
                    cx="96" 
                    cy="96" 
                    r="80" 
                    className="stroke-primary fill-none transition-all duration-1000" 
                    strokeWidth="16" 
                    strokeDasharray="502" 
                    strokeDashoffset={502 - (502 * (trustScore / 100))} 
                    strokeLinecap="round" 
                   />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                   <p className="text-5xl font-black text-foreground font-outfit">{trustScore}%</p>
                   <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest mt-1">Level {currentLevel}</p>
                </div>
             </div>
             <p className="text-sm font-medium text-muted-foreground leading-relaxed">
               {totalDownloads < 10 
                 ? `Share quality materials to earn your first 10 downloads and start your Trust Score!`
                 : `Your materials have been downloaded ${totalDownloads} times! You are currently Level ${currentLevel}.`
               }
             </p>
          </div>

          <button className="mt-8 w-full h-14 rounded-2xl bg-foreground text-background font-bold shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all">
             View Leaderboard
          </button>
        </div>
      </div>

      <FileViewerModal
        isOpen={viewerOpen}
        onClose={() => {
          if (viewerData.url?.startsWith('blob:')) window.URL.revokeObjectURL(viewerData.url);
          setViewerOpen(false);
        }}
        fileUrl={viewerData.url}
        fileName={viewerData.name}
        mimeType={viewerData.mimeType}
        onDownload={() => handleDownload(viewerData.id!, viewerData.name)}
      />
    </div>
  );
}

const Wave = () => (
  <span className="inline-block animate-bounce origin-[70%_70%]">
    👋
  </span>
);
