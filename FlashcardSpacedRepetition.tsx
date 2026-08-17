import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RotateCcw, Download, Check, Sparkles, Filter, ChevronLeft, ChevronRight, Layers, Flame, Calendar, Clock } from 'lucide-react';
import { Flashcard } from '../types';
import { cn } from '../lib/utils';

export interface SM2Card extends Flashcard {
  id?: string;
  easeFactor?: number;   // default 2.5
  interval?: number;     // days
  repetitions?: number;  // count
  nextReviewDate?: string; // YYYY-MM-DD
}

interface FlashcardSpacedRepetitionProps {
  cards: SM2Card[];
  onUpdateCards?: (updated: SM2Card[]) => void;
  subjectTitle?: string;
}

export default function FlashcardSpacedRepetition({
  cards: initialCards,
  onUpdateCards,
  subjectTitle = "Study Material"
}: FlashcardSpacedRepetitionProps) {
  const [cards, setCards] = useState<SM2Card[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showDueOnly, setShowDueOnly] = useState(true);

  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    // Initialize cards with SM-2 defaults if missing
    const prepared = initialCards.map((c, idx) => ({
      ...c,
      id: c.id || `card_${idx}`,
      easeFactor: c.easeFactor ?? 2.5,
      interval: c.interval ?? 0,
      repetitions: c.repetitions ?? 0,
      nextReviewDate: c.nextReviewDate || todayStr,
    }));
    setCards(prepared);
  }, [initialCards]);

  const dueCards = cards.filter(c => !c.nextReviewDate || c.nextReviewDate <= todayStr);
  const displayCards = showDueOnly ? (dueCards.length > 0 ? dueCards : cards) : cards;

  const currentCard = displayCards[currentIndex] || displayCards[0];

  const handleSM2Rating = (quality: number) => {
    if (!currentCard) return;

    let { easeFactor = 2.5, interval = 0, repetitions = 0 } = currentCard;

    // SM-2 calculation
    if (quality < 3) {
      repetitions = 0;
      interval = 1;
    } else {
      if (repetitions === 0) {
        interval = 1;
      } else if (repetitions === 1) {
        interval = 6;
      } else {
        interval = Math.round(interval * easeFactor);
      }
      repetitions += 1;
    }

    // New ease factor formula
    easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    if (easeFactor < 1.3) easeFactor = 1.3;

    // Calculate next review date
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + interval);
    const nextReviewDate = nextDate.toISOString().split('T')[0];

    const updatedCard: SM2Card = {
      ...currentCard,
      easeFactor,
      interval,
      repetitions,
      nextReviewDate
    };

    const updatedList = cards.map(c => c.id === currentCard.id ? updatedCard : c);
    setCards(updatedList);
    if (onUpdateCards) onUpdateCards(updatedList);

    setIsFlipped(false);
    if (currentIndex < displayCards.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setCurrentIndex(0);
    }
  };

  const handleAnkiExport = () => {
    if (!cards || cards.length === 0) return;

    // Anki import format: Front [TAB] Back
    const lines = cards.map(c => `${c.front.replace(/\t/g, ' ')}\t${c.back.replace(/\t/g, ' ')}`);
    const fileContent = lines.join('\n');

    const blob = new Blob([fileContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const safeTitle = subjectTitle.toLowerCase().replace(/[^a-z0-9]/g, '_');
    link.download = `${safeTitle}_anki_cards.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (!displayCards || displayCards.length === 0) {
    return (
      <div className="p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl text-center space-y-4">
        <p className="text-sm font-bold text-slate-500">No flashcards generated yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Top bar with Due toggle and Anki Export */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 p-3 rounded-2xl">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setShowDueOnly(!showDueOnly);
              setCurrentIndex(0);
              setIsFlipped(false);
            }}
            className={cn(
              "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5",
              showDueOnly
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
            )}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{showDueOnly ? `Due Today (${dueCards.length})` : `Review All (${cards.length})`}</span>
          </button>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Card {currentIndex + 1} of {displayCards.length}
          </span>
        </div>

        <button
          onClick={handleAnkiExport}
          className="px-4 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-sm active:scale-95 shrink-0"
        >
          <Download className="w-3.5 h-3.5 text-blue-500" />
          <span>Export to Anki (.txt)</span>
        </button>
      </div>

      {/* 3D Flip Card */}
      <div className="perspective-1000 min-h-[320px] cursor-pointer" onClick={() => setIsFlipped(!isFlipped)}>
        <motion.div
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="preserve-3d relative w-full h-80 rounded-[2.5rem] bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 shadow-xl p-8 flex flex-col justify-between"
        >
          {/* Front Side */}
          <div className={cn("backface-hidden absolute inset-0 p-8 flex flex-col justify-between", isFlipped && "pointer-events-none")}>
            <div className="flex justify-between items-center text-xs font-black uppercase tracking-widest text-blue-600 dark:text-blue-400">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" />
                QUESTION / CONCEPT
              </span>
              <span className="text-slate-400">Click to reveal answer</span>
            </div>

            <div className="my-auto text-center">
              <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-relaxed">
                {currentCard?.front}
              </p>
            </div>

            <div className="text-center text-xs font-bold text-slate-400">
              Interval: {currentCard?.interval || 0}d · Reps: {currentCard?.repetitions || 0}
            </div>
          </div>

          {/* Back Side */}
          <div className={cn("backface-hidden absolute inset-0 p-8 flex flex-col justify-between bg-gradient-to-br from-blue-50 to-indigo-50/50 dark:from-slate-900 dark:to-blue-950/40 rounded-[2.5rem] [transform:rotateY(180deg)]", !isFlipped && "pointer-events-none")}>
            <div className="flex justify-between items-center text-xs font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
              <span>ANSWER & EXPLANATION</span>
              <span className="text-slate-400">SM-2 Spaced Repetition</span>
            </div>

            <div className="my-auto text-center overflow-y-auto max-h-44 px-2">
              <p className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white leading-relaxed">
                {currentCard?.back}
              </p>
            </div>

            <div className="text-center text-[11px] font-bold text-slate-400">
              Ease: {(currentCard?.easeFactor || 2.5).toFixed(2)} · Next: {currentCard?.nextReviewDate}
            </div>
          </div>
        </motion.div>
      </div>

      {/* SM-2 Rating Controls (Revealed after flip) */}
      {isFlipped ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-4 gap-2 pt-2"
        >
          <button
            onClick={() => handleSM2Rating(1)}
            className="p-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex flex-col items-center gap-1 active:scale-95"
          >
            <span>Again</span>
            <span className="text-[10px] opacity-75 font-mono">1d</span>
          </button>

          <button
            onClick={() => handleSM2Rating(2)}
            className="p-3 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex flex-col items-center gap-1 active:scale-95"
          >
            <span>Hard</span>
            <span className="text-[10px] opacity-75 font-mono">Harder</span>
          </button>

          <button
            onClick={() => handleSM2Rating(3)}
            className="p-3 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex flex-col items-center gap-1 active:scale-95"
          >
            <span>Good</span>
            <span className="text-[10px] opacity-75 font-mono">Standard</span>
          </button>

          <button
            onClick={() => handleSM2Rating(5)}
            className="p-3 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex flex-col items-center gap-1 active:scale-95"
          >
            <span>Easy</span>
            <span className="text-[10px] opacity-75 font-mono">Bonus</span>
          </button>
        </motion.div>
      ) : (
        <div className="flex justify-between items-center text-xs font-bold text-slate-400 px-4">
          <button
            onClick={() => {
              setCurrentIndex(prev => (prev > 0 ? prev - 1 : displayCards.length - 1));
              setIsFlipped(false);
            }}
            className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-white transition-all"
          >
            <ChevronLeft className="w-4 h-4" /> Previous
          </button>
          <span>Tap card to flip answer</span>
          <button
            onClick={() => {
              setCurrentIndex(prev => (prev < displayCards.length - 1 ? prev + 1 : 0));
              setIsFlipped(false);
            }}
            className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-white transition-all"
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
