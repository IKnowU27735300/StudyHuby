'use client';

import { useState, useEffect } from 'react';
import { Search, User as UserIcon, GraduationCap, Mail, MapPin, Filter, BookOpen, FileText, Award, Layers, Eye, Download } from 'lucide-react';
import { globalSearch, SearchCategory } from '@/app/actions/search';
import { downloadMaterial } from '@/app/actions/materials';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import FileViewerModal from '@/components/FileViewerModal';

const CATEGORIES: { label: string; value: SearchCategory; icon: React.ComponentType<{ className?: string }> }[] = [
  { label: 'Study Materials', value: 'MATERIALS', icon: BookOpen },
  { label: 'Question Papers', value: 'QUESTION_PAPERS', icon: GraduationCap },
  { label: 'Model Papers', value: 'MODEL_PAPERS', icon: Award },
  { label: 'Research Papers', value: 'RESEARCH_PAPERS', icon: FileText },
  { label: 'Accounts', value: 'ACCOUNTS', icon: UserIcon },
];

interface DiscoveryResult {
  id: string;
  name?: string;
  email?: string;
  avatarUrl?: string | null;
  college?: string | null;
  course?: string | null;
  title?: string;
  subject?: string;
  subjectCode?: string;
  year?: number | string;
  publicationYear?: number;
  fileUrl?: string;
  mimeType?: string;
  createdAt: Date | string;
  _type: SearchCategory;
}

