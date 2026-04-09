'use client';

import { useState } from 'react';
import { Award, Plus, Grid, List, Download, Star, Clock, Loader2, X, Eye } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { db, storage } from '@/lib/firebase';
import { collection, query, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useCollection } from 'react-firebase-hooks/firestore';
import { toast } from 'react-hot-toast';

export default function ModelPapersPage() {
  const { user } = useAuth();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const [snapshot, loading, error] = useCollection(
    query(collection(db, 'model_papers'), orderBy('createdAt', 'desc'))
  );

  const models = snapshot?.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) })) || [];
  const filteredModels = models.filter(m => 
    m.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    m.subject?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !file || !title || !subject) {
      toast.error('Please fill all required fields and select a file.');
      return;
    }

    setUploading(true);
    const toastId = toast.loading('Uploading model paper...');

    try {
      const storageRef = ref(storage, `model_papers/${user.uid}/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      await addDoc(collection(db, 'model_papers'), {
        title,
        subject,
        downloads: 0,
        url,
        fileName: file.name,
        size: file.size,
        userId: user.uid,
        uploader: user.displayName || 'Learner',
        createdAt: serverTimestamp()
      });

      toast.success('Model paper uploaded successfully!', { id: toastId });
      setIsModalOpen(false);
      setTitle(''); setSubject(''); setFile(null);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Error uploading material', { id: toastId });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold font-outfit text-white">Model Papers</h2>
          <p className="text-muted-foreground mt-1">Simulate your exams with these curated model question sets.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="h-12 px-6 rounded-2xl bg-emerald-600 text-white font-bold inline-flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          <Plus className="h-5 w-5" />
          Create Model
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 py-2">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by title or subject..."
          className="w-full h-12 rounded-xl bg-background border border-border px-4 text-sm font-medium focus:outline-none focus:border-emerald-500 transition-all"
        />
      </div>

      {loading ? (
        <div className="py-20 flex justify-center">
          <Loader2 className="h-10 w-10 text-emerald-500 animate-spin" />
        </div>
      ) : filteredModels.length === 0 ? (
        <div className="py-20 text-center glass rounded-[2rem] border border-border">
          <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-bold text-foreground mb-2">No model papers found</h3>
          <p className="text-muted-foreground">Try a different search term or create a new model.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
          {filteredModels.map((model) => (
            <div key={model.id} className="relative glass p-8 rounded-[2.5rem] border border-white/5 overflow-hidden group flex flex-col">
              <div className="absolute top-0 right-0 p-6 opacity-5 transition-opacity group-hover:opacity-20 scale-150 rotate-12">
                <Award className="h-32 w-32 text-emerald-500" />
              </div>
              
              <div className="relative z-10 flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-8">
                  <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                    <Award className="h-6 w-6 text-emerald-500" />
                  </div>
                </div>

                <h3 className="text-xl font-bold text-white mb-2 leading-tight group-hover:text-emerald-400 transition-colors">{model.title}</h3>
                <p className="text-sm font-medium text-muted-foreground mb-8">{model.subject}</p>

                <div className="flex items-center gap-6 border-t border-white/5 pt-6 mt-auto">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-tighter">
                    <Clock className="h-3.5 w-3.5" />
                    3 Hours
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-tighter">
                    <Star className="h-3.5 w-3.5" />
                    {model.downloads || 0} Downloads
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2 mt-8 relative z-10">
                 <button onClick={() => window.open(model.url, '_blank')} className="h-14 w-14 shrink-0 rounded-2xl bg-white/5 text-white border border-white/10 font-bold flex items-center justify-center gap-2 hover:bg-white/10 transition-all shadow-xl shadow-emerald-600/5">
                  <Eye className="h-5 w-5" />
                </button>
                <button onClick={() => window.open(model.url, '_blank')} className="flex-1 h-14 rounded-2xl bg-emerald-600/10 text-emerald-400 border border-emerald-600/20 font-bold flex items-center justify-center gap-2 hover:bg-emerald-600 hover:text-white transition-all shadow-xl shadow-emerald-600/5">
                  <Download className="h-5 w-5" />
                  Download
                </button>
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
            
            <h3 className="text-2xl font-bold font-outfit text-white mb-6">Create Model Paper</h3>
            
            <form onSubmit={handleUpload} className="flex flex-col gap-5">
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-2 mb-2 block">Title</label>
                <input required type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full h-12 rounded-xl border border-border bg-background px-4 text-sm focus:border-emerald-500 outline-none text-white" placeholder="e.g. B.Tech Semester 4 - Model Set 1" />
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-2 mb-2 block">Subject</label>
                <input required type="text" value={subject} onChange={e => setSubject(e.target.value)} className="w-full h-12 rounded-xl border border-border bg-background px-4 text-sm focus:border-emerald-500 outline-none text-white" placeholder="e.g. Computer Architecture" />
              </div>


              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-2 mb-2 block">Document File (PDF, PNG, JPG)</label>
                <input required type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={e => setFile(e.target.files?.[0] || null)} className="w-full text-sm text-muted-foreground file:mr-4 file:py-3 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-emerald-500/10 file:text-emerald-400 hover:file:bg-emerald-500/20 bg-background border border-border rounded-xl p-1" />
              </div>

              <button 
                type="submit" 
                disabled={uploading}
                className="mt-4 h-14 rounded-2xl bg-emerald-600 text-white font-bold flex items-center justify-center gap-2 hover:bg-emerald-500 transition-colors disabled:opacity-50"
              >
                {uploading ? (
                  <><Loader2 className="h-5 w-5 animate-spin" /> Publishing...</>
                ) : (
                  <><Plus className="h-5 w-5" /> Upload Model Paper</>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
