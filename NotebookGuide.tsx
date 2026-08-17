import React, { useState } from 'react';
import { 
  BookOpen, 
  HelpCircle, 
  Clock, 
  Sparkles, 
  Bookmark, 
  Check, 
  ChevronDown, 
  ChevronUp, 
  FileText,
  Share2,
  List,
  RotateCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { NotebookGuideData, FAQItem, NotebookNote } from '../types';

interface NotebookGuideProps {
  guide?: NotebookGuideData;
  isLoading?: boolean;
  onSaveNote: (title: string, content: string, sourceRefs?: string[]) => void;
  onGenerateGuide: () => void;
  age?: number;
}

export const NotebookGuide: React.FC<NotebookGuideProps> = ({
  guide,
  isLoading,
  onSaveNote,
  onGenerateGuide,
  age = 18
}) => {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [savedNotes, setSavedNotes] = useState<Record<string, boolean>>({});

  const handleSaveFaq = (faq: FAQItem, idx: number) => {
    const key = `faq-${idx}`;
    onSaveNote(`FAQ: ${faq.question}`, faq.answer, faq.sourceRefs);
    setSavedNotes(prev => ({ ...prev, [key]: true }));
    setTimeout(() => {
      setSavedNotes(prev => ({ ...prev, [key]: false }));
    }, 2000);
  };

  if (isLoading) {
    return (
      <div className="p-12 text-center bg-slate-900/60 border border-slate-800 rounded-[2.5rem] my-8 max-w-4xl mx-auto">
        <div className="w-16 h-16 bg-indigo-600/20 text-indigo-400 rounded-3xl flex items-center justify-center mx-auto mb-4 animate-bounce">
          <Sparkles className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-black text-white">Synthesizing Notebook Guide...</h3>
        <p className="text-xs text-slate-400 mt-2 max-w-md mx-auto">
          Analyzing all active sources to compile exam briefings, FAQs, timeline ordering, and revision outlines.
        </p>
      </div>
    );
  }

  if (!guide) {
    return (
      <div className="p-12 text-center bg-slate-900/60 border border-slate-800 rounded-[2.5rem] my-8 max-w-4xl mx-auto">
        <div className="w-16 h-16 bg-indigo-600/10 text-indigo-400 rounded-3xl flex items-center justify-center mx-auto mb-4">
          <BookOpen className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-black text-white">Notebook Study Guide</h3>
        <p className="text-xs text-slate-400 mt-2 max-w-md mx-auto mb-6">
          Generate an executive briefing, top 8-12 likely exam questions with source citations, and structured revision outlines from your sources.
        </p>
        <button
          onClick={onGenerateGuide}
          className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-indigo-600/30 active:scale-95"
        >
          Generate Guide Now
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Executive Briefing Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="notebook-page-black notebook-binder-holes pl-14 pr-8 py-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 p-8 opacity-10 text-indigo-400">
          <Sparkles className="w-40 h-40" />
        </div>

        <div className="relative z-10 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-black uppercase tracking-widest">
              <BookOpen className="w-4 h-4" />
              Executive Briefing & Exam Framing
            </div>
            <button
              onClick={onGenerateGuide}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600/30 hover:bg-indigo-600/60 border border-indigo-500/40 text-indigo-200 hover:text-white rounded-xl font-black text-xs uppercase tracking-wider transition-all active:scale-95 disabled:opacity-50 shadow-md"
              title="Refresh and regenerate Study Guide"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh Guide
            </button>
          </div>
          <p className="text-base font-medium text-slate-100 leading-relaxed max-w-3xl">
            {guide.briefing}
          </p>
        </div>
      </motion.div>

      {/* Top 8-12 FAQ Questions */}
      <div className="notebook-grid-black border border-slate-800 p-8 rounded-[2.5rem] space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-500/20 text-indigo-400 rounded-xl flex items-center justify-center">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">Likely Exam FAQs ({guide.faq?.length || 0})</h3>
              <p className="text-xs text-slate-400">Grounded in your active notebook sources</p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {guide.faq?.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            const isSaved = savedNotes[`faq-${idx}`];
            return (
              <div
                key={`faq-item-${idx}-${faq.question}`}
                className="border border-slate-800/80 bg-slate-950/60 rounded-2xl overflow-hidden transition-all"
              >
                <button
                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 hover:bg-slate-800/30 transition-colors"
                >
                  <span className="font-bold text-sm text-slate-100 flex-1">
                    {idx + 1}. {faq.question}
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    {faq.sourceRefs && faq.sourceRefs.length > 0 && (
                      <span className="text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-md">
                        {faq.sourceRefs.length} Cited
                      </span>
                    )}
                    {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </div>
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="px-5 pb-5 pt-2 border-t border-slate-800/60 bg-slate-950/90 text-xs text-slate-300 space-y-3"
                    >
                      <p className="leading-relaxed font-medium">{faq.answer}</p>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-800/40">
                        <div className="flex items-center gap-2 text-[10px] text-slate-500">
                          {faq.sourceRefs?.map((sr, srIdx) => (
                            <span key={`${sr}-${srIdx}`} className="bg-slate-800 px-2 py-0.5 rounded text-slate-400">
                              Ref: {sr}
                            </span>
                          ))}
                        </div>

                        <button
                          onClick={() => handleSaveFaq(faq, idx)}
                          className="px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 transition-all"
                        >
                          {isSaved ? <Check className="w-3 h-3 text-emerald-400" /> : <Bookmark className="w-3 h-3" />}
                          {isSaved ? 'Saved to Notes!' : 'Save as Note'}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>

      {/* Timeline section if present */}
      {guide.timeline && guide.timeline.length > 0 && (
        <div className="bg-slate-900/80 border border-slate-800 p-8 rounded-[2.5rem] space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
            <div className="w-10 h-10 bg-indigo-500/20 text-indigo-400 rounded-xl flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">Chronological Timeline & Process Order</h3>
              <p className="text-xs text-slate-400">Sequential events & procedural steps</p>
            </div>
          </div>

          <div className="relative pl-6 space-y-6 border-l-2 border-indigo-500/30 ml-3">
            {guide.timeline.map((item, idx) => (
              <div key={`timeline-${idx}-${item.event}`} className="relative group">
                <div className="absolute -left-[31px] top-1.5 w-4 h-4 bg-indigo-600 rounded-full border-4 border-slate-900" />
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400 block mb-1">
                    {item.date_or_order}
                  </span>
                  <p className="text-xs font-bold text-slate-200">{item.event}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Structured Outline */}
      <div className="bg-slate-900/80 border border-slate-800 p-8 rounded-[2.5rem] space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <div className="w-10 h-10 bg-indigo-500/20 text-indigo-400 rounded-xl flex items-center justify-center">
            <List className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-black text-white">Structured Revision Outline</h3>
            <p className="text-xs text-slate-400">Comprehensive summary breakdown</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {guide.studyGuide?.map((sec, idx) => (
            <div key={`outline-${idx}-${sec.heading}`} className="bg-slate-950 p-6 rounded-3xl border border-slate-800 space-y-3">
              <h4 className="font-bold text-sm text-indigo-300 border-b border-slate-800/80 pb-2 flex items-center justify-between">
                <span>{sec.heading}</span>
                <button
                  onClick={() => onSaveNote(`Outline: ${sec.heading}`, sec.bullets.join('\n• '))}
                  className="text-slate-500 hover:text-indigo-400 transition-colors"
                  title="Save outline block to notes"
                >
                  <Bookmark className="w-4 h-4" />
                </button>
              </h4>
              <ul className="space-y-2 text-xs text-slate-300 font-medium">
                {sec.bullets.map((b, bIdx) => (
                  <li key={`bullet-${idx}-${bIdx}`} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-1.5 shrink-0" />
                    <span className="leading-relaxed">{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
export default NotebookGuide;
