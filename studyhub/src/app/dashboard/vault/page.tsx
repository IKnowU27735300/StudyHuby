'use client';

import { useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { useCollection } from 'react-firebase-hooks/firestore';
import { 
  Archive, 
  Search, 
  Trash2, 
  Eye, 
  FileText, 
  BookOpen, 
  GraduationCap, 
  Award, 
  HardDrive, 
  Clock, 
  Loader2,
  AlertCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { deleteMaterial } from '@/app/actions/materials';
import { deleteAcademicItem } from '@/app/actions/academic';


export default function VaultPage() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');

  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // 1. Listen to ALL collections for the user's documents in real-time
  const qMaterials = useMemo(() => 
    user ? query(collection(db, 'material_index'), where('userId', '==', user.uid)) : null
  , [user]);
  
  const qQuestions = useMemo(() => 
    user ? query(collection(db, 'question_papers'), where('userId', '==', user.uid)) : null
  , [user]);

  const qModels = useMemo(() => 
    user ? query(collection(db, 'model_papers'), where('userId', '==', user.uid)) : null
  , [user]);

  const qResearch = useMemo(() => 
    user ? query(collection(db, 'research_papers'), where('userId', '==', user.uid)) : null
  , [user]);

  const [snapMaterials, loadingMaterials] = useCollection(qMaterials);
  const [snapQuestions, loadingQuestions] = useCollection(qQuestions);
  const [snapModels, loadingModels] = useCollection(qModels);
  const [snapResearch, loadingResearch] = useCollection(qResearch);

  const stats = useMemo(() => ({
    ALL: (snapMaterials?.size || 0) + (snapQuestions?.size || 0) + (snapModels?.size || 0) + (snapResearch?.size || 0),
    MATERIALS: snapMaterials?.size || 0,
    QUESTION_PAPERS: snapQuestions?.size || 0,
    MODEL_PAPERS: snapModels?.size || 0,
    RESEARCH_PAPERS: snapResearch?.size || 0,
  }), [snapMaterials, snapQuestions, snapModels, snapResearch]);

  const myFiles = useMemo(() => {
    const allDocs: any[] = [
      ...(snapMaterials?.docs.map(d => ({ ...(d.data() as any), id: d.id, _type: 'MATERIALS' })) || []),
      ...(snapQuestions?.docs.map(d => ({ ...(d.data() as any), id: d.id, _type: 'QUESTION_PAPERS' })) || []),
      ...(snapModels?.docs.map(d => ({ ...(d.data() as any), id: d.id, _type: 'MODEL_PAPERS' })) || []),
      ...(snapResearch?.docs.map(d => ({ ...(d.data() as any), id: d.id, _type: 'RESEARCH_PAPERS' })) || []),
    ];

    return allDocs.sort((a: any, b: any) => 
      (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)
    );
  }, [snapMaterials, snapQuestions, snapModels, snapResearch]);

  const filteredFiles = myFiles.filter(f => {
    const matchesSearch = (f.title || f.subject)?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (f.subject || f.journal)?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'ALL' || f._type === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const totalSize = myFiles.reduce((acc, file) => acc + (file.size || 0), 0);
  
  const formatFileSize = (bytes: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const getCollectionName = (type: string) => {
    switch(type) {
      case 'MATERIALS': return 'material_index';
      case 'QUESTION_PAPERS': return 'question_papers';
      case 'MODEL_PAPERS': return 'model_papers';
      case 'RESEARCH_PAPERS': return 'research_papers';
      default: return 'material_index';
    }
  };

  const handleDelete = async (id: string, fileName: string, type: string) => {
    if (!confirm(`Are you sure you want to delete "${fileName}"? This cannot be undone.`)) return;

    const toastId = toast.loading('Deleting file...');
    try {
      if (type === 'MATERIALS') {
        // Study Materials use the mongodbId stored in the Firestore index
        const file = myFiles.find(f => f.id === id);
        if (file?.mongodbId) {
          await deleteMaterial(file.mongodbId, user?.uid || '');
        }
      } else {
        // Research, Question, and Model Papers
        const file = myFiles.find(f => f.id === id);
        if (file?.mongodbId) {
          const typeMap: Record<string, 'RESEARCH' | 'QUESTION' | 'MODEL'> = {
            'RESEARCH_PAPERS': 'RESEARCH',
            'QUESTION_PAPERS': 'QUESTION',
            'MODEL_PAPERS': 'MODEL'
          };
          await deleteAcademicItem(file.mongodbId, user?.uid || '', typeMap[type]);
        }
        // Always delete from Firestore
        await deleteDoc(doc(db, getCollectionName(type), id));
      }
      
      toast.success('File removed from vault', { id: toastId });

    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to delete file', { id: toastId });
    }
  };

  const isLoading = loadingMaterials || loadingQuestions || loadingModels || loadingResearch;

  if (isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center py-20">
        <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
        <p className="text-muted-foreground font-medium">Synchronizing your vault...</p>
      </div>
    );
  }

  const categoryOptions = [
    { id: 'ALL', label: 'All Files', icon: Archive },
    { id: 'MATERIALS', label: 'Study Materials', icon: BookOpen },
    { id: 'QUESTION_PAPERS', label: 'Question Papers', icon: GraduationCap },
    { id: 'MODEL_PAPERS', label: 'Model Papers', icon: Award },
    { id: 'RESEARCH_PAPERS', label: 'Research Papers', icon: FileText },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black font-outfit text-foreground flex items-center gap-3">
            <Archive className="h-8 w-8 text-primary" />
            My Storage Vault
          </h2>
          <div className="flex items-center gap-2 mt-1">
             <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
             <p className="text-muted-foreground text-sm font-medium">Real-time sync active</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
           <div className="glass bg-card px-6 py-4 rounded-3xl border border-border flex items-center gap-4 shadow-xl shadow-primary/5">
              <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                 <HardDrive className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Total Vault Size</p>
                <p className="text-xl font-black text-foreground">{formatFileSize(totalSize)}</p>
              </div>
           </div>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <div className="relative group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <input 
            type="text" 
            placeholder="Search items by title, subject or journal..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-16 pl-14 pr-6 rounded-[2rem] bg-card border border-border focus:outline-none focus:border-primary transition-all font-medium text-lg shadow-inner"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-4 no-scrollbar -mx-4 px-4 mask-fade">
          {categoryOptions.map((cat) => {
            const isActive = selectedCategory === cat.id;
            const count = stats[cat.id as keyof typeof stats];
            
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-3 px-6 py-3 rounded-2xl border transition-all whitespace-nowrap active:scale-95 ${
                  isActive 
                  ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' 
                  : 'bg-card text-muted-foreground border-border hover:border-primary/30'
                }`}
              >
                <cat.icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-primary'}`} />
                <span className="font-bold text-sm tracking-tight">{cat.label}</span>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${isActive ? 'bg-white/20 text-white' : 'bg-secondary text-primary'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {filteredFiles.length === 0 ? (
        <div className="py-24 text-center glass rounded-[3rem] border border-border bg-secondary/10 flex flex-col items-center">
          <div className="h-24 w-24 rounded-[2rem] bg-secondary/50 flex items-center justify-center mb-8">
             <Archive className="h-10 w-10 text-muted-foreground/30" />
          </div>
          <h3 className="text-3xl font-black text-foreground mb-3">
            {selectedCategory === 'ALL' ? "Vault is Empty" : `No ${selectedCategory.replace('_', ' ')} Found`}
          </h3>
          <p className="text-muted-foreground max-w-sm mx-auto leading-relaxed">
            {searchTerm 
              ? "No items match your search. Try different keywords!"
              : "Synchronize your personal archive by uploading your first document to this category."
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 pb-20">
          {filteredFiles.map((file) => (
            <div key={file.id} className="group glass bg-card p-6 rounded-[2.5rem] border border-border hover:border-primary/30 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-[0.03] transition-opacity scale-150 rotate-12">
                  <Archive className="h-32 w-32 text-foreground" />
               </div>
               
               <div className="flex items-center gap-6 relative z-10">
                  <div className={`h-16 w-16 shrink-0 rounded-2xl bg-background border border-border flex items-center justify-center text-primary shadow-inner group-hover:scale-110 transition-transform`}>
                    {file._type === 'MATERIALS' ? <BookOpen className="h-8 w-8" /> : file._type === 'RESEARCH_PAPERS' ? <FileText className="h-8 w-8" /> : file._type === 'QUESTION_PAPERS' ? <GraduationCap className="h-8 w-8" /> : <Award className="h-8 w-8" />}
                  </div>
                  
                  <div>
                    <h4 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1 font-outfit">{file.title || file.subject}</h4>
                    <div className="flex flex-wrap items-center gap-3 mt-2">
                       <span className="px-3 py-1 rounded-full bg-secondary text-[9px] font-black text-muted-foreground uppercase tracking-widest border border-border">
                          {file._type?.replace('_', ' ')}
                       </span>
                       <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-bold uppercase tracking-tighter">
                          <Clock className="h-3.5 w-3.5 text-primary" />
                          {file.createdAt?.seconds ? new Date(file.createdAt.seconds * 1000).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : 'Synchronizing...'}
                       </div>
                       <div className="h-1 w-1 rounded-full bg-border" />
                       <div className="text-xs text-foreground font-black uppercase tracking-tighter">
                          {formatFileSize(file.size || 0)}
                       </div>
                    </div>
                  </div>
               </div>

               <div className="flex items-center gap-3 shrink-0 relative z-10">
                  <button 
                    onClick={() => window.open(file.url, '_blank')}
                    className="h-14 px-6 rounded-2xl bg-background border border-border flex items-center justify-center gap-2 hover:bg-secondary transition-all text-sm font-bold text-foreground active:scale-95"
                  >
                    <Eye className="h-5 w-5" />
                    <span>View</span>
                  </button>
                  <button 
                    onClick={() => handleDelete(file.id, file.title || file.subject || 'File', file._type)}
                    className="h-14 w-14 rounded-2xl bg-red-500/5 border border-red-500/10 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-xl shadow-red-500/5 active:scale-95"
                    title="Remove from Vault"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
               </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
