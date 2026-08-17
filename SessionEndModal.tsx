import React from 'react';
import { 
  X, 
  Timer, 
  Sparkles, 
  CheckCircle, 
  Coffee, 
  HelpCircle, 
  Layers, 
  Brain, 
  ArrowRight,
  Flame,
  Award
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SessionEndModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionDurationSeconds: number;
  activeNotebookTitle?: string;
  flashcardsReviewedCount?: number;
  quizQuestionsAnswered?: number;
  onStartBreak: () => void;
  onOpenQuiz: () => void;
  onOpenFlashcards: () => void;
}

export const SessionEndModal: React.FC<SessionEndModalProps> = ({
  isOpen,
  onClose,
  sessionDurationSeconds = 1500,
  activeNotebookTitle = 'Active Study Material',
  flashcardsReviewedCount = 12,
  quizQuestionsAnswered = 5,
  onStartBreak,
  onOpenQuiz,
  onOpenFlashcards
}) => {
  if (!isOpen) return null;

  const minutes = Math.floor(sessionDurationSeconds / 60);
  const seconds = sessionDurationSeconds % 60;
  const formattedDuration = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;

  // Smart next-step recommendations
  const recommendations = [
    {
      title: 'Rest & Consolidate Memory',
      desc: 'Take a 5-minute cognitive break to strengthen neural connections before your next burst.',
      actionLabel: 'Start 5-Min Break ☕',
      onClick: () => {
        onClose();
        onStartBreak();
      },
      primary: true
    },
    {
      title: 'Active Recall Check',
      desc: 'Test what you just read with a 5-question quick assessment quiz.',
      actionLabel: 'Take Practice Quiz 🎯',
      onClick: () => {
        onClose();
        onOpenQuiz();
      }
    },
    {
      title: 'Review Spaced Flashcards',
      desc: 'Reinforce weak terms using adaptive spaced repetition flashcards.',
      actionLabel: 'Open Flashcards 🃏',
      onClick: () => {
        onClose();
        onOpenFlashcards();
      }
    }
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[130] bg-slate-950/80 backdrop-blur-md overflow-y-auto p-4 md:p-8 flex justify-center items-center">
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="bg-slate-900 border border-slate-800 text-slate-100 w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden my-auto p-6 md:p-8 relative space-y-6"
        >
          {/* Header Banner */}
          <div className="flex items-start justify-between border-b border-slate-800 pb-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shadow-lg shadow-amber-500/10">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">
                  Focus Session Complete
                </span>
                <h3 className="text-xl font-black text-white mt-0.5">Session Summary</h3>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white bg-slate-800/60 rounded-xl transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Key Session Metrics */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Timer className="w-3.5 h-3.5 text-orange-400" />
                <span>Time Focused</span>
              </p>
              <p className="text-xl font-black text-white">{formattedDuration}</p>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Brain className="w-3.5 h-3.5 text-indigo-400" />
                <span>Active Topic</span>
              </p>
              <p className="text-xs font-bold text-indigo-300 truncate">{activeNotebookTitle}</p>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-emerald-400" />
                <span>Flashcards Reviewed</span>
              </p>
              <p className="text-xl font-black text-emerald-400">{flashcardsReviewedCount} Cards</p>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Award className="w-3.5 h-3.5 text-amber-400" />
                <span>Quiz Practice</span>
              </p>
              <p className="text-xl font-black text-amber-400">{quizQuestionsAnswered} Solved</p>
            </div>
          </div>

          {/* Next Step Recommendations */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Smart Next Steps</span>
              </h4>
            </div>

            <div className="space-y-2">
              {recommendations.map((rec, idx) => (
                <div
                  key={`rec-${idx}`}
                  className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                    rec.primary
                      ? 'bg-indigo-950/40 border-indigo-500/40'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-0.5">
                    <h5 className="text-xs font-black text-white">{rec.title}</h5>
                    <p className="text-[11px] text-slate-400 leading-tight">{rec.desc}</p>
                  </div>

                  <button
                    onClick={rec.onClick}
                    className={`px-3 py-2 rounded-xl text-xs font-black shrink-0 transition-all cursor-pointer flex items-center gap-1 ${
                      rec.primary
                        ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                    }`}
                  >
                    <span>{rec.actionLabel}</span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Close Action */}
          <div className="pt-2">
            <button
              onClick={onClose}
              className="w-full py-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white rounded-2xl text-xs font-bold transition-all text-center cursor-pointer"
            >
              Close & Return to Dashboard
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
