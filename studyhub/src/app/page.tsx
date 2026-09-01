'use client';

import { LayoutDashboard, BookOpen, ShieldCheck, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import ContributorsBox from '@/components/ContributorsBox';

export default function LandingPage() {
  const { user, loginWithGoogle, loading } = useAuth();
  const router = useRouter();

  const handleStartExploring = async () => {
    if (user) {
      router.push('/dashboard');
    } else {
      try {
        await loginWithGoogle();
        router.push('/dashboard');
      } catch {
        // User closed the popup or cancelled login
      }
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background flex flex-col items-center">
      {/* Animated Background Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] animate-float" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/20 rounded-full blur-[120px] animate-float opacity-50" />

      {/* Navigation */}
      <nav className="relative z-10 w-full max-w-7xl px-8 py-8 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/20">
            <span className="text-xl font-black text-white">SH</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground font-outfit">StudyHub</h1>
        </div>
        <div className="flex items-center gap-8">
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <Link href="#features" className="hover:text-foreground transition-colors">Features</Link>
            <Link href="#community" className="hover:text-foreground transition-colors">Community</Link>
            <Link href="#about" className="hover:text-foreground transition-colors">About</Link>
          </div>
          <button 
            onClick={handleStartExploring}
            disabled={loading}
            className="group relative inline-flex items-center gap-2 overflow-hidden rounded-2xl bg-foreground px-8 py-3.5 text-sm font-bold text-background transition-all hover:scale-105 active:scale-95 shadow-xl shadow-foreground/10 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Entering...' : 'Get Started'}
            <Sparkles className="h-4 w-4" />
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <main id="about" className="relative z-10 flex-1 flex flex-col items-center justify-center px-8 pt-20 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-4 py-1.5 mb-8 backdrop-blur-sm">
          <span className="text-xs font-bold uppercase tracking-widest text-primary">New: Version 2.0 is live</span>
          <div className="h-1 w-1 rounded-full bg-border" />
          <span className="text-xs font-semibold text-muted-foreground">Share smarter, learn faster</span>
        </div>

        <h2 className="max-w-4xl text-5xl md:text-7xl lg:text-8xl font-black font-outfit tracking-tight text-foreground mb-8">
          The Hub for<br />
          <span className="gradient-text">Student Resources</span>
        </h2>

        <p className="max-w-2xl text-lg md:text-xl text-muted-foreground mb-12 leading-relaxed">
          Access high-quality study materials, research papers, and previous year questions. 
          Built by students, for students. Join the community of elite learners today.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-6">
          <button 
            onClick={handleStartExploring}
            disabled={loading}
            className="h-14 px-10 rounded-2xl bg-primary text-white font-bold inline-flex items-center justify-center gap-2 shadow-2xl shadow-primary/40 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Please wait...' : 'Start Exploring'}
          </button>
        </div>

        {/* Feature Preview Cards */}
        <div id="features" className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-7xl pb-24 scroll-mt-24">
          {[
            { title: 'Study Materials', desc: 'Handwritten notes, lab manuals, and chapter summaries.', icon: BookOpen, color: 'text-blue-500' },
            { title: 'Research Papers', desc: 'Latest publications and research work from campus peers.', icon: ShieldCheck, color: 'text-purple-500' },
            { title: 'Exam Vault', desc: 'Previous year question papers and official model papers.', icon: LayoutDashboard, color: 'text-orange-500' },
          ].map((feature, i) => (
            <div key={i} className="glass group rounded-[2.5rem] p-8 text-left transition-all hover:border-primary/40 border border-border bg-card">
              <div className={`h-12 w-12 rounded-2xl bg-secondary border border-border flex items-center justify-center mb-6 shadow-2xl transition-transform group-hover:scale-110 group-hover:rotate-3`}>
                <feature.icon className={`h-6 w-6 ${feature.color}`} />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">{feature.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>

        {/* Contributors Section */}
        <div id="community" className="w-full max-w-7xl scroll-mt-24">
          <ContributorsBox />
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full border-t border-border bg-card/50 py-12 px-8 flex justify-center">
        <div className="w-full max-w-7xl flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
              <span className="text-xs font-black text-white">SH</span>
            </div>
            <span className="font-bold text-foreground">StudyHub</span>
            <span className="text-muted-foreground ml-4 text-xs">© 2026 StudyHub Inc.</span>
          </div>
          <div className="flex gap-8 text-sm text-muted-foreground">
            <Link href="#" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-foreground transition-colors">Terms</Link>
            <Link href="#" className="hover:text-foreground transition-colors">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

