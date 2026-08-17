import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  HelpCircle, 
  GraduationCap, 
  Award, 
  BrainCircuit, 
  BookOpen, 
  Search, 
  CheckCircle2, 
  ArrowLeft, 
  Sparkles, 
  ArrowRight, 
  FileText, 
  Compass, 
  Wand2, 
  Clapperboard, 
  Globe, 
  Zap, 
  Download, 
  Share2, 
  BookMarked
} from 'lucide-react';

interface HowItWorksModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'overview' | 'university' | 'scholarship' | 'mastery' | 'studiotools';
  onOpenUniversityTracker?: () => void;
  onOpenScholarshipTracker?: () => void;
}

export default function HowItWorksModal({
  isOpen,
  onClose,
  initialTab = 'overview',
  onOpenUniversityTracker,
  onOpenScholarshipTracker
}: HowItWorksModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'university' | 'scholarship' | 'mastery' | 'studiotools'>(initialTab);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 text-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Top Header */}
          <div className="px-6 py-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all text-xs font-bold flex items-center gap-2 border border-slate-700/60 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4 text-blue-400" />
                <span>Back</span>
              </button>
              <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
                <HelpCircle className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  Platform Guide & Instructions
                </h3>
                <p className="text-xs text-slate-400 font-medium">How to navigate & maximize your AI Study Buddy features</p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-1.5 px-6 py-3 bg-slate-950/60 border-b border-slate-800 overflow-x-auto shrink-0">
            {[
              { id: 'overview', label: 'Platform Overview', icon: Sparkles },
              { id: 'university', label: 'University Tracker', icon: GraduationCap },
              { id: 'scholarship', label: 'Scholarship Matcher', icon: Award },
              { id: 'mastery', label: 'Engineering Mastery', icon: BrainCircuit },
              { id: 'studiotools', label: 'AI Studio Tools', icon: Wand2 }
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={`how-tab-${tab.id}`}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Modal Content Area */}
          <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8">

            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="p-6 rounded-3xl bg-gradient-to-r from-blue-600/20 via-indigo-600/10 to-purple-600/20 border border-blue-500/30 space-y-3">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-[10px] font-black uppercase tracking-wider">
                    <Zap className="w-3 h-3 text-blue-400" /> Complete Student AI Ecosystem
                  </div>
                  <h4 className="text-2xl font-black text-white">Welcome to AI Study Buddy</h4>
                  <p className="text-xs md:text-sm text-slate-300 leading-relaxed font-medium">
                    Your all-in-one educational platform for multi-source textbook analysis, active recall, global university tracking, and 100% fully funded scholarship discovery.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 space-y-3">
                    <div className="w-10 h-10 rounded-2xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
                      <GraduationCap className="w-5 h-5 text-blue-400" />
                    </div>
                    <h5 className="font-black text-white text-base">1. AI University & Degree Tracker</h5>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Matches your current GPA, target field, and location (Nepal, Pakistan, US, UK, Global) to premier real-world institutions and degrees. Includes full eligibility scores & PDF export.
                    </p>
                  </div>

                  <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 space-y-3">
                    <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
                      <Award className="w-5 h-5 text-amber-400" />
                    </div>
                    <h5 className="font-black text-white text-base">2. AI Scholarship Tracker</h5>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Cross-references global databases (Fulbright, Chevening, DAAD, MEXT, Australia Awards) to find 100% fully funded grants, tuition waivers, and stipends tailored to your profile.
                    </p>
                  </div>

                  <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 space-y-3">
                    <div className="w-10 h-10 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
                      <BrainCircuit className="w-5 h-5 text-purple-400" />
                    </div>
                    <h5 className="font-black text-white text-base">3. Engineering & Study Mastery</h5>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Upload PDFs, lecture notes, or textbook images to generate age-customized explanations (age 7 to 50), 3D mind maps, interactive quizzes, and audio podcasts.
                    </p>
                  </div>

                  <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 space-y-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                      <Wand2 className="w-5 h-5 text-emerald-400" />
                    </div>
                    <h5 className="font-black text-white text-base">4. AI Studio Productivity Tools</h5>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Access Diagram Studio for high-res educational graphics, Veo Video Studio for animated explanations, Deep Thinking for complex calculus, and Search Grounding for live exam facts.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* UNIVERSITY TRACKER TAB */}
            {activeTab === 'university' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between p-5 rounded-2xl bg-blue-950/40 border border-blue-500/30">
                  <div className="flex items-center gap-3">
                    <GraduationCap className="w-6 h-6 text-blue-400" />
                    <div>
                      <h4 className="font-black text-white text-base">University Tracker Step-by-Step Instructions</h4>
                      <p className="text-xs text-slate-300">How to find matching institutions & export shortlisted reports</p>
                    </div>
                  </div>
                  {onOpenUniversityTracker && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenUniversityTracker();
                      }}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold flex items-center gap-2 cursor-pointer shadow-md"
                    >
                      <span>Open Tracker Now</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="space-y-4">
                  {[
                    {
                      step: '01',
                      title: 'Enter Academic Credentials & Preferred Field',
                      desc: 'Select your target degree level (Undergraduate, Master\'s, PhD) and specify your current GPA or grades (e.g. GPA 3.7 / 85%). Enter your major or field of interest.'
                    },
                    {
                      step: '02',
                      title: 'Choose Target Location',
                      desc: 'Pick a target country from options like Nepal, Pakistan, United States, United Kingdom, Canada, Australia, Germany, or select "Anywhere / Global" for worldwide opportunities.'
                    },
                    {
                      step: '03',
                      title: 'Run AI Matching Engine',
                      desc: 'Click "Find Top Universities & Degrees". Gemini AI evaluates acceptance rates, tuition estimates, campus highlights, and matches specific degree programs to your background.'
                    },
                    {
                      step: '04',
                      title: 'Save Shortlists & Export PDF',
                      desc: 'Click the Bookmark icon on any university card to save it to your personal shortlist. Click "Export PDF Report" to download a formatted summary for counselor or parent review.'
                    }
                  ].map((item) => (
                    <div key={`uni-step-${item.step}`} className="p-5 rounded-2xl bg-slate-950 border border-slate-800 flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 font-black text-sm flex items-center justify-center shrink-0 border border-blue-500/30">
                        {item.step}
                      </div>
                      <div className="space-y-1">
                        <h5 className="font-black text-white text-sm">{item.title}</h5>
                        <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SCHOLARSHIP TRACKER TAB */}
            {activeTab === 'scholarship' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between p-5 rounded-2xl bg-amber-950/40 border border-amber-500/30">
                  <div className="flex items-center gap-3">
                    <Award className="w-6 h-6 text-amber-400" />
                    <div>
                      <h4 className="font-black text-white text-base">Scholarship Tracker Step-by-Step Instructions</h4>
                      <p className="text-xs text-slate-300">How to uncover 100% fully funded grants & build application plans</p>
                    </div>
                  </div>
                  {onOpenScholarshipTracker && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenScholarshipTracker();
                      }}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-black flex items-center gap-2 cursor-pointer shadow-md"
                    >
                      <span>Open Tracker Now</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="space-y-4">
                  {[
                    {
                      step: '01',
                      title: 'Configure Funding Requirements',
                      desc: 'Select your degree level and set your preferred funding type: Fully Funded (Tuition + Monthly Stipend), Tuition Waiver, or Partial Grants.'
                    },
                    {
                      step: '02',
                      title: 'Specify Field & Destination',
                      desc: 'Choose your academic subject (Engineering, CS, Medicine, Business) and target country to filter active government and university scholarship funds.'
                    },
                    {
                      step: '03',
                      title: 'Review Required Documents & Action Plan',
                      desc: 'Each matched scholarship highlights mandatory documentation (Statement of Purpose, Letters of Recommendation, Transcripts) and step-by-step application timelines.'
                    },
                    {
                      step: '04',
                      title: 'Bookmark & Filter Coverage',
                      desc: 'Use funding filters to instantly view only 100% fully funded options. Bookmark scholarships to build your personalized tracking dashboard.'
                    }
                  ].map((item) => (
                    <div key={`sch-step-${item.step}`} className="p-5 rounded-2xl bg-slate-950 border border-slate-800 flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 font-black text-sm flex items-center justify-center shrink-0 border border-amber-500/30">
                        {item.step}
                      </div>
                      <div className="space-y-1">
                        <h5 className="font-black text-white text-sm">{item.title}</h5>
                        <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* MASTERY TAB */}
            {activeTab === 'mastery' && (
              <div className="space-y-6">
                <div className="p-5 rounded-2xl bg-purple-950/40 border border-purple-500/30 flex items-center gap-3">
                  <BrainCircuit className="w-6 h-6 text-purple-400" />
                  <div>
                    <h4 className="font-black text-white text-base">Engineering & AI Study Mastery Instructions</h4>
                    <p className="text-xs text-slate-300">How to analyze multi-source study materials & generate cognitive assets</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {[
                    {
                      step: '01',
                      title: 'Upload Study Files or Drop Images',
                      desc: 'Drag & drop PDF chapters, formula cheatsheets, lecture slide photos, or text documents into the Engineering Mastery hero area.'
                    },
                    {
                      step: '02',
                      title: 'Set Target Understanding Age',
                      desc: 'Adjust the target age slider (e.g. Age 7 for simple analogies, Age 15 for high school foundation, Age 25 for university rigor, Age 40 for executive summary).'
                    },
                    {
                      step: '03',
                      title: 'Generate Notebook & Study Kit',
                      desc: 'Click "Master Study Material". The system synthesizes key concepts into interactive tabs: Executive Overview, Chapter Topics, Active Recall Quiz, Mind Map, and Audio Podcast.'
                    },
                    {
                      step: '04',
                      title: 'Practice & Monitor Streaks',
                      desc: 'Complete quiz questions and save customized notes to your persistent notebook storage. Study streaks update automatically upon activity.'
                    }
                  ].map((item) => (
                    <div key={`mas-step-${item.step}`} className="p-5 rounded-2xl bg-slate-950 border border-slate-800 flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 font-black text-sm flex items-center justify-center shrink-0 border border-purple-500/30">
                        {item.step}
                      </div>
                      <div className="space-y-1">
                        <h5 className="font-black text-white text-sm">{item.title}</h5>
                        <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* STUDIO TOOLS TAB */}
            {activeTab === 'studiotools' && (
              <div className="space-y-6">
                <div className="p-5 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 flex items-center gap-3">
                  <Wand2 className="w-6 h-6 text-emerald-400" />
                  <div>
                    <h4 className="font-black text-white text-base">AI Studio Suite Instructions</h4>
                    <p className="text-xs text-slate-300">How to use visual, video, reasoning, and grounding tools</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex items-center gap-2 text-purple-400 font-black text-sm">
                      <Wand2 className="w-4 h-4" /> Diagram Studio
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Type prompts to generate high-definition scientific diagrams, circuit blueprints, or anatomical illustrations. Includes editing & resolution export controls.
                    </p>
                  </div>

                  <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex items-center gap-2 text-blue-400 font-black text-sm">
                      <Clapperboard className="w-4 h-4" /> Veo Video Studio
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Animate static textbook images or generate animated video explanations for complex physics, chemistry, or engineering concepts.
                    </p>
                  </div>

                  <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex items-center gap-2 text-emerald-400 font-black text-sm">
                      <BrainCircuit className="w-4 h-4" /> Deep Thinking Workbench
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Submit step-by-step calculus proofs, algorithmic problems, or structural mechanics equations for high-reasoning solutions with line-by-line breakdown.
                    </p>
                  </div>

                  <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex items-center gap-2 text-sky-400 font-black text-sm">
                      <Globe className="w-4 h-4" /> Search Grounding Hub
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Fetch live web updates for university exam syllabi, research papers, latest scholarship deadlines, and verified academic citations.
                    </p>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Bottom Backlink Footer Bar */}
          <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
            <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Need help while exploring? Click "How It Works" anytime from any tracker screen.</span>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              {onOpenUniversityTracker && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenUniversityTracker();
                  }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border border-slate-700"
                >
                  <span>Go to Uni Tracker</span>
                </button>
              )}

              {onOpenScholarshipTracker && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenScholarshipTracker();
                  }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border border-slate-700"
                >
                  <span>Go to Scholarships</span>
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer shadow-md shadow-blue-600/30"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Return to Workspace</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
