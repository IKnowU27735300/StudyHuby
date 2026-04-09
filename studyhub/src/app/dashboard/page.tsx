'use client';

import { useState } from 'react';
import { FileUp, TrendingUp, Users, BookMarked, Clock, ArrowUpRight, ShieldCheck, Sparkles, Loader2, Search, Eye, Download } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useCollection } from 'react-firebase-hooks/firestore';
import { db } from '@/lib/firebase';
import { collection, query, orderBy } from 'firebase/firestore';

export default function DashboardPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  
  // Real-time activity feed from Firestore
  // Fetch all to allow local search filtering, real-world apps might use Algolia or server search
  const [activities, loadingActivities] = useCollection(
    query(collection(db, 'materials'), orderBy('createdAt', 'desc'))
  );

  const stats = [
    { label: 'Total Contributions', value: profile?.contributionCount || 0, icon: FileUp, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Login Streak', value: `${profile?.loginStreak || 0} Days`, icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: 'Library Size', value: '0', icon: BookMarked, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { label: 'Active Users', value: '0', icon: Users, color: 'text-orange-500', bg: 'bg-orange-500/10' },
  ];

  if (authLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
      </div>
    );
  }

  const materialsList = activities?.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) })) || [];
  const displayMaterials = searchTerm
    ? materialsList.filter(m => 
        m.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        m.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.subjectCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.subject?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : materialsList.slice(0, 5);

  const formatFileSize = (bytes: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

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
        
        <div className="flex items-center gap-4">
          <div className="glass px-6 py-3 rounded-2xl border border-border flex items-center gap-4">
            <div className="text-right">
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Global Rank</p>
              <p className="text-foreground font-black font-outfit">0</p>
            </div>
            <div className="h-8 w-[1px] bg-border" />
            <div className="text-right">
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Points</p>
              <p className="text-primary font-black font-outfit">0</p>
            </div>
          </div>
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
              <span className="text-emerald-500 text-[10px] font-black flex items-center gap-1 bg-emerald-500/10 px-2.5 py-1.5 rounded-xl border border-emerald-500/20">
                <ArrowUpRight className="h-3 w-3" /> 0%
              </span>
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
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-muted-foreground" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search documents..."
                className="h-10 pl-10 pr-4 rounded-xl bg-secondary border border-border text-xs font-medium focus:outline-none focus:border-primary transition-colors"
              />
            </div>
          </div>
          
          <div className="flex flex-col gap-4 relative z-10">
            {loadingActivities ? (
              [1, 2, 3].map(i => <div key={i} className="h-20 w-full animate-pulse bg-secondary rounded-2xl" />)
            ) : displayMaterials.length ? (
              displayMaterials.map((data: any) => (
                <div key={data.id} className="group flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-[2rem] bg-secondary/50 hover:bg-secondary transition-all border border-transparent hover:border-border gap-4">
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 shrink-0 rounded-2xl bg-background border border-border flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                      <Clock className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div>
                      <h4 className="font-bold text-foreground group-hover:text-primary transition-colors text-lg line-clamp-1">{data.title}</h4>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest bg-background px-2 py-0.5 rounded border border-border">{data.code || data.subjectCode}</span>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">
                          {data.createdAt ? new Date(data.createdAt.seconds * 1000).toLocaleDateString() : 'Just now'} • {data.uploader}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button 
                      onClick={() => window.open(data.url, '_blank')}
                      className="h-10 px-4 rounded-xl bg-background border border-border text-foreground text-xs font-bold hover:bg-muted transition-colors flex items-center gap-2"
                    >
                      <Eye className="h-4 w-4" /> View
                    </button>
                    <button 
                      onClick={() => window.open(data.url, '_blank')}
                      className="h-10 px-4 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/90 transition-colors flex items-center gap-2 shadow-lg shadow-primary/20"
                    >
                      <Download className="h-4 w-4" /> DL
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center border-2 border-dashed border-border rounded-[2rem] bg-secondary/30 text-muted-foreground">
                <Search className="h-10 w-10 mx-auto mb-4 opacity-50" />
                <p className="font-medium">No documents found.</p>
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
                   <circle cx="96" cy="96" r="80" className="stroke-primary fill-none transition-all duration-1000" strokeWidth="16" strokeDasharray="502" strokeDashoffset={502} strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                   <p className="text-5xl font-black text-foreground font-outfit">0</p>
                   <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest mt-1">Level 0</p>
                </div>
             </div>
             <p className="text-sm font-medium text-muted-foreground leading-relaxed">
               Your contributions have helped <span className="text-foreground font-bold">0 students</span>. Keep it up to unlock the "Master Contributor" badge!
             </p>
          </div>

          <button className="mt-8 w-full h-14 rounded-2xl bg-foreground text-background font-bold shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all">
             View Leaderboard
          </button>
        </div>
      </div>
    </div>
  );
}

const Wave = () => (
  <span className="inline-block animate-bounce origin-[70%_70%]">
    👋
  </span>
);
