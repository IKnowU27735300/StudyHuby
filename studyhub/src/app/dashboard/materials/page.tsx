'use client';

import { useState, useEffect } from 'react';
import { Plus, Filter, Download, Calendar, Tag, User as UserIcon, BookOpen, Search, X, Loader2, Eye, Trash2, ShieldCheck } from 'lucide-react';
import FileViewerModal from '@/components/FileViewerModal';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'react-hot-toast';
import { db } from '@/lib/firebase';
import { collection, addDoc, doc, setDoc, increment, query, where, getDocs, deleteDoc, orderBy, serverTimestamp } from 'firebase/firestore';
import { useCollection } from 'react-firebase-hooks/firestore';
import { uploadMaterial, downloadMaterial, deleteMaterial } from '@/app/actions/materials';
import { incrementDownloads } from '@/app/actions/user';

export default function MaterialsPage() {
  const { user } = useAuth();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form State
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [code, setCode] = useState('');
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [tags, setTags] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // File Viewer State
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerData, setViewerData] = useState<{ url: string | null; name: string; mimeType: string; id?: string }>({
    url: null,
    name: '',
    mimeType: '',
  });

  const [snapshot, loadingMaterials] = useCollection(
    query(collection(db, 'material_index'), orderBy('createdAt', 'desc'))
  );

  const materials = snapshot?.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) })) || [];

  const handleDelete = async (id: string, materialTitle: string) => {
    if (!user) return;
    if (!window.confirm(`Are you sure you want to delete "${materialTitle}"?`)) return;

    const toastId = toast.loading('Deleting material...');
    try {
      // 1. Delete from MongoDB & update Prisma via server
      await deleteMaterial(id, user.uid);
      
      // 2. Clean up from Firestore index (Client has permissions)
      const q = query(collection(db, 'material_index'), where('mongodbId', '==', id));
      const snap = await getDocs(q);
      await Promise.all(snap.docs.map(d => deleteDoc(d.ref)));

      // 3. Decrement Firestore count
      await setDoc(doc(db, 'users', user.uid), {
        contributionCount: increment(-1)
      }, { merge: true });

      toast.success('Material deleted successfully', { id: toastId });
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete material', { id: toastId });
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !file || !title || !subject || !code || !year) {
      toast.error('Please fill all required fields and select a file.');
      return;
    }

    setUploading(true);
    const toastId = toast.loading('Uploading material to MongoDB...');

    try {
      const formData = new FormData();
      formData.append('userId', user.uid);
      formData.append('title', title);
      formData.append('subject', subject);
      formData.append('code', code.toUpperCase());
      formData.append('year', year);
      formData.append('tags', JSON.stringify(tags.split(',').map(t => t.trim()).filter(t => t)));
      formData.append('file', file);

      const result = await uploadMaterial(formData);

      // 2. Index in Firestore for real-time counters (Done on client to ensure access)
      await addDoc(collection(db, 'material_index'), {
        fileName: result.title,
        category: result.subject,
        mongodbId: result.id,
        userId: user.uid,
        size: file.size,
        createdAt: serverTimestamp(),
      });

      // 3. Create a Broadcast Alert for all users (Client handles this now)
      await addDoc(collection(db, 'notifications'), {
        userId: 'GLOBAL_ALERTS',
        type: 'UPLOAD',
        message: `New Document: "${result.title}" added by ${user.displayName || 'a user'}!`,
        createdAt: new Date(),
        resourceId: result.id
      });

      // 4. Increment Firestore count
      await setDoc(doc(db, 'users', user.uid), {
        contributionCount: increment(1)
      }, { merge: true });

      toast.success('Document uploaded & synced successfully!', { id: toastId });
      setIsModalOpen(false);
      setTitle(''); setSubject(''); setCode(''); setYear(new Date().getFullYear().toString()); setTags(''); setFile(null);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Error uploading material', { id: toastId });
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (materialId: string, fileName: string) => {
    const toastId = toast.loading('Downloading from MongoDB...');
    try {
      const result = await downloadMaterial(materialId);
      const blob = new Blob([new Uint8Array(result.content)], { type: result.mimeType });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);

      // Increment stats for uploader
      const material = materials.find(m => m.id === materialId || m.mongodbId === materialId);
      if (material?.userId) await incrementDownloads(material.userId);

      toast.success('Download started!', { id: toastId });
    } catch (err) {
      toast.error("Download failed", { id: toastId });
    }
  };

  const handleOpenViewer = async (material: any) => {
    setViewerData({
      url: null,
      name: material.title,
      mimeType: material.mimeType || (material.fileName?.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg'),
      id: material.id
    });
    setViewerOpen(true);

    try {
      const result = await downloadMaterial(material.mongodbId || material.id);
      const blob = new Blob([new Uint8Array(result.content)], { type: result.mimeType });
      const url = window.URL.createObjectURL(blob);
      setViewerData(prev => ({ ...prev, url, mimeType: result.mimeType }));
      
      // Increment stats for uploader
      if (material.userId) await incrementDownloads(material.userId);
    } catch (err) {
      toast.error('Failed to load preview');
      setViewerOpen(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const filteredMaterials = (materials || []).filter(m => 
    m.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    m.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.subjectCode?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-8 relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold font-outfit text-foreground">Study Materials</h2>
          <p className="text-muted-foreground mt-1">Discover resources stored in MongoDB & indexed in Firebase.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="h-12 px-6 rounded-2xl bg-primary text-white font-bold inline-flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          <Plus className="h-5 w-5" />
          Upload Material
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 py-2">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-muted-foreground" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by title, subject, or code..."
            className="w-full h-12 rounded-xl bg-background border border-border pl-12 pr-4 text-sm font-medium focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
          />
        </div>
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-secondary border border-border text-foreground text-sm font-medium cursor-pointer hover:bg-secondary/80 transition-colors">
          <Filter className="h-4 w-4" />
          Filters
        </div>
      </div>

      {loadingMaterials ? (
        <div className="py-20 flex justify-center">
          <Loader2 className="h-10 w-10 text-primary animate-spin" />
        </div>
      ) : filteredMaterials.length === 0 ? (
        <div className="py-20 text-center glass rounded-[2rem] border border-border">
          <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-bold text-foreground mb-2">No materials found</h3>
          <p className="text-muted-foreground">Try a different search term or upload a new document.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredMaterials.map((material) => (
            <div key={material.id} className="glass group rounded-[2rem] overflow-hidden flex flex-col transition-all hover:scale-[1.02] hover:shadow-xl border border-border bg-card">
              <div className="p-8 flex-1">
                <div className="flex items-start justify-between mb-6">
                  <div className="p-3 rounded-2xl bg-primary/10 text-primary border border-primary/20">
                    <BookOpen className="h-6 w-6" />
                  </div>
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground border border-border px-2 py-1 rounded">
                    {material.subjectCode}
                  </div>
                </div>
                
                <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors leading-tight line-clamp-2">
                  {material.title}
                </h3>
                <p className="text-sm text-muted-foreground mb-6 font-medium line-clamp-1">{material.subject}</p>

                <div className="flex flex-col gap-3 mb-6">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                    <Calendar className="h-3.5 w-3.5" />
                    Year {material.year}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium text-primary">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Saved in MongoDB
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {(material.tags || []).map((tag: string) => (
                    <span key={tag} className="inline-flex items-center gap-1 text-[10px] font-bold text-foreground bg-secondary border border-border px-2.5 py-1 rounded-full uppercase tracking-wider">
                      <Tag className="h-2.5 w-2.5 text-primary" />
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-secondary/50 border-t border-border flex gap-2">
                <button 
                  onClick={() => handleOpenViewer(material)}
                  className="h-12 w-12 rounded-xl bg-background border border-border text-foreground hover:bg-muted transition-colors flex items-center justify-center group"
                  title="View Material"
                >
                  <Eye className="h-5 w-5 group-hover:scale-110 transition-transform" />
                </button>
                <button 
                  onClick={() => handleDownload(material.id, material.title)}
                  className="flex-1 h-12 rounded-xl bg-primary text-white text-sm font-bold flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors"
                >
                  <Download className="h-4 w-4" />
                  Download
                </button>
                {material.user?.firebaseUid === user?.uid && (
                  <button 
                    onClick={() => handleDelete(material.id, material.title)}
                    className="h-12 w-12 rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all"
                    title="Delete Material"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-card border border-border w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => !uploading && setIsModalOpen(false)}
              className="absolute top-6 right-6 p-2 rounded-full bg-secondary text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
              disabled={uploading}
            >
              <X className="h-5 w-5" />
            </button>
            
            <h3 className="text-2xl font-bold font-outfit text-foreground mb-6">Upload Material</h3>
            
            <form onSubmit={handleUpload} className="flex flex-col gap-5">
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-2 mb-2 block">Title</label>
                <input required type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full h-12 rounded-xl border border-border bg-background px-4 text-sm focus:border-primary outline-none" placeholder="e.g. OS Full Notes" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-2 mb-2 block">Subject</label>
                  <input required type="text" value={subject} onChange={e => setSubject(e.target.value)} className="w-full h-12 rounded-xl border border-border bg-background px-4 text-sm focus:border-primary outline-none" placeholder="e.g. Operating Systems" />
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-2 mb-2 block">Subject Code</label>
                  <input required type="text" value={code} onChange={e => setCode(e.target.value)} className="w-full h-12 rounded-xl border border-border bg-background px-4 text-sm focus:border-primary outline-none" placeholder="e.g. CS301" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-2 mb-2 block">Year</label>
                  <input required type="number" value={year} onChange={e => setYear(e.target.value)} className="w-full h-12 rounded-xl border border-border bg-background px-4 text-sm focus:border-primary outline-none" placeholder="2024" />
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-2 mb-2 block">Tags (comma separated)</label>
                  <input type="text" value={tags} onChange={e => setTags(e.target.value)} className="w-full h-12 rounded-xl border border-border bg-background px-4 text-sm focus:border-primary outline-none" placeholder="e.g. Mid-Sem, Lab" />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-2 mb-2 block">Document File (Max 15MB)</label>
                <input required type="file" onChange={e => setFile(e.target.files?.[0] || null)} className="w-full text-sm text-muted-foreground file:mr-4 file:py-3 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 bg-background border border-border rounded-xl p-1" />
              </div>

              <button 
                type="submit" 
                disabled={uploading}
                className="mt-4 h-14 rounded-2xl bg-primary text-white font-bold flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {uploading ? (
                  <><Loader2 className="h-5 w-5 animate-spin" /> Syncing to MongoDB...</>
                ) : (
                  <><Plus className="h-5 w-5" /> Share Material</>
                )}
              </button>
            </form>
          </div>
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
        onDownload={() => handleDownload(viewerData.id!, viewerData.name)}
      />
    </div>
  );
}
