import React, { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { motion } from 'motion/react';
import { Flame, Award, BookOpen, CheckCircle2, Trophy, BrainCircuit, ArrowLeft, ShieldCheck, Sparkles } from 'lucide-react';
import StudyProgressCharts from './StudyProgressCharts';
import { useNavigation } from '../context/NavigationContext';

interface ShareData {
  shareId: string;
  userId: string;
  displayName: string;
  currentStreak: number;
  longestStreak: number;
  totalAnalyses: number;
  quizzesCompleted: number;
  masteryScoreAverage: number;
  topicsStudied: string[];
  sharedAt: string;
}

export default function PublicProgressDashboard({ shareId, onBack }: { shareId: string; onBack: () => void }) {
  const { goBack, registerModal } = useNavigation();
  const [data, setData] = useState<ShareData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return registerModal('PublicProgressDashboard', onBack);
  }, [onBack, registerModal]);

  useEffect(() => {
    const fetchShare = async () => {
      try {
        const shareRef = doc(db, 'progress_shares', shareId);
        const snap = await getDoc(shareRef);

        if (snap.exists()) {
          setData(snap.data() as ShareData);
        } else {
          setError("This progress share link was not found or has expired.");
        }
      } catch (err: any) {
        console.error("Fetch progress share error:", err);
        setError("Failed to load progress share data.");
      } finally {
        setLoading(false);
      }
    };

    fetchShare();
  }, [shareId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6">
        <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-4" />
        <p className="text-sm font-bold text-slate-400">Loading Student Progress Dashboard...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen h-full overflow-y-auto bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="p-6 bg-rose-500/10 border border-rose-500/20 rounded-3xl max-w-md space-y-4">
          <p className="text-rose-400 font-bold">{error || "Data unavailable"}</p>
          <button
            onClick={goBack}
            className="px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
          >
            Go to Main App
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen h-full overflow-y-auto bg-slate-950 text-white p-4 sm:p-8 flex flex-col items-center">
      <div className="w-full max-w-4xl space-y-8">
        {/* Top Navbar */}
        <div className="flex items-center justify-between bg-slate-900/80 border border-slate-800 rounded-2xl p-4 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <button
              onClick={goBack}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all flex items-center gap-2 text-xs font-bold cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to AI Study Buddy</span>
            </button>
            <div className="h-4 w-px bg-slate-800" />
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Verified Read-Only Parent & Team View</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-black tracking-wide text-blue-400">Remix Study Buddy</span>
          </div>
        </div>

        {/* Hero Section */}
        <div className="bg-gradient-to-br from-blue-900/40 via-indigo-900/30 to-purple-900/20 border border-blue-500/30 rounded-[2.5rem] p-8 sm:p-10 relative overflow-hidden">
          <div className="relative z-10 space-y-4">
            <span className="px-3 py-1 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-300 font-black text-[10px] uppercase tracking-widest">
              Parent & Mentor Progress Report
            </span>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
              {data.displayName}'s Study Statistics
            </h1>
            <p className="text-sm font-medium text-slate-300 max-w-xl leading-relaxed">
              Real-time academic consistency, quiz performance metrics, and topic mastery tracking generated on {new Date(data.sharedAt).toLocaleDateString()}.
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-slate-900/80 border border-amber-500/30 rounded-3xl p-5 flex flex-col gap-2">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Flame className="w-6 h-6 fill-amber-500" />
            </div>
            <div className="text-3xl font-black text-white mt-1">{data.currentStreak} Days</div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Current Streak</div>
          </div>

          <div className="bg-slate-900/80 border border-purple-500/30 rounded-3xl p-5 flex flex-col gap-2">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <Award className="w-6 h-6" />
            </div>
            <div className="text-3xl font-black text-white mt-1">{data.longestStreak} Days</div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Longest Streak</div>
          </div>

          <div className="bg-slate-900/80 border border-blue-500/30 rounded-3xl p-5 flex flex-col gap-2">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <BookOpen className="w-6 h-6" />
            </div>
            <div className="text-3xl font-black text-white mt-1">{data.totalAnalyses}</div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Study Sessions</div>
          </div>

          <div className="bg-slate-900/80 border border-emerald-500/30 rounded-3xl p-5 flex flex-col gap-2">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Trophy className="w-6 h-6" />
            </div>
            <div className="text-3xl font-black text-white mt-1">{data.masteryScoreAverage}%</div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Mastery Score</div>
          </div>
        </div>

        {/* Recharts Analytics Visualization */}
        <StudyProgressCharts 
          quizzesCompleted={data.quizzesCompleted}
          masteryScoreAverage={data.masteryScoreAverage}
          topicsStudied={data.topicsStudied}
          totalAnalyses={data.totalAnalyses}
          currentStreak={data.currentStreak}
          longestStreak={data.longestStreak}
          isDark={true}
        />

        {/* Topics Studied */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
            <BrainCircuit className="w-5 h-5 text-blue-400" />
            <h3 className="text-lg font-black text-white tracking-tight">Active Topics & Subjects Mastered</h3>
          </div>

          {data.topicsStudied && data.topicsStudied.length > 0 ? (
            <div className="flex flex-wrap gap-2.5 pt-2">
              {data.topicsStudied.map((topic, idx) => (
                <div
                  key={`topic-${idx}-${topic}`}
                  className="px-4 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-xs font-bold text-slate-200 flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{topic}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs font-medium text-slate-400 italic">
              No specific topic tags recorded yet. Regular study sessions update this list automatically.
            </p>
          )}
        </div>

        <p className="text-center text-xs font-medium text-slate-500">
          Generated via Remix AI Study Buddy Pro — Privacy Preserving Academic Analytics.
        </p>
      </div>
    </div>
  );
}
