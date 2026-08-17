import React, { useState, useRef, useEffect, Suspense, lazy } from 'react';
import { 
  Upload, 
  BookOpen, 
  HelpCircle, 
  CheckCircle2, 
  Lightbulb, 
  RotateCcw, 
  GraduationCap,
  Award,
  Sparkles,
  Camera,
  FileText,
  AlertCircle,
  MessageSquare,
  Mic,
  ArrowRight,
  ArrowLeft,
  BrainCircuit,
  History,
  Timer,
  Layers,
  Zap,
  ChevronRight,
  Play,
  Pause,
  LayoutDashboard,
  LogOut,
  User as UserIcon,
  Plus,
  Brain,
  Trophy,
  Target,
  Clapperboard,
  Loader2,
  Sun,
  Moon,
  LayoutGrid,
  Download,
  Wand2,
  Globe,
  Flame,
  ShieldCheck,
  Settings,
  Gift,
  BarChart2,
  Share2,
  WifiOff,
  Globe2,
  Users,
  Lock,
  Map,
  UserX,
  ShieldAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { analyzeStudyMaterial } from './services/geminiService';
import LandingPage from './components/LandingPage';
import CookieConsentBanner from './components/CookieConsentBanner';

// Lazy-loaded heavy modules & secondary views for lightning-fast initial load
const VoiceTeacher = lazy(() => import('./components/VoiceTeacher'));
const Dashboard = lazy(() => import('./components/Dashboard'));
const AdminDashboard = lazy(() => import('./components/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const TestMaker = lazy(() => import('./components/TestMaker'));
const LiveChat = lazy(() => import('./components/LiveChat'));
const NotebookInfographic = lazy(() => import('./components/NotebookInfographic'));
const Converter = lazy(() => import('./components/Converter'));
const ResumeMaker = lazy(() => import('./components/ResumeMaker'));
const WeaknessDetector = lazy(() => import('./components/WeaknessDetector'));
const ImageStudio = lazy(() => import('./components/ImageStudio'));
const VeoStudio = lazy(() => import('./components/VeoStudio'));
const DeepThinkingWorkbench = lazy(() => import('./components/DeepThinkingWorkbench'));
const SearchGroundingHub = lazy(() => import('./components/SearchGroundingHub'));
const SourcesPanel = lazy(() => import('./components/SourcesPanel'));
const SourceExcerptModal = lazy(() => import('./components/SourceExcerptModal'));
const NotebookGuide = lazy(() => import('./components/NotebookGuide'));
const StudyCast = lazy(() => import('./components/StudyCast'));
const MindMap = lazy(() => import('./components/MindMap'));
const NotesPanel = lazy(() => import('./components/NotesPanel'));
const NotebooksHome = lazy(() => import('./components/NotebooksHome'));
const UpgradeModal = lazy(() => import('./components/UpgradeModal'));
const LearningRoadmapModal = lazy(() => import('./components/LearningRoadmapModal').then(m => ({ default: m.LearningRoadmapModal })));
const SessionEndModal = lazy(() => import('./components/SessionEndModal').then(m => ({ default: m.SessionEndModal })));
const AccountSettingsModal = lazy(() => import('./components/AccountSettingsModal'));
const PublicProgressDashboard = lazy(() => import('./components/PublicProgressDashboard'));
const FlashcardSpacedRepetition = lazy(() => import('./components/FlashcardSpacedRepetition'));
const GroupStudyModal = lazy(() => import('./components/GroupStudyModal'));
const UniversityTracker = lazy(() => import('./components/UniversityTracker'));
const ScholarshipTracker = lazy(() => import('./components/ScholarshipTracker'));
const AuthModal = lazy(() => import('./components/AuthModal'));
const HowItWorksModal = lazy(() => import('./components/HowItWorksModal'));
const BlogPage = lazy(() => import('./components/BlogPage'));
const LegalModal = lazy(() => import('./components/LegalModal'));
const MeetTeamModal = lazy(() => import('./components/MeetTeamModal'));
const SitemapModal = lazy(() => import('./components/SitemapModal'));
import engineeringMasteryBg from './assets/images/engineering_mastery_bg_1785304924998.jpg';
import { getUserStats, incrementUserAnalysesUsed, updateStudyStreak, processReferralCode, setUserProStatus, checkIsAdmin, UserStatsData, FAIR_USE_LIMIT, FAIR_USE_MESSAGE, PRO_FAIR_USE_MESSAGE, isFairUseExceeded } from './lib/userStats';
import { extractTextFromFile } from './lib/textExtractor';
import { Notebook, NotebookSource, NotebookNote, NotebookGuideData, MindMapData, StudyCastLine } from './types';
import { analyzeNotebook, generateNotebookGuide, generateStudyCastScript, generateMindMapFromSources, askTutorQuestion } from './services/geminiService';
import { cn } from './lib/utils';
import { auth, signInWithGoogle, db } from './lib/firebase';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { collection, addDoc, serverTimestamp, query, getDocs, doc, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore';

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
}

interface AppError {
  type: 'auth' | 'quota' | 'model' | 'technical' | 'network' | 'unauthorized';
  title: string;
  message: string;
  details?: string;
  recoveryAction?: () => void;
  recoveryLabel?: string;
}

const ErrorDisplay = ({ error, onClear }: { error: AppError; onClear: () => void }) => {
  const Icon = error.type === 'quota' ? Zap : error.type === 'auth' ? LogOut : error.type === 'model' ? BrainCircuit : AlertCircle;
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: -10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={cn(
        "p-8 rounded-[3rem] border w-full mb-8 relative overflow-hidden group",
        error.type === 'quota' ? "bg-amber-50 border-amber-100 text-amber-900" :
        error.type === 'auth' ? "bg-blue-50 border-blue-100 text-blue-900" :
        "bg-rose-50 border-rose-100 text-rose-900"
      )}
    >
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
        <Icon className="w-32 h-32 rotate-12" />
      </div>
      
      <div className="relative flex flex-col md:flex-row items-start gap-6">
        <div className={cn(
          "w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg",
          error.type === 'quota' ? "bg-amber-500 text-white" :
          error.type === 'auth' ? "bg-blue-500 text-white" :
          "bg-rose-500 text-white"
        )}>
          <Icon className="w-7 h-7" />
        </div>
        
        <div className="flex-1 space-y-2">
          <h4 className="text-xl font-black tracking-tight">{error.title}</h4>
          <p className="text-sm font-medium leading-relaxed opacity-90 max-w-2xl">{error.message}</p>
          {error.details && (
            <div className="mt-4 p-4 bg-black/5 rounded-2xl border border-black/5">
              <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-1">System Trace</p>
              <code className="text-[11px] font-mono break-all">{error.details}</code>
            </div>
          )}
          
          <div className="flex flex-wrap gap-4 pt-4">
            {error.recoveryAction && (
              <button 
                onClick={error.recoveryAction}
                className={cn(
                  "px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-md active:scale-95",
                  error.type === 'quota' ? "bg-amber-950 text-white hover:bg-amber-900" :
                  error.type === 'auth' ? "bg-blue-950 text-white hover:bg-blue-900" :
                  "bg-rose-950 text-white hover:bg-rose-900"
                )}
              >
                {error.recoveryLabel || 'Take Action'}
              </button>
            )}
            <button 
              onClick={onClear}
              className="px-6 py-3 bg-white/50 hover:bg-white text-slate-900 rounded-xl font-black text-xs uppercase tracking-widest border border-black/5 transition-all shadow-sm active:scale-95"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

interface Flashcard {
  front: string;
  back: string;
}

interface ScheduleItem {
  time: string;
  activity: string;
}

interface StudyResult {
  chapters: {
    title: string;
    topics: {
      title: string;
      explanation: string;
    }[];
  }[];
  topics: string[];
  subject: string;
  simpleExplanation: string;
  teacherExplanation: string;
  summary: string[];
  flashcards: Flashcard[];
  schedule: ScheduleItem[];
  quiz: QuizQuestion[];
  weakAreas: {
    difficulty: string;
    suggestion: string;
  };
}

export default function App() {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<{ url: string; type: string; name?: string }[]>([]);
  const [firstFileBase64, setFirstFileBase64] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<StudyResult | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [showQuizResults, setShowQuizResults] = useState(false);
  const [error, setError] = useState<AppError | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  
  // Multi-Notebook States
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [currentNotebook, setCurrentNotebook] = useState<Notebook | null>(null);
  
  // Drawer & Modal States
  const [isSourcesOpen, setIsSourcesOpen] = useState(false);
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [selectedSourceForExcerpt, setSelectedSourceForExcerpt] = useState<NotebookSource | null>(null);

  // Tab & AI Generation Loading States
  const [activeTab, setActiveTab] = useState<'overview' | 'tutor' | 'guide' | 'studycast' | 'mindmap' | 'flashcards' | 'quiz' | 'chat'>('overview');
  const [isGuideLoading, setIsGuideLoading] = useState(false);
  const [isScriptLoading, setIsScriptLoading] = useState(false);
  const [isMindMapLoading, setIsMindMapLoading] = useState(false);

  const [view, setView] = useState<'landing' | 'home' | 'notebooks' | 'dashboard' | 'admin' | 'blog'>('landing');
  const [blogSlug, setBlogSlug] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [pendingPaymentCount, setPendingPaymentCount] = useState<number>(0);
  const [isAccountSuspended, setIsAccountSuspended] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup'>('signin');
  const [timerActive, setTimerActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [currentFlashcard, setCurrentFlashcard] = useState(0);
  const [showFlashcardBack, setShowFlashcardBack] = useState(false);
  const [showGlobalTestMaker, setShowGlobalTestMaker] = useState(false);
  const [showConverter, setShowConverter] = useState(false);
  const [showResumeMaker, setShowResumeMaker] = useState(false);
  const [showWeaknessDetector, setShowWeaknessDetector] = useState(false);
  const [showImageStudio, setShowImageStudio] = useState(false);
  const [showVeoStudio, setShowVeoStudio] = useState(false);
  const [showDeepThinking, setShowDeepThinking] = useState(false);
  const [showSearchGrounding, setShowSearchGrounding] = useState(false);
  const [showUniversityTracker, setShowUniversityTracker] = useState(false);
  const [showScholarshipTracker, setShowScholarshipTracker] = useState(false);
  const [showHowItWorksGlobal, setShowHowItWorksGlobal] = useState(false);
  const [showLearningRoadmap, setShowLearningRoadmap] = useState(false);
  const [showSessionEndModal, setShowSessionEndModal] = useState(false);
  const [sessionDurationSeconds, setSessionDurationSeconds] = useState(1500);
  const [allTopics, setAllTopics] = useState<string[]>([]);
  const [quizzesCompletedCount, setQuizzesCompletedCount] = useState<number>(8);
  const [masteryScoreAvg, setMasteryScoreAvg] = useState<number>(88);
  const [selectedAge, setSelectedAge] = useState<number>(20);
  const [selectedLanguage, setSelectedLanguage] = useState<string>(() => {
    return localStorage.getItem('study_buddy_language') || 'English';
  });
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isAccountSettingsOpen, setIsAccountSettingsOpen] = useState(false);
  const [isLegalModalOpen, setIsLegalModalOpen] = useState(false);
  const [legalModalTab, setLegalModalTab] = useState<'terms' | 'privacy'>('terms');
  const [isMeetTeamOpen, setIsMeetTeamOpen] = useState(false);
  const [isSitemapOpen, setIsSitemapOpen] = useState(() => {
    const path = window.location.pathname.toLowerCase();
    const hash = window.location.hash.toLowerCase();
    return path.includes('sitemap') || path.includes('robots') || hash.includes('sitemap');
  });
  const [showCookieBanner, setShowCookieBanner] = useState<boolean>(() => {
    return !localStorage.getItem('cookie_consent_status');
  });

  useEffect(() => {
    const handleUrlChanges = () => {
      const path = window.location.pathname.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      if (path.includes('sitemap') || path.includes('robots') || hash.includes('sitemap')) {
        setIsSitemapOpen(true);
      } else if (hash.includes('team')) {
        setIsMeetTeamOpen(true);
      } else if (hash.includes('blog')) {
        const parts = window.location.hash.split('blog');
        if (parts.length > 1 && parts[1].startsWith('/')) {
          const slug = parts[1].replace(/^\//, '').split('?')[0];
          setBlogSlug(slug || null);
        } else {
          setBlogSlug(null);
        }
        setView('blog');
      }
    };
    handleUrlChanges();
    window.addEventListener('popstate', handleUrlChanges);
    window.addEventListener('hashchange', handleUrlChanges);
    return () => {
      window.removeEventListener('popstate', handleUrlChanges);
      window.removeEventListener('hashchange', handleUrlChanges);
    };
  }, []);

  useEffect(() => {
    const status = localStorage.getItem('cookie_consent_status');
    if (!status) {
      setShowCookieBanner(true);
    } else {
      setShowCookieBanner(false);
    }
  }, []);

  const handleAcceptCookies = () => {
    localStorage.setItem('cookie_consent_status', 'accepted');
    localStorage.setItem('cookie_consent_date', new Date().toISOString());
    setShowCookieBanner(false);
  };

  const handleDeclineCookies = () => {
    localStorage.setItem('cookie_consent_status', 'declined');
    localStorage.setItem('cookie_consent_date', new Date().toISOString());
    setShowCookieBanner(false);
  };
  const [userStats, setUserStats] = useState<UserStatsData | null>(null);
  const [showStreakToast, setShowStreakToast] = useState(false);
  const [publicShareId, setPublicShareId] = useState<string | null>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('shareId');
  });

  // Group Study Real-time State
  const [isGroupStudyOpen, setIsGroupStudyOpen] = useState<boolean>(() => {
    return Boolean(new URLSearchParams(window.location.search).get('roomId'));
  });
  const [groupRoomIdFromUrl, setGroupRoomIdFromUrl] = useState<string | null>(() => {
    return new URLSearchParams(window.location.search).get('roomId');
  });

  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved === 'dark'; // Default theme is LIGHT!
  });

  // Firestore Notebook Helper Functions
  const saveNotebookToFirestore = async (userId: string, nb: Notebook) => {
    if (!userId || !nb || !nb.id) return;
    try {
      const docRef = doc(db, 'users', userId, 'notebooks', nb.id);
      await setDoc(docRef, JSON.parse(JSON.stringify(nb)), { merge: true });
    } catch (err) {
      console.warn("Firestore save notebook error:", err);
    }
  };

  const deleteNotebookFromFirestore = async (userId: string, notebookId: string) => {
    if (!userId || !notebookId) return;
    try {
      const docRef = doc(db, 'users', userId, 'notebooks', notebookId);
      await deleteDoc(docRef);
    } catch (err) {
      console.warn("Firestore delete notebook error:", err);
    }
  };

  // Handle Online/Offline Status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Save selected language
  useEffect(() => {
    localStorage.setItem('study_buddy_language', selectedLanguage);
  }, [selectedLanguage]);

  // Load User Stats, Admin Status, and enforce Suspension
  useEffect(() => {
    if (!currentUser) {
      setIsAdmin(false);
      setUserStats(null);
      return;
    }

    // Verify Admin Privilege
    checkIsAdmin(currentUser.uid, currentUser.email).then(setIsAdmin);

    // Fetch Stats & Check Account Suspension
    getUserStats(currentUser).then(stats => {
      setUserStats(stats);
      if (stats?.disabled === true) {
        signOut(auth);
        setIsAccountSuspended(true);
        setCurrentUser(null);
        setIsAdmin(false);
      }
    });
  }, [currentUser, isUpgradeModalOpen, isAccountSettingsOpen]);

  // Real-time listener for pending payment proofs count (admin badge)
  useEffect(() => {
    const isUserAdmin = isAdmin || currentUser?.email?.toLowerCase() === 'ayaicrypcoin@gmail.com' || currentUser?.email?.toLowerCase() === 'sagarmatha.store1@gmail.com';
    if (!isUserAdmin) {
      setPendingPaymentCount(0);
      return;
    }

    const unsub = onSnapshot(collection(db, 'payment_requests'), (snapshot) => {
      let count = 0;
      snapshot.docs.forEach(docSnap => {
        const data = docSnap.data();
        if (data.status === 'pending') {
          count++;
        }
      });
      setPendingPaymentCount(count);
    }, (err) => {
      console.warn("Realtime pending payment listener note:", err);
    });

    return () => unsub();
  }, [isAdmin, currentUser]);

  // Check referral code on boot/login
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const refCode = params.get('ref');
    if (refCode && currentUser) {
      processReferralCode(currentUser.uid, refCode).then((success) => {
        if (success) {
          getUserStats(currentUser).then(setUserStats);
        }
      });
    }
  }, [currentUser]);

  // Dark mode effect
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
      document.body.classList.add('dark');
      document.body.classList.remove('light');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
      document.body.classList.remove('dark');
      document.body.classList.add('light');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  // Auth Listener & Firestore Notebooks Sync
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthLoading(false);
      if (user) {
         // Fetch topics and stats for Test Maker & Analytics
         const q = query(collection(db, `users/${user.uid}/sessions`));
         getDocs(q).then(snapshot => {
            const docs = snapshot.docs.map(d => d.data());
            const topics = Array.from(new Set(docs.map(d => d.topic as string).filter(Boolean)));
            setAllTopics(topics);

            if (docs.length > 0) {
              setQuizzesCompletedCount(docs.length);
              const scores = docs.map(d => typeof d.masteryScore === 'number' ? d.masteryScore : 85);
              const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
              setMasteryScoreAvg(avg);
            }
         }).catch(err => {
            console.warn("Sessions fetch fallback:", err);
         });

         // Sync Notebooks
         const nq = query(collection(db, `users/${user.uid}/notebooks`));
         getDocs(nq).then(snapshot => {
            const loaded = snapshot.docs.map(docSnap => ({
               id: docSnap.id,
               ...docSnap.data()
            })) as Notebook[];
            if (loaded.length > 0) {
              setNotebooks(loaded);
            } else {
              // Migrate local notebooks to Firestore for the logged-in user
              const saved = localStorage.getItem('study_buddy_notebooks');
              if (saved) {
                try {
                  const localNbs = JSON.parse(saved) as Notebook[];
                  if (localNbs.length > 0) {
                    setNotebooks(localNbs);
                    localNbs.forEach(nb => saveNotebookToFirestore(user.uid, nb));
                  }
                } catch (e) {}
              }
            }
         }).catch(err => {
            console.warn("Firestore notebook sync using local fallback:", err);
            const saved = localStorage.getItem('study_buddy_notebooks');
            if (saved) {
              try { setNotebooks(JSON.parse(saved)); } catch (e) {}
            }
         });
      } else {
         // Load local notebooks if offline/guest
         const saved = localStorage.getItem('study_buddy_notebooks');
         if (saved) {
           try { setNotebooks(JSON.parse(saved)); } catch (e) {}
         }
      }
    });
    return () => unsubscribe();
  }, []);

  // Auto-Save Notebooks (to LocalStorage & Firestore) & handle beforeunload
  useEffect(() => {
    if (notebooks.length > 0) {
      localStorage.setItem('study_buddy_notebooks', JSON.stringify(notebooks));
      if (currentUser) {
        notebooks.forEach(nb => saveNotebookToFirestore(currentUser.uid, nb));
      }
    }
  }, [notebooks, currentUser]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (notebooks.length > 0) {
        localStorage.setItem('study_buddy_notebooks', JSON.stringify(notebooks));
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [notebooks]);

  // Notebook Action Handlers
  const handleCreateNotebook = async (title: string, subject: string, age: number, initialSources: NotebookSource[]) => {
    const newNb: Notebook = {
      id: `nb-${Date.now()}`,
      title,
      subject,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      age,
      sources: initialSources,
      notes: []
    };

    setNotebooks(prev => [newNb, ...prev]);
    setCurrentNotebook(newNb);
    setView('home');

    if (currentUser) {
      saveNotebookToFirestore(currentUser.uid, newNb);
    }

    if (initialSources.length > 0) {
      runNotebookAnalysis(newNb);
    }
  };

  const handleSelectNotebook = (nb: Notebook) => {
    setCurrentNotebook(nb);
    if (nb.analysis) {
      setResult(nb.analysis);
    } else if (nb.sources.length > 0) {
      runNotebookAnalysis(nb);
    }
    setView('home');
  };

  const handleDeleteNotebook = async (id: string) => {
    setNotebooks(prev => prev.filter(n => n.id !== id));
    if (currentNotebook?.id === id) {
      setCurrentNotebook(null);
      setResult(null);
      setView('notebooks');
    }
    if (currentUser) {
      deleteNotebookFromFirestore(currentUser.uid, id);
    }
  };

  const runNotebookAnalysis = async (nb: Notebook) => {
    if (!isOnline) {
      alert("📶 You are offline. Internet connection is required for AI analyses.");
      return;
    }

    const currentStats = await getUserStats(currentUser);
    if (isFairUseExceeded(currentStats.analysesUsed, currentStats.isPro)) {
      setError({
        type: 'quota',
        title: currentStats.isPro ? 'Monthly Pro Limit Reached (50/50)' : 'Free Limit Reached (10/10)',
        message: currentStats.isPro ? PRO_FAIR_USE_MESSAGE : FAIR_USE_MESSAGE,
        recoveryLabel: 'Upgrade / Support',
        recoveryAction: () => setIsUpgradeModalOpen(true)
      });
      setIsUpgradeModalOpen(true);
      return;
    }

    const activeSources = nb.sources.filter(s => s.enabled !== false && s.isActive !== false);
    if (activeSources.length === 0) return;
    setLoading(true);
    setLoadingMessage("Grounded Multi-Source Analysis...");
    try {
      const analysisData = await analyzeNotebook(activeSources, nb.age || selectedAge, selectedLanguage);
      setResult(analysisData);
      const updated = {
        ...nb,
        analysis: analysisData,
        updatedAt: new Date().toISOString()
      };
      setCurrentNotebook(updated);
      setNotebooks(prev => prev.map(n => n.id === nb.id ? updated : n));

      // Increment Usage & Update Streak
      await incrementUserAnalysesUsed(currentUser);
      const streakRes = await updateStudyStreak(currentUser);
      if (streakRes.streakIncreased) {
        setShowStreakToast(true);
        setTimeout(() => setShowStreakToast(false), 4000);
      }
      getUserStats(currentUser).then(setUserStats);
    } catch (err: any) {
      console.error("Notebook Analysis Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSource = (sourceId: string) => {
    if (!currentNotebook) return;
    const updatedSources = currentNotebook.sources.map(s => 
      s.id === sourceId ? { ...s, enabled: s.enabled === false, isActive: s.isActive === false } : s
    );
    const updatedNb = { ...currentNotebook, sources: updatedSources };
    setCurrentNotebook(updatedNb);
    setNotebooks(prev => prev.map(n => n.id === updatedNb.id ? updatedNb : n));
    runNotebookAnalysis(updatedNb);
  };

  const handleAddSourceToCurrent = (source: NotebookSource) => {
    if (!currentNotebook) return;
    const updatedSources = [...currentNotebook.sources, source];
    const updatedNb = { ...currentNotebook, sources: updatedSources };
    setCurrentNotebook(updatedNb);
    setNotebooks(prev => prev.map(n => n.id === updatedNb.id ? updatedNb : n));
    runNotebookAnalysis(updatedNb);
  };

  const handleDeleteSourceFromCurrent = (sourceId: string) => {
    if (!currentNotebook) return;
    const updatedSources = currentNotebook.sources.filter(s => s.id !== sourceId);
    const updatedNb = { ...currentNotebook, sources: updatedSources };
    setCurrentNotebook(updatedNb);
    setNotebooks(prev => prev.map(n => n.id === updatedNb.id ? updatedNb : n));
    if (updatedSources.length > 0) {
      runNotebookAnalysis(updatedNb);
    } else {
      setResult(null);
    }
  };

  const handleSaveNote = (title: string, content: string, sourceRefs?: string[]) => {
    if (!currentNotebook) return;
    const newNote: NotebookNote = {
      id: `note-${Date.now()}`,
      title,
      content,
      sourceRefs,
      createdAt: new Date().toISOString(),
      pinned: false
    };
    const updatedNotes = [newNote, ...(currentNotebook.notes || [])];
    const updatedNb = { ...currentNotebook, notes: updatedNotes };
    setCurrentNotebook(updatedNb);
    setNotebooks(prev => prev.map(n => n.id === updatedNb.id ? updatedNb : n));
  };

  const handleDeleteNote = (noteId: string) => {
    if (!currentNotebook) return;
    const updatedNotes = (currentNotebook.notes || []).filter(n => n.id !== noteId);
    const updatedNb = { ...currentNotebook, notes: updatedNotes };
    setCurrentNotebook(updatedNb);
    setNotebooks(prev => prev.map(n => n.id === updatedNb.id ? updatedNb : n));
  };

  const handleTogglePinNote = (noteId: string) => {
    if (!currentNotebook) return;
    const updatedNotes = (currentNotebook.notes || []).map(n => 
      n.id === noteId ? { ...n, pinned: !n.pinned } : n
    );
    const updatedNb = { ...currentNotebook, notes: updatedNotes };
    setCurrentNotebook(updatedNb);
    setNotebooks(prev => prev.map(n => n.id === updatedNb.id ? updatedNb : n));
  };

  const handleGenerateGuide = async () => {
    let activeSources: NotebookSource[] = [];
    let ageToUse = selectedAge;

    if (currentNotebook && currentNotebook.sources && currentNotebook.sources.length > 0) {
      activeSources = currentNotebook.sources.filter(s => s.enabled !== false && s.isActive !== false);
      if (activeSources.length === 0) {
        activeSources = currentNotebook.sources;
      }
      ageToUse = currentNotebook.age || selectedAge;
    } else if (files.length > 0) {
      activeSources = files.map((f, i) => ({
        id: `src-temp-${i}`,
        name: f.name,
        type: 'file',
        extractedText: result?.summary?.join('\n') || result?.teacherExplanation || f.name,
        addedAt: new Date().toISOString(),
        isActive: true,
        enabled: true
      }));
    } else if (result) {
      activeSources = [{
        id: 'src-result',
        name: result.subject || 'Current Study Topic',
        type: 'pasted_text',
        extractedText: `${result.subject}\n\n${(result.summary || []).join('\n')}\n\n${result.teacherExplanation || ''}`,
        addedAt: new Date().toISOString(),
        isActive: true,
        enabled: true
      }];
    }

    if (activeSources.length === 0) {
      alert("Please upload study material or select a notebook first!");
      return;
    }

    setIsGuideLoading(true);
    try {
      const guideData = await generateNotebookGuide(activeSources, ageToUse);
      if (currentNotebook) {
        const updated = { ...currentNotebook, guide: guideData };
        setCurrentNotebook(updated);
        setNotebooks(prev => prev.map(n => n.id === updated.id ? updated : n));
      } else {
        const newNb: Notebook = {
          id: `nb-${Date.now()}`,
          title: result?.subject || files[0]?.name || "Study Session",
          subject: result?.subject || "General",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          age: ageToUse,
          sources: activeSources,
          guide: guideData,
          analysis: result || undefined,
          notes: []
        };
        setCurrentNotebook(newNb);
        setNotebooks(prev => [newNb, ...prev.filter(n => n.id !== newNb.id)]);
      }
    } catch (err: any) {
      console.error("Guide Gen Error:", err);
      alert(`Failed to generate Guide: ${err.message || 'AI model error'}. Please try again.`);
    } finally {
      setIsGuideLoading(false);
    }
  };

  const handleGenerateScript = async () => {
    let activeSources: NotebookSource[] = [];
    let ageToUse = selectedAge;

    if (currentNotebook && currentNotebook.sources && currentNotebook.sources.length > 0) {
      activeSources = currentNotebook.sources.filter(s => s.enabled !== false && s.isActive !== false);
      if (activeSources.length === 0) {
        activeSources = currentNotebook.sources;
      }
      ageToUse = currentNotebook.age || selectedAge;
    } else if (files.length > 0) {
      activeSources = files.map((f, i) => ({
        id: `src-temp-${i}`,
        name: f.name,
        type: 'file',
        extractedText: result?.summary?.join('\n') || result?.teacherExplanation || f.name,
        addedAt: new Date().toISOString(),
        isActive: true,
        enabled: true
      }));
    } else if (result) {
      activeSources = [{
        id: 'src-result',
        name: result.subject || 'Current Study Topic',
        type: 'pasted_text',
        extractedText: `${result.subject}\n\n${(result.summary || []).join('\n')}\n\n${result.teacherExplanation || ''}`,
        addedAt: new Date().toISOString(),
        isActive: true,
        enabled: true
      }];
    }

    if (activeSources.length === 0) {
      alert("Please upload study material or select a notebook first!");
      return;
    }

    setIsScriptLoading(true);
    try {
      const script = await generateStudyCastScript(activeSources, ageToUse);
      if (currentNotebook) {
        const updated = { ...currentNotebook, studyCastScript: script };
        setCurrentNotebook(updated);
        setNotebooks(prev => prev.map(n => n.id === updated.id ? updated : n));
      } else {
        const newNb: Notebook = {
          id: `nb-${Date.now()}`,
          title: result?.subject || files[0]?.name || "Study Session",
          subject: result?.subject || "General",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          age: ageToUse,
          sources: activeSources,
          studyCastScript: script,
          analysis: result || undefined,
          notes: []
        };
        setCurrentNotebook(newNb);
        setNotebooks(prev => [newNb, ...prev.filter(n => n.id !== newNb.id)]);
      }
    } catch (err: any) {
      console.error("StudyCast Script Gen Error:", err);
      alert(`Failed to generate StudyCast: ${err.message || 'AI model error'}. Please try again.`);
    } finally {
      setIsScriptLoading(false);
    }
  };

  const handleGenerateMindMap = async () => {
    let activeSources: NotebookSource[] = [];

    if (currentNotebook && currentNotebook.sources && currentNotebook.sources.length > 0) {
      activeSources = currentNotebook.sources.filter(s => s.enabled !== false && s.isActive !== false);
      if (activeSources.length === 0) {
        activeSources = currentNotebook.sources;
      }
    } else if (files.length > 0) {
      activeSources = files.map((f, i) => ({
        id: `src-temp-${i}`,
        name: f.name,
        type: 'file',
        extractedText: result?.summary?.join('\n') || result?.teacherExplanation || f.name,
        addedAt: new Date().toISOString(),
        isActive: true,
        enabled: true
      }));
    } else if (result) {
      activeSources = [{
        id: 'src-result',
        name: result.subject || 'Current Study Topic',
        type: 'pasted_text',
        extractedText: `${result.subject}\n\n${(result.summary || []).join('\n')}\n\n${result.teacherExplanation || ''}`,
        addedAt: new Date().toISOString(),
        isActive: true,
        enabled: true
      }];
    }

    if (activeSources.length === 0) {
      alert("Please upload study material or select a notebook first!");
      return;
    }

    setIsMindMapLoading(true);
    try {
      const mmData = await generateMindMapFromSources(activeSources);
      if (currentNotebook) {
        const updated = { ...currentNotebook, mindMap: mmData };
        setCurrentNotebook(updated);
        setNotebooks(prev => prev.map(n => n.id === updated.id ? updated : n));
      } else {
        const newNb: Notebook = {
          id: `nb-${Date.now()}`,
          title: result?.subject || files[0]?.name || "Study Session",
          subject: result?.subject || "General",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          age: selectedAge,
          sources: activeSources,
          mindMap: mmData,
          analysis: result || undefined,
          notes: []
        };
        setCurrentNotebook(newNb);
        setNotebooks(prev => [newNb, ...prev.filter(n => n.id !== newNb.id)]);
      }
    } catch (err: any) {
      console.error("MindMap Gen Error:", err);
      alert(`Failed to generate Mind Map: ${err.message || 'AI model error'}. Please try again.`);
    } finally {
      setIsMindMapLoading(false);
    }
  };

  const runMidCastAnswer = async (question: string, lineContext: string): Promise<string> => {
    if (!currentNotebook) return "No active notebook selected.";
    const activeSources = currentNotebook.sources.filter(s => s.enabled !== false && s.isActive !== false);
    return await askTutorQuestion(activeSources, question, currentNotebook.age || selectedAge, lineContext);
  };

  const handleAskAboutNode = (conceptLabel: string) => {
    setActiveTab('chat');
  };

  const handleToggleTimer = () => {
    if (timerActive) {
      const elapsed = Math.max(10, 25 * 60 - timeLeft);
      setSessionDurationSeconds(elapsed);
      setTimerActive(false);
      setShowSessionEndModal(true);
    } else {
      setTimerActive(true);
    }
  };
  
  // Timer logic
  useEffect(() => {
    let interval: any;
    if (timerActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(t => t - 1);
      }, 1000);
    } else if (timeLeft === 0 && timerActive) {
      setTimerActive(false);
      setSessionDurationSeconds(25 * 60);
      setShowSessionEndModal(true);
    }
    return () => clearInterval(interval);
  }, [timerActive, timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

    const [loadingMessage, setLoadingMessage] = useState("Lightning Analysis...");
    const loadingStates = [
        "Reading your files...",
        "Identifying key themes...",
        "Structuring your study notes...",
        "Generating clear explanation...",
        "Almost done, Dost!"
    ];

    useEffect(() => {
        let interval: any;
        if (loading) {
            let i = 0;
            interval = setInterval(() => {
                setLoadingMessage(loadingStates[i % loadingStates.length]);
                i++;
            }, 2500);
        } else {
            setLoadingMessage("Lightning Analysis...");
        }
        return () => clearInterval(interval);
    }, [loading]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    
    // Supported mime types for Gemini
    const supportedTypes = [
      'application/pdf', 
      'image/jpeg', 
      'image/png', 
      'image/webp',
      'text/plain', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/csv',
      'text/markdown'
    ];

    const MAX_SINGLE_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    const MAX_TOTAL_FILES_SIZE = 15 * 1024 * 1024; // 15MB

    const oversizedFiles = selectedFiles.filter(file => file.size > MAX_SINGLE_FILE_SIZE);
    if (oversizedFiles.length > 0) {
      const appErr: AppError = {
        type: 'technical',
        title: 'Document Too Large',
        message: `The file "${oversizedFiles[0].name}" is too large (${(oversizedFiles[0].size / (1024 * 1024)).toFixed(1)}MB). Please ensure individual study materials are under 10MB to keep dynamic learning swift and within API context limits.`,
        recoveryLabel: 'Dismiss',
        recoveryAction: () => setError(null)
      };
      setError(appErr);
      if (e.target) {
        e.target.value = '';
      }
      return;
    }

    const currentTotalSize = files.reduce((acc, f) => acc + f.size, 0);
    const incomingTotalSize = selectedFiles.reduce((acc, f) => acc + f.size, 0);
    if (currentTotalSize + incomingTotalSize > MAX_TOTAL_FILES_SIZE) {
      const appErr: AppError = {
        type: 'technical',
        title: 'Workspace Ceiling Reached',
        message: `The total size of your uploaded study materials would exceed the 15MB limit. Please remove some existing files first or upload fewer files to stay within neural limits.`,
        recoveryLabel: 'Dismiss',
        recoveryAction: () => setError(null)
      };
      setError(appErr);
      if (e.target) {
        e.target.value = '';
      }
      return;
    }

    const validFiles = selectedFiles.filter(file => {
      const isPdf = file.name.toLowerCase().endsWith('.pdf');
      const isTxt = file.name.toLowerCase().endsWith('.txt');
      const isDocx = file.name.toLowerCase().endsWith('.docx');
      const isMd = file.name.toLowerCase().endsWith('.md');
      const isCsv = file.name.toLowerCase().endsWith('.csv');
      const isImage = file.type.startsWith('image/') || Boolean(file.name.match(/\.(png|jpg|jpeg|webp)$/i));
      
      if (!isPdf && !isTxt && !isDocx && !isMd && !isCsv && !isImage && !supportedTypes.includes(file.type)) {
        console.warn(`Potential unsupported file type: ${file.type} for ${file.name}`);
      }
      return true;
    });

    if (validFiles.length > 0) {
      setFiles(prev => [...prev, ...validFiles]);
      const newPreviews = validFiles.map(file => ({
        url: URL.createObjectURL(file),
        type: file.type || (file.name.endsWith('.pdf') ? 'application/pdf' : 'text/plain'),
        name: file.name
      }));
      setPreviews(prev => [...prev, ...newPreviews]);
      
      // Convert first file to base64 for voice mode
      const first = validFiles[0];
      if (first && first.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = () => setFirstFileBase64((reader.result as string).split(',')[1]);
        reader.readAsDataURL(first);
      } else {
        setFirstFileBase64(null);
      }
      
      setResult(null);
      setError(null);
      
      // Clear input value
      if (e.target) {
        e.target.value = '';
      }
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const loadSession = (session: any) => {
    if (session.result) {
      try {
        const data = JSON.parse(session.result);
        setResult(data);
        setCurrentSessionId(session.id);
        setView('home'); // Switch view to show result
      } catch (err) {
        console.error("Error parsing session result:", err);
      }
    }
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    if (!isOnline) {
      alert("📶 You are offline. Internet connection is required for AI analyses.");
      return;
    }

    const currentStats = await getUserStats(currentUser);
    if (isFairUseExceeded(currentStats.analysesUsed, currentStats.isPro)) {
      setError({
        type: 'quota',
        title: currentStats.isPro ? 'Monthly Pro Limit Reached (50/50)' : 'Free Limit Reached (10/10)',
        message: currentStats.isPro ? PRO_FAIR_USE_MESSAGE : FAIR_USE_MESSAGE,
        recoveryLabel: 'Upgrade / Support',
        recoveryAction: () => setIsUpgradeModalOpen(true)
      });
      setIsUpgradeModalOpen(true);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await analyzeStudyMaterial(files, selectedAge, selectedLanguage);
      setLoadingMessage("Generating AI Video Explainer...");
      // Simulate/Buffer for visual effect of "generating video" 
      await new Promise(r => setTimeout(r, 1200));
      
      setResult(data);

      // Increment Usage & Update Streak
      await incrementUserAnalysesUsed(currentUser);
      const streakRes = await updateStudyStreak(currentUser);
      if (streakRes.streakIncreased) {
        setShowStreakToast(true);
        setTimeout(() => setShowStreakToast(false), 4000);
      }
      getUserStats(currentUser).then(setUserStats);
      const safeTopics = Array.isArray(data.topics) ? data.topics : [];
      setAllTopics(prev => Array.from(new Set([...prev, ...safeTopics])));
      setLoading(false);
      setSelectedAnswers({});
      setShowQuizResults(false);

      // Auto-create Notebook & Sources context
      const convertToBase64 = (f: File): Promise<string> => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve((reader.result as string).split(',')[1]);
          reader.onerror = reject;
          reader.readAsDataURL(f);
        });
      };

      const extractedSources: NotebookSource[] = await Promise.all(
        files.map(async (f, idx) => {
          let text = '';
          try {
            text = await extractTextFromFile(f);
          } catch (e) {
            console.warn('Text extraction error:', e);
          }
          const base64Data = await convertToBase64(f).catch(() => undefined);
          return {
            id: `src-upload-${Date.now()}-${idx}`,
            name: f.name,
            type: 'file',
            extractedText: text || (Array.isArray(data.summary) ? data.summary.join('\n') : '') || data.teacherExplanation || f.name,
            enabled: true,
            isActive: true,
            addedAt: new Date().toISOString(),
            mimeType: f.type,
            base64Data
          };
        })
      );

      const uploadedNb: Notebook = {
        id: `nb-${Date.now()}`,
        title: data.subject || files[0]?.name || "Study Session",
        subject: data.subject || "General",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        age: selectedAge,
        sources: extractedSources,
        analysis: data,
        notes: []
      };

      setCurrentNotebook(uploadedNb);
      setNotebooks(prev => [uploadedNb, ...prev.filter(n => n.id !== uploadedNb.id)]);

      // Save to Firebase if logged in as background process
      if (currentUser) {
        const path = `users/${currentUser.uid}/sessions`;
        try {
          const docRef = await addDoc(collection(db, path), {
            userId: currentUser.uid,
            topic: (Array.isArray(data.topics) && data.topics[0]) || "General Study",
            topics: safeTopics,
            chapters: Array.isArray(data.chapters) ? data.chapters : [],
            subject: data.subject || "Study Session",
            timestamp: serverTimestamp(),
            quizScore: 0,
            totalQuestions: Array.isArray(data.quiz) ? data.quiz.length : 0,
            summaryPoints: Array.isArray(data.summary) ? data.summary.length : 0,
            result: JSON.stringify(data)
          });
          setCurrentSessionId(docRef.id);
        } catch (err: any) {
          // Firebase instructions: Handle Firestore errors with detailed JSON
          if (err?.code === 'permission-denied' || err?.message?.includes('insufficient permissions')) {
            const errInfo = {
              error: err.message,
              operationType: 'write',
              path: path,
              authInfo: {
                userId: currentUser.uid,
                email: currentUser.email,
                emailVerified: currentUser.emailVerified
              }
            };
            console.error('Firestore Error:', JSON.stringify(errInfo));
          }
          throw err;
        }
      }
    } catch (err: any) {
      console.error("Analysis Error Detailed:", err);
      const errorMessage = err?.message || (typeof err === 'string' ? err : JSON.stringify(err)) || "Unknown error";
      const errLower = errorMessage.toLowerCase();
      
      const appErr: AppError = {
        type: 'technical',
        title: 'Analysis Protocol Failure',
        message: 'Dost! I encountered an unexpected error while processing your data.',
        details: errorMessage
      };

      if (errLower.includes("gemini_api_key") || errLower.includes("api key not valid") || errLower.includes("key not configured")) {
        appErr.type = 'auth';
        appErr.title = 'Intelligence Key Invalid';
        appErr.message = 'This shared application requires a valid Gemini API Key to function. Without it, I cannot connect to the neural network.';
        appErr.recoveryLabel = 'Configure API Key';
        appErr.recoveryAction = () => window.open('https://ai.studio/build', '_blank');
      } else if (
        errLower.includes("quota") || 
        errLower.includes("exceeded") || 
        errLower.includes("429") || 
        errLower.includes("resource_exhausted") || 
        errLower.includes("billing") ||
        errLower.includes("limit")
      ) {
        appErr.type = 'quota';
        appErr.title = 'Neural Capacity & Quota Reached';
        appErr.message = 'The Gemini API server has reached its rate or quota limit for this session. Take a quick 1-minute study break, then click "Try Again" to resume!';
        appErr.recoveryLabel = 'Try Again Now';
        appErr.recoveryAction = handleUpload;
      } else if (errLower.includes("503") || errLower.includes("unavailable") || errLower.includes("high demand") || errLower.includes("overloaded") || errLower.includes("busy")) {
        appErr.type = 'quota';
        appErr.title = 'Model Server Overloaded';
        appErr.message = 'The AI model is currently experiencing extremely high demand (503 Service Unavailable). Please click "Try Again" to reconnect and retry your analysis.';
        appErr.recoveryLabel = 'Try Again';
        appErr.recoveryAction = handleUpload;
      } else if (errLower.includes("404") || errLower.includes("not found")) {
        appErr.type = 'model';
        appErr.title = 'Model Architecture Missing';
        appErr.message = 'I\'m having trouble connecting to the specific AI model. It might be undergoing maintenance or is unavailable in your region.';
        appErr.recoveryLabel = 'Refresh System';
        appErr.recoveryAction = () => window.location.reload();
      } else if (errLower.includes("token count") || errLower.includes("exceeds the maximum number of tokens") || errLower.includes("1048576")) {
        appErr.type = 'quota';
        appErr.title = 'Material Size Limit Exceeded';
        appErr.message = 'The size of your study materials exceeds the neural processing limit (1,048,576 tokens). Please remove some files or upload shorter documents to keep our study sessions fast and effective!';
        appErr.recoveryLabel = 'Clear Files';
        appErr.recoveryAction = () => { setFiles([]); setPreviews([]); setError(null); };
      } else if (errLower.includes("failed to fetch") || errLower.includes("networkerror")) {
        appErr.type = 'network';
        appErr.title = 'Communication Link Severed';
        appErr.message = 'Your internet connection seems unstable. I need a steady stream to beam your data to the neural core.';
      }

      setError(appErr);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setFiles([]);
    setPreviews([]);
    setResult(null);
    setSelectedAnswers({});
    setShowQuizResults(false);
    setError(null);
    setView('home');
  };

  const [answeredQuestions, setAnsweredQuestions] = useState<Set<number>>(new Set());

  const handleAnswerValidation = async () => {
    setShowQuizResults(true);
    
    if (result) {
      const correctCount = (result.quiz || []).filter((q: any, i: number) => selectedAnswers[i] === q.correctAnswer).length;
      const currentQuizMastery = Math.round((correctCount / (result.quiz?.length || 1)) * 100);
      
      setQuizzesCompletedCount(prev => prev + 1);
      setMasteryScoreAvg(prev => Math.round((prev + currentQuizMastery) / 2));

      // Save session to history
      if (auth.currentUser) {
        try {
          await addDoc(collection(db, `users/${auth.currentUser.uid}/sessions`), {
            topic: result.subject || "Study Session",
            subject: result.subject || "General",
            timestamp: serverTimestamp(),
            quizScore: correctCount,
            totalQuestions: result.quiz?.length || 0,
            masteryScore: currentQuizMastery,
            topics: result.topics || []
          });
        } catch (err) {
          console.error("Failed to save session history:", err);
        }
      }
    }
  };

  const handleAnswerSelect = (qIdx: number, option: string) => {
    if (answeredQuestions.has(qIdx)) return;
    setSelectedAnswers(prev => ({ ...prev, [qIdx]: option }));
    setAnsweredQuestions(prev => new Set([...prev, qIdx]));
  };

  const exportFullReport = async () => {
    if (!result) return;

    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF();
    const margin = 20;
    let y = 30;

    // Title
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('AI STUDY BUDDY: INTELLIGENCE REPORT', margin, y);
    y += 15;

    // Metadata
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(`Subject: ${result.subject.toUpperCase()}`, margin, y);
    y += 10;
    doc.text(`Generated on: ${new Date().toLocaleString()}`, margin, y);
    y += 20;

    // Adaptive Summary
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('CORE SYNTHESIS', margin, y);
    y += 10;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    result.summary.forEach(point => {
      const wrappedText = doc.splitTextToSize(`• ${point}`, 170);
      doc.text(wrappedText, margin, y);
      y += wrappedText.length * 7;
      if (y > 270) { doc.addPage(); y = 30; }
    });

    y += 10;

    // Chapters/Modules
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('TACTICAL BREAKDOWN', margin, y);
    y += 15;

    result.chapters.forEach((chapter, idx) => {
      if (y > 250) { doc.addPage(); y = 30; }
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(`${idx + 1}. ${chapter.title.toUpperCase()}`, margin, y);
      y += 10;

      (chapter.topics || []).forEach(topic => {
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text(topic.title, margin + 5, y);
        y += 7;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        const wrappedExp = doc.splitTextToSize(topic.explanation, 160);
        doc.text(wrappedExp, margin + 5, y);
        y += wrappedExp.length * 6 + 4;
        if (y > 270) { doc.addPage(); y = 30; }
      });
      y += 5;
    });

    // Flashcards
    if (result.flashcards && result.flashcards.length > 0) {
      doc.addPage();
      y = 30;
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('COGNITIVE ANCHORS (FLASHCARDS)', margin, y);
      y += 15;

      result.flashcards.forEach((card) => {
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text(`Q: ${card.front}`, margin, y);
        y += 7;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        const wrappedBack = doc.splitTextToSize(`A: ${card.back}`, 170);
        doc.text(wrappedBack, margin, y);
        y += wrappedBack.length * 6 + 10;
        if (y > 270) { doc.addPage(); y = 30; }
      });
    }

    // Practice Quiz
    if (result.quiz && result.quiz.length > 0) {
      doc.addPage();
      y = 30;
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('PRACTICE ASSESSMENT', margin, y);
      y += 15;

      result.quiz.forEach((q, idx) => {
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        const wrappedQ = doc.splitTextToSize(`${idx + 1}. ${q.question}`, 170);
        doc.text(wrappedQ, margin, y);
        y += wrappedQ.length * 7;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        q.options.forEach((opt) => {
          doc.text(`[ ] ${opt}`, margin + 5, y);
          y += 6;
        });
        
        doc.setTextColor(0, 150, 0);
        doc.text(`Correct Answer: ${q.correctAnswer}`, margin + 5, y);
        doc.setTextColor(0, 0, 0);
        y += 10;

        if (y > 270) { doc.addPage(); y = 30; }
      });
    }

    doc.save(`AI_StudyBuddy_Report_${result.subject.replace(/\s+/g, '_')}.pdf`);
  };

  if (publicShareId) {
    return <PublicProgressDashboard shareId={publicShareId} onBack={() => {
      setPublicShareId(null);
      window.history.pushState({}, '', window.location.pathname);
    }} />;
  }

  if (view === 'landing') {
    return (
      <>
        <LandingPage
          user={currentUser}
          onOpenAuth={(mode) => {
            setAuthModalMode(mode);
            setIsAuthModalOpen(true);
          }}
          onEnterWorkspace={() => setView('notebooks')}
          onSignOut={() => signOut(auth)}
          isDarkMode={isDarkMode}
          onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
          onOpenUniversityTracker={() => {
            if (!userStats?.isPro) {
              setIsUpgradeModalOpen(true);
            } else {
              setShowUniversityTracker(true);
            }
          }}
          onOpenScholarshipTracker={() => {
            if (!userStats?.isPro) {
              setIsUpgradeModalOpen(true);
            } else {
              setShowScholarshipTracker(true);
            }
          }}
          onOpenMeetTeam={() => setIsMeetTeamOpen(true)}
          onOpenSitemap={() => setIsSitemapOpen(true)}
          onOpenUpgrade={() => setIsUpgradeModalOpen(true)}
          onOpenTerms={() => {
            setLegalModalTab('terms');
            setIsLegalModalOpen(true);
          }}
          onOpenPrivacy={() => {
            setLegalModalTab('privacy');
            setIsLegalModalOpen(true);
          }}
          onOpenBlog={(slug) => {
            setBlogSlug(slug || null);
            setView('blog');
          }}
        />
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          initialMode={authModalMode}
          onSuccess={() => setView('notebooks')}
          onOpenTerms={() => {
            setLegalModalTab('terms');
            setIsLegalModalOpen(true);
          }}
          onOpenPrivacy={() => {
            setLegalModalTab('privacy');
            setIsLegalModalOpen(true);
          }}
        />
        <LegalModal
          isOpen={isLegalModalOpen}
          onClose={() => setIsLegalModalOpen(false)}
          initialTab={legalModalTab}
        />
        <MeetTeamModal
          isOpen={isMeetTeamOpen}
          onClose={() => setIsMeetTeamOpen(false)}
        />
        <SitemapModal
          isOpen={isSitemapOpen}
          onClose={() => setIsSitemapOpen(false)}
          onNavigateSection={(sectionId) => {
            if (sectionId.startsWith('#blog') || sectionId.includes('blog')) {
              setView('blog');
              const parts = sectionId.split('blog');
              if (parts.length > 1 && parts[1].startsWith('/')) {
                setBlogSlug(parts[1].replace(/^\//, '').split('?')[0]);
              }
            } else {
              setView('landing');
              setTimeout(() => {
                const el = document.getElementById(sectionId.replace(/^#/, ''));
                el?.scrollIntoView({ behavior: 'smooth' });
              }, 100);
            }
          }}
        />
        {showCookieBanner && (
          <CookieConsentBanner
            onOpenTermsOfService={() => {
              setLegalModalTab('terms');
              setIsLegalModalOpen(true);
            }}
            onOpenPrivacyPolicy={() => {
              setLegalModalTab('privacy');
              setIsLegalModalOpen(true);
            }}
            onAccept={handleAcceptCookies}
            onDecline={handleDeclineCookies}
          />
        )}
        <UpgradeModal
          isOpen={isUpgradeModalOpen}
          onClose={() => setIsUpgradeModalOpen(false)}
          user={currentUser}
          analysesUsed={userStats?.analysesUsed || 0}
          bonusAnalyses={userStats?.bonusAnalyses || 0}
          isPro={Boolean(userStats?.isPro)}
        />
        {showUniversityTracker && (
          <div className="fixed inset-0 z-50 bg-[#fdfcfb] dark:bg-slate-950 overflow-y-auto">
            <UniversityTracker
              isOpen={showUniversityTracker}
              onClose={() => setShowUniversityTracker(false)}
              currentUser={currentUser}
              targetLanguage={selectedLanguage}
              isPro={Boolean(userStats?.isPro)}
              onOpenUpgrade={() => {
                setShowUniversityTracker(false);
                setIsUpgradeModalOpen(true);
              }}
              onOpenScholarshipTracker={() => {
                setShowUniversityTracker(false);
                setShowScholarshipTracker(true);
              }}
            />
          </div>
        )}
        {showScholarshipTracker && (
          <div className="fixed inset-0 z-50 bg-[#fdfcfb] dark:bg-slate-950 overflow-y-auto">
            <ScholarshipTracker
              isOpen={showScholarshipTracker}
              onClose={() => setShowScholarshipTracker(false)}
              currentUser={currentUser}
              targetLanguage={selectedLanguage}
              isPro={Boolean(userStats?.isPro)}
              onOpenUpgrade={() => {
                setShowScholarshipTracker(false);
                setIsUpgradeModalOpen(true);
              }}
              onOpenUniversityTracker={() => {
                setShowScholarshipTracker(false);
                setShowUniversityTracker(true);
              }}
            />
          </div>
        )}
      </>
    );
  }

  if (view === 'blog') {
    return (
      <>
        <BlogPage
          initialSlug={blogSlug}
          onBackToHome={() => {
            setView('landing');
            setBlogSlug(null);
            window.location.hash = '';
          }}
          onEnterWorkspace={() => {
            setView('notebooks');
            window.location.hash = '';
          }}
          isDarkMode={isDarkMode}
          onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        />
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          initialMode={authModalMode}
          onSuccess={() => setView('notebooks')}
          onOpenTerms={() => {
            setLegalModalTab('terms');
            setIsLegalModalOpen(true);
          }}
          onOpenPrivacy={() => {
            setLegalModalTab('privacy');
            setIsLegalModalOpen(true);
          }}
        />
        <LegalModal
          isOpen={isLegalModalOpen}
          onClose={() => setIsLegalModalOpen(false)}
          initialTab={legalModalTab}
        />
        <MeetTeamModal
          isOpen={isMeetTeamOpen}
          onClose={() => setIsMeetTeamOpen(false)}
        />
        <SitemapModal
          isOpen={isSitemapOpen}
          onClose={() => setIsSitemapOpen(false)}
          onNavigateSection={(sectionId) => {
            if (sectionId.startsWith('#blog') || sectionId.includes('blog')) {
              setView('blog');
              const parts = sectionId.split('blog');
              if (parts.length > 1 && parts[1].startsWith('/')) {
                setBlogSlug(parts[1].replace(/^\//, '').split('?')[0]);
              }
            } else {
              setView('landing');
              setTimeout(() => {
                const el = document.getElementById(sectionId.replace(/^#/, ''));
                el?.scrollIntoView({ behavior: 'smooth' });
              }, 100);
            }
          }}
        />
        {showCookieBanner && (
          <CookieConsentBanner
            onOpenTermsOfService={() => {
              setLegalModalTab('terms');
              setIsLegalModalOpen(true);
            }}
            onOpenPrivacyPolicy={() => {
              setLegalModalTab('privacy');
              setIsLegalModalOpen(true);
            }}
            onAccept={handleAcceptCookies}
            onDecline={handleDeclineCookies}
          />
        )}
        <UpgradeModal
          isOpen={isUpgradeModalOpen}
          onClose={() => setIsUpgradeModalOpen(false)}
          user={currentUser}
          analysesUsed={userStats?.analysesUsed || 0}
          bonusAnalyses={userStats?.bonusAnalyses || 0}
          isPro={Boolean(userStats?.isPro)}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen relative bg-[var(--color-study-bg)] dark:bg-[var(--color-study-dark-bg)] pb-20 selection:bg-blue-100 selection:text-blue-900 overflow-x-hidden">
      {/* Offline Mode Banner */}
      {!isOnline && (
        <div className="bg-amber-500 text-slate-950 font-black text-xs py-2 px-4 text-center flex items-center justify-center gap-2 sticky top-0 z-[70] shadow-md">
          <WifiOff className="w-4 h-4 shrink-0" />
          <span>Offline Mode — Viewing cached study data. AI generation and live features are unavailable until reconnected.</span>
        </div>
      )}

      {/* Streak Increase Toast */}
      <AnimatePresence>
        {showStreakToast && (
          <motion.div
            key="streak-toast-toast"
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 20, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] bg-slate-900 text-white border-2 border-amber-500/50 px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 font-black text-sm"
          >
            <Flame className="w-6 h-6 fill-amber-500 text-amber-500 animate-bounce" />
            <span>🔥 Streak Updated! {userStats?.currentStreak || 1} Days in a row!</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="glass-morphism sticky top-0 z-[60] min-h-20 py-2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-full flex items-center justify-between gap-4 min-w-0">
          <div className="flex items-center gap-3 shrink-0 cursor-pointer group" onClick={() => { setView('notebooks'); setCurrentNotebook(null); setResult(null); }}>
            <div className="bg-slate-950 dark:bg-white p-2.5 rounded-2xl shadow-xl transition-transform group-hover:scale-110 group-hover:rotate-3">
              <GraduationCap className="text-white dark:text-slate-950 w-7 h-7" />
            </div>
            <div>
              <h1 className="font-display font-black text-2xl tracking-tighter text-slate-950 dark:text-white leading-none">
                AI STUDY <span className="text-blue-600 italic">BUDDY</span>
              </h1>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-[0.3em] mt-1">Multi-Source Grounded Tutor</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto no-scrollbar py-1 shrink min-w-0 max-w-full">
            {/* Language Selector with Pro Lock Gating */}
            <div className="shrink-0 hidden sm:flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800">
              <Globe className="w-3.5 h-3.5 text-blue-500" />
              <select
                value={selectedLanguage}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val !== 'English' && !userStats?.isPro) {
                    setIsUpgradeModalOpen(true);
                    return;
                  }
                  setSelectedLanguage(val);
                  localStorage.setItem('study_buddy_language', val);
                }}
                className="bg-transparent text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
              >
                <option value="English">English (Free)</option>
                <option value="Urdu" disabled={!userStats?.isPro}>Urdu (اردو) {!userStats?.isPro ? '🔒 PRO' : ''}</option>
                <option value="Arabic" disabled={!userStats?.isPro}>Arabic (العربية) {!userStats?.isPro ? '🔒 PRO' : ''}</option>
                <option value="Spanish" disabled={!userStats?.isPro}>Spanish (Español) {!userStats?.isPro ? '🔒 PRO' : ''}</option>
                <option value="French" disabled={!userStats?.isPro}>French (Français) {!userStats?.isPro ? '🔒 PRO' : ''}</option>
                <option value="Hindi" disabled={!userStats?.isPro}>Hindi (हिंदी) {!userStats?.isPro ? '🔒 PRO' : ''}</option>
              </select>
              {!userStats?.isPro && (
                <span 
                  onClick={() => setIsUpgradeModalOpen(true)}
                  className="text-[9px] font-extrabold bg-amber-500/20 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded-md flex items-center gap-0.5 cursor-pointer hover:bg-amber-500/30 transition-all"
                  title="Unlock Multilingual AI with Pro"
                >
                  <Lock className="w-2.5 h-2.5" /> PRO
                </span>
              )}
            </div>

            {/* Live Real-time Group Study Button */}
            <button
              onClick={() => {
                if (!userStats?.isPro) {
                  setIsUpgradeModalOpen(true);
                } else {
                  setIsGroupStudyOpen(true);
                }
              }}
              className="shrink-0 px-3 py-1.5 bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/30 text-indigo-600 dark:text-indigo-400 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer whitespace-nowrap"
              title="Real-time Collaborative Group Study"
            >
              <Users className="w-4 h-4 text-indigo-500" />
              <span>Group Study</span>
              {!userStats?.isPro && (
                <span className="text-[9px] font-black bg-amber-500/20 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                  <Lock className="w-2.5 h-2.5" /> PRO
                </span>
              )}
            </button>

            {/* University & Degree Tracker Button */}
            <button
              onClick={() => {
                if (!userStats?.isPro) {
                  setIsUpgradeModalOpen(true);
                } else {
                  setShowUniversityTracker(true);
                }
              }}
              className="shrink-0 px-3 py-1.5 bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/30 text-blue-600 dark:text-blue-400 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer whitespace-nowrap"
              title="AI University & Degree Tracker"
            >
              <span>Uni Tracker</span>
              {!userStats?.isPro && (
                <span className="text-[9px] font-black bg-amber-500/20 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                  <Lock className="w-2.5 h-2.5" /> PRO
                </span>
              )}
            </button>

            {/* Scholarship Tracker Button */}
            <button
              onClick={() => {
                if (!userStats?.isPro) {
                  setIsUpgradeModalOpen(true);
                } else {
                  setShowScholarshipTracker(true);
                }
              }}
              className="shrink-0 px-3 py-1.5 bg-amber-600/10 hover:bg-amber-600/20 border border-amber-500/30 text-amber-600 dark:text-amber-400 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer whitespace-nowrap"
              title="AI Scholarship & Grant Tracker"
            >
              <span>Scholarships</span>
              {!userStats?.isPro && (
                <span className="text-[9px] font-black bg-amber-500/20 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                  <Lock className="w-2.5 h-2.5" /> PRO
                </span>
              )}
            </button>

            {/* How It Works Button */}
            <button
              onClick={() => setShowHowItWorksGlobal(true)}
              className="shrink-0 px-3 py-1.5 bg-sky-600/10 hover:bg-sky-600/20 border border-sky-500/30 text-sky-600 dark:text-sky-400 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer whitespace-nowrap"
              title="How It Works & Instructions"
            >
              <HelpCircle className="w-4 h-4 text-sky-500" />
              <span>How It Works</span>
            </button>

            {/* Study Analytics Recharts Button */}
            <button
              onClick={() => setIsAccountSettingsOpen(true)}
              className="shrink-0 px-3 py-1.5 bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/30 text-blue-600 dark:text-blue-400 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer whitespace-nowrap"
              title="Study Analytics & Progress Charts"
            >
              <BarChart2 className="w-4 h-4 text-blue-500" />
              <span>Analytics</span>
            </button>

            {/* Streak Pill */}
            <button
              onClick={() => setIsAccountSettingsOpen(true)}
              className="shrink-0 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-600 dark:text-amber-400 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all whitespace-nowrap"
              title="Study Streak"
            >
              <Flame className="w-4 h-4 fill-amber-500 text-amber-500" />
              <span>{userStats?.currentStreak || 0}d</span>
            </button>

            {/* Pro / Free Pill */}
            {userStats?.isPro ? (
              <span
                onClick={() => setIsAccountSettingsOpen(true)}
                className="shrink-0 px-3 py-1.5 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer shadow-sm hover:scale-105 transition-all flex items-center gap-1 whitespace-nowrap"
              >
                <Zap className="w-3.5 h-3.5 fill-current" />
                PRO
              </span>
            ) : (
              <button
                onClick={() => setIsUpgradeModalOpen(true)}
                className="shrink-0 px-3.5 py-1.5 bg-gradient-to-r from-amber-500/10 via-blue-500/10 to-indigo-500/10 hover:from-amber-500/20 hover:to-indigo-500/20 border border-blue-500/30 text-blue-600 dark:text-blue-400 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer shadow-xs"
                title="Click to upgrade to Pro ($3.99/month or $30.99/year)"
              >
                <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500 animate-pulse" />
                <span>Upgrade Pro ($3.99/mo)</span>
              </button>
            )}

            <nav className="shrink-0 flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
              <button 
                onClick={() => setView('landing')}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all flex items-center gap-1.5 whitespace-nowrap",
                  (view as string) === 'landing' ? "bg-white dark:bg-slate-800 text-slate-950 dark:text-white shadow-sm" : "text-slate-400 hover:text-slate-600"
                )}
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                Landing
              </button>

              <button 
                onClick={() => setView('notebooks')}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all flex items-center gap-1.5 whitespace-nowrap",
                  view === 'notebooks' ? "bg-white dark:bg-slate-800 text-slate-950 dark:text-white shadow-sm" : "text-slate-400 hover:text-slate-600"
                )}
              >
                <BookOpen className="w-3.5 h-3.5" />
                Notebooks ({notebooks.length})
              </button>

              <button 
                onClick={() => { setBlogSlug(null); setView('blog'); }}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all flex items-center gap-1.5 whitespace-nowrap",
                  (view as string) === 'blog' ? "bg-white dark:bg-slate-800 text-slate-950 dark:text-white shadow-sm" : "text-slate-400 hover:text-slate-600"
                )}
              >
                <FileText className="w-3.5 h-3.5 text-blue-500" />
                Blog
              </button>

              {currentNotebook && (
                <>
                  <button 
                    onClick={() => setView('home')}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all truncate max-w-[120px] sm:max-w-[160px] whitespace-nowrap",
                      view === 'home' ? "bg-white dark:bg-slate-800 text-slate-950 dark:text-white shadow-sm" : "text-slate-400 hover:text-slate-600"
                    )}
                    title={currentNotebook.title}
                  >
                    {currentNotebook.title}
                  </button>
                  <button 
                    onClick={() => setIsSourcesOpen(true)}
                    className="px-2.5 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg text-xs font-bold hover:bg-blue-100 transition-all flex items-center gap-1 whitespace-nowrap"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    Sources ({currentNotebook.sources.filter(s => s.enabled).length})
                  </button>
                </>
              )}
            </nav>

            <div className="shrink-0 flex items-center gap-2">
              {(isAdmin || currentUser?.email?.toLowerCase() === 'ayaicrypcoin@gmail.com' || currentUser?.email?.toLowerCase() === 'sagarmatha.store1@gmail.com') && (
                <button
                  onClick={() => setView('admin')}
                  className={cn(
                    "px-3 py-2 border rounded-2xl transition-all text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-xs whitespace-nowrap relative",
                    view === 'admin'
                      ? "bg-rose-600 text-white border-rose-500 shadow-md"
                      : "bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border-rose-500/30"
                  )}
                  title="Open Admin Control Center"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Admin Center</span>
                  {pendingPaymentCount > 0 && (
                    <span className="ml-1 px-2 py-0.5 text-[10px] font-black bg-amber-400 text-slate-950 rounded-full animate-pulse shadow-md border border-amber-300 flex items-center justify-center shrink-0">
                      {pendingPaymentCount}
                    </span>
                  )}
                </button>
              )}

              <button
                onClick={() => setShowLearningRoadmap(true)}
                className="px-3 py-2 bg-gradient-to-r from-indigo-600/10 to-purple-600/10 hover:from-indigo-600/20 hover:to-purple-600/20 text-indigo-600 dark:text-indigo-300 border border-indigo-500/30 rounded-2xl transition-all text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-xs whitespace-nowrap"
                title="View Learning Roadmap & Mastery Path"
              >
                <Map className="w-4 h-4 text-indigo-500" />
                <span>Roadmap</span>
              </button>

              <button
                onClick={() => setIsAccountSettingsOpen(true)}
                className="w-10 h-10 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-all text-slate-500 dark:text-slate-400 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 cursor-pointer shrink-0"
                title="Account & Settings"
              >
                <Settings className="w-5 h-5" />
              </button>

              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="w-10 h-10 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-all text-slate-500 dark:text-slate-400 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 cursor-pointer shrink-0"
                title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                {isDarkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-indigo-600" />}
              </button>

              {currentUser ? (
                <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800 shrink-0">
                  <img 
                    onClick={() => setIsAccountSettingsOpen(true)}
                    src={currentUser.photoURL || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"} 
                    alt={currentUser.displayName ? `${currentUser.displayName}'s Profile Avatar` : "Student Profile Avatar"} 
                    className="w-10 h-10 rounded-2xl border-2 border-white dark:border-slate-800 shadow-lush object-cover cursor-pointer hover:scale-105 transition-transform" 
                  />
                  <button 
                    onClick={() => signOut(auth)}
                    className="w-10 h-10 flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-500/10 text-red-500 rounded-2xl transition-colors border border-transparent hover:border-red-100 dark:hover:border-red-900/30 cursor-pointer"
                    title="Sign Out"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => {
                    setAuthModalMode('signin');
                    setIsAuthModalOpen(true);
                  }}
                  className="bg-slate-950 dark:bg-white text-white dark:text-slate-950 px-4 py-2.5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-deep hover:scale-105 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className={cn("mx-auto px-4 md:px-6 pt-8 md:pt-12 transition-all", (view === 'notebooks' || view === 'admin') ? "max-w-7xl" : "max-w-5xl")}>
        {authLoading ? (
            <div className="flex items-center justify-center py-20">
                <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
            </div>
        ) : view === 'admin' ? (
           <AdminDashboard 
              currentUser={currentUser} 
              onNavigateHome={() => setView('notebooks')} 
           />
        ) : view === 'notebooks' ? (
           <NotebooksHome 
              notebooks={notebooks}
              onOpenNotebook={handleSelectNotebook}
              onCreateNotebook={handleCreateNotebook}
              onDeleteNotebook={handleDeleteNotebook}
              onOpenUniversityTracker={() => {
                if (!userStats?.isPro) {
                  setIsUpgradeModalOpen(true);
                } else {
                  setShowUniversityTracker(true);
                }
              }}
           />
        ) : view === 'dashboard' ? (
           <Suspense fallback={<div className="flex items-center justify-center p-20"><div className="w-8 h-8 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" /></div>}>
             <Dashboard 
                onBack={() => setView('home')} 
                onSelectSession={loadSession} 
                onShowWeaknessDetector={() => setShowWeaknessDetector(true)}
             />
           </Suspense>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-slate-100/80 dark:bg-slate-900/80 rounded-2xl border border-slate-200 dark:border-slate-800 backdrop-blur-md shadow-xs">
              <button
                type="button"
                onClick={() => {
                  setView('notebooks');
                  setCurrentNotebook(null);
                  setResult(null);
                }}
                className="px-4 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-extrabold text-xs flex items-center gap-2 transition-all shadow-xs cursor-pointer group"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform text-blue-600 dark:text-blue-400" />
                <span>← Back to All Notebooks</span>
              </button>

              {currentNotebook && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-400 hidden sm:inline">Active Notebook:</span>
                  <span className="px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg font-black text-xs truncate max-w-[150px] sm:max-w-[250px]">
                    {currentNotebook.title}
                  </span>
                </div>
              )}
            </div>

            <AnimatePresence mode="wait">
          {!result ? (
            <motion.div 
              key="upload"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-12"
            >
              {/* Engineering Total Mastery Hero Banner */}
              <div className="relative rounded-[3.5rem] overflow-hidden border border-slate-800/80 shadow-2xl bg-slate-950 p-8 md:p-14 space-y-10">
                {/* Background Image Layer with Gradient Overlay */}
                <div className="absolute inset-0 z-0">
                  <img 
                    src={engineeringMasteryBg} 
                    alt="Engineering Mastery Ambient Atmosphere" 
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover object-center opacity-35 mix-blend-luminosity filter brightness-110 contrast-125"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/95 to-indigo-950/70" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                  <div className="absolute -top-20 -right-20 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
                  <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
                </div>

                {/* Foreground Header Content */}
                <div className="relative z-10 max-w-4xl mx-auto text-center space-y-6">
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="inline-flex items-center gap-3 px-5 py-2 bg-slate-900/90 border border-slate-700/80 rounded-full shadow-lg backdrop-blur-md"
                  >
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-pulse shadow-sm shadow-blue-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">
                      Engineering Intelligence Engine
                    </span>
                    <span className="w-px h-3 bg-slate-700" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-blue-400 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> AI Grounded
                    </span>
                  </motion.div>
                  
                  <h2 className="text-5xl md:text-7xl font-display font-black text-white tracking-tighter leading-[0.9]">
                     Engineering <br />
                     <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-sky-300 bg-clip-text text-transparent inline-block transition-transform hover:scale-105 cursor-default">
                       Total Mastery Hub
                     </span>
                  </h2>

                  <p className="text-base md:text-xl text-slate-300 font-medium max-w-2xl mx-auto leading-relaxed">
                    Upload textbooks, problem sets, formulas, or lecture slides. Generate age-adaptive solutions, cognitive mindmaps, and interactive exam practice in seconds.
                  </p>

                  {/* AI Studio Suite Quick Launch Bar */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto pt-4">
                    <button
                      type="button"
                      onClick={() => setShowImageStudio(true)}
                      className="p-5 rounded-3xl bg-slate-900/80 hover:bg-slate-800/90 border border-purple-500/30 hover:border-purple-400 hover:shadow-2xl hover:shadow-purple-500/20 transition-all text-left group backdrop-blur-xl cursor-pointer"
                    >
                      <div className="w-11 h-11 rounded-2xl bg-purple-600/90 text-white flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-md shadow-purple-500/30">
                        <Wand2 className="w-5.5 h-5.5" />
                      </div>
                      <h4 className="font-black text-sm text-white group-hover:text-purple-300 transition-colors">Diagram Studio</h4>
                      <p className="text-[11px] text-slate-400 font-medium mt-0.5 leading-snug">Generate & edit high-res diagrams</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowVeoStudio(true)}
                      className="p-5 rounded-3xl bg-slate-900/80 hover:bg-slate-800/90 border border-blue-500/30 hover:border-blue-400 hover:shadow-2xl hover:shadow-blue-500/20 transition-all text-left group backdrop-blur-xl cursor-pointer"
                    >
                      <div className="w-11 h-11 rounded-2xl bg-blue-600/90 text-white flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-md shadow-blue-500/30">
                        <Clapperboard className="w-5.5 h-5.5" />
                      </div>
                      <h4 className="font-black text-sm text-white group-hover:text-blue-300 transition-colors">Veo Video Studio</h4>
                      <p className="text-[11px] text-slate-400 font-medium mt-0.5 leading-snug">Animate formulas & lectures</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowDeepThinking(true)}
                      className="p-5 rounded-3xl bg-slate-900/80 hover:bg-slate-800/90 border border-emerald-500/30 hover:border-emerald-400 hover:shadow-2xl hover:shadow-emerald-500/20 transition-all text-left group backdrop-blur-xl cursor-pointer"
                    >
                      <div className="w-11 h-11 rounded-2xl bg-emerald-600/90 text-white flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-md shadow-emerald-500/30">
                        <BrainCircuit className="w-5.5 h-5.5" />
                      </div>
                      <h4 className="font-black text-sm text-white group-hover:text-emerald-300 transition-colors">Deep Thinking</h4>
                      <p className="text-[11px] text-slate-400 font-medium mt-0.5 leading-snug">Solve calculus & proof logic</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowSearchGrounding(true)}
                      className="p-5 rounded-3xl bg-slate-900/80 hover:bg-slate-800/90 border border-sky-500/30 hover:border-sky-400 hover:shadow-2xl hover:shadow-sky-500/20 transition-all text-left group backdrop-blur-xl cursor-pointer"
                    >
                      <div className="w-11 h-11 rounded-2xl bg-sky-600/90 text-white flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-md shadow-sky-500/30">
                        <Globe className="w-5.5 h-5.5" />
                      </div>
                      <h4 className="font-black text-sm text-white group-hover:text-sky-300 transition-colors">Search Grounding</h4>
                      <p className="text-[11px] text-slate-400 font-medium mt-0.5 leading-snug">Live web syllabus & research</p>
                    </button>
                  </div>
                </div>
              </div>

              {/* Enhanced Multi-File Upload Area */}
              <div 
                className={cn(
                  "relative group border-4 border-dashed rounded-[3.5rem] p-8 md:p-12 transition-all duration-500 flex flex-col items-center justify-center gap-8 bg-white dark:bg-slate-900/90 backdrop-blur-xl shadow-xl",
                  previews.length > 0 
                    ? "border-blue-400 dark:border-blue-500 bg-blue-50/10 dark:bg-blue-950/20" 
                    : "border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-2xl hover:shadow-blue-500/10"
                )}
              >
                {previews.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 w-full">
                    {previews.map((prev, i) => (
                      <motion.div 
                        key={`preview-item-${i}-${prev.name || 'file'}`}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="relative aspect-square group/item"
                      >
                        <div className="w-full h-full rounded-2xl overflow-hidden shadow-lg border-2 border-white bg-slate-50 flex items-center justify-center">
                          {prev.type === 'application/pdf' ? (
                            <div className="flex flex-col items-center gap-2">
                                <FileText className="w-10 h-10 text-red-500" />
                                <span className="text-[10px] font-black uppercase text-slate-400 line-clamp-1 max-w-full px-1">{prev.name || "PDF Document"}</span>
                            </div>
                          ) : prev.type.startsWith('image/') ? (
                            <img src={prev.url} alt={prev.name ? `Preview for ${prev.name}` : "Uploaded study material preview"} className="w-full h-full object-cover" />
                          ) : (
                            <div className="flex flex-col items-center gap-2 p-2 text-center">
                                <FileText className="w-10 h-10 text-indigo-500" />
                                <span className="text-[10px] font-black uppercase text-slate-400 line-clamp-1 max-w-full px-1">{prev.name || "Study File"}</span>
                            </div>
                          )}
                        </div>
                        <button 
                          type="button"
                          onClick={() => removeFile(i)}
                          className="absolute -top-2 -right-2 bg-white shadow-lg p-1.5 rounded-full text-red-500 border border-slate-100 hover:scale-110 active:scale-95 transition-transform"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      </motion.div>
                    ))}
                    <button 
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="aspect-square rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-2 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600 transition-all text-slate-400"
                    >
                        <Plus className="w-8 h-8" />
                        <span className="text-[10px] font-black uppercase">Add More</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center py-12 pointer-events-none text-center">
                    <div className="w-28 h-28 bg-gradient-to-tr from-blue-600 to-indigo-700 rounded-[3rem] flex items-center justify-center mb-6 shadow-2xl shadow-blue-200 group-hover:rotate-6 transition-transform duration-500">
                      <Upload className="w-12 h-12 text-white" />
                    </div>
                    <h4 className="text-3xl font-black text-slate-800 dark:text-slate-100 mb-2 tracking-tight">Document & Image Study Workspace</h4>
                    <p className="text-slate-400 max-w-xs font-bold leading-relaxed">Select PDF documents, textbook scans, notes, or images for high-accuracy analysis.</p>
                  </div>
                )}
                
                <input 
                  type="file" 
                  className="hidden" 
                  ref={fileInputRef} 
                  accept="image/*,application/pdf,.docx,.txt,.md,.csv" 
                  multiple
                  onChange={handleFileChange}
                />
                
                {error && <ErrorDisplay error={error} onClear={() => setError(null)} />}

                <div className="flex flex-col items-center gap-10 mt-10">
                  {/* Age Selection */}
                  <div className="w-full max-w-xl">
                    <div className="flex items-center justify-center gap-3 mb-4">
                      <div className="h-px bg-slate-100 dark:bg-slate-800 flex-1" />
                      <label className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 dark:text-slate-500 whitespace-nowrap">
                         Cognitive Adaptation Level
                      </label>
                      <div className="h-px bg-slate-100 dark:bg-slate-800 flex-1" />
                    </div>
                    <div className="grid grid-cols-5 bg-slate-50 dark:bg-slate-900 p-2 rounded-[2rem] border border-slate-100 dark:border-slate-800">
                      {[7, 15, 25, 40, 50].map((age) => (
                        <button
                          key={`app-age-${age}`}
                          onClick={() => setSelectedAge(age)}
                          className={cn(
                            "py-4 rounded-2xl font-display font-black text-xl transition-all duration-500 border border-transparent flex flex-col items-center justify-center gap-1",
                            selectedAge === age 
                              ? "bg-white dark:bg-slate-800 text-blue-600 shadow-deep scale-[1.08] border-blue-100 dark:border-slate-700 z-10" 
                              : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                          )}
                        >
                          <span className={cn("transition-transform", selectedAge === age && "scale-110")}>{age === 50 ? '50+' : age}</span>
                          <span className="text-[8px] font-black uppercase tracking-tighter opacity-60">Level</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-6 items-center w-full max-w-2xl px-6">
                  {previews.length === 0 ? (
                    <button 
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full bg-slate-950 dark:bg-white text-white dark:text-slate-950 px-10 py-6 rounded-3xl font-display font-black shadow-deep hover:bg-slate-900 dark:hover:bg-slate-100 hover:-translate-y-2 transition-all flex items-center justify-center gap-4 text-2xl uppercase tracking-tighter active:translate-y-0"
                    >
                      <Plus className="w-8 h-8" /> <span>Connect Intelligence</span>
                    </button>
                  ) : (
                    <button 
                      type="button"
                      disabled={loading}
                      onClick={(e) => { e.preventDefault(); handleUpload(); }}
                      className={cn(
                        "w-full bg-blue-600 text-white px-10 py-6 rounded-3xl font-display font-black shadow-deep hover:bg-blue-700 transition-all hover:-translate-y-2 active:translate-y-0 flex items-center justify-center gap-4 text-2xl uppercase tracking-tighter group overflow-hidden",
                        loading && "opacity-90 cursor-not-allowed transform-none"
                      )}
                    >
                      {loading ? (
                         <div className="flex items-center gap-4">
                            <Loader2 className="w-8 h-8 animate-spin" />
                            <span>Infiltrating Data...</span>
                         </div>
                      ) : (
                        <>
                          <BrainCircuit className="w-8 h-8 group-hover:scale-110 transition-transform" /> 
                          <span>Execute Synthesis ({files.length})</span>
                        </>
                      )}
                    </button>
                  )}
                  </div>
                </div>
            </div>

            <AnimatePresence>
               {loading && (
                 <motion.div 
                   key="global-loading-screen"
                   initial={{ opacity: 0, y: -30 }}
                   animate={{ opacity: 1, y: 0 }}
                   exit={{ opacity: 0, y: -30 }}
                   className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] max-w-xl w-[92%] bg-white dark:bg-slate-900 border-2 border-blue-600/50 shadow-2xl rounded-3xl p-4 sm:p-5"
                 >
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shrink-0 shadow-md text-white animate-pulse">
                         <Brain className="w-6 h-6" />
                       </div>
                       <div className="flex-1 min-w-0">
                          <h4 className="text-sm sm:text-base font-black text-slate-950 dark:text-white truncate">
                             Generating Intelligence Layer...
                          </h4>
                          <div className="flex items-center gap-2 mt-0.5">
                            <div className="w-2 h-2 rounded-full bg-blue-600 animate-bounce" />
                            <p className="text-xs font-bold text-blue-600 dark:text-blue-400 truncate uppercase tracking-wider">{loadingMessage || "Synthesizing multi-source knowledge..."}</p>
                          </div>
                       </div>
                       <Loader2 className="w-6 h-6 text-blue-600 animate-spin shrink-0" />
                    </div>
                 </motion.div>
               )}
            </AnimatePresence>

              {/* Feature Highlights */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12">
                <FeatureCard 
                   icon={<Mic className="text-emerald-500" />}
                   title="Voice Tutoring"
                   desc="Talk naturally with your AI Buddy to clear doubts in real-time."
                />
                <FeatureCard 
                   icon={<HelpCircle className="text-purple-500" />}
                   title="Interactive Quizzes"
                   desc="Test your understanding with personalized concept-check MCQs."
                />
                <FeatureCard 
                   icon={<BookOpen className="text-amber-500" />}
                   title="Smart Summaries"
                   desc="Get the gist of any lengthly topic in just 3-5 solid bullet points."
                />
              </div>

            </motion.div>
          ) : (
            <motion.div 
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-12"
            >
              {/* Distinctive Hero Section */}
              <div className="bg-white dark:bg-slate-950 rounded-[4rem] p-8 md:p-14 text-slate-950 dark:text-white shadow-xl relative overflow-hidden group border border-slate-200 dark:border-white/5">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03]" />
                <div className="absolute -top-24 -right-24 w-[500px] h-[500px] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />
                <div className="absolute -bottom-24 -left-24 w-[300px] h-[300px] bg-purple-600/10 blur-[100px] rounded-full pointer-events-none" />
                
                <div className="relative z-20 mb-8 flex flex-wrap items-center justify-between gap-4">
                  <button 
                    onClick={reset}
                    className="group/back inline-flex items-center gap-3 px-6 py-2.5 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 transition-all cursor-pointer shadow-sm"
                  >
                    <ArrowLeft className="w-5 h-5 group-hover/back:-translate-x-2 transition-transform text-blue-600 dark:text-blue-400" />
                    <span className="font-display font-black text-xs uppercase tracking-wider">Back to Workspace</span>
                  </button>

                  <button
                    onClick={() => setIsSourcesOpen(true)}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-all shadow-md hover:scale-105 active:scale-95 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Add More Documents</span>
                  </button>
                </div>

                <div className="relative z-10 flex flex-col xl:flex-row xl:items-end justify-between gap-12">
                  <div className="space-y-6 max-w-3xl">
                    <div className="flex flex-wrap gap-2.5 items-center">
                      <div className="px-5 py-2 bg-blue-600 rounded-xl text-[10px] font-black tracking-widest uppercase text-white shadow-md">
                        {result.subject}
                      </div>
                      {(result.topics || []).slice(0, 3).map((t, idx) => (
                        <div key={`hero-topic-${idx}-${t}`} className="px-4 py-2 bg-slate-100 dark:bg-white/5 backdrop-blur-3xl rounded-xl text-[10px] font-black tracking-widest uppercase border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                          {t}
                        </div>
                      ))}
                    </div>
                    
                    <h2 className="text-4xl sm:text-6xl md:text-7xl font-display font-black tracking-tight leading-[0.95] text-slate-950 dark:text-white">
                        {result.topics?.[0] || result.subject}
                    </h2>
                    
                    <div className="flex items-center gap-4">
                       <div className="h-px bg-slate-200 dark:bg-white/10 flex-1" />
                       <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 font-black uppercase text-xs tracking-wider">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                          AI Analysis Saved & Ready
                       </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-4 w-full xl:w-80">
                    <button 
                      onClick={exportFullReport}
                      className="bg-indigo-600 text-white p-5 rounded-3xl font-display font-black transition-all flex items-center justify-center gap-3 shadow-lg hover:bg-indigo-500 active:scale-95 group/export cursor-pointer"
                    >
                      <Download className="w-5 h-5 group-hover:animate-bounce" /> 
                      <span className="uppercase text-xs tracking-wider">Download PDF Summary</span>
                    </button>
                    <button 
                      onClick={() => setView('dashboard')}
                      className="bg-slate-100 dark:bg-white/5 text-slate-900 dark:text-white border border-slate-200 dark:border-white/10 p-5 rounded-3xl font-display font-black transition-all flex items-center justify-center gap-3 hover:bg-slate-200 dark:hover:bg-white/10 active:scale-95 group/dash cursor-pointer"
                    >
                      <History className="w-5 h-5 text-slate-500 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-white transition-colors" /> 
                      <span className="uppercase text-xs tracking-wider">Study Analytics</span>
                    </button>
                    <button 
                      onClick={() => {
                        if (!userStats?.isPro) {
                          setIsUpgradeModalOpen(true);
                        } else {
                          setIsVoiceMode(true);
                        }
                      }}
                      className="bg-slate-950 dark:bg-white text-white dark:text-slate-950 p-5 rounded-3xl font-display font-black transition-all flex items-center justify-center gap-3 shadow-lg hover:scale-[1.02] active:scale-95 group/voice cursor-pointer"
                    >
                      <Mic className="w-5 h-5 group-hover:animate-pulse" /> 
                      <span className="uppercase text-xs tracking-wider">AI Voice Tutor</span>
                      {!userStats?.isPro && (
                        <span className="text-[9px] font-black bg-amber-500/20 text-amber-600 px-1.5 py-0.5 rounded">
                          🔒 PRO
                        </span>
                      )}
                    </button>
                    <div className="flex bg-white/5 backdrop-blur-3xl rounded-3xl p-3 border border-white/10 items-center justify-between gap-6 sm:col-span-2 xl:col-span-1">
                        <div className="flex items-center gap-4 px-6">
                            <Timer className={cn("w-6 h-6", timerActive ? "text-orange-400 animate-pulse" : "text-slate-500")} />
                            <span className="font-mono font-black text-2xl text-white tracking-widest">{formatTime(timeLeft)}</span>
                        </div>
                        <button 
                            onClick={handleToggleTimer}
                            className="bg-white/10 hover:bg-white/20 p-4 rounded-2xl transition-all active:scale-90 cursor-pointer"
                            title={timerActive ? "Pause & Complete Session" : "Start Study Timer"}
                        >
                            {timerActive ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
                        </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="flex bg-white dark:bg-slate-900 p-2 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-xl sticky top-24 z-40 overflow-x-auto no-scrollbar gap-1 items-center">
                {[
                  { id: 'overview', label: 'Overview', icon: LayoutGrid },
                  { id: 'guide', label: 'Guide', icon: BookOpen },
                  { id: 'studycast', label: 'StudyCast', icon: Mic },
                  { id: 'mindmap', label: 'Mind Map', icon: BrainCircuit },
                  { id: 'flashcards', label: 'Flashcards', icon: Layers },
                  { id: 'quiz', label: 'Quiz', icon: Target },
                  { id: 'chat', label: 'Grounded Chat', icon: MessageSquare }
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={cn(
                            "shrink-0 px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all whitespace-nowrap flex items-center gap-2",
                            activeTab === tab.id 
                                ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-lg" 
                                : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                        )}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
                
                <div className="shrink-0 flex items-center gap-2 ml-auto px-4 border-l border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => setShowLearningRoadmap(true)}
                    className="shrink-0 flex items-center gap-2 px-4 py-3 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-600 dark:text-indigo-300 rounded-2xl font-display font-black text-xs uppercase tracking-widest transition-all cursor-pointer border border-indigo-500/20 whitespace-nowrap"
                    title="View Learning Roadmap Card"
                  >
                    <Map className="w-4 h-4 text-indigo-500" />
                    <span>Roadmap</span>
                  </button>

                  <button
                    onClick={exportFullReport}
                    className="shrink-0 flex items-center gap-2 px-4 py-3 bg-slate-950 dark:bg-white text-white dark:text-slate-950 rounded-2xl font-display font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-deep group whitespace-nowrap"
                  >
                    <Download className="w-4 h-4 group-hover:animate-bounce" />
                    <span>Export</span>
                  </button>
                </div>
              </div>

              {/* Quick AI Assistance Floating Header */}
              <div className="mt-8 bg-slate-900/5 dark:bg-white/5 backdrop-blur-sm rounded-3xl p-6 border border-slate-200 dark:border-white/10 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
                    <Brain className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-black text-slate-900 dark:text-white leading-tight">Concept Assistant</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Struggling with a concept? Click any term to explain it.</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setActiveTab('chat')}
                    className="px-6 py-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl font-black text-xs hover:bg-slate-50 dark:hover:bg-slate-700 transition-all flex items-center gap-2"
                  >
                    <MessageSquare className="w-4 h-4" /> Ask a Question
                  </button>
                  <button 
                    onClick={() => {
                      if (!userStats?.isPro) {
                        setIsUpgradeModalOpen(true);
                      } else {
                        setIsVoiceMode(true);
                      }
                    }}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-black text-xs hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-lg shadow-indigo-200 dark:shadow-none cursor-pointer"
                  >
                    <Mic className="w-4 h-4" /> Start Voice Session {!userStats?.isPro ? '🔒 PRO' : ''}
                  </button>
                </div>
              </div>

              <AnimatePresence mode="wait">
                {activeTab === 'guide' && (
                  <motion.div
                    key="guide"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="mt-8"
                  >
                    <NotebookGuide 
                      guide={currentNotebook?.guide}
                      isLoading={isGuideLoading}
                      onGenerateGuide={handleGenerateGuide}
                      onSaveNote={handleSaveNote}
                      age={currentNotebook?.age || selectedAge}
                    />
                  </motion.div>
                )}

                {activeTab === 'studycast' && (
                  <motion.div
                    key="studycast"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="mt-8"
                  >
                    <StudyCast 
                      script={currentNotebook?.studyCastScript || []}
                      isLoadingScript={isScriptLoading}
                      onGenerateScript={handleGenerateScript}
                      onAskMidCast={runMidCastAnswer}
                      age={currentNotebook?.age || selectedAge}
                    />
                  </motion.div>
                )}

                {activeTab === 'mindmap' && (
                  <motion.div
                    key="mindmap"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="mt-8"
                  >
                    <MindMap 
                      data={currentNotebook?.mindMap}
                      isLoading={isMindMapLoading}
                      onGenerateMindMap={handleGenerateMindMap}
                      onAskAboutNode={handleAskAboutNode}
                    />
                  </motion.div>
                )}

                {activeTab === 'overview' && (
                    <motion.div 
                        key="overview"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-12 mt-12"
                    >
                        {result && <NotebookInfographic data={result} onDeepAnalysis={() => document.getElementById('tactical-breakdown')?.scrollIntoView({ behavior: 'smooth' })} />}

                        {/* Summary Section (Enhanced) */}
                        <div className="bg-white dark:bg-slate-900 rounded-[3.5rem] p-10 md:p-16 shadow-lush border border-slate-100 dark:border-slate-800 relative overflow-hidden group">
                             <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-[80px] rounded-full pointer-events-none" />
                             <div className="flex flex-col xl:flex-row xl:items-center justify-between mb-16 gap-10">
                                <div className="flex items-center gap-8">
                                    <div className="bg-slate-950 dark:bg-white p-6 rounded-[2.5rem] shadow-deep group-hover:rotate-12 transition-transform duration-700">
                                        <Zap className="text-white dark:text-slate-950 w-10 h-10" />
                                    </div>
                                    <div>
                                        <h3 className="text-5xl font-display font-black text-slate-950 dark:text-white tracking-tighter">Core Synthesis</h3>
                                        <p className="text-slate-500 dark:text-slate-400 font-black uppercase tracking-[0.4em] text-[10px] mt-2">Neural Extraction Complete</p>
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-4">
                                    <button 
                                        onClick={() => setShowConverter(true)}
                                        className="flex-1 md:flex-none flex items-center justify-center gap-3 bg-white dark:bg-slate-800 text-slate-950 dark:text-white border-2 border-slate-950 dark:border-white/20 px-10 py-5 rounded-2xl font-display font-black text-xs uppercase tracking-widest shadow-soft hover:bg-slate-50 dark:hover:bg-slate-700 active:scale-95 transition-all"
                                    >
                                        <Layers className="w-5 h-5" />
                                        Assets
                                    </button>
                                    <button 
                                        onClick={() => setShowResumeMaker(true)}
                                        className="flex-1 md:flex-none flex items-center justify-center gap-3 bg-slate-950 dark:bg-white text-white dark:text-slate-950 px-10 py-5 rounded-2xl font-display font-black text-xs uppercase tracking-widest shadow-deep hover:scale-105 transition-all"
                                    >
                                        <GraduationCap className="w-5 h-5" />
                                        Resume
                                    </button>
                                </div>
                             </div>
                             <div className="columns-1 md:columns-2 gap-10 space-y-6">
                             {result.summary.map((point, i) => (
                                <div key={`sum-pt-${i}`} className="break-inside-avoid p-8 bg-slate-50/50 dark:bg-slate-800/10 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 hover:bg-white dark:hover:bg-slate-900 transition-all group/card shadow-soft relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 blur-2xl rounded-full opacity-0 group-hover/card:opacity-100 transition-opacity" />
                                    <div className="flex gap-6 relative z-10">
                                        <div className="w-2.5 h-2.5 rounded-full bg-blue-600 mt-2.5 shrink-0 group-hover/card:scale-[2.5] shadow-[0_0_10px_rgba(37,99,235,0.4)] transition-all" />
                                        <p className="text-xl font-medium text-slate-800 dark:text-slate-200 leading-relaxed font-sans">{point}</p>
                                    </div>
                                </div>
                             ))}
                             </div>
                        </div>

                        {/* Chapters Section */}
                        <div id="tactical-breakdown" className="space-y-12">
                            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 px-10">
                                <div className="space-y-4">
                                    <h3 className="text-5xl font-display font-black text-slate-950 dark:text-white tracking-tighter">Tactical Breadown</h3>
                                    <p className="text-slate-500 dark:text-slate-400 text-xs font-black uppercase tracking-[0.5em] mt-1">Structural Intelligence View</p>
                                </div>
                                <div className="px-8 py-3 bg-slate-950 dark:bg-white text-white dark:text-slate-950 text-xs font-black uppercase tracking-widest rounded-full shadow-deep">
                                    {result.chapters.length} Modules Online
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                                {result.chapters.map((chapter, i) => (
                                    <motion.div 
                                        key={`chapter-card-${i}`}
                                        whileHover={{ y: -10 }}
                                        className="bg-white dark:bg-slate-900 rounded-[4rem] p-12 shadow-lush border border-slate-100 dark:border-slate-800 group relative overflow-hidden"
                                    >
                                        <div className="absolute top-0 right-0 w-48 h-48 bg-slate-100 dark:bg-slate-800/20 blur-3xl rounded-full" />
                                        <div className="flex items-start justify-between mb-12 relative z-10">
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-3">
                                                   <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 dark:bg-blue-900/10 px-3 py-1 rounded-md">Sector {i + 1}</span>
                                                </div>
                                                <h4 className="text-4xl font-display font-black text-slate-950 dark:text-white group-hover:text-blue-600 transition-colors leading-[0.9] tracking-tighter uppercase">{chapter.title}</h4>
                                            </div>
                                            <div className="bg-slate-50 dark:bg-slate-800 p-5 rounded-[1.8rem] shadow-soft border border-slate-100 dark:border-slate-700">
                                                <BookOpen className="w-8 h-8 text-slate-400 group-hover:text-blue-600 transition-colors" />
                                            </div>
                                        </div>

                                        <div className="space-y-8 relative z-10">
                                            {(chapter.topics || []).map((topic, j) => (
                                                <div key={`chap-${i}-topic-${j}-${topic.title || 'untitled'}`} className="p-8 bg-slate-50/50 dark:bg-slate-800/10 rounded-[2rem] border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all group/item shadow-inner">
                                                    <h5 className="text-2xl font-display font-black text-slate-950 dark:text-white mb-4 flex items-center gap-4">
                                                        <div className="w-2.5 h-2.5 rounded-full bg-blue-600 group-hover/item:scale-150 transition-transform" />
                                                        {topic.title}
                                                    </h5>
                                                    <p className="text-base font-medium text-slate-500 dark:text-slate-400 leading-relaxed font-sans line-clamp-4">
                                                        {topic.explanation}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>

                        {/* Unified Topic Inventory (Requested by User) */}
                        <div className="bg-slate-900 rounded-[4rem] p-12 text-white shadow-2xl relative overflow-hidden group">
                           <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px]" />
                           <div className="relative z-10 space-y-12">
                              <div className="flex items-center gap-6">
                                 <div className="bg-white/10 p-5 rounded-[2rem] border border-white/10">
                                    <Target className="text-blue-400 w-8 h-8" />
                                 </div>
                                 <div className="space-y-1">
                                    <h3 className="text-4xl font-black tracking-tight">Main Topics Inventory</h3>
                                    <p className="text-blue-400 font-bold uppercase tracking-[0.2em] text-[10px]">Extracted Concept Catalog</p>
                                 </div>
                              </div>

                               <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                                 {(result.chapters || []).flatMap(c => c.topics || []).map((topic, i) => (
                                    <div key={`flat-topic-${i}-${topic.title}`} className="space-y-3 group/topic">
                                       <div className="flex items-center gap-4">
                                          <div className="text-blue-500 font-black text-lg opacity-40 group-hover/topic:opacity-100 transition-opacity">
                                             {(i + 1).toString().padStart(2, '0')}
                                          </div>
                                          <h4 className="text-xl font-black text-white group-hover/topic:text-blue-400 transition-colors">
                                             {topic.title}
                                          </h4>
                                       </div>
                                       <p className="text-slate-400 text-sm font-medium leading-relaxed pl-9 border-l-2 border-white/5 group-hover/topic:border-blue-500/30 transition-colors italic">
                                          {topic.explanation}
                                       </p>
                                    </div>
                                 ))}
                              </div>
                           </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <Card 
                                title="Simplified Logic" 
                                icon={<div className="bg-orange-100 p-4 rounded-2xl shadow-inner"><Sparkles className="text-orange-600 w-7 h-7" /></div>}
                            >
                                <div className="text-slate-600 leading-relaxed text-xl font-medium italic border-l-8 border-orange-100 pl-8 py-4">
                                    {result.simpleExplanation}
                                </div>
                            </Card>
                            <Card 
                                title="Academic Depth" 
                                icon={<div className="bg-indigo-100 p-4 rounded-2xl shadow-inner"><GraduationCap className="text-indigo-600 w-7 h-7" /></div>}
                            >
                                <div className="text-slate-600 leading-relaxed text-xl font-bold">
                                    {result.teacherExplanation}
                                </div>
                            </Card>
                        </div>
                    </motion.div>
                )}

                {activeTab === 'flashcards' && (
                    <motion.div 
                        key="flashcards"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="w-full"
                    >
                        <FlashcardSpacedRepetition 
                          cards={result?.flashcards || []} 
                          subjectTitle={result?.subject || "Study Material"} 
                        />
                    </motion.div>
                )}

                {activeTab === 'quiz' && (
                    /* Existing Quiz Content Enhanced */
                    <motion.div 
                        key="quiz"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                    >
                         <div id="quiz" className="bg-slate-900 rounded-[4rem] p-12 text-white shadow-2xl relative overflow-hidden ring-4 ring-white shadow-slate-900/40">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/20 rounded-full blur-[80px]" />
                            
                            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
                            <div className="flex items-center gap-6">
                                <div className="bg-purple-500/20 p-4 rounded-[1.5rem] border border-purple-500/30">
                                <HelpCircle className="text-purple-400 w-8 h-8" />
                                </div>
                                <div>
                                <h3 className="text-4xl font-black tracking-tight">Concept Mastery Quiz</h3>
                                <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px] mt-1">Assessment Engine</p>
                                </div>
                            </div>
                            {!showQuizResults && Object.keys(selectedAnswers).length === (result?.quiz?.length || 0) && (
                                <button 
                                onClick={handleAnswerValidation}
                                className="bg-white text-slate-950 px-10 py-4 rounded-full font-black hover:scale-105 active:scale-95 transition-all shadow-xl shadow-white/10 text-lg"
                                >
                                Validate Knowledge
                                </button>
                            )}
                            </div>

                            <div className="space-y-12 relative z-10">
                            {(result?.quiz || []).map((q, qIdx) => (
                                <div key={`quiz-q-${qIdx}`} className="space-y-6">
                                <div className="flex items-start gap-4">
                                    <span className="text-purple-400 font-black text-2xl opacity-50">Q{qIdx + 1}</span>
                                    <p className="font-bold text-2xl leading-tight text-slate-100">{q?.question}</p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-12">
                                    {(q?.options || []).map((opt, oIdx) => {
                                    const isSelected = selectedAnswers[qIdx] === opt;
                                    const isCorrect = q?.correctAnswer === opt;
                                    const showCorrect = showQuizResults && isCorrect;
                                    const showWrong = showQuizResults && isSelected && !isCorrect;

                                    return (
                                        <button
                                        key={`quiz-opt-${qIdx}-${oIdx}`}
                                        onClick={() => handleAnswerSelect(qIdx, opt)}
                                        disabled={showQuizResults}
                                        className={cn(
                                            "p-6 rounded-[2rem] border-2 text-left transition-all font-bold text-lg relative overflow-hidden group/opt",
                                            isSelected 
                                            ? "border-purple-500 bg-white text-slate-950" 
                                            : "border-white/10 hover:border-purple-500/50 bg-white/5 text-slate-300",
                                            showCorrect && "border-emerald-500 !bg-emerald-500 !text-white",
                                            showWrong && "border-red-500 !bg-red-500 !text-white"
                                        )}
                                        >
                                        <div className="flex items-center justify-between pointer-events-none">
                                            <span>{opt}</span>
                                            {showCorrect && <CheckCircle2 className="w-6 h-6" />}
                                        </div>
                                        </button>
                                    );
                                    })}
                                </div>
                                </div>
                            ))}
                            </div>
                        </div>
                    </motion.div>
                )}

                {activeTab === 'chat' && (
                    <motion.div 
                        key="chat"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-12"
                    >
                         <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                            <div className="lg:col-span-3 space-y-6">
                                <div className="flex items-center justify-between px-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Real-time Study Chat</span>
                                    </div>
                                    <button 
                                        type="button"
                                        onClick={() => setShowGlobalTestMaker(true)}
                                        className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl font-bold text-xs hover:bg-indigo-100 transition-all border border-indigo-100"
                                    >
                                        <Brain className="w-3.5 h-3.5" /> Launch Test Maker
                                    </button>
                                </div>
                                 <LiveChat 
                                   initialContext={
                                     currentNotebook && currentNotebook.sources && currentNotebook.sources.length > 0
                                       ? `Notebook: ${currentNotebook.title} (${currentNotebook.subject})\n\n` +
                                         currentNotebook.sources
                                           .filter(s => s.enabled !== false && s.isActive !== false)
                                           .map(s => `[Source ${s.name}]:\n${s.extractedText || ''}`)
                                           .join('\n\n')
                                       : result
                                         ? `Subject: ${result.subject}\n\nSummary:\n${(result.summary || []).join('\n')}\n\nTechnical Explanation:\n${result.teacherExplanation || ''}`
                                         : ""
                                   } 
                                   selectedAge={currentNotebook?.age || selectedAge}
                                   onSaveNote={handleSaveNote}
                                 />
                            </div>
                            <div className="lg:col-span-2 space-y-6">
                                {/* Enhanced Test Maker Card */}
                                <div className="bg-slate-900 rounded-[2.5rem] p-10 flex flex-col gap-8 shadow-2xl relative overflow-hidden group">
                                     <Brain className="w-40 h-40 absolute -bottom-10 -right-10 text-white/5 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-700" />
                                     
                                     <div className="relative">
                                         <div className="flex items-center gap-4 mb-2">
                                             <div className="bg-indigo-500/20 p-2.5 rounded-xl border border-indigo-500/30">
                                                 <Brain className="text-indigo-400 w-5 h-5" />
                                             </div>
                                             <h4 className="text-2xl font-black text-white tracking-tight">Practice Zone</h4>
                                         </div>
                                         <p className="text-slate-400 text-xs font-bold uppercase tracking-widest pl-1">AI Mastery Assessment</p>
                                     </div>

                                     <div className="space-y-6 relative">
                                        <div className="p-6 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-sm">
                                            <div className="flex items-center gap-2 mb-3 text-indigo-400">
                                                <Target className="w-4 h-4" />
                                                <span className="text-[10px] font-black uppercase tracking-widest">Recommended Focus</span>
                                            </div>
                                            <p className="text-slate-200 text-base font-bold leading-relaxed italic">
                                                "{result.weakAreas.difficulty}"
                                            </p>
                                        </div>

                                        <button 
                                            type="button"
                                            onClick={() => setShowGlobalTestMaker(true)}
                                            className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black text-base hover:bg-indigo-700 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 shadow-2xl shadow-indigo-500/20"
                                        >
                                            <Sparkles className="w-5 h-5" /> Generate Custom Test
                                        </button>

                                        <div className="flex items-center justify-between px-2">
                                            <div className="flex -space-x-2">
                                                {[1,2,3].map(i => (
                                                    <div key={`avatar-dot-${i}`} className="w-7 h-7 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center">
                                                        <div className="w-full h-full rounded-full bg-gradient-to-tr from-slate-700 to-slate-600" />
                                                    </div>
                                                ))}
                                            </div>
                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Real-time sync enabled</p>
                                        </div>
                                     </div>
                                </div>

                                {/* Mastery Goal Card */}
                                <div className="bg-amber-50 rounded-[2.5rem] p-8 border border-amber-100 flex flex-col gap-4 relative overflow-hidden transition-all hover:bg-amber-100/50">
                                     <Lightbulb className="w-20 h-20 absolute -bottom-4 -right-4 text-amber-200/30 rotate-12" />
                                     <div className="flex items-center gap-3">
                                            <div className="p-2 bg-amber-500/10 rounded-lg">
                                                <Lightbulb className="w-4 h-4 text-amber-600" />
                                            </div>
                                            <h4 className="text-xs font-black text-amber-700 uppercase tracking-widest">Efficiency Goal</h4>
                                     </div>
                                     <p className="text-amber-900/80 text-sm font-bold leading-relaxed relative z-10">{result.weakAreas.suggestion}</p>
                                </div>
                            </div>
                         </div>

                        {/* Dynamic Study Schedule */}
                        <div className="bg-white rounded-[3.5rem] p-12 border border-slate-100 shadow-xl shadow-slate-100/50">
                            <div className="flex items-center gap-6 mb-10">
                                <div className="bg-amber-100 p-4 rounded-[1.5rem]">
                                    <History className="text-amber-600 w-8 h-8" />
                                </div>
                                <div>
                                    <h3 className="text-3xl font-black text-slate-900 tracking-tight">Optimal Study Plan</h3>
                                    <p className="text-slate-400 font-bold uppercase tracking-wider text-xs">AI-Generated Roadmap</p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                {result.schedule?.map((item, i) => (
                                    <div key={`sched-${i}-${item.time}`} className="flex items-center gap-8 p-6 bg-slate-50 rounded-3xl border border-slate-100 overflow-hidden group">
                                        <div className="w-32 font-black text-blue-600 uppercase tracking-tighter text-xl shrink-0 group-hover:scale-110 transition-transform">
                                            {item.time}
                                        </div>
                                        <div className="h-10 w-px bg-slate-200" />
                                        <div className="text-lg font-bold text-slate-700">
                                            {item.activity}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
              </AnimatePresence>

              {/* Final Success Call to Action */}
              <div className="text-center py-20 bg-blue-600 rounded-[4rem] text-white shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-from)_0%,_transparent_70%)] from-indigo-500/50 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                <div className="relative z-10 space-y-8">
                    <div className="flex justify-center flex-wrap gap-4">
                        <div className="px-6 py-2 bg-white/20 backdrop-blur-md rounded-full text-xs font-black tracking-widest uppercase">Verified Knowledge</div>
                        <div className="px-6 py-2 bg-white/20 backdrop-blur-md rounded-full text-xs font-black tracking-widest uppercase">24/7 Access</div>
                    </div>
                    <h3 className="text-5xl font-black tracking-tighter max-w-xl mx-auto">Another successful learning session.</h3>
                    <div className="flex justify-center gap-6">
                        <button 
                            onClick={reset}
                            className="bg-white text-slate-900 px-10 py-5 rounded-full font-black text-lg hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-blue-900/20"
                        >
                            Next Study Topic
                        </button>
                    </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
          </div>
        )}

        <AnimatePresence>
            {showGlobalTestMaker && (
              <TestMaker 
                key="global-test-maker-modal"
                topics={allTopics} 
                onClose={() => setShowGlobalTestMaker(false)} 
              />
            )}
            {showConverter && (
              <Converter key="converter-modal-component" onClose={() => setShowConverter(false)} />
            )}
            {showResumeMaker && (
              <ResumeMaker key="resume-maker-modal-component" onClose={() => setShowResumeMaker(false)} />
            )}
            {showWeaknessDetector && (
              <WeaknessDetector key="weakness-detector-modal-component" onClose={() => setShowWeaknessDetector(false)} />
            )}
            {showImageStudio && (
              <div key="image-studio-modal-wrapper" className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md overflow-y-auto p-4 md:p-8 flex justify-center items-start">
                <div className="w-full max-w-4xl my-auto py-4">
                  <ImageStudio 
                    onClose={() => setShowImageStudio(false)} 
                    isPro={Boolean(userStats?.isPro)}
                    onOpenUpgrade={() => {
                      setShowImageStudio(false);
                      setIsUpgradeModalOpen(true);
                    }}
                  />
                </div>
              </div>
            )}
            {showVeoStudio && (
              <div key="veo-studio-modal-wrapper" className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md overflow-y-auto p-4 md:p-8 flex justify-center items-start">
                <div className="w-full max-w-4xl my-auto py-4">
                  <VeoStudio 
                    onClose={() => setShowVeoStudio(false)} 
                    isPro={Boolean(userStats?.isPro)}
                    onOpenUpgrade={() => {
                      setShowVeoStudio(false);
                      setIsUpgradeModalOpen(true);
                    }}
                  />
                </div>
              </div>
            )}
            {showDeepThinking && (
              <div key="deep-thinking-modal-wrapper" className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md overflow-y-auto p-4 md:p-8 flex justify-center items-start">
                <div className="w-full max-w-4xl my-auto py-4">
                  <DeepThinkingWorkbench onClose={() => setShowDeepThinking(false)} />
                </div>
              </div>
            )}
            {showSearchGrounding && (
              <div key="search-grounding-modal-wrapper" className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md overflow-y-auto p-4 md:p-8 flex justify-center items-start">
                <div className="w-full max-w-4xl my-auto py-4">
                  <SearchGroundingHub onClose={() => setShowSearchGrounding(false)} />
                </div>
              </div>
            )}
            {showUniversityTracker && (
              <div key="university-tracker-modal-wrapper" className="fixed inset-0 z-50 bg-[#fdfcfb] dark:bg-slate-950 overflow-y-auto">
                <UniversityTracker 
                  onClose={() => setShowUniversityTracker(false)} 
                  currentUser={currentUser}
                  targetLanguage={selectedLanguage}
                  isPro={Boolean(userStats?.isPro)}
                  onOpenUpgrade={() => {
                    setShowUniversityTracker(false);
                    setIsUpgradeModalOpen(true);
                  }}
                  onOpenScholarshipTracker={() => {
                    setShowUniversityTracker(false);
                    setShowScholarshipTracker(true);
                  }}
                />
              </div>
            )}
            {showScholarshipTracker && (
              <div key="scholarship-tracker-modal-wrapper" className="fixed inset-0 z-50 bg-[#fdfcfb] dark:bg-slate-950 overflow-y-auto">
                <ScholarshipTracker 
                  onClose={() => setShowScholarshipTracker(false)} 
                  currentUser={currentUser}
                  targetLanguage={selectedLanguage}
                  isPro={Boolean(userStats?.isPro)}
                  onOpenUpgrade={() => {
                    setShowScholarshipTracker(false);
                    setIsUpgradeModalOpen(true);
                  }}
                  onOpenUniversityTracker={() => {
                    setShowScholarshipTracker(false);
                    setShowUniversityTracker(true);
                  }}
                />
              </div>
            )}
            <HowItWorksModal
              key="how-it-works-modal-component"
              isOpen={showHowItWorksGlobal}
              onClose={() => setShowHowItWorksGlobal(false)}
              onOpenUniversityTracker={() => setShowUniversityTracker(true)}
              onOpenScholarshipTracker={() => setShowScholarshipTracker(true)}
            />
            <MeetTeamModal
              key="meet-team-modal-component"
              isOpen={isMeetTeamOpen}
              onClose={() => setIsMeetTeamOpen(false)}
            />
            <SitemapModal
              key="sitemap-modal-component"
              isOpen={isSitemapOpen}
              onClose={() => setIsSitemapOpen(false)}
              onNavigateSection={(sectionId) => {
                const el = document.getElementById(sectionId);
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
            />
            {isVoiceMode && (
                <Suspense key="voice-teacher-suspense-wrapper" fallback={null}>
                    <VoiceTeacher 
                        initialContext={result 
                          ? `The student is ${selectedAge} years old. They are studying ${(result.topics || []).join(", ") || result.subject} in ${result.subject}. Key points from analysis: ${(result.summary || []).join(". ")}` 
                          : `The student is ${selectedAge} years old.`
                        }
                        initialImage={firstFileBase64 || undefined}
                        age={selectedAge}
                        onClose={() => setIsVoiceMode(false)}
                    />
                </Suspense>
            )}
            {currentNotebook && isSourcesOpen && (
              <SourcesPanel 
                key="sources-panel-modal-component"
                isOpen={isSourcesOpen}
                onClose={() => setIsSourcesOpen(false)}
                sources={currentNotebook.sources}
                onToggleSource={handleToggleSource}
                onAddSource={handleAddSourceToCurrent}
                onDeleteSource={handleDeleteSourceFromCurrent}
                onViewSourceExcerpt={(source) => setSelectedSourceForExcerpt(source)}
              />
            )}
            {currentNotebook && isNotesOpen && (
              <NotesPanel 
                key="notes-panel-modal-component"
                isOpen={isNotesOpen}
                onClose={() => setIsNotesOpen(false)}
                notes={currentNotebook.notes || []}
                onAddCustomNote={(title, content) => handleSaveNote(title, content)}
                onDeleteNote={handleDeleteNote}
                onTogglePin={handleTogglePinNote}
              />
            )}
            {currentNotebook && selectedSourceForExcerpt && (
              <SourceExcerptModal 
                key="source-excerpt-modal-component"
                source={selectedSourceForExcerpt}
                onClose={() => setSelectedSourceForExcerpt(null)}
              />
            )}
        </AnimatePresence>
      </main>

      {/* Freemium Paywall Upgrade Modal */}
      <UpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        user={currentUser}
        analysesUsed={userStats?.analysesUsed || 0}
        bonusAnalyses={userStats?.bonusAnalyses || 0}
        isPro={Boolean(userStats?.isPro)}
        refCode={userStats?.refCode}
        onInstantUpgrade={() => getUserStats(currentUser).then(setUserStats)}
      />

      {/* Account & Billing Settings Modal */}
      <AccountSettingsModal
        isOpen={isAccountSettingsOpen}
        onClose={() => setIsAccountSettingsOpen(false)}
        user={currentUser}
        stats={userStats}
        quizzesCompleted={quizzesCompletedCount}
        masteryScoreAverage={masteryScoreAvg}
        topicsStudied={allTopics}
        onOpenUpgrade={() => {
          setIsAccountSettingsOpen(false);
          setIsUpgradeModalOpen(true);
        }}
        selectedLanguage={selectedLanguage}
        onChangeLanguage={(lang) => {
          setSelectedLanguage(lang);
          localStorage.setItem('study_buddy_language', lang);
        }}
        selectedAge={selectedAge}
        onChangeAge={(age) => setSelectedAge(age)}
      />

      {/* Learning Roadmap & Mastery Path Modal */}
      <LearningRoadmapModal
        isOpen={showLearningRoadmap}
        onClose={() => setShowLearningRoadmap(false)}
        topicsStudied={allTopics.length > 0 ? allTopics : (currentNotebook ? [currentNotebook.title] : ['Quantum Physics', 'Neural Networks', 'Calculus III'])}
        quizzesCompleted={quizzesCompletedCount}
        masteryScoreAverage={masteryScoreAvg}
        currentStreak={userStats?.currentStreak || 3}
        userName={currentUser?.displayName || 'Dedicated Scholar'}
      />

      {/* Session End Modal */}
      <SessionEndModal
        isOpen={showSessionEndModal}
        onClose={() => setShowSessionEndModal(false)}
        sessionDurationSeconds={sessionDurationSeconds}
        activeNotebookTitle={currentNotebook?.title || 'Active Study Material'}
        flashcardsReviewedCount={12}
        quizQuestionsAnswered={5}
        onStartBreak={() => {
          setTimeLeft(5 * 60);
          setTimerActive(true);
        }}
        onOpenQuiz={() => {
          setActiveTab('quiz');
        }}
        onOpenFlashcards={() => {
          setActiveTab('flashcards');
        }}
      />

      {/* Real-Time Collaborative Group Study Modal */}
      <GroupStudyModal
        isOpen={isGroupStudyOpen}
        onClose={() => setIsGroupStudyOpen(false)}
        currentUser={currentUser}
        initialRoomId={groupRoomIdFromUrl}
        notebookTitle={currentNotebook?.title || "AI Study Session"}
        isPro={Boolean(userStats?.isPro)}
        onOpenUpgrade={() => setIsUpgradeModalOpen(true)}
      />

      {/* Account Suspended Notice Overlay */}
      {isAccountSuspended && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 max-w-md w-full text-center space-y-6 shadow-2xl">
            <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
              <UserX className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-black text-white tracking-tight">Account Suspended</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Your account has been suspended by an administrator for policy violations. Access to your notebooks, study sessions, and tools has been restricted.
              </p>
            </div>

            <button
              onClick={() => setIsAccountSuspended(false)}
              className="w-full py-3.5 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all cursor-pointer"
            >
              Dismiss Notice
            </button>
          </div>
        </div>
      )}

      {/* Auth Modal for Sign In / Sign Up */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authModalMode}
        onSuccess={() => setView('notebooks')}
        onOpenTerms={() => {
          setLegalModalTab('terms');
          setIsLegalModalOpen(true);
        }}
        onOpenPrivacy={() => {
          setLegalModalTab('privacy');
          setIsLegalModalOpen(true);
        }}
      />

      {/* Legal Documents Modal */}
      <LegalModal
        isOpen={isLegalModalOpen}
        onClose={() => setIsLegalModalOpen(false)}
        initialTab={legalModalTab}
      />

      {/* Cookie Consent Notification */}
      {showCookieBanner && (
        <CookieConsentBanner
          onOpenTermsOfService={() => {
            setLegalModalTab('terms');
            setIsLegalModalOpen(true);
          }}
          onOpenPrivacyPolicy={() => {
            setLegalModalTab('privacy');
            setIsLegalModalOpen(true);
          }}
          onAccept={handleAcceptCookies}
          onDecline={handleDeclineCookies}
        />
      )}

      {/* Footer Branding */}
      <footer className="mt-20 text-center text-slate-400 text-sm py-12 border-t dark:border-slate-800 bg-white dark:bg-slate-950">
        <div className="flex items-center justify-center gap-3 mb-4">
            <GraduationCap className="w-5 h-5 opacity-20" />
            <span className="w-8 h-px bg-slate-100 dark:bg-slate-800"></span>
            <History className="w-5 h-5 opacity-20" />
        </div>
        <p className="font-black tracking-widest uppercase text-[10px] dark:text-slate-500 flex flex-wrap items-center justify-center gap-2">
          <span>AI Study BUDDY by Ayan Ahmed</span>
          <span>•</span>
          <span>Contact me: <a href="mailto:ayaicrypcoin@gmail.com" className="text-blue-500 hover:underline lowercase font-mono">ayaicrypcoin@gmail.com</a></span>
        </p>
        <div className="mt-3 flex flex-wrap items-center justify-center gap-4 text-xs font-bold text-blue-600 dark:text-blue-400">
          <button
            onClick={() => setIsMeetTeamOpen(true)}
            className="hover:underline cursor-pointer"
          >
            Meet Our Team
          </button>
          <span>•</span>
          <button
            onClick={() => { setLegalModalTab('terms'); setIsLegalModalOpen(true); }}
            className="hover:underline cursor-pointer"
          >
            Terms of Service
          </button>
          <span>•</span>
          <button
            onClick={() => { setLegalModalTab('privacy'); setIsLegalModalOpen(true); }}
            className="hover:underline cursor-pointer"
          >
            Privacy Policy
          </button>
          <span>•</span>
          <button
            onClick={() => setIsSitemapOpen(true)}
            className="hover:underline cursor-pointer font-bold text-blue-600 dark:text-blue-400"
          >
            Sitemap
          </button>
          <span>•</span>
          <a
            href="/robots.txt"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
          >
            Robots.txt
          </a>
          <span>•</span>
          <button
            onClick={() => {
              localStorage.removeItem('cookie_consent_status');
              window.location.reload();
            }}
            className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:underline cursor-pointer"
          >
            Cookie Preferences
          </button>
        </div>
        <p className="mt-2 font-medium dark:text-slate-400">Built with extreme attention to educational quality.</p>
      </footer>
    </div>
  );
}

function Card({ 
  title, 
  icon, 
  children, 
  className 
}: { 
  title: string; 
  icon: React.ReactNode; 
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={cn("bg-white dark:bg-slate-900 p-10 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-100/30 flex shadow flex-col h-full", className)}
    >
      <div className="flex items-center gap-5 mb-8">
        {icon}
        <h3 className="font-black text-2xl text-slate-900 dark:text-white tracking-tight">{title}</h3>
      </div>
      <div className="flex-grow">
        {children}
      </div>
    </motion.div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
    return (
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl hover:shadow-deep transition-all group hover:-translate-y-2 card-shine">
            <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl w-fit group-hover:scale-110 transition-transform">{icon}</div>
            <h5 className="text-2xl font-display font-black text-slate-950 dark:text-white mb-3 tracking-tight">{title}</h5>
            <p className="text-slate-500 dark:text-slate-400 font-medium text-sm leading-relaxed">{desc}</p>
        </div>
    )
}