export default function DiscoveryPage() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState<SearchCategory>('MATERIALS');
  const [results, setResults] = useState<DiscoveryResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // File Viewer Modal State
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerData, setViewerData] = useState<{ url: string | null; name: string; mimeType: string; id?: string }>({
    url: null,
    name: '',
    mimeType: '',
  });

  useEffect(() => {
    handleSearch(searchTerm, category, user?.uid);
  }, [category, user?.uid]);

  const handleSearch = async (query: string, cat: SearchCategory, uid?: string) => {
    setLoading(true);
    try {
      const result = await globalSearch(query, [cat], uid);
      if (result.success && result.data) {
        setResults(result.data as DiscoveryResult[]);
      } else {
        toast.error('Search failed');
      }
    } catch {
      toast.error('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      handleSearch(searchTerm, category, user?.uid);
    }, 400);
    return () => clearTimeout(timeout);
  }, [searchTerm]);

  const handleOpenViewer = async (item: DiscoveryResult) => {
    const name = item.title || item.subject || 'Document';
    const mimeType = item.mimeType || (item.fileUrl?.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg');

    setViewerData({
      url: item.fileUrl || null,
      name,
      mimeType,
      id: item.id
    });
    setViewerOpen(true);

    if (!item.fileUrl && category === 'MATERIALS') {
      try {
        const result = await downloadMaterial(item.id);
        const blob = new Blob([new Uint8Array(result.content)], { type: result.mimeType });
        const url = window.URL.createObjectURL(blob);
        setViewerData(prev => ({ ...prev, url, mimeType: result.mimeType }));
      } catch {
        toast.error('Failed to load preview');
        setViewerOpen(false);
      }
    }
  };

  const handleDownload = async (item: DiscoveryResult) => {
    const toastId = toast.loading('Preparing download...');
    try {
      if (item.fileUrl) {
        window.open(item.fileUrl, '_blank');
        toast.dismiss(toastId);
        return;
      }
      if (category === 'MATERIALS') {
        const result = await downloadMaterial(item.id);
        const blob = new Blob([new Uint8Array(result.content)], { type: result.mimeType });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = item.title || item.subject || 'document';
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      }
      toast.success('Download started!', { id: toastId });
    } catch {
      toast.error('Download failed', { id: toastId });
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black font-outfit text-foreground tracking-tight">Discovery Hub</h2>
          <p className="text-muted-foreground mt-1 font-medium">Find materials, papers, or connect with peers.</p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-muted-foreground" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={`Search ${category.toLowerCase().replace('_', ' ')}...`}
              className="w-full h-14 rounded-2xl bg-card border border-border pl-12 pr-4 text-sm font-medium focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-lg shadow-black/5 text-foreground"
            />
          </div>
          
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`h-14 px-6 rounded-2xl border flex items-center gap-2 font-bold transition-all shadow-lg ${showFilters ? 'bg-primary text-white border-primary' : 'bg-card text-foreground border-border hover:bg-muted'}`}
          >
            <Filter className="h-5 w-5" />
            <span className="hidden sm:inline">Filter</span>
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="glass p-2 rounded-3xl border border-border flex flex-wrap gap-2 animate-in fade-in slide-in-from-top-4 duration-300">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => {
                setCategory(cat.value);
              }}
              className={`flex-1 min-w-[150px] flex items-center justify-center gap-3 py-4 rounded-2xl font-bold text-sm transition-all ${category === cat.value ? 'bg-primary text-white shadow-xl shadow-primary/20 scale-[1.02]' : 'bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground'}`}
            >
              <cat.icon className="h-5 w-5" />
              {cat.label}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="py-24 flex justify-center">
          <div className="relative h-16 w-16">
            <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
            <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          </div>
        </div>
      ) : results.length === 0 ? (
        <div className="py-24 text-center glass rounded-[3rem] border border-border bg-card/50">
          <div className="h-20 w-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6 opacity-50">
            <Layers className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="text-2xl font-bold text-foreground mb-2">Nothing found here</h3>
          <p className="text-muted-foreground max-w-xs mx-auto font-medium">Try adjusting your search terms or picking a different category filter.</p>
        </div>
      ) : category === 'ACCOUNTS' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {results.map((targetUser) => (
            <div key={targetUser.id} className="glass group rounded-[2.5rem] overflow-hidden flex flex-col transition-all hover:scale-[1.03] hover:shadow-2xl border border-border bg-card relative">
              <div className="p-8 pb-6 flex flex-col items-center text-center">
                <div className="relative mb-6">
                  <div className="h-24 w-24 rounded-full border-4 border-background overflow-hidden relative z-10 shadow-xl group-hover:border-primary/50 transition-colors">
                    {targetUser.avatarUrl ? (
                      <img src={targetUser.avatarUrl} alt={targetUser.name || 'User'} className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full bg-secondary flex items-center justify-center">
                        <UserIcon className="h-10 w-10 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                </div>

                <h3 className="text-xl font-bold text-foreground mb-1 group-hover:text-primary transition-colors line-clamp-1">{targetUser.name || 'Anonymous User'}</h3>
                <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-6">College Student</p>

                <div className="w-full space-y-4 pt-6 border-t border-border">
                  <div className="flex items-center gap-3 text-left">
                    <MapPin className="h-4 w-4 text-primary shrink-0" />
                    <p className="text-xs font-semibold text-foreground line-clamp-1">{targetUser.college || 'Universal Campus'}</p>
                  </div>
                  <div className="flex items-center gap-3 text-left">
                    <Mail className="h-4 w-4 text-primary shrink-0" />
                    <p className="text-xs font-semibold text-foreground line-clamp-1 truncate">{targetUser.email}</p>
                  </div>
                </div>
              </div>
              
              <div className="p-4 bg-secondary/30 mt-auto border-t border-border">
                <Link 
                  href={`/dashboard/profile/${targetUser.id}`}
                  className="w-full h-12 rounded-xl bg-primary text-white text-xs font-bold flex items-center justify-center gap-2 hover:bg-primary/90 transition-all shadow-lg shadow-primary/10"
                >
                  View Profile & Contributions
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {results.map((item) => (
             <div key={item.id} className="glass group rounded-[2rem] p-6 border border-border hover:border-primary/30 transition-all bg-card/50 flex flex-col gap-4">
                <div className="flex justify-between items-start">
                   <div className="p-3 rounded-2xl bg-primary/10 text-primary border border-primary/20">
                      {category === 'MATERIALS' ? <BookOpen className="h-5 w-5" /> : category === 'RESEARCH_PAPERS' ? <FileText className="h-5 w-5" /> : <Award className="h-5 w-5" />}
                   </div>
                   <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-2 py-1 bg-muted rounded">
                      {item.year || item.subjectCode || item.publicationYear || 'ARCHIVE'}
                   </span>
                </div>
                <div>
                   <h4 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2">{item.title || item.subject}</h4>
                   <p className="text-xs text-muted-foreground font-medium mt-1 uppercase tracking-tighter">
                      {item.college || item.subjectCode || 'Global Archive'}
                   </p>
                </div>
                <div className="pt-4 mt-auto border-t border-border/50 flex items-center justify-between">
                   <span className="text-[10px] font-bold text-muted-foreground uppercase">{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Recent'}</span>
                   <div className="flex items-center gap-2">
                     <button onClick={() => handleOpenViewer(item)} className="p-2 rounded-lg bg-secondary hover:bg-muted text-foreground transition-colors" title="Quick Preview">
                        <Eye className="h-3.5 w-3.5" />
                     </button>
                     <button onClick={() => handleDownload(item)} className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
                        <Download className="h-3.5 w-3.5" /> Download
                     </button>
                   </div>
                </div>
             </div>
          ))}
        </div>
      )}

      <FileViewerModal
        isOpen={viewerOpen}
        onClose={() => {
          if (viewerData.url?.startsWith('blob:')) window.URL.revokeObjectURL(viewerData.url);
          setViewerOpen(false);
        }}
        fileUrl={viewerData.url}
        fileName={viewerData.name}
        mimeType={viewerData.mimeType}
        onDownload={() => {
          if (viewerData.url) window.open(viewerData.url, '_blank');
        }}
      />
    </div>
  );
}

