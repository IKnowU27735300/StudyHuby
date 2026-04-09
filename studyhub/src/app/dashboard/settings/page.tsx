'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from 'next-themes';
import { db, storage } from '@/lib/firebase';
import { doc, updateDoc, collection, query, where } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useCollection } from 'react-firebase-hooks/firestore';
import { updateProfile } from 'firebase/auth';
import { Monitor, Moon, Sun, Save, User, HardDrive, FileText, BookOpen, GraduationCap, Award, Trash2, Camera, Loader2, Users, UserPlus } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function SettingsPage() {
  const { user, profile } = useAuth();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
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

  // Setup queries for storage
  // Note: These will safely return empty if no uploads exist yet.
  const [materials] = useCollection(
    user ? query(collection(db, 'materials'), where('userId', '==', user.uid)) : null
  );
  const [papers] = useCollection(
    user ? query(collection(db, 'papers'), where('userId', '==', user.uid)) : null
  );
  const [questions] = useCollection(
    user ? query(collection(db, 'question-papers'), where('userId', '==', user.uid)) : null
  );
  const [models] = useCollection(
    user ? query(collection(db, 'model-papers'), where('userId', '==', user.uid)) : null
  );

  const totalFiles = (materials?.docs.length || 0) + (papers?.docs.length || 0) + (questions?.docs.length || 0) + (models?.docs.length || 0);

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
              onClick={() => setTheme('light')}
              className={`flex-1 flex items-center justify-center gap-2 h-12 rounded-xl text-sm font-bold transition-all ${mounted && theme === 'light' ? 'bg-white shadow-lg text-slate-950' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <Sun className="h-4 w-4" /> Light
            </button>
            <button
              onClick={() => setTheme('dark')}
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
              <div className="bg-secondary/50 rounded-2xl p-4 border border-border/50 flex items-center gap-4 group hover:bg-secondary transition-all">
                <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Users className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-xl font-black text-foreground">{profile?.followers?.length || 0}</p>
                  <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Followers</p>
                </div>
              </div>
              <div className="bg-secondary/50 rounded-2xl p-4 border border-border/50 flex items-center gap-4 group hover:bg-secondary transition-all">
                <div className="h-10 w-10 rounded-xl bg-orange-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <UserPlus className="h-5 w-5 text-orange-500" />
                </div>
                <div>
                  <p className="text-xl font-black text-foreground">{profile?.following?.length || 0}</p>
                  <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Following</p>
                </div>
              </div>
            </div>
            
          </div>
        </div>

      </div>

      {/* Storage & Uploads */}
      <div className="glass rounded-[2.5rem] p-8 md:p-10 border border-border">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-orange-500/10 flex items-center justify-center">
              <HardDrive className="h-6 w-6 text-orange-500" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-foreground font-outfit">My Storage Vault</h3>
              <p className="text-sm font-medium text-muted-foreground mt-1">You have uploaded {totalFiles} resources across all categories.</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Materials */}
          <div className="p-6 rounded-3xl border border-border/50 bg-secondary/50 hover:bg-secondary transition-colors">
            <div className="flex items-center gap-3 mb-6">
              <BookOpen className="h-5 w-5 text-blue-500" />
              <h4 className="font-bold text-foreground">Study Materials ({materials?.docs.length || 0})</h4>
            </div>
            {materials?.docs.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">No study materials uploaded yet.</p>
            ) : (
              <div className="space-y-3">
                {materials?.docs.map(doc => (
                  <div key={doc.id} className="flex items-center justify-between text-sm py-2 border-b border-border/50 last:border-0 text-foreground">
                    <span className="truncate pr-4">{doc.data().title}</span>
                    <button className="text-rose-500 hover:scale-110 transition-transform"><Trash2 className="h-4 w-4" /></button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Research Papers */}
          <div className="p-6 rounded-3xl border border-border/50 bg-secondary/50 hover:bg-secondary transition-colors">
            <div className="flex items-center gap-3 mb-6">
              <FileText className="h-5 w-5 text-purple-500" />
              <h4 className="font-bold text-foreground">Research Papers ({papers?.docs.length || 0})</h4>
            </div>
            {papers?.docs.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">No research papers uploaded yet.</p>
            ) : (
              <div className="space-y-3">
                {papers?.docs.map(doc => (
                  <div key={doc.id} className="flex items-center justify-between text-sm py-2 border-b border-border/50 last:border-0 text-foreground">
                    <span className="truncate pr-4">{doc.data().title}</span>
                    <button className="text-rose-500 hover:scale-110 transition-transform"><Trash2 className="h-4 w-4" /></button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Question Papers */}
          <div className="p-6 rounded-3xl border border-border/50 bg-secondary/50 hover:bg-secondary transition-colors">
            <div className="flex items-center gap-3 mb-6">
              <GraduationCap className="h-5 w-5 text-orange-500" />
              <h4 className="font-bold text-foreground">Question Papers ({questions?.docs.length || 0})</h4>
            </div>
            {questions?.docs.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">No question papers uploaded yet.</p>
            ) : (
              <div className="space-y-3">
                {questions?.docs.map(doc => (
                  <div key={doc.id} className="flex items-center justify-between text-sm py-2 border-b border-border/50 last:border-0 text-foreground">
                    <span className="truncate pr-4">{doc.data().subjectCode} - {doc.data().year}</span>
                    <button className="text-rose-500 hover:scale-110 transition-transform"><Trash2 className="h-4 w-4" /></button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Model Papers */}
          <div className="p-6 rounded-3xl border border-border/50 bg-secondary/50 hover:bg-secondary transition-colors">
            <div className="flex items-center gap-3 mb-6">
              <Award className="h-5 w-5 text-emerald-500" />
              <h4 className="font-bold text-foreground">Model Papers ({models?.docs.length || 0})</h4>
            </div>
            {models?.docs.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">No model papers uploaded yet.</p>
            ) : (
              <div className="space-y-3">
                {models?.docs.map(doc => (
                  <div key={doc.id} className="flex items-center justify-between text-sm py-2 border-b border-border/50 last:border-0 text-foreground">
                    <span className="truncate pr-4">{doc.data().title}</span>
                    <button className="text-rose-500 hover:scale-110 transition-transform"><Trash2 className="h-4 w-4" /></button>
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
