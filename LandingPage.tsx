import React, { useState, Suspense, lazy } from 'react';
import { motion } from 'motion/react';
import { 
  Sparkles, 
  Brain, 
  BookOpen, 
  Mic, 
  Layers, 
  Target, 
  GraduationCap, 
  Award, 
  ArrowRight, 
  CheckCircle2, 
  XCircle,
  Star, 
  Zap, 
  ShieldCheck, 
  Play, 
  Users, 
  BrainCircuit, 
  Sun, 
  Moon, 
  LogOut,
  HelpCircle,
  ChevronDown,
  Calculator,
  FlaskConical,
  Stethoscope,
  PenTool,
  Scale,
  TrendingUp,
  FileText,
  Search,
  Crown,
  Cpu,
  Palette
} from 'lucide-react';
import { User } from 'firebase/auth';
import { cn } from '../lib/utils';
const ThreeBackground = lazy(() => import('./ThreeBackground'));
import { TEAM_MEMBERS } from '../data/teamData';
import { BLOG_POSTS } from '../data/blogData';

interface LandingPageProps {
  user: User | null;
  onOpenAuth: (mode: 'signin' | 'signup') => void;
  onEnterWorkspace: () => void;
  onSignOut: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenUniversityTracker: () => void;
  onOpenScholarshipTracker: () => void;
  onOpenMeetTeam?: () => void;
  onOpenSitemap?: () => void;
  onOpenUpgrade?: () => void;
  onOpenTerms?: () => void;
  onOpenPrivacy?: () => void;
  onOpenBlog?: (slug?: string) => void;
}

