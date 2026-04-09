'use client';

import { useAuth } from "@/context/AuthContext";
import { useState } from "react";
import { db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { toast } from "react-hot-toast";

export default function OnboardingModal() {
  const { user, profile, isOnboardingComplete } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    college: '',
    course: '',
    semester: 1,
    academicYear: '2024-25',
    registrationNo: ''
  });

  if (!user || isOnboardingComplete) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        ...formData,
        updatedAt: new Date()
      });
      toast.success("Welcome to StudyHub!");
      window.location.reload(); // Refresh to update context
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="glass w-full max-w-xl rounded-[2.5rem] p-10 border border-white/10 animate-in fade-in zoom-in duration-300">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-black font-outfit text-white mb-2">Let's get started! 🎓</h2>
          <p className="text-muted-foreground">We just need a few details to personalize your experience.</p>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2 space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-2">College Name</label>
            <input
              required
              type="text"
              placeholder="e.g. Stanford University"
              className="w-full h-14 rounded-2xl bg-slate-900/50 border border-white/5 px-6 text-white focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all"
              value={formData.college}
              onChange={(e) => setFormData({...formData, college: e.target.value})}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-2">Course / Branch</label>
            <input
              required
              type="text"
              placeholder="e.g. B.Tech CSE"
              className="w-full h-14 rounded-2xl bg-slate-900/50 border border-white/5 px-6 text-white focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all"
              value={formData.course}
              onChange={(e) => setFormData({...formData, course: e.target.value})}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-2">Registration No.</label>
            <input
              required
              type="text"
              placeholder="Roll Number"
              className="w-full h-14 rounded-2xl bg-slate-900/50 border border-white/5 px-6 text-white focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all"
              value={formData.registrationNo}
              onChange={(e) => setFormData({...formData, registrationNo: e.target.value})}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-2">Semester</label>
            <select
              className="w-full h-14 rounded-2xl bg-slate-900/50 border border-white/5 px-6 text-white focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all appearance-none"
              value={formData.semester}
              onChange={(e) => setFormData({...formData, semester: parseInt(e.target.value)})}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <option key={s} value={s} className="bg-slate-900">Semester {s}</option>)}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-2">Academic Year</label>
            <select
              className="w-full h-14 rounded-2xl bg-slate-900/50 border border-white/5 px-6 text-white focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all appearance-none"
              value={formData.academicYear}
              onChange={(e) => setFormData({...formData, academicYear: e.target.value})}
            >
              <option value="2024-25" className="bg-slate-900">2024-25</option>
              <option value="2023-24" className="bg-slate-900">2023-24</option>
            </select>
          </div>

          <button
            disabled={loading}
            type="submit"
            className="md:col-span-2 h-14 mt-4 rounded-2xl bg-primary text-white font-bold text-lg shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {loading ? 'Setting up Profile...' : 'Complete Onboarding'}
          </button>
        </form>
      </div>
    </div>
  );
}
