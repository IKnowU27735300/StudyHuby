import { Code, Eye, Globe, ShieldCheck, Zap, Sparkles } from 'lucide-react';

export default function ContributorsBox() {
  return (
    <section className="w-full max-w-7xl px-8 py-24 relative overflow-visible" id="community">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] pointer-events-none opacity-30" />
      
      <div className="relative z-10 flex flex-col items-center">
        {/* Title Section (Optional, keeping it clean based on Image 2) */}
        <div className="text-center mb-24 opacity-0 animate-fade-in" style={{ animationDelay: '0.2s', animationFillMode: 'forwards' }}>
          <h2 className="text-4xl md:text-5xl font-black font-outfit text-white mb-4">
             Meet the <span className="gradient-text">Project Visionary</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
             The soul behind StudyHub's mission to revolutionize academic resource sharing.
          </p>
        </div>

        <div className="relative group max-w-3xl w-full">
          {/* 3D Avatar Image - Popping out of the card */}
          <div className="absolute -top-32 -left-12 w-64 h-64 z-20 pointer-events-none transform -rotate-6 transition-transform group-hover:rotate-0 duration-500">
            <img 
              src="/anish-avatar.png" 
              alt="Anish" 
              className="w-full h-full object-contain"
            />
          </div>

          {/* Main Card */}
          <div className="relative glass p-12 md:p-16 rounded-[3rem] border border-white/10 bg-slate-900/40 backdrop-blur-2xl shadow-2xl overflow-hidden group-hover:border-primary/30 transition-all duration-500">
            {/* Background Decorative Gradient */}
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
            
            <div className="relative z-10 flex flex-col items-center">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-6 py-2 mb-8">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/80">Project Visionary</span>
              </div>

              {/* Name */}
              <h1 className="text-4xl md:text-6xl font-black font-outfit text-white mb-6 italic tracking-tight text-center">
                Anish Tanaji Inamadar
              </h1>

              {/* Email Button */}
              <a 
                href="mailto:anishinamadar11111@gmail.com"
                className="inline-flex items-center px-8 py-3 rounded-2xl bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-all duration-300 mb-12 font-mono text-sm tracking-wide"
              >
                anishinamadar11111@gmail.com
              </a>

              {/* Social Icons */}
              <div className="flex gap-6 mb-12">
                <a 
                  href="https://github.com/IKnowU27735300" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="h-16 w-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-primary hover:text-white hover:scale-110 transition-all shadow-xl"
                >
                  <Code className="h-7 w-7" />
                </a>
                <a 
                  href="https://resume-nu-red-78.vercel.app/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="h-16 w-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-primary hover:text-white hover:scale-110 transition-all shadow-xl"
                >
                  <Eye className="h-7 w-7" />
                </a>
                <a 
                  href="https://www.linkedin.com/in/anish-inamadar-858461303" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="h-16 w-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-primary hover:text-white hover:scale-110 transition-all shadow-xl"
                >
                  <Globe className="h-7 w-7" />
                </a>
              </div>

              {/* Decorative Line */}
              <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-12" />

              {/* Footer Labels */}
              <div className="grid grid-cols-2 gap-12 w-full">
                <div className="flex items-center justify-center gap-3">
                  <ShieldCheck className="h-5 w-5 text-muted-foreground/60" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Verified Contributor</span>
                </div>
                <div className="flex items-center justify-center gap-3">
                  <Zap className="h-5 w-5 text-muted-foreground/60" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Systems Architect</span>
                </div>
              </div>
            </div>

            {/* Shine Animation */}
            <div className="absolute top-0 -left-[100%] w-[100%] h-full bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-[-25deg] group-hover:left-[100%] transition-all duration-1000 ease-in-out" />
          </div>
        </div>
      </div>
    </section>
  );
}
