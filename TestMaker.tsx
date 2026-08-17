import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Brain, Sparkles, ChevronRight, CheckCircle2, RotateCcw, X, Plus, Target, ArrowLeft } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { cn } from '../lib/utils';
import { auth, db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { runWithRetry } from '../services/geminiService';
import { useNavigation } from '../context/NavigationContext';

interface TestMakerProps {
  topics: string[];
  onClose: () => void;
}

interface Question {
  question: string;
  options: string[];
  correctAnswer: string;
}

const TestMaker: React.FC<TestMakerProps> = ({ topics, onClose }) => {
  const { goBack, registerModal } = useNavigation();

  useEffect(() => {
    return registerModal('TestMaker', onClose);
  }, [onClose, registerModal]);
  const [selectedTopics, setSelectedTopics] = useState<string[]>(topics.slice(0, 3));
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [loading, setLoading] = useState(false);
  const [test, setTest] = useState<Question[] | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [results, setResults] = useState<boolean | null>(null);

  const [isAnswered, setIsAnswered] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const generateTest = async () => {
    setLoading(true);
    setTest(null);
    setErrorMsg(null);
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY is not defined");
      }
      const ai = new GoogleGenAI({ 
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
      const prompt = `
        Act as a professional academic examiner. Generate a ${difficulty} level multiple-choice test based on the study material topics: ${topics.join(', ')}.
        
        CRITICAL INSTRUCTIONS:
        - Exactly 8 high-quality questions.
        - Each question must have exactly 4 distinct options.
        - One clear correct answer that MUST match one of the options EXACTLY.
        - Return raw valid JSON only.
        
        OUTPUT FORMAT: A JSON array of objects with keys "question", "options" (array), and "correctAnswer".
      `;

      let response;
      try {
        response = await runWithRetry(() => ai.models.generateContent({
          model: "gemini-3.6-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            temperature: 0.1,
          }
        }));
      } catch (firstErr: any) {
        response = await runWithRetry(() => ai.models.generateContent({
          model: "gemini-3.1-flash-lite",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            temperature: 0.1,
          }
        }), 2, 1000);
      }

      const text = response.text;
      if (!text) throw new Error("Empty AI response");
      
      // Clean and parse JSON
      let cleanJson = text.replace(/```json/g, "").replace(/```/g, "").trim();
      const data = JSON.parse(cleanJson);
      
      if (Array.isArray(data) && data.length > 0) {
        setTest(data);
      } else {
          throw new Error("Invalid format received from AI");
      }
    } catch (err: any) {
      console.error("Test Generation Error:", err);
      const errStr = String(err?.message || err || "").toLowerCase();
      if (errStr.includes("quota") || errStr.includes("exceeded") || errStr.includes("429")) {
        setErrorMsg("API Quota Reached: The AI server is experiencing high traffic. Please try again in 1 minute.");
      } else {
        setErrorMsg("Test generation failed. Please try again in a few moments.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOptionClick = (opt: string) => {
    if (isAnswered) return;
    setAnswers(prev => ({ ...prev, [currentIdx]: opt }));
    setIsAnswered(true);
  };

  const nextQuestion = () => {
    setIsAnswered(false);
    setCurrentIdx(prev => prev + 1);
  };

  const submitTest = async () => {
    const correct = test?.filter((q, i) => answers[i] === q.correctAnswer).length || 0;
    setResults(true);

    if (auth.currentUser) {
      await addDoc(collection(db, `users/${auth.currentUser.uid}/sessions`), {
        userId: auth.currentUser.uid,
        topic: `Mastery Test (${difficulty})`,
        subject: "AI Generated Test",
        timestamp: serverTimestamp(),
        quizScore: correct,
        totalQuestions: test?.length || 0,
        masteryScore: Math.round((correct / (test?.length || 1)) * 100)
      });
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-xl overflow-y-auto h-full p-4 md:p-8 flex justify-center items-start">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white w-full max-w-2xl my-auto rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-4">
             <div className="bg-indigo-600 p-2.5 rounded-2xl">
                <Brain className="text-white w-6 h-6" />
             </div>
             <div>
                <h3 className="text-xl font-black text-slate-900 leading-tight">AI Test Maker</h3>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Mastery Assessment</p>
             </div>
          </div>
          <button type="button" onClick={goBack} className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-2xl transition-all font-black text-xs flex items-center gap-2 cursor-pointer">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to AI Study Buddy</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div 
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-8"
              >
                <div className="space-y-4">
                  <div className="h-6 w-1/3 bg-slate-100 rounded-lg animate-pulse" />
                  <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-200 w-1/2 rounded-full animate-pulse mx-auto" />
                  </div>
                </div>
                <div className="h-20 w-full bg-slate-50 rounded-2xl animate-pulse" />
                <div className="space-y-3">
                  {[1, 2, 3, 4].map(i => (
                    <div key={`tm-skel-${i}`} className="h-16 w-full bg-slate-50 rounded-2xl animate-pulse" style={{ animationDelay: `${i * 100}ms` }} />
                  ))}
                </div>
                <div className="pt-6 border-t border-slate-100 flex justify-end">
                    <div className="h-10 w-32 bg-slate-100 rounded-xl animate-pulse" />
                </div>
              </motion.div>
            ) : !test ? (
              <motion.div 
                key="setup"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-8"
              >
                <div className="bg-indigo-50/50 p-6 rounded-3xl border border-indigo-100 flex items-start gap-4">
                   <Target className="text-indigo-600 w-6 h-6 shrink-0 mt-1" />
                   <div>
                      <h4 className="font-black text-indigo-900 text-sm">Deep Evaluation Mode</h4>
                      <p className="text-xs text-indigo-600/80 font-medium leading-relaxed">The AI will analyze all your study materials and generate a comprehensive assessment covering key concepts, logic, and definitions.</p>
                   </div>
                </div>

                <div>
                   <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 block">Select Difficulty Level</label>
                   <div className="grid grid-cols-3 gap-4">
                     {(['easy', 'medium', 'hard'] as const).map(d => (
                       <button
                         key={d}
                         type="button"
                        onClick={() => setDifficulty(d)}
                         className={cn(
                           "py-3 rounded-2xl text-sm font-black uppercase transition-all border",
                           difficulty === d 
                            ? "bg-slate-900 border-slate-900 text-white" 
                            : "bg-slate-50 border-slate-100 text-slate-400 font-bold"
                         )}
                       >
                         {d}
                       </button>
                     ))}
                   </div>
                </div>

                {errorMsg && (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-800 text-xs font-medium leading-relaxed">
                    {errorMsg}
                  </div>
                )}

                <button 
                  type="button"
                  disabled={loading}
                  onClick={generateTest}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-700 text-white py-5 rounded-2xl font-black shadow-xl shadow-indigo-100 hover:scale-[1.02] active:scale-95 transition-all text-lg flex items-center justify-center gap-3 cursor-pointer"
                >
                  {loading ? <RotateCcw className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                  {loading ? "Constructing Exam..." : "Generate Master Test"}
                </button>
              </motion.div>
            ) : !results ? (
              <motion.div 
                key="quiz"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-8"
              >
                <div className="flex items-center justify-between">
                   <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Question {currentIdx + 1} of {test?.length || 0}</div>
                   <div className="h-1.5 w-32 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-600 transition-all duration-500" style={{ width: `${((currentIdx + 1) / (test?.length || 1)) * 100}%` }} />
                   </div>
                </div>

                <div className="text-xl font-black text-slate-900 leading-tight min-h-[80px]">
                  {test?.[currentIdx]?.question}
                </div>

                <div className="space-y-2">
                  {(test?.[currentIdx]?.options || []).map((opt, optIdx) => (
                    <button
                      key={`${opt}-${optIdx}`}
                      type="button"
                      onClick={() => handleOptionClick(opt)}
                      className={cn(
                        "w-full text-left p-5 rounded-2xl font-bold border transition-all flex items-center justify-between group",
                        isAnswered 
                          ? opt === test?.[currentIdx]?.correctAnswer
                            ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                            : answers[currentIdx] === opt
                              ? "bg-rose-50 border-rose-200 text-rose-700"
                              : "bg-slate-50 opacity-40"
                          : answers[currentIdx] === opt 
                            ? "bg-indigo-50 border-indigo-200 text-indigo-700" 
                            : "bg-slate-50/50 border-slate-100 text-slate-600 hover:bg-slate-100"
                      )}
                    >
                      <span>{opt}</span>
                      {isAnswered && opt === test?.[currentIdx]?.correctAnswer && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                      {isAnswered && answers[currentIdx] === opt && opt !== test?.[currentIdx]?.correctAnswer && <X className="w-4 h-4 text-rose-600" />}
                      {!isAnswered && answers[currentIdx] === opt && <CheckCircle2 className="w-4 h-4" />}
                    </button>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-6 border-t border-slate-100">
                  <div className="text-xs text-slate-400 font-bold italic">
                    {isAnswered 
                      ? answers[currentIdx] === test?.[currentIdx]?.correctAnswer ? "Excellent! That's correct." : "Study this concept again."
                      : "Select an option to proceed"}
                  </div>
                  {currentIdx < (test?.length || 0) - 1 ? (
                    <button 
                      type="button"
                      disabled={!isAnswered}
                      onClick={nextQuestion}
                      className="bg-slate-950 text-white px-8 py-3 rounded-xl font-black text-sm flex items-center gap-2 hover:bg-slate-800 disabled:opacity-30 transition-all"
                    >
                      Next Question <ChevronRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button 
                      type="button"
                      disabled={!isAnswered}
                      onClick={submitTest}
                      className="bg-indigo-600 text-white px-10 py-3 rounded-xl font-black text-sm hover:bg-indigo-700 transition-all"
                    >
                      Finalize & Submit
                    </button>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="results"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-10 space-y-8"
              >
                <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Target className="w-12 h-12 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-3xl font-black text-slate-900">Test Complete!</h3>
                  <p className="text-slate-500 font-medium">Analyzing your mastery levels...</p>
                </div>
                <div className="bg-slate-50 rounded-3xl p-10 flex flex-col items-center">
                    <div className="text-6xl font-black text-slate-900 mb-2">
                        {(test || []).filter((q, i) => answers[i] === q?.correctAnswer).length} / {test?.length || 0}
                    </div>
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Total Score</div>
                    <div className="mt-4 px-4 py-1.5 bg-indigo-100 text-indigo-700 rounded-full text-xs font-black uppercase tracking-widest">
                        {Math.round(((test || []).filter((q, i) => answers[i] === q?.correctAnswer).length / (test?.length || 1)) * 100)}% Mastery
                    </div>
                </div>
                
                <div className="space-y-4 text-left max-h-48 overflow-y-auto px-4 custom-scrollbar">
                   {(test || []).map((q, i) => (
                      <div key={`tm-res-${i}-${q?.question ? q.question.substring(0, 15) : i}`} className="flex gap-4 items-start pb-4 border-b border-slate-100 last:border-0 hover:bg-slate-50 p-2 rounded-xl transition-colors">
                         <div className={cn(
                            "mt-1 p-1 rounded-full shrink-0",
                            answers[i] === q?.correctAnswer ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"
                         )}>
                            {answers[i] === q?.correctAnswer ? <CheckCircle2 className="w-3 h-3" /> : <X className="w-3 h-3" />}
                         </div>
                         <div className="space-y-1">
                            <p className="text-xs font-bold text-slate-700 line-clamp-2">{q?.question}</p>
                            <p className="text-[10px] text-slate-400 font-medium italic">Correct: {q?.correctAnswer}</p>
                         </div>
                      </div>
                   ))}
                </div>

                <button 
                  type="button"
                  onClick={onClose}
                  className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black shadow-xl shadow-slate-200 hover:scale-[1.02] transition-all"
                >
                  Return to Dashboard
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default TestMaker;
