import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Globe, 
  Search, 
  Sparkles, 
  ExternalLink, 
  X, 
  AlertCircle, 
  Loader2, 
  CheckCircle2, 
  BookOpen, 
  Clock,
  ArrowLeft
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { searchGroundedQuery } from '../services/geminiService';
import { cn } from '../lib/utils';
import { useNavigation } from '../context/NavigationContext';

interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
}

interface SearchGroundingHubProps {
  onClose?: () => void;
}

export const SearchGroundingHub: React.FC<SearchGroundingHubProps> = ({ onClose }) => {
  const { goBack, registerModal } = useNavigation();
  const [queryText, setQueryText] = useState('');

  useEffect(() => {
    if (onClose) {
      return registerModal('SearchGroundingHub', onClose);
    }
  }, [onClose, registerModal]);
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);
  const [sources, setSources] = useState<GroundingChunk[]>([]);
  const [error, setError] = useState<string | null>(null);

  const sampleSearchQueries = [
    "What are the latest 2026 exam format updates for NEET and JEE Advanced?",
    "What were the most recent breakthrough discoveries in room-temperature superconductors?",
    "Summarize current NASA Artemis mission status and launch schedules.",
    "What are the updated international guidelines for AI safety research in 2026?"
  ];

  const handleSearch = async () => {
    if (!queryText.trim()) {
      setError('Please enter a research topic or search query.');
      return;
    }

    setLoading(true);
    setError(null);
    setAnswer(null);
    setSources([]);

    try {
      const res = await searchGroundedQuery(queryText.trim());
      setAnswer(res.text);
      setSources(res.sources || []);
    } catch (err: any) {
      console.error("[SearchGroundingHub] Error:", err);
      setError(err?.message || 'Search grounding request failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-8 md:p-10 border border-slate-100 dark:border-slate-800 shadow-lush space-y-8 relative overflow-hidden h-full overflow-y-auto">
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-500/10 via-sky-500/5 to-transparent blur-3xl pointer-events-none rounded-full" />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-tr from-blue-600 to-sky-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
            <Globe className="w-7 h-7 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 text-[10px] font-black uppercase tracking-wider">
                Google Search Grounding
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-sky-100 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 text-[10px] font-black uppercase tracking-wider">
                Live Web Data
              </span>
            </div>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
              Live Search Grounded Research Hub
            </h2>
          </div>
        </div>
        {onClose && (
          <button 
            onClick={goBack}
            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-sky-100 dark:hover:bg-sky-950 hover:text-sky-700 dark:hover:text-sky-300 rounded-2xl font-black text-xs flex items-center gap-2 transition-all shadow-sm cursor-pointer shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to AI Study Buddy</span>
          </button>
        )}
      </div>

      {/* Query Bar */}
      <div className="space-y-3">
        <label className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center justify-between">
          <span>Search Topic / Fact Verification</span>
          <span className="text-[11px] text-blue-600 font-bold">Real-time Web Grounding</span>
        </label>
        
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={queryText}
              onChange={(e) => setQueryText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="e.g., What are the latest exam dates and updates for JEE/NEET or research breakthroughs?"
              className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 font-medium text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={loading}
            className="px-8 py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm shadow-xl shadow-blue-500/20 flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 shrink-0"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
            <span>Search</span>
          </button>
        </div>
      </div>

      {/* Suggested Queries */}
      <div className="space-y-2">
        <label className="text-[11px] font-black uppercase tracking-wider text-slate-400">
          Suggested Live Web Queries
        </label>
        <div className="flex flex-wrap gap-2">
          {sampleSearchQueries.map((q, i) => (
            <button
              key={`sample-search-${i}-${q}`}
              onClick={() => setQueryText(q)}
              className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-blue-100 dark:hover:bg-blue-950 text-slate-700 dark:text-slate-300 hover:text-blue-800 dark:hover:text-blue-200 text-xs font-medium transition-colors text-left truncate max-w-xs"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 flex items-start gap-3 text-xs font-medium">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-500 mt-0.5" />
          <div className="flex-1">{error}</div>
        </div>
      )}

      {/* Result Display */}
      {answer && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6 pt-4 border-t border-slate-100 dark:border-slate-800"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" /> Grounded Fact Answer
            </h3>
            {sources.length > 0 && (
              <span className="text-xs font-bold px-3 py-1 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 rounded-full">
                {sources.length} Verified Sources Found
              </span>
            )}
          </div>

          <div className="p-8 rounded-3xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 text-sm leading-relaxed space-y-4">
            <div className="markdown-body">
              <ReactMarkdown>{answer}</ReactMarkdown>
            </div>
          </div>

          {/* Sources List */}
          {sources.length > 0 && (
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Grounded Web Citations & Sources
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {sources.map((chunk, idx) => chunk.web && (
                  <a
                    key={`source-chunk-${idx}-${chunk.web.uri || idx}`}
                    href={chunk.web.uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400 transition-all flex items-center justify-between group shadow-sm hover:shadow-md"
                  >
                    <div className="min-w-0 flex-1 pr-3">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">
                        {chunk.web.title || chunk.web.uri}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate mt-0.5 font-mono">
                        {chunk.web.uri}
                      </p>
                    </div>
                    <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-blue-500 shrink-0" />
                  </a>
                ))}
              </div>
            </div>
          )}
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

export default SearchGroundingHub;
