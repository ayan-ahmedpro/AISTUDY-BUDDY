import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Target, 
  Brain, 
  ChevronRight, 
  ChevronLeft, 
  Sparkles, 
  AlertTriangle, 
  Zap, 
  CheckCircle2,
  X,
  Loader2,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  BarChart3,
  ArrowLeft
} from 'lucide-react';
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  ResponsiveContainer 
} from 'recharts';
import { cn } from '../lib/utils';
import { detectWeakness } from '../services/geminiService';
import { useNavigation } from '../context/NavigationContext';

interface WeaknessDetectorProps {
  onClose: () => void;
}

const QUESTIONS = [
  {
    id: 1,
    question: "When faced with a complex task, what's your first instinct?",
    options: [
      "Break it down into tiny steps immediately",
      "Feel overwhelmed and scroll through my phone",
      "Start working on the easiest part first",
      "Research everything before taking a single step"
    ],
    category: "Action Orientation"
  },
  {
    id: 2,
    question: "How do you handle a mistake or a bad grade?",
    options: [
      "Analyze exactly what went wrong for next time",
      "Tell myself 'I'm just not good at this'",
      "Ignore it and hope the next one is better",
      "Feel guilty for days and lose motivation"
    ],
    category: "Resilience"
  },
  {
    id: 3,
    question: "Think about your most common distraction while studying. What is it?",
    options: [
      "Social media and notifications",
      "My own wandering thoughts / daydreaming",
      "Minor household chores I suddenly need to do",
      "Other 'productive' tasks that aren't the priority"
    ],
    category: "Focus"
  },
  {
    id: 4,
    question: "If you have to explain a concept to someone, how do you feel?",
    options: [
      "Confident, I enjoy teaching",
      "Nervous, I'm afraid I'll say something wrong",
      "Frustrated if they don't get it immediately",
      "I realize I don't actually know it as well as I thought"
    ],
    category: "Knowledge Depth"
  },
  {
    id: 5,
    question: "What's your typical study environment like?",
    options: [
      "Perfectly organized with everything I need",
      "A bit chaotic, but I know where things are",
      "Loud and shared with others",
      "I constantly change locations to 'find the vibe'"
    ],
    category: "Environment"
  }
];