export default function LandingPage({
  user,
  onOpenAuth,
  onEnterWorkspace,
  onSignOut,
  isDarkMode,
  onToggleDarkMode,
  onOpenUniversityTracker,
  onOpenScholarshipTracker,
  onOpenMeetTeam,
  onOpenSitemap,
  onOpenUpgrade,
  onOpenTerms,
  onOpenPrivacy,
  onOpenBlog,
}: LandingPageProps) {
  const [activeFeatureTab, setActiveFeatureTab] = useState<'voice' | 'notebook' | 'flashcards' | 'quiz' | 'mindmap'>('voice');
  const [activeSubject, setActiveSubject] = useState<string>('math');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const featureDetails = {
    voice: {
      title: "Talk With Your AI Voice Teacher",
      description: "Speak directly with your AI study buddy using your natural voice. Ask tough questions, talk through concepts out loud, and get immediate spoken explanations adapted to your grade level.",
      badge: "Live Voice Tutor",
      highlights: ["Adapts to your age and grade level (7 to 50)", "Instant spoken answers with zero lag", "Helps explain tough concepts step-by-step"],
      accentColor: "bg-blue-600"
    },
    notebook: {
      title: "All-In-One Multi-Source Study Notebooks",
      description: "Upload PDFs, textbook chapters, lecture slides, video lessons, and raw notes into clean notebooks that answer your exact questions with page-level citations.",
      badge: "Document Knowledge Hub",
      highlights: ["Supports 200+ page PDFs, images, YouTube & notes", "Grounded answers directly from your course files", "Exact page citations with zero AI hallucinations"],
      accentColor: "bg-indigo-600"
    },
    flashcards: {
      title: "Smart 3D Spaced Repetition Flashcards",
      description: "Auto-generated digital flashcards powered by the scientifically proven SM-2 cognitive memory algorithm so you remember facts effortlessly before exams.",
      badge: "Active Recall Engine",
      highlights: ["Interactive 3D card flip animation", "SM-2 spaced repetition (Easy, Good, Hard)", "Tracks memory retention and weak study areas"],
      accentColor: "bg-emerald-600"
    },
    quiz: {
      title: "Practice Exam & Quiz Generator",
      description: "Generate customized multiple-choice and short-answer practice tests directly from your study syllabus. Get instant grading and step-by-step answer keys.",
      badge: "Diagnostic Test Maker",
      highlights: ["Multiple choice, short answer & true/false", "Identifies specific conceptual weaknesses", "Full step-by-step explanations for every question"],
      accentColor: "bg-amber-600"
    },
    mindmap: {
      title: "Visual Concept Mind Maps",
      description: "See how complex topics connect with interactive visual diagrams that break down large textbook chapters into clear, intuitive hierarchies.",
      badge: "Visual Knowledge Graph",
      highlights: ["Auto-generated topic trees from uploaded text", "Click nodes for instant bite-sized summaries", "Fluid pan, zoom & interactive exploration"],
      accentColor: "bg-purple-600"
    }
  };

  const subjectClusters = [
    {
      id: 'math',
      title: 'Math & Calculus',
      icon: Calculator,
      badge: 'Step-By-Step Derivations',
      desc: 'Master Calculus I-III, Linear Algebra, Differential Equations, and Discrete Math with step-by-step problem breakdowns and rendered formulas.',
      topics: ['Chain Rule & Derivatives', 'Integration by Parts', 'Matrix Eigenvalues', 'Taylor Series Approximations']
    },
    {
      id: 'chemistry',
      title: 'Science & Organic Chemistry',
      icon: FlaskConical,
      badge: 'Reaction Mechanisms',
      desc: 'Understand SN1/SN2 reactions, thermodynamic pathways, IUPAC nomenclature, and biochemical cycles with visual explanations.',
      topics: ['Electrophilic Addition', 'Stereochemistry & Chirality', 'Cellular Respiration', 'Equilibrium Constants']
    },
    {
      id: 'medicine',
      title: 'Medicine & Anatomy',
      icon: Stethoscope,
      badge: 'High-Yield USMLE / MCAT',
      desc: 'Memorize organ systems, pharmacology drug interactions, and pathology case notes with high-yield active recall flashcards.',
      topics: ['Cardiovascular Hemodynamics', 'Neuroanatomy Pathways', 'Antibiotic Classifications', 'Endocrine Feedback Loops']
    },
    {
      id: 'humanities',
      title: 'Essay Writing & Humanities',
      icon: PenTool,
      badge: 'Citations & Structure',
      desc: 'Draft strong thesis statements, organize multi-paragraph arguments, and verify primary sources with accurate APA/MLA citation helpers.',
      topics: ['Thesis & Argument Framing', 'Primary Source Analysis', 'Literary Device Decoding', 'APA/MLA Reference Formatting']
    },
    {
      id: 'law',
      title: 'Law & Legal Studies',
      icon: Scale,
      badge: 'IRAC Case Briefs',
      desc: 'Break down legal precedents, constitutional law doctrines, and statute interpretations into concise IRAC structured briefs.',
      topics: ['IRAC Format Briefing', 'Constitutional Due Process', 'Tort Law Negligence Elements', 'Contract Formation & Breach']
    },
    {
      id: 'business',
      title: 'Business & Economics',
      icon: TrendingUp,
      badge: 'Financial & Market Models',
      desc: 'Demystify supply-demand shifts, macro fiscal policy, corporate valuation ratios, and case study strategic frameworks.',
      topics: ['Elasticity & Market Shifts', 'Discounted Cash Flow (DCF)', 'Porter\'s 5 Forces Analysis', 'Monetary Policy Impacts']
    }
  ];

  const comparisonRows = [
    {
      feature: 'Multi-Document Syllabus Grounding (PDFs, Slides, Videos, Notes)',
      studyBuddy: true,
      chatGpt: 'Manual single pastes',
      chegg: false,
      quizlet: false,
      anki: false
    },
    {
      feature: 'Zero-Hallucination Exact Page-Level Citations',
      studyBuddy: true,
      chatGpt: false,
      chegg: false,
      quizlet: false,
      anki: false
    },
    {
      feature: 'Real-Time Spoken AI Voice Teacher',
      studyBuddy: true,
      chatGpt: 'App only / generic',
      chegg: false,
      quizlet: false,
      anki: false
    },
    {
      feature: 'SM-2 Cognitive Spaced Repetition 3D Flashcards',
      studyBuddy: true,
      chatGpt: false,
      chegg: false,
      quizlet: 'Basic flips only',
      anki: true
    },
    {
      feature: 'Automated Practice Quizzes with Step-by-Step Keys',
      studyBuddy: true,
      chatGpt: 'Text-only prompt',
      chegg: 'Static textbook keys',
      quizlet: 'Standard flashcard tests',
      anki: false
    },
    {
      feature: 'Global University Matcher & $100M+ Scholarship Database',
      studyBuddy: true,
      chatGpt: false,
      chegg: false,
      quizlet: false,
      anki: false
    },
    {
      feature: 'Student-Friendly Pricing',
      studyBuddy: '$0 Free / $3.99/mo Pro',
      chatGpt: '$20.00 / month',
      chegg: '$19.95 / month',
      quizlet: '$35.99 / year',
      anki: 'Free (Desktop) / $25 (iOS)'
    }
  ];

  const faqs = [
    {
      question: "How does AI Study Buddy check its answers against real sources?",
      answer: "AI Study Buddy uses grounded retrieval architecture powered by modern AI. Instead of guessing or making up facts, it directly indexes your uploaded documents, lecture slides, and textbook chapters. Every answer highlights the exact paragraph and page number from your syllabus so you can verify the information instantly."
    },
    {
      question: "Is AI Study Buddy free for students?",
      answer: "Yes, AI Study Buddy includes a completely free starter plan with 10 free AI document analyses and study searches with no credit card required. Students can upgrade to Pro for $3.99/month for unlimited study guides, real-time voice tutoring, and university matching tools."
    },
    {
      question: "How does the AI Voice Teacher work for studying out loud?",
      answer: "The Live Voice Teacher allows you to have a natural, spoken two-way conversation with your study buddy. You can ask questions out loud, brainstorm essay topics, or ask the AI to quiz you orally. The voice tutor adapts its explanations to your requested age or grade level (from elementary to postgraduate)."
    },
    {
      question: "How are 3D Spaced Repetition flashcards generated?",
      answer: "When you upload notes or ask a study question, AI Study Buddy automatically identifies key definitions, formulas, and concepts. It generates interactive 3D digital cards programmed with the SuperMemo SM-2 spaced repetition algorithm, scheduling reviews right before you are about to forget them."
    },
    {
      question: "Can I upload 200+ page textbook PDFs, slides, and video lessons?",
      answer: "Yes! AI Study Buddy handles long-form PDF documents, slide presentations, handwritten notes, and even YouTube lecture links within the limit of 10 mb per file. The system organizes all your files into focused study notebooks for each course."
    },
    {
      question: "How do the Global University Matcher and Scholarship Hub work?",
      answer: "You can enter your current GPA, country of study (such as US, UK, Canada, Pakistan, Nepal, or Global), and desired major. The system analyzes admissions criteria across 500+ accredited universities and connects you to over $100M in verified merit-based grants, stipends, and tuition waivers."
    },
    {
      question: "Is my study data and uploaded homework private?",
      answer: "Yes. Your uploaded documents, study notes, and personal data are strictly private to your account and protected by Firebase authentication and encryption. We do not sell student data or share your homework with third parties."
    },
    {
      question: "Can I use AI Study Buddy on my phone or tablet?",
      answer: "Yes, AI Study Buddy is fully responsive and optimized for mobile phones, tablets, laptops, and desktop computers. You can study on the go anywhere with an internet connection."
    }
  ];

  return (
    <div className="min-h-screen w-full bg-[#fdfcfb] dark:bg-[#030712] text-slate-950 dark:text-slate-100 font-sans selection:bg-blue-600 selection:text-white transition-colors duration-300 flex flex-col">
      
      {/* 1. Header Navigation */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-4">
          
          {/* Logo */}
          <div className="flex items-center gap-3 cursor-pointer shrink-0" onClick={onEnterWorkspace}>
            <div className="w-10 h-10 sm:w-11 sm:h-11 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-md hover:bg-blue-700 transition-colors">
              <Brain className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-black text-lg sm:text-xl tracking-tight text-slate-900 dark:text-white">
                  AI Study <span className="text-blue-600">BUDDY</span>
                </span>
              </div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 hidden sm:block">Instant Homework &amp; Study Assistant</p>
            </div>
          </div>

          {/* Quick Nav Links */}
          <nav className="hidden lg:flex items-center gap-5 xl:gap-6 text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-200">
            <a href="#features" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">How It Works</a>
            <a href="#subjects" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Subjects</a>
            <a href="#compare" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Compare</a>
            <button onClick={onOpenUniversityTracker} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer">
              Uni Tracker
            </button>
            <button onClick={onOpenScholarshipTracker} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer">
              Scholarships
            </button>
            <a href="#team" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Team</a>
            <button 
              onClick={() => onOpenBlog?.()} 
              className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer flex items-center gap-1 text-blue-600 dark:text-blue-400 font-black"
            >
              <Sparkles className="w-3.5 h-3.5" /> Blog
            </button>
            <a href="#faq" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">FAQ</a>
            <a href="#pricing" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Pricing</a>
          </nav>

          {/* Header Action Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={onToggleDarkMode}
              className="w-10 h-10 flex items-center justify-center rounded-2xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer shrink-0"
              title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDarkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-blue-600" />}
            </button>

            {user ? (
              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  onClick={onEnterWorkspace}
                  className="px-4 sm:px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-xs uppercase tracking-wider shadow-md hover:scale-105 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <BrainCircuit className="w-4 h-4" /> <span className="hidden sm:inline">Go To</span> Workspace
                </button>
                <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
                  <button
                    onClick={onSignOut}
                    className="p-2 text-slate-500 hover:text-rose-600 transition-colors cursor-pointer"
                    title="Sign Out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onOpenAuth('signin')}
                  className="px-3.5 sm:px-5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-2xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer"
                >
                  Sign In
                </button>
                <button
                  onClick={() => onOpenAuth('signup')}
                  className="px-3.5 sm:px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-xs uppercase tracking-wider shadow-md hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Sign Up Free</span><span className="sm:hidden">Start</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="relative pt-8 sm:pt-12 pb-16 sm:pb-24 overflow-hidden">
        {/* Interactive 3D Canvas Background with instant ambient CSS glow fallback */}
        <Suspense fallback={
          <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-40">
            <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"></div>
            <div className="absolute top-1/2 -right-40 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl"></div>
          </div>
        }>
          <ThreeBackground isDarkMode={isDarkMode} className="opacity-70 dark:opacity-80" />
        </Suspense>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 text-center space-y-6 sm:space-y-8">
          
          {/* Status Badge */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-3 px-5 py-2 bg-white dark:bg-slate-900 rounded-full border border-slate-200 dark:border-slate-800 shadow-md"
          >
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-black uppercase tracking-widest text-slate-800 dark:text-slate-200">
              Grounded AI Study Assistant
            </span>
            <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-[10px] font-black rounded-md uppercase">
              Zero Hallucinations
            </span>
          </motion.div>

          {/* Main Problem-First Headline */}
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-display font-black tracking-tight leading-[1.08] text-slate-950 dark:text-white max-w-5xl mx-auto"
          >
            <span className="text-slate-950 dark:text-white">Study </span>
            <span className="text-blue-600 dark:text-blue-500 font-black">10x</span>
            <span className="text-slate-950 dark:text-white"> Faster &amp; Ace Your Exams</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-base sm:text-xl md:text-2xl text-slate-600 dark:text-slate-300 font-medium max-w-3xl mx-auto leading-relaxed px-2"
          >
            Turn your textbooks, lecture notes, PDFs, and video lessons into clear step-by-step summaries, 3D active recall flashcards, practice exam quizzes, and live AI voice tutoring.
          </motion.p>

          {/* Primary Action Buttons */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2 max-w-xl mx-auto"
          >
            <button
              onClick={() => onOpenAuth('signup')}
              className="w-full sm:w-auto min-h-[52px] px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-sm uppercase tracking-wider shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 cursor-pointer group"
            >
              <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
              <span>Start Learning Free</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={onEnterWorkspace}
              className="w-full sm:w-auto min-h-[52px] px-8 py-3.5 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 hover:border-blue-600 text-slate-900 dark:text-white rounded-2xl font-black text-sm uppercase tracking-wider shadow-md hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current text-blue-600" />
              <span>Explore Demo Mode</span>
            </button>
          </motion.div>

          {/* Quick Trackers & Subject Nav Chips */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={onOpenUniversityTracker}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5"
            >
              <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
              <span>University Matcher</span>
            </button>
            <button
              onClick={onOpenScholarshipTracker}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Award className="w-3.5 h-3.5 text-amber-500" />
              <span>$100M+ Scholarships</span>
            </button>
            <a
              href="#subjects"
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5"
            >
              <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
              <span>Subject Study Hubs</span>
            </a>
          </div>

          {/* Social Proof Bar */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 text-slate-600 dark:text-slate-400 text-xs font-bold"
          >
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} className="w-4 h-4 fill-amber-500 text-amber-500" />
              ))}
              <span className="ml-2 text-slate-900 dark:text-white font-black">4.9 / 5.0 Rating (1,240+ Reviews)</span>
            </div>
            <span className="hidden sm:inline opacity-30">•</span>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              <span>Used by 50,000+ students worldwide</span>
            </div>
            <span className="hidden sm:inline opacity-30">•</span>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Zero Hallucinations • 100% Citation Grounded</span>
            </div>
          </motion.div>

          {/* Hero Feature Showcase Grid */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="pt-6 max-w-6xl mx-auto"
          >
            <div className="relative rounded-[2.5rem] p-4 sm:p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl text-left space-y-4">
              
              {/* Window Frame Header */}
              <div className="flex items-center justify-between px-4 py-2 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500" />
                  <div className="w-3 h-3 rounded-full bg-amber-500" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="ml-2 text-xs font-mono font-bold text-slate-400 hidden sm:inline">yourstudybuddy.online / grounded-workspace</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-black text-blue-600 dark:text-blue-400">
                  <Zap className="w-3.5 h-3.5 fill-current text-amber-500" /> Verified Source Citations Engine
                </div>
              </div>

              {/* Showcase Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-blue-600 text-white rounded-xl">
                      <Mic className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-black text-xs text-slate-900 dark:text-white">Live Voice Teacher</h4>
                      <p className="text-[10px] text-blue-600 font-bold uppercase">Spoken Two-Way Audio</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    "Explain organic chemistry SN2 mechanisms simply." — Speaks out loud with step-by-step guidance tailored to your learning speed.
                  </p>
                </div>

                <div className="bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-indigo-600 text-white rounded-xl">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-black text-xs text-slate-900 dark:text-white">Multi-Source Notebook</h4>
                      <p className="text-[10px] text-indigo-600 font-bold uppercase">Textbooks, Slides &amp; PDFs</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    Indexes multiple 200+ page textbook chapters simultaneously, providing exact page-level citations for every single answer.
                  </p>
                </div>

                <div className="bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-emerald-600 text-white rounded-xl">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-black text-xs text-slate-900 dark:text-white">3D Active Recall</h4>
                      <p className="text-[10px] text-emerald-600 font-bold uppercase">SM-2 Spaced Repetition</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    Auto-generates 3D flip flashcards and custom diagnostic quizzes so key facts stay permanently locked in long-term memory.
                  </p>
                </div>
              </div>

            </div>
          </motion.div>

        </div>
      </section>

      {/* 3. Section: Core Features */}
      <section id="features" className="pt-10 pb-16 bg-slate-50 dark:bg-slate-950 border-y border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
          
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 rounded-lg text-xs font-black uppercase tracking-wider">
              Complete Study Toolkit
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-black tracking-tight text-slate-950 dark:text-white">
              Everything You Need To Ace Any Exam
            </h2>
            <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto text-sm sm:text-base font-medium">
              Explore our core study engines designed to help you understand tough concepts faster and retain them long-term.
            </p>
          </div>

          {/* Interactive Feature Tabs */}
          <div className="flex flex-wrap justify-center gap-2">
            {[
              { id: 'voice', label: 'Voice Teacher', icon: Mic },
              { id: 'notebook', label: 'Notebook Hub', icon: BookOpen },
              { id: 'flashcards', label: '3D Flashcards', icon: Layers },
              { id: 'quiz', label: 'Quiz Maker', icon: Target },
              { id: 'mindmap', label: 'Concept Mind Map', icon: BrainCircuit }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveFeatureTab(tab.id as any)}
                className={cn(
                  "px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer border",
                  activeFeatureTab === tab.id 
                    ? "bg-blue-600 text-white border-blue-600 shadow-md scale-105" 
                    : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-blue-500"
                )}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Active Tab Showcase Card */}
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 sm:p-10 border border-slate-200 dark:border-slate-800 shadow-xl relative overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              
              <div className="space-y-5">
                <span className="px-3 py-1 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-xs font-black uppercase tracking-widest rounded-md">
                  {featureDetails[activeFeatureTab].badge}
                </span>

                <h3 className="text-2xl sm:text-3xl md:text-4xl font-display font-black text-slate-950 dark:text-white tracking-tight leading-tight">
                  {featureDetails[activeFeatureTab].title}
                </h3>

                <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base font-medium leading-relaxed">
                  {featureDetails[activeFeatureTab].description}
                </p>

                <div className="space-y-2.5 pt-1">
                  {featureDetails[activeFeatureTab].highlights.map((h, i) => (
                    <div key={`feat-hl-${activeFeatureTab}-${i}`} className="flex items-center gap-3 text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{h}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-2">
                  <button
                    onClick={onEnterWorkspace}
                    className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-md flex items-center gap-2 cursor-pointer"
                  >
                    <span>Launch In Workspace</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Visual Demo Preview */}
              <div className="p-6 rounded-2xl bg-slate-950 text-white border border-slate-800 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                    <span className="text-xs font-mono font-bold text-slate-300">LIVE ENGINE SIMULATION</span>
                  </div>
                  <span className="text-[10px] font-black uppercase text-blue-400 bg-blue-950 px-2.5 py-1 rounded-md border border-blue-800">
                    Grounded &amp; Cited
                  </span>
                </div>

                <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Input Study Source</div>
                  <p className="text-xs font-medium italic text-slate-200">
                    "Uploaded: Campbell_Biology_Ch12_CellCycle.pdf (48 pages)"
                  </p>
                </div>

                <div className="p-4 bg-blue-950/60 rounded-xl border border-blue-900/80 space-y-2">
                  <div className="flex items-center gap-2 text-[10px] text-blue-400 font-bold uppercase tracking-widest">
                    <Sparkles className="w-3.5 h-3.5" /> Output Generated with Citations
                  </div>
                  <p className="text-xs font-bold text-white leading-relaxed">
                    "Generated 12 SM-2 flashcards on Cyclin-Dependent Kinases (CDKs), 1 diagnostic quiz with step explanations [Cited: Page 234, Paragraph 3], and 1 voice audio briefing."
                  </p>
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* 4. Section: Subject Study Hubs (Matches SEO & Student Search Requirements) */}
      <section id="subjects" className="pt-10 pb-16 bg-[#fdfcfb] dark:bg-[#030712]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-10">
          
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 rounded-lg text-xs font-black uppercase tracking-wider">
              Subject Study Hubs
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-black tracking-tight text-slate-950 dark:text-white">
              Tailored For Your Hardest Classes
            </h2>
            <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto text-sm sm:text-base font-medium">
              Whether you are preparing for medical board exams, calculus finals, or law school case briefs, AI Study Buddy adapts to your syllabus.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {subjectClusters.map((subj) => (
              <div 
                key={subj.id}
                className={cn(
                  "p-6 rounded-3xl bg-white dark:bg-slate-900 border transition-all duration-300 flex flex-col justify-between space-y-4 hover:shadow-lg",
                  activeSubject === subj.id 
                    ? "border-blue-600 shadow-md ring-1 ring-blue-600" 
                    : "border-slate-200 dark:border-slate-800 hover:border-blue-400"
                )}
                onClick={() => setActiveSubject(subj.id)}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="p-3 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-2xl border border-blue-200 dark:border-blue-900">
                      <subj.icon className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                      {subj.badge}
                    </span>
                  </div>

                  <h3 className="text-xl font-display font-black text-slate-950 dark:text-white tracking-tight">
                    {subj.title}
                  </h3>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                    {subj.desc}
                  </p>

                  <div className="pt-2 space-y-1.5">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Popular Study Topics:</div>
                    <div className="flex flex-wrap gap-1.5">
                      {subj.topics.map((t, idx) => (
                        <span key={`topic-${subj.id}-${idx}`} className="text-[11px] font-bold px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={onEnterWorkspace}
                    className="w-full py-2.5 px-4 bg-slate-100 hover:bg-blue-600 text-slate-800 hover:text-white dark:bg-slate-800 dark:hover:bg-blue-600 dark:text-slate-200 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Study {subj.title.split('&')[0].trim()}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* 5. Section: How It Works */}
      <section id="how-it-works" className="pt-10 pb-16 bg-slate-50 dark:bg-slate-950 border-y border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-10">
          
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 rounded-lg text-xs font-black uppercase tracking-wider">
              Simple 4-Step Process
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-black tracking-tight text-slate-950 dark:text-white">
              How AI Study BUDDY Works
            </h2>
            <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto text-sm sm:text-base font-medium">
              Upload your documents, generate verified summaries, practice with 3D flashcards, and discover top global university scholarships.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-black text-sm flex items-center justify-center">
                01
              </div>
              <h3 className="text-lg font-black text-slate-950 dark:text-white">Upload Your Files</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                Drop your textbooks, lecture PDFs, slides, or syllabus notes into the notebook. The grounded AI neural indexer extracts text and formulas.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white font-black text-sm flex items-center justify-center">
                02
              </div>
              <h3 className="text-lg font-black text-slate-950 dark:text-white">Ask &amp; Verify Citations</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                Ask any question or talk with the AI Voice Teacher. Every explanation includes exact page-number citations from your materials.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white font-black text-sm flex items-center justify-center">
                03
              </div>
              <h3 className="text-lg font-black text-slate-950 dark:text-white">Active Recall &amp; Quizzes</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                Practice with SM-2 3D digital flashcards, diagnostic practice exams, and visual concept mind maps to fix your weak study areas.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-600 text-white font-black text-sm flex items-center justify-center">
                04
              </div>
              <h3 className="text-lg font-black text-slate-950 dark:text-white">Match Universities</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                Input your GPA and location to match with 500+ top universities worldwide and claim $100M+ in fully funded scholarships.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Section: Product Comparison Matrix (Addresses PDF Step 2 & 4 Comparison Requirements) */}
      <section id="compare" className="pt-10 pb-16 bg-[#fdfcfb] dark:bg-[#030712]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-10">
          
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 rounded-lg text-xs font-black uppercase tracking-wider">
              Transparent Comparison
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-black tracking-tight text-slate-950 dark:text-white">
              Why Students Choose AI Study BUDDY
            </h2>
            <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto text-sm sm:text-base font-medium">
              See how AI Study Buddy compares directly with standard ChatGPT, Chegg, Quizlet, and Anki.
            </p>
          </div>

          <div className="overflow-x-auto rounded-[2rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-100/80 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
                  <th className="p-4 sm:p-5 font-black text-slate-900 dark:text-white uppercase tracking-wider">Study Capabilities</th>
                  <th className="p-4 sm:p-5 font-black text-blue-600 dark:text-blue-400 uppercase tracking-wider bg-blue-50/50 dark:bg-blue-950/40 border-x border-blue-200 dark:border-blue-900">
                    AI Study Buddy
                  </th>
                  <th className="p-4 sm:p-5 font-bold text-slate-600 dark:text-slate-400">ChatGPT (Free/Plus)</th>
                  <th className="p-4 sm:p-5 font-bold text-slate-600 dark:text-slate-400">Chegg</th>
                  <th className="p-4 sm:p-5 font-bold text-slate-600 dark:text-slate-400">Quizlet</th>
                  <th className="p-4 sm:p-5 font-bold text-slate-600 dark:text-slate-400">Anki</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {comparisonRows.map((row, idx) => (
                  <tr key={`compare-row-${idx}`} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-4 sm:p-5 font-bold text-slate-800 dark:text-slate-200 max-w-xs">
                      {row.feature}
                    </td>

                    {/* AI Study Buddy Cell */}
                    <td className="p-4 sm:p-5 font-black text-blue-600 dark:text-blue-400 bg-blue-50/30 dark:bg-blue-950/20 border-x border-blue-200 dark:border-blue-900">
                      {typeof row.studyBuddy === 'boolean' ? (
                        row.studyBuddy ? (
                          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="w-5 h-5" /> <span>Yes (Included)</span>
                          </div>
                        ) : (
                          <XCircle className="w-5 h-5 text-rose-500" />
                        )
                      ) : (
                        <span className="px-2.5 py-1 bg-blue-600 text-white rounded-lg font-black text-xs">
                          {row.studyBuddy}
                        </span>
                      )}
                    </td>

                    {/* ChatGPT */}
                    <td className="p-4 sm:p-5 text-slate-600 dark:text-slate-400">
                      {typeof row.chatGpt === 'boolean' ? (
                        row.chatGpt ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <XCircle className="w-4 h-4 text-slate-400" />
                      ) : (
                        <span>{row.chatGpt}</span>
                      )}
                    </td>

                    {/* Chegg */}
                    <td className="p-4 sm:p-5 text-slate-600 dark:text-slate-400">
                      {typeof row.chegg === 'boolean' ? (
                        row.chegg ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <XCircle className="w-4 h-4 text-slate-400" />
                      ) : (
                        <span>{row.chegg}</span>
                      )}
                    </td>

                    {/* Quizlet */}
                    <td className="p-4 sm:p-5 text-slate-600 dark:text-slate-400">
                      {typeof row.quizlet === 'boolean' ? (
                        row.quizlet ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <XCircle className="w-4 h-4 text-slate-400" />
                      ) : (
                        <span>{row.quizlet}</span>
                      )}
                    </td>

                    {/* Anki */}
                    <td className="p-4 sm:p-5 text-slate-600 dark:text-slate-400">
                      {typeof row.anki === 'boolean' ? (
                        row.anki ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <XCircle className="w-4 h-4 text-slate-400" />
                      ) : (
                        <span>{row.anki}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="text-center pt-2">
            <button
              onClick={() => onOpenAuth('signup')}
              className="px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-xs uppercase tracking-wider shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer inline-flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Switch To AI Study Buddy Free</span>
            </button>
          </div>

        </div>
      </section>

      {/* 7. Section: University & Scholarship Trackers Highlights */}
      <section className="pt-10 pb-16 max-w-7xl mx-auto px-4 sm:px-6 w-full">
        <div className="bg-slate-900 text-white rounded-[2.5rem] p-8 sm:p-12 border border-slate-800 shadow-xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-950 text-blue-400 border border-blue-800 rounded-lg text-xs font-black uppercase tracking-widest">
                Global Opportunities
              </div>

              <h2 className="text-3xl sm:text-4xl font-display font-black tracking-tight leading-tight">
                Global University &amp; Scholarship Hub
              </h2>

              <p className="text-slate-300 font-medium text-sm sm:text-base leading-relaxed">
                Track admissions criteria, acceptance rates, tuition waivers, and merit-based grants for top universities across the US, UK, Canada, Pakistan, Nepal, and worldwide.
              </p>

              <div className="flex flex-wrap gap-3 pt-1">
                <button
                  onClick={onOpenUniversityTracker}
                  className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer flex items-center gap-2"
                >
                  <GraduationCap className="w-4 h-4" />
                  <span>Match Top Universities</span>
                </button>
                <button
                  onClick={onOpenScholarshipTracker}
                  className="px-5 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer flex items-center gap-2"
                >
                  <Award className="w-4 h-4" />
                  <span>Explore Scholarships</span>
                </button>
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800">
                <div className="text-2xl sm:text-3xl font-display font-black text-amber-400">500+</div>
                <div className="text-[11px] font-bold text-slate-400 mt-1 uppercase tracking-wider">Top Universities</div>
              </div>
              <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800">
                <div className="text-2xl sm:text-3xl font-display font-black text-emerald-400">$100M+</div>
                <div className="text-[11px] font-bold text-slate-400 mt-1 uppercase tracking-wider">Active Scholarships</div>
              </div>
              <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800">
                <div className="text-2xl sm:text-3xl font-display font-black text-blue-400">98.4%</div>
                <div className="text-[11px] font-bold text-slate-400 mt-1 uppercase tracking-wider">Exam Pass Rate</div>
              </div>
              <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800">
                <div className="text-2xl sm:text-3xl font-display font-black text-purple-400">24/7</div>
                <div className="text-[11px] font-bold text-slate-400 mt-1 uppercase tracking-wider">Voice AI Tutor</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. Section: Testimonials */}
      <section id="testimonials" className="pt-10 pb-16 max-w-7xl mx-auto px-4 sm:px-6 w-full">
        <div className="text-center space-y-3 mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 rounded-lg text-xs font-black uppercase tracking-wider">
            Student Success Stories
          </div>
          <h2 className="text-3xl sm:text-4xl font-display font-black tracking-tight text-slate-950 dark:text-white">
            Loved By 50,000+ Students Everywhere
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              quote: "The voice teacher mode completely saved my Organic Chemistry grade. I can talk through mechanism reactions out loud and get instant corrections with exact page citations.",
              name: "Maya Lin",
              role: "Pre-Med Student, Stanford",
              rating: 5,
              avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80"
            },
            {
              quote: "Uploading entire 200-page medical textbooks and asking questions grounded specifically in my syllabus gave me the top score in my class with zero guesswork.",
              name: "David Chen",
              role: "Biomedical Engineering, MIT",
              rating: 5,
              avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80"
            },
            {
              quote: "The 3D flashcards with SM-2 spaced repetition meant I only spent 15 minutes a day reviewing and aced my law finals without pulling all-nighters.",
              name: "Sophia Rodriguez",
              role: "Law Scholar, Oxford",
              rating: 5,
              avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80"
            }
          ].map((t, idx) => (
            <div key={`testimonial-${idx}-${t.name}`} className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-md flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-1">
                  {[...Array(t.rating)].map((_, i) => (
                    <Star key={`testimonial-star-${idx}-${i}`} className="w-4 h-4 fill-amber-500 text-amber-500" />
                  ))}
                </div>
                <p className="text-slate-700 dark:text-slate-300 font-medium text-xs sm:text-sm leading-relaxed italic">
                  "{t.quote}"
                </p>
              </div>

              <div className="flex items-center gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <img 
                  src={t.avatar} 
                  alt={`${t.name} – ${t.role} verified student user avatar`} 
                  loading="lazy"
                  decoding="async"
                  className="w-10 h-10 rounded-xl object-cover border border-blue-500/30" 
                />
                <div>
                  <h4 className="font-black text-xs text-slate-900 dark:text-white">{t.name}</h4>
                  <p className="text-[11px] text-slate-500 font-medium">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 9. Section: Meet Our Team */}
      <section id="team" className="pt-12 pb-16 max-w-7xl mx-auto px-4 sm:px-6 w-full">
        <div className="text-center space-y-3 mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 rounded-lg text-xs font-black uppercase tracking-wider">
            <Users className="w-3.5 h-3.5" /> Leadership &amp; Engineering
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-black tracking-tight text-slate-950 dark:text-white">
            Meet Our Team
          </h2>
          <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto text-sm sm:text-base font-medium">
            The founders, engineers, and designers dedicated to creating the most accurate, zero-hallucination study platform for students worldwide.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {TEAM_MEMBERS.map((member) => (
            <div
              key={`landing-team-${member.id}`}
              id={`team-card-${member.id}`}
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-md hover:shadow-xl hover:border-blue-500/50 transition-all duration-300 flex flex-col justify-between space-y-5 group"
            >
              <div className="space-y-4">
                {/* Photo or Clean Avatar Badge */}
                <div className="relative mx-auto w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden shadow-md flex items-center justify-center">
                  {member.hasPhoto && member.photoUrl ? (
                    <img 
                      src={member.photoUrl} 
                      alt={`${member.name} – ${member.role} at AI Study Buddy`}
                      loading="lazy"
                      decoding="async"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-950 dark:from-slate-800 dark:to-slate-900 flex flex-col items-center justify-center text-white border-2 border-slate-300 dark:border-slate-700">
                      <member.icon className="w-10 h-10 text-blue-400 mb-1" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">
                        {member.name.split(' ')[0]}
                      </span>
                    </div>
                  )}
                  <div className="absolute bottom-2 right-2 p-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm">
                    <member.icon className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>

                {/* Name & Role */}
                <div className="text-center space-y-1">
                  <span className={`inline-block px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border ${member.badgeBg}`}>
                    {member.titleBadge}
                  </span>
                  <h3 className="text-lg font-display font-black text-slate-950 dark:text-white tracking-tight">
                    {member.name}
                  </h3>
                  <p className="text-xs font-bold text-blue-600 dark:text-blue-400">
                    {member.role}
                  </p>
                </div>

                {/* Short Bio */}
                <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed text-center">
                  {member.bio}
                </p>
              </div>

              {/* Tags */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap justify-center gap-1">
                {member.tags.slice(0, 3).map((tag, tIdx) => (
                  <span
                    key={`tag-landing-${member.id}-${tIdx}`}
                    className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-bold"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Modal Trigger / Details CTA */}
        <div className="mt-8 text-center">
          <button
            onClick={() => {
              if (onOpenMeetTeam) {
                onOpenMeetTeam();
              }
            }}
            className="inline-flex items-center gap-2 px-6 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 text-slate-900 dark:text-white rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-sm cursor-pointer"
          >
            <Users className="w-4 h-4" />
            <span>View Full Team Profile &amp; Responsibilities</span>
          </button>
        </div>
      </section>

      {/* 9.5 Section: Latest AI Research & Blog Insights (SEO & Google Trends Engine) */}
      <section id="blog" className="pt-12 pb-16 max-w-7xl mx-auto px-4 sm:px-6 w-full">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 rounded-lg text-xs font-black uppercase tracking-wider">
              <TrendingUp className="w-3.5 h-3.5" /> Research, Trends &amp; Publications
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-black tracking-tight text-slate-950 dark:text-white">
              Latest AI &amp; Education Insights
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base font-medium">
              Data-backed research analyzing Google Trends search shifts, Agentic AI architectures, and cognitive memory optimization.
            </p>
          </div>

          <button
            onClick={() => onOpenBlog?.()}
            className="inline-flex items-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-xs uppercase tracking-wider shadow-md hover:scale-105 active:scale-95 transition-all self-start md:self-auto cursor-pointer"
          >
            <BookOpen className="w-4 h-4" /> View All Articles &rarr;
          </button>
        </div>

        {/* Featured Article Spotlight Card */}
        {BLOG_POSTS[0] && (
          <div
            onClick={() => onOpenBlog?.(BLOG_POSTS[0].slug)}
            className="group relative rounded-3xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl cursor-pointer hover:border-blue-500/50 transition-all duration-300 mb-8"
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
              
              {/* Image half */}
              <div className="lg:col-span-6 relative min-h-[280px] sm:min-h-[360px] overflow-hidden">
                <img 
                  src={BLOG_POSTS[0].coverImage} 
                  alt={`${BLOG_POSTS[0].title} – AI Study Buddy In-Depth Analysis Cover`}
                  loading="lazy"
                  decoding="async"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-4 left-4 flex flex-wrap items-center gap-2">
                  <span className="px-3 py-1 bg-amber-500 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-md">
                    Trending 2026 Analysis
                  </span>
                  <span className="px-3 py-1 bg-black/60 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest rounded-full">
                    {BLOG_POSTS[0].readTime}
                  </span>
                </div>
              </div>

              {/* Text half */}
              <div className="lg:col-span-6 p-6 sm:p-10 flex flex-col justify-between space-y-6">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2 text-xs font-black">
                    <span className="text-blue-600 dark:text-blue-400 uppercase tracking-wider">{BLOG_POSTS[0].category}</span>
                    <span className="text-slate-400">•</span>
                    <span className="text-slate-400">{BLOG_POSTS[0].publishedAt}</span>
                    <span className="text-slate-400">•</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                      <TrendingUp className="w-3.5 h-3.5" /> Trends Score: {BLOG_POSTS[0].googleTrendsScore}/100
                    </span>
                  </div>

                  <h3 className="font-display font-black text-xl sm:text-2xl lg:text-3xl text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors leading-tight">
                    {BLOG_POSTS[0].title}
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium line-clamp-3 leading-relaxed">
                    {BLOG_POSTS[0].subtitle}
                  </p>

                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {BLOG_POSTS[0].relatedTags.slice(0, 4).map((tag, tagIdx) => (
                      <span key={tagIdx} className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] font-semibold rounded-lg">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <img 
                      src={BLOG_POSTS[0].author.avatar} 
                      alt={`${BLOG_POSTS[0].author.name} – ${BLOG_POSTS[0].author.role}`}
                      loading="lazy"
                      decoding="async"
                      referrerPolicy="no-referrer"
                      className="w-9 h-9 rounded-xl object-cover border border-blue-500"
                    />
                    <div>
                      <p className="font-bold text-xs text-slate-900 dark:text-white">{BLOG_POSTS[0].author.name}</p>
                      <p className="text-[10px] text-slate-500">{BLOG_POSTS[0].author.role}</p>
                    </div>
                  </div>

                  <span className="text-xs font-black text-blue-600 dark:text-blue-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    Read Full Investigation &rarr;
                  </span>
                </div>

              </div>

            </div>
          </div>
        )}

        {/* 2-Column Grid for Secondary Posts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {BLOG_POSTS.slice(1).map((post) => (
            <div
              key={post.id}
              onClick={() => onOpenBlog?.(post.slug)}
              className="group bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-md hover:shadow-xl hover:border-blue-500/50 transition-all duration-300 flex flex-col justify-between space-y-4 cursor-pointer"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-black">
                  <span className="text-blue-600 dark:text-blue-400 uppercase tracking-wider">{post.category}</span>
                  <span className="text-slate-400">{post.readTime}</span>
                </div>

                <h4 className="font-display font-black text-lg text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors leading-snug">
                  {post.title}
                </h4>

                <p className="text-xs text-slate-600 dark:text-slate-300 font-medium line-clamp-2 leading-relaxed">
                  {post.subtitle}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <img 
                    src={post.author.avatar} 
                    alt={`${post.author.name} – ${post.author.role}`}
                    loading="lazy"
                    decoding="async"
                    referrerPolicy="no-referrer"
                    className="w-7 h-7 rounded-lg object-cover border border-blue-500"
                  />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{post.author.name}</span>
                </div>

                <span className="text-xs font-black text-blue-600 dark:text-blue-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  Read &rarr;
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 10. Section: Quick Answer & AEO/GEO FAQ (Direct answers optimized for Google, Perplexity, and AI search) */}
      <section id="faq" className="pt-10 pb-16 bg-slate-50 dark:bg-slate-950 border-y border-slate-200 dark:border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-10">
          
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 rounded-lg text-xs font-black uppercase tracking-wider">
              <HelpCircle className="w-3.5 h-3.5" /> Frequently Asked Questions
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-black tracking-tight text-slate-950 dark:text-white">
              Questions &amp; Verified Answers
            </h2>
            <p className="text-slate-600 dark:text-slate-400 max-w-xl mx-auto text-sm font-medium">
              Direct, self-contained answers about how AI Study Buddy operates, protects data, and verifies sources.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => {
              const isOpen = openFaqIndex === index;
              return (
                <div 
                  key={`faq-item-${index}`}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden transition-all shadow-sm"
                >
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                    className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 font-display font-black text-sm sm:text-base text-slate-900 dark:text-white cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    <span>{faq.question}</span>
                    <ChevronDown className={cn("w-5 h-5 shrink-0 transition-transform duration-200", isOpen && "rotate-180 text-blue-600")} />
                  </button>

                  {isOpen && (
                    <div className="px-5 sm:px-6 pb-6 pt-0 text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium leading-relaxed border-t border-slate-100 dark:border-slate-800/60 mt-1 pt-4">
                      <p>{faq.answer}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* 10. Section: Pricing */}
      <section id="pricing" className="pt-10 pb-16 max-w-7xl mx-auto px-4 sm:px-6 w-full">
        <div className="text-center space-y-3 mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 rounded-lg text-xs font-black uppercase tracking-wider">
            Affordable Student Pricing
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-black tracking-tight text-slate-950 dark:text-white">
            Choose Your AI Study Plan
          </h2>
          <p className="text-slate-600 dark:text-slate-400 max-w-xl mx-auto text-sm font-medium">
            Start free with 10 AI study sessions and searches or unlock unlimited grounded study guides, voice tutoring, and global university tracking with Pro.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* Free Tier */}
          <div className="p-8 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-md flex flex-col justify-between space-y-6">
            <div className="space-y-5">
              <div className="space-y-1.5">
                <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-black uppercase tracking-wider">Free Starter</span>
                <h3 className="text-2xl font-black text-slate-950 dark:text-white">Free Plan</h3>
                <p className="text-xs text-slate-500 font-medium">10 Free Uses Included • No Credit Card Required</p>
              </div>
              <div className="text-3xl font-black text-slate-950 dark:text-white">$0 <span className="text-xs text-slate-500 font-medium">/ forever</span></div>

              <ul className="space-y-2.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> 10 Free AI Study Analyses &amp; Searches</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Grounded Syllabus Search with Citations</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Basic Flashcard &amp; Quiz Creation</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> English &amp; Multilingual AI Support</li>
              </ul>
            </div>

            <button
              onClick={() => onOpenAuth('signup')}
              className="w-full py-3.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-black text-xs uppercase tracking-wider rounded-2xl transition-all cursor-pointer"
            >
              Get Started Free
            </button>
          </div>

          {/* Pro Plan */}
          <div className="p-8 bg-slate-900 text-white rounded-[2.5rem] border-2 border-blue-600 shadow-xl relative flex flex-col justify-between space-y-6">
            <div className="absolute -top-3.5 right-6 bg-amber-500 text-slate-950 font-black text-[10px] uppercase tracking-widest px-3 py-1 rounded-full shadow-md flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 fill-current" /> Most Popular
            </div>

            <div className="space-y-5">
              <div className="space-y-1.5">
                <span className="px-3 py-1 bg-blue-950 text-blue-400 rounded-lg text-xs font-black uppercase tracking-wider border border-blue-800">Pro Mastery</span>
                <h3 className="text-2xl font-black text-white">Pro Unlimited</h3>
                <p className="text-xs text-slate-400 font-medium">For students aiming for top academic grades</p>
              </div>

              <div className="space-y-0.5">
                <div className="text-3xl font-black text-white">$3.99 <span className="text-xs text-slate-400 font-medium">/ month</span></div>
                <p className="text-xs font-mono font-bold text-emerald-400">or $30.99 / year (Save 35%) • Rs. 1,100/mo</p>
              </div>

              <ul className="space-y-2.5 text-xs font-bold text-slate-200">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> <strong>Unlimited</strong> AI Study Guides &amp; Analyses</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> <strong>Real-Time Live Voice Teacher</strong> (Spoken Audio)</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> <strong>SM-2 3D Spaced Repetition</strong> Flashcard Algorithm</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> <strong>Global University Matcher</strong> &amp; $100M+ Scholarship Hub</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> <strong>Real-Time Group Study</strong> &amp; Collaborative Workspaces</li>
              </ul>
            </div>

            <button
              onClick={() => {
                if (onOpenUpgrade) onOpenUpgrade();
                else onEnterWorkspace();
              }}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Zap className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span>Upgrade To Pro ($3.99/mo)</span>
            </button>
          </div>
        </div>
      </section>

      {/* 11. Final Call To Action */}
      <section className="pt-6 pb-16 max-w-5xl mx-auto px-4 sm:px-6 w-full text-center">
        <div className="p-8 sm:p-14 bg-blue-600 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden space-y-6">
          <h2 className="text-3xl sm:text-5xl font-display font-black tracking-tight max-w-2xl mx-auto leading-tight">
            Ready To Supercharge Your Grades?
          </h2>
          <p className="text-sm sm:text-base text-blue-100 font-medium max-w-xl mx-auto">
            Create your free account today and start studying smarter with verified, citation-grounded AI.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
            <button
              onClick={() => onOpenAuth('signup')}
              className="px-8 py-4 bg-white text-slate-950 font-black text-sm uppercase tracking-wider rounded-2xl shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              Sign Up Free Now
            </button>
            <button
              onClick={onEnterWorkspace}
              className="px-8 py-4 bg-blue-700 hover:bg-blue-800 text-white font-black text-sm uppercase tracking-wider rounded-2xl transition-all cursor-pointer border border-blue-500"
            >
              Try Demo Mode
            </button>
          </div>
        </div>
      </section>

      {/* 12. SEO / GEO Directory Navigation & Footer */}
      <footer className="mt-auto py-12 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
          
          {/* Quick Hub Directory Links */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-left">
            <div className="space-y-2.5">
              <h4 className="font-display font-black text-slate-900 dark:text-white uppercase tracking-wider text-xs">Study Features</h4>
              <ul className="space-y-1.5 font-medium">
                <li><a href="#features" className="hover:text-blue-600 transition-colors">Live Voice Tutor</a></li>
                <li><a href="#features" className="hover:text-blue-600 transition-colors">Multi-Source Document Hub</a></li>
                <li><a href="#features" className="hover:text-blue-600 transition-colors">SM-2 3D Flashcards</a></li>
                <li><a href="#features" className="hover:text-blue-600 transition-colors">Practice Exam Quiz Maker</a></li>
                <li><a href="#features" className="hover:text-blue-600 transition-colors">Concept Mind Maps</a></li>
              </ul>
            </div>

            <div className="space-y-2.5">
              <h4 className="font-display font-black text-slate-900 dark:text-white uppercase tracking-wider text-xs">Subject Hubs</h4>
              <ul className="space-y-1.5 font-medium">
                <li><a href="#subjects" className="hover:text-blue-600 transition-colors">Math &amp; Calculus Solver</a></li>
                <li><a href="#subjects" className="hover:text-blue-600 transition-colors">Organic Chemistry Mechanisms</a></li>
                <li><a href="#subjects" className="hover:text-blue-600 transition-colors">Medical &amp; Anatomy Flashcards</a></li>
                <li><a href="#subjects" className="hover:text-blue-600 transition-colors">Essay &amp; Thesis Assistant</a></li>
                <li><a href="#subjects" className="hover:text-blue-600 transition-colors">Law IRAC Case Briefs</a></li>
              </ul>
            </div>

            <div className="space-y-2.5">
              <h4 className="font-display font-black text-slate-900 dark:text-white uppercase tracking-wider text-xs">Comparisons</h4>
              <ul className="space-y-1.5 font-medium">
                <li><a href="#compare" className="hover:text-blue-600 transition-colors">AI Study Buddy vs ChatGPT</a></li>
                <li><a href="#compare" className="hover:text-blue-600 transition-colors">AI Study Buddy vs Chegg</a></li>
                <li><a href="#compare" className="hover:text-blue-600 transition-colors">AI Study Buddy vs Quizlet</a></li>
                <li><a href="#compare" className="hover:text-blue-600 transition-colors">AI Study Buddy vs Anki</a></li>
              </ul>
            </div>

            <div className="space-y-2.5">
              <h4 className="font-display font-black text-slate-900 dark:text-white uppercase tracking-wider text-xs">Global Education &amp; SEO</h4>
              <ul className="space-y-1.5 font-medium">
                <li><button onClick={() => onOpenBlog?.()} className="hover:text-blue-600 transition-colors cursor-pointer text-left font-bold text-blue-600 dark:text-blue-400">📚 AI Insights &amp; Blog</button></li>
                <li><button onClick={() => onOpenBlog?.('how-ai-is-revolutionizing-in-this-era')} className="hover:text-blue-600 transition-colors cursor-pointer text-left">🔥 How AI is Revolutionizing</button></li>
                <li><button onClick={onOpenUniversityTracker} className="hover:text-blue-600 transition-colors cursor-pointer text-left">Top University Matcher</button></li>
                <li><button onClick={onOpenScholarshipTracker} className="hover:text-blue-600 transition-colors cursor-pointer text-left">$100M+ Scholarship Directory</button></li>
                <li><a href="#team" className="hover:text-blue-600 transition-colors">Meet Our Team</a></li>
                <li><a href="#pricing" className="hover:text-blue-600 transition-colors">Pricing &amp; Free Tier</a></li>
                <li>
                  <button
                    onClick={() => {
                      if (onOpenSitemap) onOpenSitemap();
                    }}
                    className="hover:text-blue-600 transition-colors cursor-pointer text-left font-bold text-blue-600 dark:text-blue-400"
                  >
                    🗺️ Website Sitemap
                  </button>
                </li>
                <li><a href="/robots.txt" target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 transition-colors">🤖 Robots.txt Index</a></li>
              </ul>
            </div>
          </div>

          {/* Copyright & Legal Links */}
          <div className="pt-6 border-t border-slate-200 dark:border-slate-800 text-center space-y-3 font-bold">
            <p className="uppercase tracking-widest flex flex-wrap items-center justify-center gap-2">
              <span>AI STUDY BUDDY PRO • CREATED BY AYAN AHMED</span>
              <span>•</span>
              <span>CONTACT: <a href="mailto:ayaicrypcoin@gmail.com" className="text-blue-600 dark:text-blue-400 hover:underline font-mono lowercase">ayaicrypcoin@gmail.com</a></span>
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-bold text-blue-600 dark:text-blue-400">
              <button 
                onClick={() => {
                  if (onOpenMeetTeam) {
                    onOpenMeetTeam();
                  } else {
                    const el = document.getElementById('team');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                className="hover:underline cursor-pointer"
              >
                Meet Our Team
              </button>
              <span>•</span>
              <button onClick={onOpenTerms} className="hover:underline cursor-pointer">
                Terms of Service
              </button>
              <span>•</span>
              <button onClick={onOpenPrivacy} className="hover:underline cursor-pointer">
                Privacy Policy
              </button>
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
            <p className="font-medium text-[11px] text-slate-400">
              Zero-hallucination educational study engine with verified citations. Built with attention to academic rigor.
            </p>
          </div>

        </div>
      </footer>

    </div>
  );
}
