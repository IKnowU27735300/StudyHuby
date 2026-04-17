
'use client';

import { useEffect } from 'react';
import { AlertCircle, RefreshCcw } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Materials Page Error:', error);
  }, [error]);

  return (
    <div className="flex h-[60vh] flex-col items-center justify-center gap-6 text-center">
      <div className="h-20 w-20 rounded-3xl bg-rose-500/10 flex items-center justify-center">
        <AlertCircle className="h-10 w-10 text-rose-500" />
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl font-black text-white uppercase tracking-tight">Something went wrong</h2>
        <p className="text-muted-foreground text-sm max-w-md">
          {error.message || "We couldn't load the materials. This might be a database connection issue."}
        </p>
      </div>
      <button
        onClick={() => reset()}
        className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-white text-slate-950 font-bold hover:bg-slate-200 transition-all shadow-xl shadow-white/5 active:scale-95"
      >
        <RefreshCcw className="h-4 w-4" />
        Try Again
      </button>
    </div>
  );
}
