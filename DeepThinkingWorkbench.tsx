import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  BrainCircuit, 
  Sparkles, 
  CheckCircle2, 
  X, 
  AlertCircle, 
  Loader2, 
  Send, 
  BookOpen, 
  Cpu, 
  Layers, 
  Copy, 
  Check,
  ArrowLeft
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { solveWithHighThinking } from '../services/geminiService';
import { cn } from '../lib/utils';
import { useNavigation } from '../context/NavigationContext';

interface DeepThinkingWorkbenchProps {
  onClose?: () => void;
  initialQuery?: string;
}

export const DeepThinkingWorkbench: React.FC<DeepThinkingWorkbenchProps> = ({ onClose, initialQuery = '' }) => {
  const { goBack, registerModal } = useNavigation();
  const [queryText, setQueryText] = useState(initialQuery);

  useEffect(() => {
    if (onClose) {
      return registerModal('DeepThinkingWorkbench', onClose);
    }
  }, [onClose, registerModal]);
  const [loading, setLoading] = useState(false);
  const [solution, setSolution] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const samplePrompts = [
    "Prove the Pythagorean Theorem using vector calculus and geometric topology step by step.",
    "Derive the Schrödinger equation for a quantum harmonic oscillator and calculate energy eigenvalues.",
    "Explain the complete biochemical mechanism of CRISPR-Cas9 gene editing and off-target repair pathways.",
    "Solve and derive the step-by-step integration of ∫ (x³ * e^(2x)) dx using integration by parts."
  ];

  const handleSolve = async () => {
    if (!queryText.trim()) {
      setError('Please type a complex question or problem to analyze.');
      return;
    }

    setLoading(true);
    setError(null);
    setSolution(null);

    try {
      const resultText = await solveWithHighThinking(queryText.trim());
      setSolution(resultText);
    } catch (err: any) {
      console.error("[DeepThinkingWorkbench] Error:", err);
      setError(err?.message || 'Failed to complete high reasoning analysis. Please check your query.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!solution) return;
    navigator.clipboard.writeText(solution);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-8 md:p-10 border border-slate-100 dark:border-slate-800 shadow-lush space-y-8 relative overflow-hidden h-full overflow-y-auto">
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent blur-3xl pointer-events-none rounded-full" />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-tr from-emerald-600 to-teal-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
            <BrainCircuit className="w-7 h-7 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 text-[10px] font-black uppercase tracking-wider">
                ThinkingLevel.HIGH
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-teal-100 dark:bg-teal-950/80 text-teal-700 dark:text-teal-300 text-[10px] font-black uppercase tracking-wider">
                Gemini 3.1 Pro Preview
              </span>
            </div>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
              Deep Thinking & Logic Workbench
            </h2>
          </div>
        </div>
        {onClose && (
          <button 
            onClick={goBack}
            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-emerald-100 dark:hover:bg-emerald-950 hover:text-emerald-700 dark:hover:text-emerald-300 rounded-2xl font-black text-xs flex items-center gap-2 transition-all shadow-sm cursor-pointer shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to AI Study Buddy</span>
          </button>
        )}
      </div>

      {/* Intro Description */}
      <div className="p-6 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 text-slate-700 dark:text-slate-300 text-xs font-medium leading-relaxed">
        <p className="font-bold text-emerald-800 dark:text-emerald-300 mb-1 flex items-center gap-2">
          <Cpu className="w-4 h-4 text-emerald-600" /> Maximum Neural Reasoning Active
        </p>
        <p>
          This mode forces Gemini 3.1 Pro to perform deep internal reasoning step-by-step. Perfect for solving complex calculus derivations, physics mechanics, proof verifications, and advanced academic problems.
        </p>
      </div>

      {/* Sample Question Chips */}
      <div className="space-y-2">
        <label className="text-[11px] font-black uppercase tracking-wider text-slate-400">
          Try a High-Thinking Sample Problem
        </label>
        <div className="flex flex-wrap gap-2">
          {samplePrompts.map((sample, i) => (
            <button
              key={`deep-sample-${i}-${sample}`}
              onClick={() => setQueryText(sample)}
              className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-100 dark:hover:bg-emerald-950 text-slate-700 dark:text-slate-300 hover:text-emerald-800 dark:hover:text-emerald-200 text-xs font-medium transition-colors text-left truncate max-w-xs"
            >
              {sample}
            </button>
          ))}
        </div>
      </div>

      {/* Problem Input Box */}
      <div className="space-y-3">
        <label className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Your Complex Problem or Query
        </label>
        <textarea
          value={queryText}
          onChange={(e) => setQueryText(e.target.value)}
          placeholder="Type or paste your complex question, proof request, math problem, or physics derivation here..."
          className="w-full h-32 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 font-medium text-sm focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
        />
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 flex items-start gap-3 text-xs font-medium">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-500 mt-0.5" />
          <div className="flex-1">{error}</div>
        </div>
      )}

      {/* Action Button */}
      <button
        onClick={handleSolve}
        disabled={loading}
        className="w-full py-5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-base shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-3 transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <Loader2 className="w-6 h-6 animate-spin" />
            <span>Performing High Reasoning Analysis...</span>
          </>
        ) : (
          <>
            <Sparkles className="w-6 h-6" />
            <span>Execute High Thinking Solution</span>
          </>
        )}
      </button>

      {/* Result Display */}
      {solution && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" /> Deep Reasoned Solution
            </h3>
            <button
              onClick={handleCopy}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-2 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied Solution!' : 'Copy Explanation'}</span>
            </button>
          </div>

          <div className="p-8 rounded-3xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 text-sm leading-relaxed overflow-x-auto space-y-4">
            <div className="markdown-body">
              <ReactMarkdown>{solution}</ReactMarkdown>
            </div>
          </div>
        </motion.div>
      )}

      {/* Bottom Back Action Bar */}
      {onClose && (
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-black text-xs flex items-center gap-2 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Main Studio Dashboard</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default DeepThinkingWorkbench;
