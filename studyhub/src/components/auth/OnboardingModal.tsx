'use client';

import { useAuth } from "@/context/AuthContext";
import { useState } from "react";
import { db } from "@/lib/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { toast } from "react-hot-toast";
import { updateUserOnboarding } from "@/app/actions/user";
import { useRouter } from "next/navigation";
import { ChevronDown, X } from "lucide-react";

export default function OnboardingModal() {
  const { user, loading: authLoading, isOnboardingComplete } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [formData, setFormData] = useState({
    college: '',
    course: '',
    semester: 1,
    academicYear: '2024-25',
    registrationNo: ''
  });

  if (authLoading || !user || isOnboardingComplete || dismissed) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, {
        ...formData,
        updatedAt: serverTimestamp()
      }, { merge: true });

      // Sync onboarding info to MongoDB
      await updateUserOnboarding({
        firebaseUid: user.uid,
        college: formData.college,
        course: formData.course,
        semester: formData.semester,
        academicYear: formData.academicYear,
        registrationNo: formData.registrationNo
      });

      toast.success("Welcome to StudyHub!");
      setDismissed(true);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Something went wrong. Please try again.';
      console.error("Onboarding error:", msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
      <div className="glass w-full max-w-xl rounded-[2.5rem] p-10 border border-border bg-card shadow-2xl animate-in fade-in zoom-in duration-200 relative">
        <button 
          type="button"
          onClick={() => setDismissed(true)} 
          className="absolute top-6 right-6 p-2 rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          title="Skip for now"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="text-center mb-10">
          <h2 className="text-3xl font-black font-outfit text-foreground mb-2">Let&apos;s get started! 🎓</h2>
          <p className="text-muted-foreground text-sm">We just need a few details to personalize your experience.</p>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2 space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-2">College Name</label>
            <input
              required
              type="text"
              placeholder="e.g. Stanford University"
              className="w-full h-14 rounded-2xl bg-secondary border border-border px-6 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors duration-150"
              value={formData.college}
              onChange={(e) => setFormData(prev => ({ ...prev, college: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-2">Course / Branch</label>
            <input
              required
              type="text"
              placeholder="e.g. B.Tech CSE"
              className="w-full h-14 rounded-2xl bg-secondary border border-border px-6 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors duration-150"
              value={formData.course}
              onChange={(e) => setFormData(prev => ({ ...prev, course: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-2">Registration No.</label>
            <input
              required
              type="text"
              placeholder="Roll Number"
              className="w-full h-14 rounded-2xl bg-secondary border border-border px-6 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors duration-150"
              value={formData.registrationNo}
              onChange={(e) => setFormData(prev => ({ ...prev, registrationNo: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-2">Semester</label>
            <div className="relative">
              <select
                className="w-full h-14 rounded-2xl bg-secondary border border-border px-6 pr-10 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors duration-150 appearance-none cursor-pointer"
                value={formData.semester}
                onChange={(e) => setFormData(prev => ({ ...prev, semester: parseInt(e.target.value) }))}
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <option key={s} value={s} className="bg-card text-foreground">Semester {s}</option>)}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-2">Academic Year</label>
            <div className="relative">
              <select
                className="w-full h-14 rounded-2xl bg-secondary border border-border px-6 pr-10 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors duration-150 appearance-none cursor-pointer"
                value={formData.academicYear}
                onChange={(e) => setFormData(prev => ({ ...prev, academicYear: e.target.value }))}
              >
                <option value="2024-25" className="bg-card text-foreground">2024-25</option>
                <option value="2023-24" className="bg-card text-foreground">2023-24</option>
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          <button
            disabled={loading}
            type="submit"
            className="md:col-span-2 h-14 mt-4 rounded-2xl bg-primary text-primary-foreground font-bold text-lg shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-transform duration-150 disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'Setting up Profile...' : 'Complete Onboarding'}
          </button>

          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="md:col-span-2 text-center text-xs font-bold text-muted-foreground hover:text-foreground transition-colors py-1 cursor-pointer"
          >
            Skip for now & explore as guest
          </button>
        </form>
      </div>
    </div>
  );
}
