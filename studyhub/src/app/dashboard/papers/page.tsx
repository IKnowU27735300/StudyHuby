'use client';

import { useState } from 'react';
import { FileText, Plus, Search, Filter, Download, ExternalLink, ScrollText, Loader2, X, Eye } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { incrementContribution, incrementDownloads } from '@/app/actions/user';
import { db, storage } from '@/lib/firebase';
import { collection, query, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useCollection } from 'react-firebase-hooks/firestore';
import { toast } from 'react-hot-toast';
import { createResearchPaper } from '@/app/actions/academic';
import FileViewerModal from '@/components/FileViewerModal';


export default function ResearchPapersPage() {
  const { user } = useAuth();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [title, setTitle] = useState('');
  const [authors, setAuthors] = useState('');
  const [abstract, setAbstract] = useState('');
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [journal, setJournal] = useState('');
  const [tags, setTags] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // File Viewer State
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerData, setViewerData] = useState({ url: '', name: '', mimeType: 'application/pdf' });

  const [snapshot, loading, error] = useCollection(
    query(collection(db, 'research_papers'), orderBy('createdAt', 'desc'))
  );

  const papers = snapshot?.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) })) || [];
  const filteredPapers = papers.filter(p => 
    p.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.authors?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.journal?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !file || !title || !authors) {
      toast.error('Please fill all required fields and select a file.');
      return;
    }

    setUploading(true);
    const toastId = toast.loading('Uploading research paper...');

    try {
      const storageRef = ref(storage, `research_papers/${user.uid}/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      // 1. Sync to MongoDB first to get the ID
      const mongoResult = await createResearchPaper({
        firebaseUid: user.uid,
        title,
        authors,
        abstract,
        year: parseInt(year),
        journal,
        tags: tags.split(',').map(t => t.trim()).filter(t => t),
        url
      });

      if (!mongoResult.success) {
        throw new Error(mongoResult.error || "Failed to sync research paper to MongoDB profile.");
      }


      // 2. Save to Firestore with MongoDB ID reference
      await addDoc(collection(db, 'research_papers'), {
        title,
        authors,
        abstract,
        year: parseInt(year),
        journal,
        tags: tags.split(',').map(t => t.trim()).filter(t => t),
        url,
        fileName: file.name,
        size: file.size,
        userId: user.uid,
        mongodbId: mongoResult.id, // Linked ID
        uploader: user.displayName || 'Learner',
        createdAt: serverTimestamp()
      });



      await incrementContribution(user.uid);

      toast.success('Research paper uploaded successfully!', { id: toastId });
      setIsModalOpen(false);
      setTitle(''); setAuthors(''); setAbstract(''); setJournal(''); setYear(new Date().getFullYear().toString()); setTags(''); setFile(null);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Error uploading material', { id: toastId });
    } finally {
      setUploading(false);
    }
  };

  const handleOpenViewer = async (paper: any) => {
    setViewerData({
      url: paper.url,
      name: paper.title,
      mimeType: paper.url.includes('.pdf') ? 'application/pdf' : 'image/jpeg'
    });
    setViewerOpen(true);
    if (paper.userId) await incrementDownloads(paper.userId);
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  return (
    <div className="flex flex-col gap-8 relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold font-outfit text-white">Research Papers</h2>
          <p className="text-muted-foreground mt-1">Explore groundbreaking research published by students and faculty.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="h-12 px-6 rounded-2xl bg-purple-600 text-white font-bold inline-flex items-center justify-center gap-2 shadow-lg shadow-purple-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          <Plus className="h-5 w-5" />
          Submit Paper
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
            placeholder="Search by title, authors, or journal..."
            className="w-full h-12 rounded-xl bg-background border border-border pl-12 pr-4 text-sm font-medium focus:outline-none focus:border-purple-500 transition-all"
          />
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center">
          <Loader2 className="h-10 w-10 text-purple-500 animate-spin" />
        </div>
      ) : filteredPapers.length === 0 ? (
        <div className="py-20 text-center glass rounded-[2rem] border border-border">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-bold text-foreground mb-2">No papers found</h3>
          <p className="text-muted-foreground">Try a different search term or upload a new research paper.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 pb-20">
          {filteredPapers.map((paper) => (
            <div key={paper.id} className="glass p-8 rounded-[2.5rem] border border-white/5 transition-all hover:border-purple-500/30 flex flex-col xl:flex-row gap-8">
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-4 mb-4">
                  <div className="text-[10px] font-black uppercase tracking-widest text-purple-400 bg-purple-400/10 px-3 py-1.5 rounded-lg border border-purple-500/20">
                    Published {paper.year}
                  </div>
                  {paper.journal && (
                    <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
                      {paper.journal}
                    </div>
                  )}
                </div>

                <h3 className="text-2xl font-bold text-white mb-3 font-outfit leading-tight hover:text-purple-400 transition-colors cursor-pointer">
                  {paper.title}
                </h3>
                
                <p className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
                  <ScrollText className="h-4 w-4 text-purple-500" />
                  Authored by {paper.authors}
                </p>

                {paper.abstract && (
                  <div className="bg-slate-900/40 rounded-2xl p-6 border border-white/5 mb-6">
                    <h4 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground mb-3">Abstract Excerpt</h4>
                    <p className="text-sm text-slate-400 leading-relaxed italic">
                      "{paper.abstract}"
                    </p>
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  {(paper.tags || []).map((tag: string) => (
                    <span key={tag} className="px-3 py-1.5 rounded-xl bg-purple-500/5 border border-purple-500/10 text-[11px] font-bold text-purple-300 uppercase tracking-wider">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="xl:w-64 flex flex-col gap-3 justify-center border-t border-white/5 xl:border-none pt-6 xl:pt-0">
                <button onClick={() => handleOpenViewer(paper)} className="h-14 w-full rounded-2xl bg-white text-slate-950 font-bold flex items-center justify-center gap-3 shadow-xl hover:bg-slate-100 transition-colors">
                  <Eye className="h-5 w-5" />
                  View Full Document
                </button>
                <div className="text-center mt-2 text-xs text-muted-foreground font-medium">
                   {paper.size ? formatFileSize(paper.size) : ''}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-card border border-border w-full max-w-2xl rounded-[2.5rem] p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => !uploading && setIsModalOpen(false)}
              className="absolute top-6 right-6 p-2 rounded-full bg-secondary text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
              disabled={uploading}
            >
              <X className="h-5 w-5" />
            </button>
            
            <h3 className="text-2xl font-bold font-outfit text-white mb-6">Submit Research Paper</h3>
            
            <form onSubmit={handleUpload} className="flex flex-col gap-5">
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-2 mb-2 block">Title</label>
                <input required type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full h-12 rounded-xl border border-border bg-background px-4 text-sm focus:border-purple-500 outline-none text-white" placeholder="e.g. Optimizing Micro-services..." />
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-2 mb-2 block">Authors</label>
                <input required type="text" value={authors} onChange={e => setAuthors(e.target.value)} className="w-full h-12 rounded-xl border border-border bg-background px-4 text-sm focus:border-purple-500 outline-none text-white" placeholder="e.g. John Doe, Jane Smith" />
              </div>
              
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-2 mb-2 block">Abstract (Optional)</label>
                <textarea rows={3} value={abstract} onChange={e => setAbstract(e.target.value)} className="w-full rounded-xl border border-border bg-background p-4 text-sm focus:border-purple-500 outline-none resize-none text-white" placeholder="Brief summary of the paper..." />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-2 mb-2 block">Journal / Conference</label>
                  <input type="text" value={journal} onChange={e => setJournal(e.target.value)} className="w-full h-12 rounded-xl border border-border bg-background px-4 text-sm focus:border-purple-500 outline-none text-white" placeholder="e.g. IEEE Transactions" />
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-2 mb-2 block">Year</label>
                  <input required type="number" value={year} onChange={e => setYear(e.target.value)} className="w-full h-12 rounded-xl border border-border bg-background px-4 text-sm focus:border-purple-500 outline-none text-white" placeholder="2024" />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-2 mb-2 block">Tags (comma separated)</label>
                <input type="text" value={tags} onChange={e => setTags(e.target.value)} className="w-full h-12 rounded-xl border border-border bg-background px-4 text-sm focus:border-purple-500 outline-none text-white" placeholder="e.g. Cloud Computing, AI" />
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-2 mb-2 block">Document File (PDF, PNG, JPG)</label>
                <input required type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={e => setFile(e.target.files?.[0] || null)} className="w-full text-sm text-muted-foreground file:mr-4 file:py-3 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-purple-500/10 file:text-purple-400 hover:file:bg-purple-500/20 bg-background border border-border rounded-xl p-1" />
              </div>

              <button 
                type="submit" 
                disabled={uploading}
                className="mt-4 h-14 rounded-2xl bg-purple-600 text-white font-bold flex items-center justify-center gap-2 hover:bg-purple-500 transition-colors disabled:opacity-50"
              >
                {uploading ? (
                  <><Loader2 className="h-5 w-5 animate-spin" /> Publishing...</>
                ) : (
                  <><Plus className="h-5 w-5" /> Submit Research Paper</>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      <FileViewerModal 
        isOpen={viewerOpen}
        onClose={() => setViewerOpen(false)}
        fileUrl={viewerData.url}
        fileName={viewerData.name}
        mimeType={viewerData.mimeType}
        onDownload={() => window.open(viewerData.url, '_blank')}
      />
    </div>
  );
}

