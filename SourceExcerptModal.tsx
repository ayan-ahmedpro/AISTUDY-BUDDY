import React from 'react';
import { FileText, X, Globe, Youtube, Video, Sparkles, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { NotebookSource } from '../types';

interface SourceExcerptModalProps {
  source: NotebookSource | null;
  onClose: () => void;
  highlightText?: string;
}

export const SourceExcerptModal: React.FC<SourceExcerptModalProps> = ({
  source,
  onClose,
  highlightText
}) => {
  if (!source) return null;

  const Icon = source.type === 'youtube' ? Youtube : source.type === 'url' ? Globe : source.type === 'video_ref' ? Video : FileText;

  // Simple text snippet formatting with highlight if snippet is available
  const textContent = source.extractedText || 'No text extracted for this source.';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[130] bg-slate-950/70 backdrop-blur-md overflow-y-auto p-4 md:p-8 flex justify-center items-start">
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="bg-slate-900 border border-slate-800 text-slate-100 w-full max-w-2xl my-auto rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        >
          {/* Header */}
          <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-500/20 text-indigo-400 rounded-xl flex items-center justify-center border border-indigo-500/30">
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20">
                    Source Citation
                  </span>
                  {source.url && (
                    <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-indigo-400 hover:underline">
                      Open Original
                    </a>
                  )}
                </div>
                <h3 className="text-base font-black text-white mt-0.5">{source.name}</h3>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800 rounded-xl transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body content */}
          <div className="p-6 overflow-y-auto space-y-4">
            {highlightText && (
              <div className="p-4 bg-indigo-950/40 border border-indigo-500/30 rounded-2xl">
                <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs mb-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  Grounded Citation Focus
                </div>
                <p className="text-sm font-medium text-indigo-200 leading-relaxed italic">
                  "{highlightText}"
                </p>
              </div>
            )}

            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 text-xs text-slate-300 font-mono leading-relaxed whitespace-pre-wrap max-h-[400px] overflow-y-auto">
              {textContent}
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold text-xs uppercase tracking-wider transition-all"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
export default SourceExcerptModal;
