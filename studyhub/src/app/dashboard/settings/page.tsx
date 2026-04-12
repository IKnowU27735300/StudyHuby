'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from 'next-themes';
import { db, storage } from '@/lib/firebase';
import { doc, updateDoc, collection, query, where, deleteDoc, setDoc, increment, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useCollection } from 'react-firebase-hooks/firestore';
import { updateProfile } from 'firebase/auth';
import { Monitor, Moon, Sun, Save, User, HardDrive, FileText, BookOpen, GraduationCap, Award, Trash2, Camera, Loader2, Users, UserPlus } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getUsersByFirebaseUids, incrementContribution, decrementContribution } from '@/app/actions/user';
import { deleteMaterial } from '@/app/actions/materials';
import Link from 'next/link';

export default function SettingsPage() {
  const { user, profile } = useAuth();
  
  // Storage Refresh trigger
  const [storageRefresh, setStorageRefresh] = useState(0);

  const handleDeleteMaterial = async (mongodbId: string, title: string) => {
    if (!user) return;
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) return;
    
    const tid = toast.loading('Deleting material...');
    try {
      // 1. Delete from MongoDB & update Prisma via server
      await deleteMaterial(mongodbId, user.uid);
      
      // 2. Clean up from Firestore index (Client has permissions)
      const q = query(collection(db, 'material_index'), where('mongodbId', '==', mongodbId));
      const snap = await getDocs(q);
      await Promise.all(snap.docs.map(d => deleteDoc(d.ref)));

      // 3. Decrement Firestore count
      await setDoc(doc(db, 'users', user.uid), {
        contributionCount: increment(-1)
      }, { merge: true });

      toast.success('Deleted successfully', { id: tid });
    } catch (err: any) {
      toast.error(err.message || 'Deletion failed', { id: tid });
    }
  };

  const handleGenericDelete = async (collectionName: string, docId: string, title: string) => {
    if (!user) return;
    if (!window.confirm(`Are you sure you want to delete this resource?`)) return;

    const tid = toast.loading('Removing archive...');
    try {
      // 1. Delete from Firestore
      await deleteDoc(doc(db, collectionName, docId));
      
      // 2. Decrement contribution count in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        contributionCount: increment(-1)
      }, { merge: true });

      // 3. Decrement in MongoDB (Papers in MongoDB are handled by Prisma relation Cascades if storage URLs change, but for now we focus on sync)
      await decrementContribution(user.uid); 

      toast.success('Removed from vault', { id: tid });
    } catch (err: any) {
      toast.error(err.message || 'Deletion failed', { id: tid });
    }
  };
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = (newTheme: string, e: React.MouseEvent) => {
    // @ts-ignore
    if (!document.startViewTransition || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setTheme(newTheme);
      return;
    }

    const x = e.clientX;
    const y = e.clientY;
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    document.documentElement.classList.add('view-transitioning');

    // @ts-ignore
    const transition = document.startViewTransition(async () => {
      setTheme(newTheme);
      // Wait for next-themes to apply class to html
      await new Promise(resolve => setTimeout(resolve, 50));
    });

    transition.ready.then(() => {
      const clipPath = [
        `circle(0px at ${x}px ${y}px)`,
        `circle(${endRadius}px at ${x}px ${y}px)`,
      ];
      
      document.documentElement.animate(
        {
          clipPath: newTheme === "dark" ? clipPath : [...clipPath].reverse(),
        },
        {
          duration: 700,
          easing: "cubic-bezier(0.4, 0, 0.2, 1)",
          pseudoElement: newTheme === "dark" ? "::view-transition-new(root)" : "::view-transition-old(root)",
        }
      );
    });

    transition.finished.finally(() => {
      document.documentElement.classList.remove('view-transitioning');
    });
  };

  // User List Modal State
  const [showUserModal, setShowUserModal] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalUsers, setModalUsers] = useState<any[]>([]);
  const [modalLoading, setModalLoading] = useState(false);

  const handleOpenUserList = async (title: string, uids: string[]) => {
    setModalTitle(title);
    setModalUsers([]);
    setShowUserModal(true);
    setModalLoading(true);
    
    try {
      if (uids.length === 0) {
        setModalUsers([]);
        return;
      }
      const result = await getUsersByFirebaseUids(uids);
      if (result.success) {
        setModalUsers(result.users || []);
      }
    } catch (error) {
      toast.error(`Failed to load ${title.toLowerCase()}`);
    } finally {
      setModalLoading(false);
    }
  };
  
  // Name Change State
  const [name, setName] = useState('');
  const [savingName, setSavingName] = useState(false);
  
  // Photo Upload State
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize name from profile
  useEffect(() => {
    if (user?.displayName) setName(user.displayName);
  }, [user]);

  const handleUpdateName = async () => {
    if (!user || !name.trim()) return;
    setSavingName(true);
    try {
      await updateProfile(user, { displayName: name });
      await updateDoc(doc(db, 'users', user.uid), { name });
      toast.success('Username updated successfully!');
    } catch (error) {
      toast.error('Failed to update username.');
    } finally {
      setSavingName(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file.');
      return;
    }

    setUploadingPhoto(true);
    const toastId = toast.loading('Uploading profile video/photo...');
    
    try {
      const storageRef = ref(storage, `avatars/${user.uid}/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      
      await updateProfile(user, { photoURL: url });
      await updateDoc(doc(db, 'users', user.uid), { photoURL: url });
      
      toast.success('Profile photo updated!', { id: toastId });
    } catch (error) {
      console.error(error);
      toast.error('Failed to upload photo.', { id: toastId });
    } finally {
      setUploadingPhoto(false);
      // reset file input
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Real-time tracking for the Storage Vault counters
  const qMaterials = useMemo(() => 
    user ? query(collection(db, 'material_index'), where('userId', '==', user.uid)) : null
  , [user?.uid]);
  
  const qPapers = useMemo(() => 
    user ? query(collection(db, 'research_papers'), where('userId', '==', user.uid)) : null
  , [user?.uid]);

  const qQuestions = useMemo(() => 
    user ? query(collection(db, 'question_papers'), where('userId', '==', user.uid)) : null
  , [user?.uid]);

  const qModels = useMemo(() => 
    user ? query(collection(db, 'model_papers'), where('userId', '==', user.uid)) : null
  , [user?.uid]);

  const [snapMaterials, loadingMaterials] = useCollection(qMaterials);
  const [snapPapers, loadingPapers] = useCollection(qPapers);
  const [snapQuestions, loadingQuestions] = useCollection(qQuestions);
  const [snapModels, loadingModels] = useCollection(qModels);

  const counts = useMemo(() => ({
    materials: snapMaterials?.size ?? 0,
    papers: snapPapers?.size ?? 0,
    questions: snapQuestions?.size ?? 0,
    models: snapModels?.size ?? 0,
  }), [snapMaterials, snapPapers, snapQuestions, snapModels]);

  // Calculate aggregate storage size
  const totalSizeBytes = useMemo(() => {
    let sum = 0;
    snapMaterials?.docs.forEach(d => sum += (d.data().size || 0));
    snapPapers?.docs.forEach(d => sum += (d.data().size || 0));
    snapQuestions?.docs.forEach(d => sum += (d.data().size || 0));
    snapModels?.docs.forEach(d => sum += (d.data().size || 0));
    return sum;
  }, [snapMaterials, snapPapers, snapQuestions, snapModels]);

  const MAX_STORAGE = 500 * 1024 * 1024; // 500 MB quota
  const storagePercentage = Math.min((totalSizeBytes / MAX_STORAGE) * 100, 100);

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const isVaultLoading = loadingMaterials || loadingPapers || loadingQuestions || loadingModels;
  const totalFiles = counts.materials + counts.papers + counts.questions + counts.models;

  // Use profile contribution count as a fallback if the live count hasn't loaded yet
  const displayedTotal = totalFiles > 0 ? totalFiles : (profile?.contributionCount || 0);

  return (
    <div className="flex flex-col gap-8 max-w-4xl">
      <div>
        <h2 className="text-3xl font-bold font-outfit text-foreground">Settings & Profile</h2>
        <p className="text-muted-foreground mt-1">Manage your account preferences and uploaded resources.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Appearance Settings */}
        <div className="glass rounded-[2rem] p-8 border border-border">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Monitor className="h-5 w-5 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-foreground">Appearance</h3>
          </div>
          
          <div className="flex bg-secondary p-1.5 rounded-2xl border border-border/50">
            <button
              onClick={(e) => toggleTheme('light', e)}
              className={`flex-1 flex items-center justify-center gap-2 h-12 rounded-xl text-sm font-bold transition-all ${mounted && theme === 'light' ? 'bg-white shadow-lg text-slate-950' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <Sun className="h-4 w-4" /> Light
            </button>
            <button
              onClick={(e) => toggleTheme('dark', e)}
              className={`flex-1 flex items-center justify-center gap-2 h-12 rounded-xl text-sm font-bold transition-all ${mounted && theme === 'dark' ? 'bg-slate-800 shadow-lg text-white' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <Moon className="h-4 w-4" /> Dark
            </button>
          </div>
        </div>

        {/* Profile Settings */}
        <div className="glass rounded-[2rem] p-8 border border-border">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
              <User className="h-5 w-5 text-purple-500" />
            </div>
            <h3 className="text-xl font-bold text-foreground">User Profile</h3>
          </div>
          
          <div className="flex flex-col gap-6">
            
            {/* Avatar Section */}
            <div className="flex items-center gap-4">
              <div className="relative h-16 w-16 rounded-2xl bg-gradient-to-tr from-primary to-purple-500 p-[2px] shadow-lg shadow-purple-500/20">
                <div className="h-full w-full rounded-[14px] bg-card flex items-center justify-center overflow-hidden">
                  {uploadingPhoto ? (
                    <Loader2 className="h-6 w-6 text-primary animate-spin" />
                  ) : user?.photoURL ? (
                    <img src={user.photoURL} alt="Avatar" className="h-full w-full object-cover" />
                  ) : (
                    <User className="h-8 w-8 text-muted-foreground" />
                  )}
                </div>
              </div>
              <div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handlePhotoUpload} 
                  accept="image/*" 
                  className="hidden" 
                />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingPhoto}
                  className="flex items-center gap-2 h-10 px-4 rounded-xl bg-secondary text-foreground text-sm font-bold border border-border hover:bg-secondary/50 transition-colors disabled:opacity-50"
                >
                  <Camera className="h-4 w-4" />
                  Change Photo
                </button>
                <p className="text-xs text-muted-foreground mt-1.5 ml-1">JPG, PNG or GIF. Max 5MB.</p>
              </div>
            </div>

            <div className="h-px w-full bg-border/50"></div>

            <div>
              <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-2">Display Name</label>
              <div className="flex gap-3 mt-2">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="flex-1 h-12 rounded-xl bg-transparent border border-border px-4 text-foreground focus:border-purple-500 focus:outline-none focus:ring-4 focus:ring-purple-500/10 transition-all font-medium"
                />
                <button
                  onClick={handleUpdateName}
                  disabled={savingName || name === user?.displayName}
                  className="h-12 px-6 rounded-xl bg-purple-600 text-white font-bold flex items-center gap-2 shadow-lg shadow-purple-500/20 disabled:opacity-50 hover:bg-purple-700 transition-colors"
                >
                  {savingName ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save
                </button>
              </div>
            </div>

            {/* Social Stats */}
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => handleOpenUserList('Followers', profile?.followers || [])}
                className="bg-secondary/50 rounded-2xl p-4 border border-border/50 flex items-center gap-4 group hover:bg-secondary transition-all"
              >
                <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Users className="h-5 w-5 text-blue-500" />
                </div>
                <div className="text-left">
                  <p className="text-xl font-black text-foreground">{profile?.followers?.length || 0}</p>
                  <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Followers</p>
                </div>
              </button>
              <button 
                onClick={() => handleOpenUserList('Following', profile?.following || [])}
                className="bg-secondary/50 rounded-2xl p-4 border border-border/50 flex items-center gap-4 group hover:bg-secondary transition-all"
              >
                <div className="h-10 w-10 rounded-xl bg-orange-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <UserPlus className="h-5 w-5 text-orange-500" />
                </div>
                <div className="text-left">
                  <p className="text-xl font-black text-foreground">{profile?.following?.length || 0}</p>
                  <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Following</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {showUserModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md glass bg-card rounded-[2.5rem] border border-border shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
             <div className="p-6 border-b border-border flex justify-between items-center bg-secondary/30">
                <h4 className="text-xl font-black font-outfit text-foreground uppercase tracking-widest">{modalTitle}</h4>
                <button onClick={() => setShowUserModal(false)} className="h-8 w-8 rounded-full bg-secondary hover:bg-muted flex items-center justify-center transition-colors">
                   <Trash2 className="h-4 w-4 text-muted-foreground" />
                </button>
             </div>
             <div className="max-h-[60vh] overflow-y-auto p-4 flex flex-col gap-3">
                {modalLoading ? (
                  <div className="py-12 flex flex-col items-center justify-center gap-4">
                     <Loader2 className="h-8 w-8 text-primary animate-spin" />
                     <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Fetching Network...</p>
                  </div>
                ) : modalUsers.length > 0 ? (
                  modalUsers.map(u => (
                    <Link href={`/dashboard/profile/${u.id}`} key={u.id} className="flex items-center justify-between p-4 rounded-2xl bg-secondary/50 hover:bg-primary/5 border border-transparent hover:border-primary/20 transition-all group">
                       <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-xl border border-border overflow-hidden bg-background">
                             {u.avatarUrl ? <img src={u.avatarUrl} className="h-full w-full object-cover" /> : <User className="h-6 w-6 m-3 text-muted-foreground" />}
                          </div>
                          <div>
                             <p className="font-bold text-foreground group-hover:text-primary transition-colors">{u.name}</p>
                             <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">{u.college || 'Universal Campus'}</p>
                          </div>
                       </div>
                    </Link>
                  ))
                ) : (
                  <div className="py-12 text-center text-muted-foreground">
                     <Users className="h-12 w-12 mx-auto mb-4 opacity-10" />
                     <p className="text-sm font-medium italic">No one found here yet.</p>
                  </div>
                )}
             </div>
          </div>
        </div>
      )}

      {/* Storage & Uploads */}
      <div className="glass rounded-[2.5rem] p-8 md:p-10 border border-border">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-orange-500/10 flex items-center justify-center">
              <HardDrive className="h-6 w-6 text-orange-500" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-foreground font-outfit">My Storage Vault</h3>
              <p className="text-sm font-medium text-muted-foreground mt-1">
                {isVaultLoading ? 'Calculating archive size...' : `You have uploaded ${displayedTotal} resources across all categories.`}
              </p>
            </div>
          </div>
          
          {/* Storage Usage Indicator */}
          {!isVaultLoading && (
            <div className="flex flex-col items-end gap-2 min-w-[180px]">
              <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                <span>Occupied: <span className="text-foreground">{formatSize(totalSizeBytes)}</span></span>
                <span className="opacity-30">/</span>
                <span>Total: <span className="text-foreground">{formatSize(MAX_STORAGE)}</span></span>
              </div>
              <div className="w-full h-2.5 bg-secondary rounded-full overflow-hidden border border-border/50 relative">
                 <div 
                   className="absolute inset-y-0 left-0 bg-gradient-to-r from-orange-500 to-amber-400 transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(249,115,22,0.3)]"
                   style={{ width: `${storagePercentage}%` }}
                 />
              </div>
              <span className="text-[10px] font-black italic text-orange-500/80">
                {storagePercentage.toFixed(1)}% of your secure vault utilized
              </span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Materials */}
          <div className="p-6 rounded-3xl border border-border/50 bg-secondary/50 hover:bg-secondary transition-colors">
            <div className="flex items-center gap-3 mb-6">
              <BookOpen className="h-5 w-5 text-blue-500" />
              <h4 className="font-bold text-foreground">Study Materials ({isVaultLoading ? '...' : counts.materials})</h4>
            </div>
            {snapMaterials?.empty ? (
              <p className="text-sm text-muted-foreground italic">No study materials uploaded yet.</p>
            ) : (
              <div className="space-y-3">
                {snapMaterials?.docs.map(snap => {
                  const data = snap.data();
                  return (
                    <div key={snap.id} className="flex items-center justify-between text-sm py-2 border-b border-border/50 last:border-0 text-foreground">
                      <span className="truncate pr-4">{data.fileName}</span>
                      <button 
                        onClick={() => handleDeleteMaterial(data.mongodbId, data.fileName)}
                        className="text-rose-500 hover:scale-110 transition-transform"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Research Papers */}
          <div className="p-6 rounded-3xl border border-border/50 bg-secondary/50 hover:bg-secondary transition-colors">
            <div className="flex items-center gap-3 mb-6">
              <FileText className="h-5 w-5 text-purple-500" />
              <h4 className="font-bold text-foreground">Research Papers ({isVaultLoading ? '...' : counts.papers})</h4>
            </div>
            {snapPapers?.empty ? (
              <p className="text-sm text-muted-foreground italic">No research papers uploaded yet.</p>
            ) : (
              <div className="space-y-3">
                {snapPapers?.docs.map(snap => (
                  <div key={snap.id} className="flex items-center justify-between text-sm py-2 border-b border-border/50 last:border-0 text-foreground">
                    <span className="truncate pr-4">{snap.data().title}</span>
                    <button 
                      onClick={() => handleGenericDelete('research_papers', snap.id, snap.data().title)}
                      className="text-rose-500 hover:scale-110 transition-transform"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Question Papers */}
          <div className="p-6 rounded-3xl border border-border/50 bg-secondary/50 hover:bg-secondary transition-colors">
            <div className="flex items-center gap-3 mb-6">
              <GraduationCap className="h-5 w-5 text-orange-500" />
              <h4 className="font-bold text-foreground">Question Papers ({isVaultLoading ? '...' : counts.questions})</h4>
            </div>
            {snapQuestions?.empty ? (
              <p className="text-sm text-muted-foreground italic">No question papers uploaded yet.</p>
            ) : (
              <div className="space-y-3">
                {snapQuestions?.docs.map(snap => (
                  <div key={snap.id} className="flex items-center justify-between text-sm py-2 border-b border-border/50 last:border-0 text-foreground">
                    <span className="truncate pr-4">{snap.data().code} - {snap.data().year}</span>
                    <button 
                      onClick={() => handleGenericDelete('question_papers', snap.id, snap.data().subject)}
                      className="text-rose-500 hover:scale-110 transition-transform"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Model Papers */}
          <div className="p-6 rounded-3xl border border-border/50 bg-secondary/50 hover:bg-secondary transition-colors">
            <div className="flex items-center gap-3 mb-6">
              <Award className="h-5 w-5 text-emerald-500" />
              <h4 className="font-bold text-foreground">Model Papers ({isVaultLoading ? '...' : counts.models})</h4>
            </div>
            {snapModels?.empty ? (
              <p className="text-sm text-muted-foreground italic">No model papers uploaded yet.</p>
            ) : (
              <div className="space-y-3">
                {snapModels?.docs.map(snap => (
                  <div key={snap.id} className="flex items-center justify-between text-sm py-2 border-b border-border/50 last:border-0 text-foreground">
                    <span className="truncate pr-4">{snap.data().title}</span>
                    <button 
                      onClick={() => handleGenericDelete('model_papers', snap.id, snap.data().subject)}
                      className="text-rose-500 hover:scale-110 transition-transform"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
