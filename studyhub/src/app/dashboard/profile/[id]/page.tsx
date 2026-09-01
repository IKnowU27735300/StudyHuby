'use client';

import { useState, useEffect, use } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getUserById } from '@/app/actions/user';
import { getUserContributions } from '@/app/actions/search';
import { toggleFollow } from '@/app/actions/follow';
import { downloadMaterial } from '@/app/actions/materials';
import { 
  User as UserIcon, MapPin, GraduationCap, Mail, 
  Calendar, BookOpen, FileText, Award, GraduationCap as QAIcon,
  Loader2, Check, UserPlus, FileUp, Download, Eye
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import FileViewerModal from '@/components/FileViewerModal';

interface UserData {
  id: string;
  firebaseUid?: string;
  name?: string | null;
  email?: string;
  avatarUrl?: string | null;
  college?: string | null;
  course?: string | null;
  role?: string;
  loginStreak?: number;
  createdAt: Date | string;
}

interface ContributionsData {
  materials: any[];
  research: any[];
  questions: any[];
  models: any[];
}

export default function UserProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user: currentUser, profile: currentProfile } = useAuth();
  
  const [user, setUser] = useState<UserData | null>(null);
  const [contributions, setContributions] = useState<ContributionsData>({
    materials: [],
    research: [],
    questions: [],
    models: []
  });
  const [followerCount, setFollowerCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);
  const [togglingFollow, setTogglingFollow] = useState(false);

  // File Viewer Modal State
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerData, setViewerData] = useState<{ url: string | null; name: string; mimeType: string; id?: string }>({
    url: null,
    name: '',
    mimeType: '',
  });

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const uResult = await getUserById(id);
      const cResult = await getUserContributions(id);
      
      if (uResult.success && uResult.user) {
        setUser(uResult.user as UserData);
        
        // Fetch follower count & follow state from Firestore
        if (uResult.user.firebaseUid) {
          const targetDocRef = doc(db, 'users', uResult.user.firebaseUid);
          const targetDoc = await getDoc(targetDocRef);
          if (targetDoc.exists()) {
            const data = targetDoc.data();
            const followers: string[] = data.followers || [];
            setFollowerCount(followers.length);
            if (currentUser?.uid) {
              setFollowing(followers.includes(currentUser.uid));
            }
          }
        }
      }

      if (cResult.success && cResult.contributions) {
        setContributions(cResult.contributions);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load profile';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!currentUser) return toast.error('Please login first');
    setTogglingFollow(true);
    try {
      const result = await toggleFollow(currentUser.uid, currentUser.displayName || 'A student', id);
      if (result.success) {
        const isNowFollowing = !!result.isFollowing;
        setFollowing(isNowFollowing);
        setFollowerCount(prev => isNowFollowing ? prev + 1 : Math.max(0, prev - 1));
        toast.success(isNowFollowing ? 'Following student' : 'Unfollowed student');
      } else {
        toast.error(result.error || 'Failed to update follow status');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      toast.error(message);
    } finally {
      setTogglingFollow(false);
    }
  };

  const handleDownloadItem = async (item: any, type: string) => {
    const toastId = toast.loading('Preparing download...');
    try {
      if (item.fileUrl) {
        window.open(item.fileUrl, '_blank');
        toast.dismiss(toastId);
        return;
      }
      if (type === 'Study Material') {
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
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Download failed';
      toast.error(message, { id: toastId });
    }
  };

  const handleOpenViewer = async (item: any, type: string) => {
    setViewerData({
      url: item.fileUrl || null,
      name: item.title || item.subject || 'Document',
      mimeType: item.mimeType || (item.fileUrl?.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg'),
      id: item.id
    });
    setViewerOpen(true);

    if (!item.fileUrl && type === 'Study Material') {
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

  if (loading) return (
    <div className="h-[70vh] flex items-center justify-center">
      <Loader2 className="h-10 w-10 text-primary animate-spin" />
    </div>
  );

  if (!user) return (
    <div className="py-20 text-center">
      <h3 className="text-2xl font-bold">User Not Found</h3>
    </div>
  );

  const totalContributions = 
    (contributions.materials?.length || 0) + 
    (contributions.research?.length || 0) + 
    (contributions.questions?.length || 0) + 
    (contributions.models?.length || 0);

  return (
    <div className="flex flex-col gap-8">
      {/* Profile Header */}
      <div className="relative">
         <div className="h-48 w-full rounded-[3rem] bg-gradient-to-r from-primary/20 via-purple-500/20 to-blue-500/20 border border-border overflow-hidden">
            <div className="absolute inset-0 bg-grid-white/5 opacity-20" />
         </div>
         
         <div className="px-8 md:px-12 -mt-16 relative z-10 flex flex-col md:flex-row items-end gap-6">
            <div className="h-32 w-32 rounded-[2.5rem] border-8 border-background bg-card shadow-2xl overflow-hidden">
               {user.avatarUrl ? (
                 <img src={user.avatarUrl} alt={user.name || 'User'} className="h-full w-full object-cover" />
               ) : (
                 <div className="h-full w-full flex items-center justify-center bg-secondary">
                    <UserIcon className="h-12 w-12 text-muted-foreground" />
                 </div>
               )}
            </div>
            
            <div className="flex-1 pb-2">
               <div className="flex flex-wrap items-center gap-4">
                  <h2 className="text-4xl font-black font-outfit text-foreground">{user.name || 'Anonymous Learner'}</h2>
                  <span className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-black text-primary uppercase tracking-widest">
                     {user.role || 'USER'}
                  </span>
               </div>
               <div className="flex flex-wrap items-center gap-6 mt-3">
                  <div className="flex items-center gap-2 text-muted-foreground font-medium text-sm">
                     <MapPin className="h-4 w-4 text-primary" />
                     {user.college || 'Universal Campus'}
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground font-medium text-sm">
                     <Calendar className="h-4 w-4 text-primary" />
                     Joined {new Date(user.createdAt).toLocaleDateString()}
                  </div>
               </div>
            </div>

            <div className="pb-2 w-full md:w-auto">
               <button 
                onClick={handleFollow}
                disabled={togglingFollow || currentUser?.uid === user.firebaseUid}
                className={`w-full md:w-48 h-14 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-xl active:scale-95 disabled:opacity-50 ${following ? 'bg-secondary text-foreground hover:bg-muted border border-border' : 'bg-primary text-white hover:bg-primary/90 shadow-primary/20'}`}
               >
                  {togglingFollow ? <Loader2 className="h-5 w-5 animate-spin" /> : following ? <><Check className="h-5 w-5" /> Following</> : <><UserPlus className="h-5 w-5" /> Follow Student</>}
               </button>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
         {/* Sidebar stats */}
         <div className="lg:col-span-1 space-y-6">
            <div className="glass bg-card rounded-[2rem] p-8 border border-border">
               <h4 className="text-sm font-black text-muted-foreground uppercase tracking-widest mb-6">Contact Info</h4>
               <div className="space-y-4">
                  <div className="flex items-center gap-3">
                     <Mail className="h-4 w-4 text-primary" />
                     <span className="text-xs font-semibold text-foreground truncate">{user.email}</span>
                  </div>
                  <div className="flex items-center gap-3">
                     <GraduationCap className="h-4 w-4 text-primary" />
                     <span className="text-xs font-semibold text-foreground">{user.course || 'Undergraduate'}</span>
                  </div>
               </div>
            </div>

            <div className="glass bg-card rounded-[2rem] p-8 border border-border">
               <h4 className="text-sm font-black text-muted-foreground uppercase tracking-widest mb-6">Activity Stats</h4>
               <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-secondary/50 border border-border text-center">
                     <p className="text-2xl font-black text-foreground font-outfit">{totalContributions}</p>
                     <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">Uploads</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-secondary/50 border border-border text-center">
                     <p className="text-2xl font-black text-foreground font-outfit">{followerCount}</p>
                     <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">Followers</p>
                  </div>
               </div>
            </div>
         </div>

         {/* Contributions Main Area */}
         <div className="lg:col-span-3 space-y-8">
            <div className="flex items-center justify-between">
               <h3 className="text-2xl font-black font-outfit text-foreground flex items-center gap-3">
                  <FileUp className="h-6 w-6 text-primary" />
                  Shared Resources
               </h3>
               <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{totalContributions} Total</span>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               {/* Materials */}
               {contributions.materials?.map((item: any) => (
                  <ContributionCard 
                    key={item.id} 
                    item={item} 
                    icon={BookOpen} 
                    type="Study Material" 
                    onView={() => handleOpenViewer(item, 'Study Material')}
                    onDownload={() => handleDownloadItem(item, 'Study Material')}
                  />
               ))}
               {/* Research */}
               {contributions.research?.map((item: any) => (
                  <ContributionCard 
                    key={item.id} 
                    item={item} 
                    icon={FileText} 
                    type="Research Paper" 
                    onView={() => handleOpenViewer(item, 'Research Paper')}
                    onDownload={() => handleDownloadItem(item, 'Research Paper')}
                  />
               ))}
               {/* Questions */}
               {contributions.questions?.map((item: any) => (
                  <ContributionCard 
                    key={item.id} 
                    item={item} 
                    icon={QAIcon} 
                    type="Question Paper" 
                    onView={() => handleOpenViewer(item, 'Question Paper')}
                    onDownload={() => handleDownloadItem(item, 'Question Paper')}
                  />
               ))}
               {/* Models */}
               {contributions.models?.map((item: any) => (
                  <ContributionCard 
                    key={item.id} 
                    item={item} 
                    icon={Award} 
                    type="Model Paper" 
                    onView={() => handleOpenViewer(item, 'Model Paper')}
                    onDownload={() => handleDownloadItem(item, 'Model Paper')}
                  />
               ))}

               {totalContributions === 0 && (
                  <div className="col-span-full py-20 text-center glass rounded-[3rem] border border-border bg-card/50">
                     <p className="text-muted-foreground font-medium">This student hasn&apos;t contributed any resources yet.</p>
                  </div>
               )}
            </div>
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
        onDownload={() => handleDownloadItem(viewerData, 'Viewed Item')}
      />
    </div>
  );
}

function ContributionCard({ 
  item, 
  icon: Icon, 
  type,
  onView,
  onDownload
}: { 
  item: any; 
  icon: any; 
  type: string;
  onView: () => void;
  onDownload: () => void;
}) {
   return (
      <div className="glass group rounded-[2rem] p-6 border border-border hover:border-primary/30 transition-all bg-card/50 flex flex-col gap-4">
         <div className="flex justify-between items-start">
            <div className="p-3 rounded-2xl bg-primary/10 text-primary border border-primary/20">
               <Icon className="h-5 w-5" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-2 py-1 bg-muted rounded">
               {item.year || item.subjectCode || item.publicationYear || 'ARCHIVE'}
            </span>
         </div>
         <div>
            <h4 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2">{item.title || item.subject}</h4>
            <div className="flex items-center gap-2 mt-2">
               <span className="text-[10px] font-bold text-primary uppercase tracking-tighter bg-primary/5 px-2 py-0.5 rounded border border-primary/10">
                  {type}
               </span>
               <span className="text-[10px] font-bold text-muted-foreground uppercase">{item.college || item.journal || 'Public Resource'}</span>
            </div>
         </div>
         <div className="pt-4 mt-auto border-t border-border/50 flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted-foreground uppercase">{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Recent'}</span>
            <div className="flex items-center gap-2">
               <button onClick={onView} className="p-2 rounded-lg bg-secondary hover:bg-muted text-foreground transition-colors" title="View Preview">
                  <Eye className="h-3.5 w-3.5" />
               </button>
               <button onClick={onDownload} className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
                  <Download className="h-3.5 w-3.5" /> Download
               </button>
            </div>
         </div>
      </div>
   );
}

