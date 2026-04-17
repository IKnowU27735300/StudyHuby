'use client';

import { useState } from 'react';
import { GraduationCap, Plus, Search, Table, Download, Calendar, BookOpen, Loader2, X, Eye } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { incrementContribution } from '@/app/actions/user';
import { db, storage } from '@/lib/firebase';
import { collection, query, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useCollection } from 'react-firebase-hooks/firestore';
import { toast } from 'react-hot-toast';
import { createQuestionPaper } from '@/app/actions/academic';


export default function QuestionPapersPage() {
  const { user } = useAuth();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [subject, setSubject] = useState('');
  const [code, setCode] = useState('');
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [semester, setSemester] = useState('1');
  const [branch, setBranch] = useState('');
  const [type, setType] = useState('Regular');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const [snapshot, loading, error] = useCollection(
    query(collection(db, 'question_papers'), orderBy('createdAt', 'desc'))
  );

  const papers = snapshot?.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) })) || [];
  const filteredPapers = papers.filter(p => 
    p.subject?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.branch?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !file || !subject || !code || !branch) {
      toast.error('Please fill all required fields and select a file.');
      return;
    }

    setUploading(true);
    const toastId = toast.loading('Uploading question paper...');

    try {
      const storageRef = ref(storage, `question_papers/${user.uid}/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      // 1. Sync to MongoDB first to get the ID
      const mongoResult = await createQuestionPaper({
        firebaseUid: user.uid,
        subject,
        code: code.toUpperCase(),
        year: parseInt(year),
        semester: parseInt(semester),
        branch,
        college: user.displayName || 'Universal Campus',
        url,
        tags: [branch, code.toUpperCase()]
      });

      // 2. Save to Firestore with MongoDB ID reference
      await addDoc(collection(db, 'question_papers'), {
        subject,
        code: code.toUpperCase(),
        year: parseInt(year),
        semester: parseInt(semester),
        branch,
        type,
        url,
        fileName: file.name,
        size: file.size,
        userId: user.uid,
        mongodbId: mongoResult.id, // Linked ID
        uploader: user.displayName || 'Learner',
        createdAt: serverTimestamp()
      });



      await incrementContribution(user.uid);

      toast.success('Question paper uploaded successfully!', { id: toastId });
      setIsModalOpen(false);
      setSubject(''); setCode(''); setYear(new Date().getFullYear().toString()); setSemester('1'); setBranch(''); setType('Regular'); setFile(null);
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
          <h2 className="text-3xl font-bold font-outfit text-white">Question Papers Vault</h2>
          <p className="text-muted-foreground mt-1">Practice with previous year exams and internal assessments.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="h-12 px-6 rounded-2xl bg-orange-600 text-white font-bold inline-flex items-center justify-center gap-2 shadow-lg shadow-orange-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          <Plus className="h-5 w-5" />
          Add Paper
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
            placeholder="Search by subject, code, or branch..."
            className="w-full h-12 rounded-xl bg-background border border-border pl-12 pr-4 text-sm font-medium focus:outline-none focus:border-orange-500 transition-all"
          />
        </div>
      </div>

      <div className="glass rounded-[2.5rem] overflow-hidden border border-white/5 relative min-h-[300px]">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="h-10 w-10 text-orange-500 animate-spin" />
          </div>
        ) : filteredPapers.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
            <BookOpen className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-xl font-bold text-foreground mb-2">No question papers found</h3>
            <p className="text-muted-foreground">Try a different search term or add a new paper.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-white/5 border-b border-white/10">
                  <th className="px-8 py-5 text-xs font-black uppercase tracking-widest text-muted-foreground">Subject & Code</th>
                  <th className="px-8 py-5 text-xs font-black uppercase tracking-widest text-muted-foreground">Semester</th>
                  <th className="px-12 py-5 text-xs font-black uppercase tracking-widest text-muted-foreground">Year</th>
                  <th className="px-8 py-5 text-xs font-black uppercase tracking-widest text-muted-foreground">Type</th>
                  <th className="px-8 py-5 text-xs font-black uppercase tracking-widest text-muted-foreground text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredPapers.map((paper) => (
                  <tr key={paper.id} className="group hover:bg-white/[0.02] transition-colors">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-slate-900 border border-white/5 flex items-center justify-center">
                          <BookOpen className="h-5 w-5 text-orange-500" />
                        </div>
                        <div>
                          <p className="font-bold text-white group-hover:text-orange-500 transition-colors">{paper.subject}</p>
                          <p className="text-xs text-muted-foreground font-medium uppercase tracking-tighter">{paper.code} · {paper.branch}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-sm font-bold text-slate-300 bg-white/5 px-3 py-1 rounded-lg border border-white/5">Sem {paper.semester}</span>
                    </td>
                    <td className="px-12 py-6">
                      <div className="flex items-center gap-2 text-sm text-slate-400 font-bold font-outfit">
                        <Calendar className="h-4 w-4" />
                        {paper.year}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded bg-white/5 border border-white/5 text-slate-400">
                        {paper.type || 'Regular'}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right flex items-center justify-end gap-2">
                       <button onClick={() => window.open(paper.url, '_blank')} className="h-10 w-10 rounded-xl bg-white/5 text-white border border-white/10 inline-flex items-center justify-center hover:bg-white/10 transition-all">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button onClick={() => window.open(paper.url, '_blank')} className="h-10 w-10 rounded-xl bg-orange-600/10 text-orange-500 border border-orange-600/20 inline-flex items-center justify-center hover:bg-orange-600 hover:text-white transition-all">
                        <Download className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

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
            
            <h3 className="text-2xl font-bold font-outfit text-white mb-6">Add Question Paper</h3>
            
            <form onSubmit={handleUpload} className="flex flex-col gap-5">
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-2 mb-2 block">Subject</label>
                <input required type="text" value={subject} onChange={e => setSubject(e.target.value)} className="w-full h-12 rounded-xl border border-border bg-background px-4 text-sm focus:border-orange-500 outline-none text-white" placeholder="e.g. Database Management Systems" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-2 mb-2 block">Subject Code</label>
                  <input required type="text" value={code} onChange={e => setCode(e.target.value)} className="w-full h-12 rounded-xl border border-border bg-background px-4 text-sm focus:border-orange-500 outline-none text-white" placeholder="e.g. CS301" />
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-2 mb-2 block">Branch / Course</label>
                  <input required type="text" value={branch} onChange={e => setBranch(e.target.value)} className="w-full h-12 rounded-xl border border-border bg-background px-4 text-sm focus:border-orange-500 outline-none text-white" placeholder="e.g. B.Tech CSE" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-2 mb-2 block">Semester</label>
                  <input required type="number" min="1" max="10" value={semester} onChange={e => setSemester(e.target.value)} className="w-full h-12 rounded-xl border border-border bg-background px-4 text-sm focus:border-orange-500 outline-none text-white" placeholder="5" />
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-2 mb-2 block">Exam Year</label>
                  <input required type="number" value={year} onChange={e => setYear(e.target.value)} className="w-full h-12 rounded-xl border border-border bg-background px-4 text-sm focus:border-orange-500 outline-none text-white" placeholder="2024" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-2 mb-2 block">Type</label>
                  <select required value={type} onChange={e => setType(e.target.value)} className="w-full h-12 rounded-xl border border-border bg-background px-4 text-sm focus:border-orange-500 outline-none text-white">
                    <option value="Regular">Regular (Default)</option>
                    <option value="Makeup">Makeup</option>
                    <option value="Reexam">Reexam</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-2 mb-2 block">Document File (PDF, PNG, JPG)</label>
                <input required type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={e => setFile(e.target.files?.[0] || null)} className="w-full text-sm text-muted-foreground file:mr-4 file:py-3 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-orange-500/10 file:text-orange-400 hover:file:bg-orange-500/20 bg-background border border-border rounded-xl p-1" />
              </div>

              <button 
                type="submit" 
                disabled={uploading}
                className="mt-4 h-14 rounded-2xl bg-orange-600 text-white font-bold flex items-center justify-center gap-2 hover:bg-orange-500 transition-colors disabled:opacity-50"
              >
                {uploading ? (
                  <><Loader2 className="h-5 w-5 animate-spin" /> Publishing...</>
                ) : (
                  <><Plus className="h-5 w-5" /> Submitting Paper</>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
