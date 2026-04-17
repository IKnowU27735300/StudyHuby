
'use client';

import { X, Maximize2, Download, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FileViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileUrl: string | null;
  fileName: string;
  mimeType: string;
  onDownload?: () => void;
}

export default function FileViewerModal({
  isOpen,
  onClose,
  fileUrl,
  fileName,
  mimeType,
  onDownload
}: FileViewerModalProps) {
  if (!isOpen) return null;

  const isPDF = mimeType === 'application/pdf';
  const isImage = mimeType.startsWith('image/');

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-5xl h-[85vh] bg-card border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/5 bg-secondary/30">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Maximize2 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white line-clamp-1">{fileName}</h3>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{mimeType.split('/')[1] || 'File'} Document</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {onDownload && (
                <button
                  onClick={onDownload}
                  className="h-11 px-4 rounded-xl bg-primary/10 text-primary border border-primary/20 hover:bg-primary hover:text-white transition-all transition-colors flex items-center gap-2 text-xs font-bold"
                >
                  <Download className="h-4 w-4" />
                  <span className="hidden sm:inline">Save Copy</span>
                </button>
              )}
              <button
                onClick={onClose}
                className="h-11 w-11 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-rose-500 hover:border-rose-500 transition-all flex items-center justify-center group"
              >
                <X className="h-5 w-5 group-hover:scale-110 transition-transform" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 bg-slate-900/50 relative">
            {!fileUrl ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                <Loader2 className="h-10 w-10 text-primary animate-spin" />
                <p className="text-sm font-bold text-muted-foreground animate-pulse">Loading Document...</p>
              </div>
            ) : (
              <div className="h-full w-full">
                {isPDF ? (
                  <iframe
                    src={`${fileUrl}#toolbar=0`}
                    className="w-full h-full border-none"
                    title={fileName}
                  />
                ) : isImage ? (
                  <div className="w-full h-full flex items-center justify-center p-8">
                    <img
                      src={fileUrl}
                      alt={fileName}
                      className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
                    />
                  </div>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-12 text-center text-white">
                    <div className="h-20 w-20 rounded-3xl bg-secondary mb-6 flex items-center justify-center border border-white/10 shadow-inner">
                      <Download className="h-10 w-10 text-muted-foreground" />
                    </div>
                    <h4 className="text-xl font-black mb-2">Preview Unavailable</h4>
                    <p className="text-sm text-muted-foreground max-w-xs mb-8">
                      This file format cannot be previewed directly. Please download it to view the contents.
                    </p>
                    <button
                      onClick={onDownload}
                      className="px-8 py-4 rounded-2xl bg-white text-slate-950 font-black hover:bg-slate-200 transition-all shadow-xl shadow-white/5"
                    >
                      Download Now
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Footer Info */}
          <div className="p-4 bg-secondary/20 border-t border-white/5 flex items-center justify-center">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2">
              <ShieldCheck className="h-3 w-3 text-emerald-500" />
              Securely rendered via StudyHub Vault
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

import { ShieldCheck } from 'lucide-react';
