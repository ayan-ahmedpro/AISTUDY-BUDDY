import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, User as UserIcon, Flame, Award, Share2, CreditCard, Copy, 
  ExternalLink, Zap, CheckCircle2, ShieldCheck, Database, ArrowLeft, 
  Settings, Globe, Sliders, Lock, BarChart2, History, Receipt, XCircle, 
  Clock, AlertCircle, RefreshCw, FileText
} from 'lucide-react';
import { User } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UserStatsData, createProgressShare } from '../lib/userStats';
import { copyToClipboard } from '../lib/utils';
import StudyProgressCharts from './StudyProgressCharts';
import { useNavigation } from '../context/NavigationContext';
import { generateStudyProgressPDF } from '../lib/pdfExporter';

interface AccountSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  stats: UserStatsData | null;
  quizzesCompleted?: number;
  masteryScoreAverage?: number;
  topicsStudied?: string[];
  onOpenUpgrade: () => void;
  selectedLanguage?: string;
  onChangeLanguage?: (lang: string) => void;
  selectedAge?: number;
  onChangeAge?: (age: number) => void;
}

export default function AccountSettingsModal({
  isOpen,
  onClose,
  user,
  stats,
  quizzesCompleted = 0,
  masteryScoreAverage = 0,
  topicsStudied = [],
  onOpenUpgrade,
  selectedLanguage = 'English',
  onChangeLanguage,
  selectedAge = 20,
  onChangeAge
}: AccountSettingsModalProps) {
  const { goBack, registerModal } = useNavigation();
  const [activeTab, setActiveTab] = useState<'profile' | 'preferences' | 'analytics' | 'progress' | 'subscription' | 'payment_history'>('profile');
  const [copiedRef, setCopiedRef] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [loadingShare, setLoadingShare] = useState(false);

  // PDF Export state
  const [exportingPdf, setExportingPdf] = useState(false);

  const handleExportPDFReport = async () => {
    if (!user) return;
    setExportingPdf(true);
    try {
      const q = query(collection(db, `users/${user.uid}/sessions`));
      const snap = await getDocs(q);
      const sessionList = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
      await generateStudyProgressPDF(sessionList);
    } catch (err) {
      console.error("PDF Export error:", err);
      alert("Failed to export PDF report. Please try again.");
    } finally {
      setExportingPdf(false);
    }
  };

  // User Payment History state
  const [userPayments, setUserPayments] = useState<any[]>([]);
  const [loadingPayments, setLoadingPayments] = useState<boolean>(false);

  const fetchUserPaymentHistory = async () => {
    if (!user) return;
    setLoadingPayments(true);
    try {
      const payMap = new Map<string, any>();

      // 1. Fetch top-level payment_requests where userId == user.uid
      try {
        const q1 = query(collection(db, 'payment_requests'), where('userId', '==', user.uid));
        const snap1 = await getDocs(q1);
        snap1.docs.forEach(d => payMap.set(d.id, { id: d.id, ...d.data() }));
      } catch (e) {
        console.warn("Top-level query by userId error:", e);
      }

      // 2. Fetch top-level payment_requests where userEmail == user.email
      if (user.email) {
        try {
          const q2 = query(collection(db, 'payment_requests'), where('userEmail', '==', user.email));
          const snap2 = await getDocs(q2);
          snap2.docs.forEach(d => payMap.set(d.id, { id: d.id, ...d.data() }));
        } catch (e) {
          console.warn("Top-level query by userEmail error:", e);
        }
      }

      // 3. Fetch subcollection users/{user.uid}/payment_requests
      try {
        const subSnap = await getDocs(collection(db, 'users', user.uid, 'payment_requests'));
        subSnap.docs.forEach(d => payMap.set(d.id, { id: d.id, ...d.data() }));
      } catch (e) {
        console.warn("Subcollection query error:", e);
      }

      // 4. Local storage backup
      try {
        const localSubs = JSON.parse(localStorage.getItem('pending_payment_proofs') || '[]');
        localSubs.forEach((item: any) => {
          if (item.id && (item.userId === user.uid || item.userEmail === user.email) && !payMap.has(item.id)) {
            payMap.set(item.id, item);
          }
        });
      } catch (e) {}

      const list = Array.from(payMap.values());
      list.sort((a, b) => new Date(b.submittedAt || b.paidAt || 0).getTime() - new Date(a.submittedAt || a.paidAt || 0).getTime());
      setUserPayments(list);
    } catch (err) {
      console.error("Error fetching user payment history:", err);
    } finally {
      setLoadingPayments(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setActiveTab('profile');
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && user) {
      fetchUserPaymentHistory();
    }
  }, [isOpen, user]);

  useEffect(() => {
    if (isOpen) {
      return registerModal('AccountSettingsModal', onClose);
    }
  }, [isOpen, onClose, registerModal]);

  const baseUrl = window.location.href.split('?')[0].split('#')[0];
  const refLink = `${baseUrl}?ref=${stats?.refCode || user?.uid?.substring(0, 6).toUpperCase() || 'PRO'}`;

  // Close on ESC key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCopyRef = async () => {
    await copyToClipboard(refLink);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2000);
  };

  const handleGenerateShareLink = async () => {
    setLoadingShare(true);
    try {
      const targetUser = user || ({
        uid: 'guest_' + Math.random().toString(36).substring(2, 8),
        displayName: 'Remix Student Guest',
        email: 'guest@remix.study'
      } as any);

      const shareId = await createProgressShare(targetUser, {
        currentStreak: stats?.currentStreak || 1,
        longestStreak: stats?.longestStreak || 1,
        totalAnalyses: stats?.analysesUsed || 0,
        quizzesCompleted,
        masteryScoreAverage,
        topicsStudied
      });
      const url = `${window.location.origin}?shareId=${shareId}`;
      setShareUrl(url);
      await copyToClipboard(url);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2500);
    } catch (err) {
      console.error("Share error:", err);
      alert("Failed to generate progress link. Please try again.");
    } finally {
      setLoadingShare(false);
    }
  };

  const userLimit = stats?.isPro ? 50 : 10;
  const isLimitExceeded = (stats?.analysesUsed || 0) >= userLimit;

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-hidden"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl max-h-[90vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-5 sm:p-7 shadow-2xl overflow-hidden text-slate-900 dark:text-white flex flex-col"
        >
          {/* Top Header Section (Fixed) */}
          <div className="shrink-0">
            {/* Top Bar with Back and Close */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={goBack}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-all flex items-center gap-2 group cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span>Back to AI Study Buddy</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer"
                title="Close Settings (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile Badge Header */}
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center text-xl font-black shadow-lg shrink-0">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName ? `${user.displayName}'s Profile Avatar` : "Student Profile Avatar"} className="w-full h-full rounded-2xl object-cover" />
                ) : (
                  user?.displayName?.[0] || 'S'
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white truncate">
                    {user?.displayName || 'Guest Student'}
                  </h3>
                  {stats?.isPro ? (
                    <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black text-[10px] uppercase tracking-wider shrink-0">
                      PRO
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold text-[10px] uppercase tracking-wider shrink-0">
                      FREE PLAN
                    </span>
                  )}
                </div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate">
                  {user?.email || 'Signed in • Cloud Database Auto-Sync Active'}
                </p>
              </div>
            </div>

            {/* Settings Tabs */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 mb-4 gap-2 overflow-x-auto no-scrollbar">
              <button
                type="button"
                onClick={() => setActiveTab('profile')}
                className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'profile'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <UserIcon className="w-4 h-4" />
                <span>Profile & Sync</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('preferences')}
                className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'preferences'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Sliders className="w-4 h-4" />
                <span>Study Preferences</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('analytics')}
                className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'analytics'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <BarChart2 className="w-4 h-4" />
                <span>Study Analytics</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('progress')}
                className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'progress'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Share2 className="w-4 h-4" />
                <span>Parent/Team Link</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('subscription')}
                className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'subscription'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>Subscription & Billing</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('payment_history')}
                className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'payment_history'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <History className="w-4 h-4" />
                <span>Payment History</span>
                {userPayments.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold text-[10px]">
                    {userPayments.length}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Main Scrollable Tab Panels Body */}
          <div className="flex-1 overflow-y-auto min-h-0 pr-1.5 space-y-6 scroll-smooth focus:outline-none">

          {/* Tab 1: Profile & Sync */}
          {activeTab === 'profile' && (
            <div className="space-y-4">
              <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-emerald-500" />
                    <span className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                      Firestore Database Backup Status
                    </span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-[10px] uppercase">
                    Connected & Live
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  All your notebooks, flashcard progress, study notes, and quiz scores are automatically saved to your cloud profile.
                </p>
              </div>

              {/* Streak Stats Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                    <Flame className="w-6 h-6 fill-amber-500 text-amber-500" />
                  </div>
                  <div>
                    <div className="text-2xl font-black text-slate-900 dark:text-white">
                      {stats?.currentStreak || 1} Days
                    </div>
                    <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Current Streak
                    </div>
                  </div>
                </div>

                <div className="bg-purple-500/10 border border-purple-500/20 rounded-2xl p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                    <Award className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-2xl font-black text-slate-900 dark:text-white">
                      {stats?.longestStreak || 1} Days
                    </div>
                    <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Longest Streak
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Study Preferences */}
          {activeTab === 'preferences' && (
            <div className="space-y-4">
              <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-5 space-y-4">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">
                    Default Cognitive Age Level
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {[7, 15, 25, 40, 50].map((age) => (
                      <button
                        key={`acc-age-${age}`}
                        type="button"
                        onClick={() => onChangeAge && onChangeAge(age)}
                        className={`py-2 rounded-xl font-bold text-xs transition-all border ${
                          selectedAge === age
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {age === 50 ? '50+' : `${age} yrs`}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">
                    Output Language
                  </label>
                  <select
                    value={selectedLanguage}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (onChangeLanguage) onChangeLanguage(val);
                    }}
                    className="w-full p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option value="English">English</option>
                    <option value="Urdu">Urdu (اردو) — Free ✨</option>
                    <option value="Arabic">Arabic (العربية) — Free ✨</option>
                    <option value="Spanish">Spanish (Español) — Free ✨</option>
                    <option value="French">French (Français) — Free ✨</option>
                    <option value="Hindi">Hindi (हिंदी) — Free ✨</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Study Analytics & Recharts Progress */}
          {activeTab === 'analytics' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-900/30 to-indigo-900/30 border border-blue-500/20 rounded-2xl">
                <div>
                  <h4 className="text-sm font-black text-white flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-400" />
                    <span>Formatted PDF Progress Report</span>
                  </h4>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">
                    Download a comprehensive mastery & study history report in PDF format.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleExportPDFReport}
                  disabled={exportingPdf}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 transition-all cursor-pointer shrink-0"
                >
                  {exportingPdf ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <FileText className="w-4 h-4" />
                      <span>Export PDF Report</span>
                    </>
                  )}
                </button>
              </div>

              <StudyProgressCharts 
                quizzesCompleted={quizzesCompleted}
                masteryScoreAverage={masteryScoreAverage}
                topicsStudied={topicsStudied}
                totalAnalyses={stats?.analysesUsed || 0}
                currentStreak={stats?.currentStreak || 1}
                longestStreak={stats?.longestStreak || 1}
                isDark={true}
              />
            </div>
          )}

          {/* Tab 4: Parent / Team Progress */}
          {activeTab === 'progress' && (
            <div className="space-y-4">
              <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <Share2 className="w-5 h-5 text-emerald-500" />
                  <span className="text-sm font-black text-slate-900 dark:text-white">
                    Public Parent & Team Dashboard
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Generate a secure, read-only dashboard link showing your current study streak, quiz scores, and topics mastered. Perfect for parents, tutors, and team leaders.
                </p>

                {shareUrl && (
                  <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-between gap-2 text-xs font-mono">
                    <span className="truncate text-blue-600 dark:text-blue-400">{shareUrl}</span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleGenerateShareLink}
                  disabled={loadingShare}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20"
                >
                  {loadingShare ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : copiedShare ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Progress Link Copied to Clipboard!</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-4 h-4" />
                      <span>{shareUrl ? 'Re-copy Progress Link' : 'Generate & Copy Progress Link'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Tab 4: Subscription & Billing */}
          {activeTab === 'subscription' && (
            <div className="space-y-4">
              <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase">Plan Status</span>
                    <h4 className="text-lg font-black text-slate-900 dark:text-white">
                      {stats?.isPro ? 'Pro Unlimited Membership' : 'Free Trial Membership'}
                    </h4>
                  </div>
                  {!stats?.isPro && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenUpgrade();
                      }}
                      className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md hover:scale-105 transition-all flex items-center gap-1.5"
                    >
                      <Zap className="w-4 h-4 fill-current" />
                      <span>Upgrade Now</span>
                    </button>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60 space-y-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-500">Monthly Fair-Use Usage</span>
                    <span className="text-slate-900 dark:text-white">
                      {isLimitExceeded ? `${userLimit} / ${userLimit} (Limit Reached)` : `${stats?.analysesUsed || 0} / ${userLimit}`}
                    </span>
                  </div>
                  {isLimitExceeded && (
                    <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-600 dark:text-rose-400 text-xs font-bold leading-relaxed">
                      You've reached your monthly fair-use limit. It resets on next month, or contact support if you need more.
                    </div>
                  )}
                </div>
              </div>

              {/* Referral Code Box */}
              <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                    Your Referral Link
                  </span>
                  <span className="text-xs font-mono font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 px-2.5 py-0.5 rounded-lg">
                    {stats?.refCode || 'PRO'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={refLink}
                    className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-700 dark:text-slate-300 truncate"
                  />
                  <button
                    type="button"
                    onClick={handleCopyRef}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copiedRef ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              {/* Payment History Shortcut */}
              <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-4 flex items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                    <History className="w-4 h-4 text-blue-500" />
                    <span>Payment & Billing History</span>
                  </span>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    View past transaction receipts, review status, and admin notes.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('payment_history')}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer shadow-md shadow-blue-600/20"
                >
                  View History ({userPayments.length})
                </button>
              </div>
            </div>
          )}

          {/* Tab 5: Payment History */}
          {activeTab === 'payment_history' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <History className="w-4 h-4 text-blue-500" />
                    <span>Payment & Subscription Request History</span>
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Track all your past payment proof submissions, review status, and administrative notes.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={fetchUserPaymentHistory}
                  disabled={loadingPayments}
                  className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold"
                  title="Refresh history"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingPayments ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
              </div>

              {loadingPayments ? (
                <div className="py-12 text-center text-xs text-slate-500 flex flex-col items-center gap-2">
                  <div className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                  <span>Loading your payment history...</span>
                </div>
              ) : userPayments.length === 0 ? (
                <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-8 text-center space-y-3">
                  <Receipt className="w-10 h-10 text-slate-400 mx-auto" />
                  <h5 className="text-sm font-bold text-slate-900 dark:text-white">No Payment Records Found</h5>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                    You haven't submitted any payment verification requests yet. Upgrading to Pro will list your transaction receipts here.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenUpgrade();
                    }}
                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md hover:scale-105 transition-all inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Zap className="w-4 h-4 fill-current" />
                    <span>Upgrade to Pro ($3.99/mo or $30.99/yr)</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                  {userPayments.map((pay, pIdx) => {
                    const dateFormatted = pay.submittedAt || pay.paidAt
                      ? new Date(pay.submittedAt || pay.paidAt).toLocaleString('en-US', {
                          month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
                        })
                      : 'Date N/A';

                    return (
                      <div 
                        key={pay.id || `pay-${pIdx}`}
                        className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-4 space-y-3 shadow-sm hover:border-slate-300 dark:hover:border-slate-600 transition-all"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-700/60 pb-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs shrink-0">
                              <CreditCard className="w-4 h-4" />
                            </div>
                            <div>
                              <h5 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-2">
                                <span>{pay.paymentMethod || 'Pro Upgrade'}</span>
                                <span className="text-[10px] font-mono text-blue-600 dark:text-blue-400 font-bold bg-blue-500/10 px-2 py-0.5 rounded-md">
                                  {pay.amount || (pay.plan === 'annual' ? '$30.99/yr' : '$3.99/mo')}
                                </span>
                              </h5>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                                Submitted: {dateFormatted}
                              </p>
                            </div>
                          </div>

                          {/* Status Badge */}
                          <div>
                            {pay.status === 'approved' ? (
                              <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 rounded-full font-black text-[10px] uppercase tracking-wider flex items-center gap-1 w-max">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                <span>Approved & Active</span>
                              </span>
                            ) : pay.status === 'rejected' ? (
                              <span className="px-3 py-1 bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 rounded-full font-black text-[10px] uppercase tracking-wider flex items-center gap-1 w-max">
                                <XCircle className="w-3.5 h-3.5 text-rose-500" />
                                <span>Rejected</span>
                              </span>
                            ) : (
                              <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 rounded-full font-black text-[10px] uppercase tracking-wider flex items-center gap-1 w-max animate-pulse">
                                <Clock className="w-3.5 h-3.5 text-amber-500" />
                                <span>Pending Verification</span>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Transaction Details */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          {pay.transactionId && (
                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60 rounded-xl p-2.5">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                                Transaction ID (TID)
                              </span>
                              <span className="font-mono font-bold text-slate-800 dark:text-slate-200 text-xs">
                                {pay.transactionId}
                              </span>
                            </div>
                          )}

                          {pay.senderName && (
                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60 rounded-xl p-2.5">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                                Sender Account
                              </span>
                              <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs">
                                {pay.senderName} {pay.senderPhone ? `(${pay.senderPhone})` : ''}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Administrative Notes Box */}
                        <div className="bg-blue-500/5 dark:bg-blue-950/30 border border-blue-500/20 rounded-xl p-3 space-y-1">
                          <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400">
                            <FileText className="w-3.5 h-3.5" />
                            <span>Administrative Notes & Verification Status</span>
                          </div>

                          {pay.status === 'approved' ? (
                            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                              ✅ <span className="font-bold text-emerald-600 dark:text-emerald-400">Payment Verified:</span> Pro membership approved by administrator {pay.approvedByAdmin ? `(${pay.approvedByAdmin})` : ''} on {pay.approvedAt ? new Date(pay.approvedAt).toLocaleString() : 'record date'}.
                            </p>
                          ) : pay.status === 'rejected' ? (
                            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                              ❌ <span className="font-bold text-rose-600 dark:text-rose-400">Request Declined:</span> Payment verification failed or receipt unreadable. {pay.rejectedByAdmin ? `Reviewed by (${pay.rejectedByAdmin}).` : ''}
                            </p>
                          ) : (
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                              ⏳ <span className="font-bold text-amber-600 dark:text-amber-400">Under Review:</span> Your payment details have been logged in the Admin Control Center and are awaiting manual verification. Once confirmed, your Pro subscription will unlock automatically.
                            </p>
                          )}

                          {pay.notes && (
                            <p className="text-xs text-slate-600 dark:text-slate-400 italic pt-1 border-t border-blue-500/10">
                              Admin Note: "{pay.notes}"
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          </div>

          {/* Bottom Footer Back Button (Fixed) */}
          <div className="shrink-0 mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              type="button"
              onClick={goBack}
              className="px-5 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition-all flex items-center gap-2 cursor-pointer w-full sm:w-auto justify-center"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to AI Study Buddy</span>
            </button>

            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold text-center sm:text-right">
              AI Study BUDDY by Ayan Ahmed • Contact me: <a href="mailto:ayaicrypcoin@gmail.com" className="text-blue-500 hover:underline font-mono">ayaicrypcoin@gmail.com</a>
            </span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