export default function WeaknessDetector({ onClose }: WeaknessDetectorProps) {
  const { goBack, registerModal } = useNavigation();
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    return registerModal('WeaknessDetector', onClose);
  }, [onClose, registerModal]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    weakness: string;
    psychologicalProfile: string;
    suggestions: string[];
    dangerLevel: 'Low' | 'Medium' | 'High';
    comparisonScores: Record<string, number>;
  } | null>(null);

  const radarData = result ? Object.entries(result.comparisonScores).map(([subject, score]) => ({
    subject: subject.split(' ')[0], // Truncate for display
    fullSubject: subject,
    A: score,
    fullMark: 100,
  })) : [];

  const handleSelect = (option: string) => {
    setAnswers(prev => ({ ...prev, [QUESTIONS[currentStep].id]: option }));
    if (currentStep < QUESTIONS.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setError(null);
    try {
      const surveyData = QUESTIONS.map(q => ({
        question: q.question,
        answer: answers[q.id]
      }));
      const response = await detectWeakness(surveyData);
      setResult(response);
    } catch (err: any) {
      console.error("Analysis failed:", err);
      setError(err.message || "Failed to analyze behavior. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const progress = ((currentStep + 1) / QUESTIONS.length) * 100;

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-3xl overflow-y-auto h-full p-4 md:p-8 flex justify-center items-start">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white dark:bg-slate-900 w-full max-w-4xl my-auto rounded-[3rem] overflow-hidden shadow-2xl flex flex-col md:flex-row min-h-[550px] max-h-[90vh] relative border border-white/10"
      >
        <button 
          onClick={goBack}
          className="absolute top-6 right-6 z-10 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-2xl transition-all font-black text-xs flex items-center gap-2 cursor-pointer shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to AI Study Buddy</span>
        </button>

        {/* Sidebar Info */}
        <div className="w-full md:w-80 bg-slate-900 dark:bg-slate-950 p-10 flex flex-col justify-between text-white border-r border-slate-800 shrink-0 overflow-y-auto">
          <div>
            <div className="w-16 h-16 bg-indigo-500 rounded-3xl flex items-center justify-center mb-8 shadow-lg shadow-indigo-500/20">
              <Target className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-black mb-4">Weakness Detector</h2>
            <p className="text-slate-400 text-sm font-medium leading-relaxed">
              Answer honestly. This tool uses pattern recognition to identify psychological barriers in your learning journey.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Psychological Mode</span>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 bg-slate-50 dark:bg-slate-900 flex flex-col overflow-y-auto">
          {!result ? (
            <>
              {/* Progress Tracker */}
              <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  className="h-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)] transition-all"
                />
              </div>

              <div className="flex-1 flex flex-col justify-center p-8 md:p-16">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-10"
                  >
                    <div className="space-y-2">
                       <span className="text-indigo-500 font-black text-xs uppercase tracking-widest">
                         Question {currentStep + 1} of {QUESTIONS.length}
                       </span>
                       <h3 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white leading-tight">
                         {QUESTIONS[currentStep].question}
                       </h3>
                    </div>

                    <div className="grid gap-4">
                      {QUESTIONS[currentStep].options.map((option, idx) => (
                        <button
                          key={`opt-${currentStep}-${idx}`}
                          onClick={() => handleSelect(option)}
                          className={cn(
                            "group text-left p-6 rounded-2xl border-2 transition-all flex items-center justify-between",
                            answers[QUESTIONS[currentStep].id] === option
                              ? "bg-indigo-50 dark:bg-indigo-500/10 border-indigo-500"
                              : "bg-white dark:bg-slate-800 border-transparent hover:border-slate-200 dark:hover:border-slate-700 shadow-sm"
                          )}
                        >
                          <span className={cn(
                            "font-bold text-sm",
                            answers[QUESTIONS[currentStep].id] === option ? "text-indigo-600 dark:text-indigo-400" : "text-slate-600 dark:text-slate-300"
                          )}>{option}</span>
                          <ChevronRight className={cn(
                            "w-5 h-5 transition-transform group-hover:translate-x-1",
                            answers[QUESTIONS[currentStep].id] === option ? "text-indigo-500" : "text-slate-300 dark:text-slate-600"
                          )} />
                        </button>
                      ))}
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Bottom Nav */}
              <div className="p-8 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between">
                <button
                  disabled={currentStep === 0}
                  onClick={() => setCurrentStep(prev => prev - 1)}
                  className="flex items-center gap-2 text-slate-400 font-bold hover:text-slate-600 dark:hover:text-slate-300 disabled:opacity-0"
                >
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>
                
                {Object.keys(answers).length === QUESTIONS.length && (
                  <div className="flex flex-col items-end gap-2">
                    {error && <span className="text-xs text-rose-500 font-bold">{error}</span>}
                    <button
                      onClick={handleAnalyze}
                      disabled={isAnalyzing}
                      className="flex items-center gap-2 bg-slate-900 dark:bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-slate-800 dark:hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-xl shadow-slate-200 dark:shadow-none"
                    >
                      {isAnalyzing ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" /> Analyzing Behavior...
                        </>
                      ) : (
                        <>
                          Reveal Detailed Profile <Brain className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex-1 overflow-y-auto p-6 md:p-10 space-y-10 bg-white dark:bg-slate-900 scrollbar-hide"
            >
              <div className="flex flex-col md:flex-row gap-8 items-start">
                {/* Visual Data Section */}
                <div className="w-full md:w-64 space-y-6">
                  <div className="relative aspect-square w-full h-[240px] bg-slate-50 dark:bg-slate-950 rounded-3xl p-4 border border-slate-100 dark:border-slate-800">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                        <PolarGrid stroke="#e2e8f0" strokeOpacity={0.3} />
                        <PolarAngleAxis 
                          dataKey="subject" 
                          tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                        />
                        <Radar
                          name="Performance"
                          dataKey="A"
                          stroke="#6366f1"
                          fill="#6366f1"
                          fillOpacity={0.5}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                    <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-1 bg-white/50 dark:bg-slate-900/50 backdrop-blur rounded-lg border border-white/20">
                      <BarChart3 className="w-3 h-3 text-indigo-500" />
                      <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">Cognitive Map</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Scores breakdown</h4>
                    {Object.entries(result.comparisonScores).map(([key, val]) => (
                      <div key={key} className="flex items-center justify-between px-3 py-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                        <span className="text-[10px] font-bold text-slate-500">{key}</span>
                        <span className={cn(
                          "text-xs font-black",
                          val < 40 ? "text-rose-500" : val < 70 ? "text-amber-500" : "text-emerald-500"
                        )}>{val}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Analysis Section */}
                <div className="flex-1 space-y-8">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center",
                        result.dangerLevel === 'High' ? "bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400" :
                        result.dangerLevel === 'Medium' ? "bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400" :
                        "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                      )}>
                        {result.dangerLevel === 'High' ? <AlertTriangle className="w-6 h-6" /> : <TrendingUp className="w-6 h-6" />}
                      </div>
                      <div>
                        <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-widest text-[10px]">Detected Cognitive Lock</h3>
                        <p className="text-xl font-black text-slate-900 dark:text-white leading-tight">{result.weakness}</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 bg-indigo-50 dark:bg-indigo-500/5 rounded-3xl border border-indigo-100 dark:border-indigo-500/20 space-y-3">
                    <h4 className="font-black text-indigo-900 dark:text-indigo-300 flex items-center gap-2 text-sm">
                      <Brain className="w-4 h-4" /> Behavioral Blueprint
                    </h4>
                    <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed font-medium">
                      {result.psychologicalProfile}
                    </p>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-black text-slate-900 dark:text-white flex items-center gap-2 text-sm">
                      <Zap className="text-amber-500 w-4 h-4" /> Recommended Correction Path
                    </h4>
                    <div className="grid gap-3">
                      {result.suggestions.map((s, i) => (
                        <div key={`sug-${i}`} className="group bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 flex items-start gap-4 hover:border-indigo-200 dark:hover:border-indigo-500/30 transition-colors">
                           <div className="w-8 h-8 rounded-xl bg-slate-50 dark:bg-slate-950 flex items-center justify-center font-black text-xs text-slate-400 group-hover:text-indigo-500 transition-colors">
                             {i + 1}
                           </div>
                           <span className="text-xs font-bold text-slate-600 dark:text-slate-300 leading-normal">{s}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <button 
                  onClick={onClose}
                  className="w-full py-4 bg-slate-900 dark:bg-indigo-600 text-white rounded-2xl font-black hover:bg-slate-800 dark:hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-xl shadow-slate-200 dark:shadow-none"
                >
                  Apply These Behavioral Fixes <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
