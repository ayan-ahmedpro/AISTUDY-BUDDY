import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Mic, 
  Volume2, 
  VolumeX, 
  MessageSquare, 
  Sparkles, 
  Send, 
  Radio, 
  User, 
  GraduationCap,
  Square
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { StudyCastLine, NotebookSource } from '../types';

interface StudyCastProps {
  script: StudyCastLine[];
  onAskMidCast: (question: string, currentPositionLine: string) => Promise<string>;
  isLoadingScript?: boolean;
  onGenerateScript: () => void;
  age?: number;
}

export const StudyCast: React.FC<StudyCastProps> = ({
  script,
  onAskMidCast,
  isLoadingScript,
  onGenerateScript,
  age = 18
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  
  // Pause & Ask state
  const [isAsking, setIsAsking] = useState(false);
  const [questionInput, setQuestionInput] = useState('');
  const [isAnswering, setIsAnswering] = useState(false);
  const [midCastAnswer, setMidCastAnswer] = useState<string | null>(null);

  const synthRef = useRef<SpeechSynthesis | null>(null);
  const activeUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    }
    return () => {
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  // Speech playback loop
  useEffect(() => {
    if (!isPlaying || !script || script.length === 0 || isAsking) return;

    if (currentLineIndex >= script.length) {
      setIsPlaying(false);
      return;
    }

    const currentLine = script[currentLineIndex];
    if (!currentLine || isMuted) return;

    const synth = synthRef.current || window.speechSynthesis;
    synth.cancel();

    const utterance = new SpeechSynthesisUtterance(currentLine.line);
    activeUtteranceRef.current = utterance;

    // Pick 2 distinct voices if available
    const voices = synth.getVoices();
    if (voices.length > 0) {
      if (currentLine.speaker === 'Host A') {
        // Voice for curious student
        utterance.voice = voices.find(v => v.name.includes('Google') || v.name.includes('Natural') || v.lang.startsWith('en')) || voices[0];
        utterance.pitch = 1.1;
        utterance.rate = 1.05;
      } else {
        // Voice for tutor
        utterance.voice = voices.find(v => v.name.includes('Male') || v.name.includes('Daniel') || v.name.includes('Alex') || v.lang.startsWith('en')) || voices[Math.min(1, voices.length - 1)];
        utterance.pitch = 0.95;
        utterance.rate = 0.98;
      }
    }

    utterance.onend = () => {
      if (isPlaying && !isAsking) {
        setCurrentLineIndex(prev => prev + 1);
      }
    };

    utterance.onerror = (e) => {
      console.warn('Speech synthesis error:', e);
      if (isPlaying && !isAsking) {
        setCurrentLineIndex(prev => prev + 1);
      }
    };

    synth.speak(utterance);

    // Scroll transcript
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });

  }, [isPlaying, currentLineIndex, script, isMuted, isAsking]);

  const handlePlayPause = () => {
    if (isPlaying) {
      setIsPlaying(false);
      if (synthRef.current) synthRef.current.cancel();
    } else {
      setIsPlaying(true);
    }
  };

  const handleReset = () => {
    setIsPlaying(false);
    if (synthRef.current) synthRef.current.cancel();
    setCurrentLineIndex(0);
    setMidCastAnswer(null);
  };

  const handleOpenPauseAndAsk = () => {
    setIsPlaying(false);
    if (synthRef.current) synthRef.current.cancel();
    setIsAsking(true);
  };

  const handleSubmitQuestion = async () => {
    if (!questionInput.trim()) return;
    setIsAnswering(true);
    try {
      const currentLineText = script[currentLineIndex]?.line || 'Beginning of discussion';
      const answer = await onAskMidCast(questionInput, currentLineText);
      setMidCastAnswer(answer);

      // Speak answer using tutor voice
      const synth = synthRef.current || window.speechSynthesis;
      synth.cancel();
      const utt = new SpeechSynthesisUtterance(answer);
      synth.speak(utt);
    } catch (err) {
      console.error('Error answering mid-cast question:', err);
    } finally {
      setIsAnswering(false);
    }
  };

  if (isLoadingScript) {
    return (
      <div className="p-12 text-center bg-slate-900/60 border border-slate-800 rounded-[2.5rem] my-8 max-w-4xl mx-auto">
        <div className="w-16 h-16 bg-indigo-600/20 text-indigo-400 rounded-3xl flex items-center justify-center mx-auto mb-4 animate-bounce">
          <Radio className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-black text-white">Generating StudyCast Podcast...</h3>
        <p className="text-xs text-slate-400 mt-2 max-w-md mx-auto">
          Crafting an age-adaptive 2-host audio discussion with Hinglish casual explanations and interactive q&a hooks.
        </p>
      </div>
    );
  }

  if (!script || script.length === 0) {
    return (
      <div className="p-12 text-center bg-slate-900/60 border border-slate-800 rounded-[2.5rem] my-8 max-w-4xl mx-auto">
        <div className="w-16 h-16 bg-indigo-600/10 text-indigo-400 rounded-3xl flex items-center justify-center mx-auto mb-4">
          <Radio className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-black text-white">Interactive StudyCast Audio</h3>
        <p className="text-xs text-slate-400 mt-2 max-w-md mx-auto mb-6">
          Listen to a conversational 2-host breakdown of your notes. Pause anytime to ask a question mid-broadcast!
        </p>
        <button
          onClick={onGenerateScript}
          className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-indigo-600/30 active:scale-95"
        >
          Generate StudyCast Episode
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Player Header Banner */}
      <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 border border-indigo-500/30 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 rounded-3xl flex items-center justify-center shrink-0 shadow-inner">
            <Radio className="w-8 h-8 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2.5 py-0.5 rounded-full">
                Interactive StudyCast
              </span>
              <span className="text-[10px] text-slate-400">
                Line {currentLineIndex + 1} of {script.length}
              </span>
            </div>
            <h3 className="text-xl font-black text-white mt-1">Grounded Audio Deep Dive</h3>
            <p className="text-xs text-slate-400 mt-0.5">Two-Host Dialogue • Age {age} Tone</p>
          </div>
        </div>

        {/* Player Controls */}
        <div className="flex items-center gap-3 bg-slate-950/80 p-3 rounded-3xl border border-slate-800">
          <button
            onClick={handlePlayPause}
            className="w-12 h-12 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl flex items-center justify-center transition-all shadow-lg shadow-indigo-600/30 active:scale-95"
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
          </button>

          <button
            onClick={handleReset}
            className="p-3 text-slate-400 hover:text-white bg-slate-900 rounded-xl transition-all"
            title="Replay from start"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          <button
            onClick={onGenerateScript}
            disabled={isLoadingScript}
            className="p-3 text-indigo-300 hover:text-white bg-indigo-600/30 hover:bg-indigo-600/60 border border-indigo-500/40 rounded-xl transition-all flex items-center gap-1.5 font-bold text-xs active:scale-95 disabled:opacity-50"
            title="Refresh and regenerate StudyCast episode"
          >
            <Sparkles className={`w-4 h-4 ${isLoadingScript ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh Cast</span>
          </button>

          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-3 text-slate-400 hover:text-white bg-slate-900 rounded-xl transition-all"
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? <VolumeX className="w-5 h-5 text-rose-400" /> : <Volume2 className="w-5 h-5" />}
          </button>

          <button
            onClick={handleOpenPauseAndAsk}
            className="px-4 py-3 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all"
          >
            <MessageSquare className="w-4 h-4" />
            Pause & Ask
          </button>
        </div>
      </div>

      {/* Transcript Scrolling Box */}
      <div className="bg-slate-900/80 border border-slate-800 p-6 md:p-8 rounded-[2.5rem] max-h-[500px] overflow-y-auto space-y-4 relative">
        <div className="sticky top-0 z-10 bg-slate-900/90 backdrop-blur-md pb-3 border-b border-slate-800 flex items-center justify-between text-xs font-bold text-slate-400">
          <span>Syncing Live Transcript</span>
          <span>Hinglish / Casual Tutor Voice</span>
        </div>

        {script.map((item, idx) => {
          const isCurrent = idx === currentLineIndex;
          const isHostA = item.speaker === 'Host A';

          return (
            <motion.div
              key={`cast-line-${idx}`}
              animate={{
                scale: isCurrent ? 1.01 : 1,
                opacity: isCurrent ? 1 : 0.6
              }}
              className={`p-4 rounded-2xl border transition-all flex items-start gap-3 ${
                isCurrent 
                  ? 'bg-indigo-950/60 border-indigo-500/50 shadow-lg shadow-indigo-950/50' 
                  : 'bg-slate-950/40 border-slate-800/80'
              }`}
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                isHostA ? 'bg-slate-800 text-slate-300' : 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
              }`}>
                {isHostA ? <User className="w-4 h-4" /> : <GraduationCap className="w-4 h-4" />}
              </div>

              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-black uppercase tracking-wider ${
                    isHostA ? 'text-slate-400' : 'text-indigo-400'
                  }`}>
                    {isHostA ? 'Host A (Curious Student)' : 'Host B (AI Tutor)'}
                  </span>
                  {isCurrent && (
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                    </span>
                  )}
                </div>
                <p className="text-xs font-medium leading-relaxed text-slate-200">
                  {item.line}
                </p>
              </div>
            </motion.div>
          );
        })}
        <div ref={transcriptEndRef} />
      </div>

      {/* Mid-cast Question Modal */}
      <AnimatePresence>
        {isAsking && (
          <div className="fixed inset-0 z-[120] bg-slate-950/80 backdrop-blur-md overflow-y-auto p-4 md:p-8 flex justify-center items-start">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 text-slate-100 w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden my-auto p-6 md:p-8 relative space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-600/20 text-indigo-400 rounded-xl flex items-center justify-center">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white">Pause & Ask Tutor</h3>
                    <p className="text-xs text-slate-400">Ask a question about the current topic</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsAsking(false)}
                  className="p-2 text-slate-400 hover:text-white bg-slate-800/50 rounded-xl"
                >
                  <Square className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-xs text-slate-400">
                <span className="font-bold text-indigo-400 block mb-1">Paused at line:</span>
                "{script[currentLineIndex]?.line || 'StudyCast discussion point'}"
              </div>

              <textarea
                rows={3}
                placeholder="Ask your question here... (e.g. Can you explain that again with an example?)"
                value={questionInput}
                onChange={(e) => setQuestionInput(e.target.value)}
                className="w-full p-4 bg-slate-950 border border-slate-800 rounded-2xl text-xs text-slate-100 focus:outline-none focus:border-indigo-500 resize-none"
              />

              <button
                onClick={handleSubmitQuestion}
                disabled={isAnswering || !questionInput.trim()}
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg"
              >
                {isAnswering ? <Sparkles className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {isAnswering ? 'Tutor is answering...' : 'Ask Tutor Now'}
              </button>

              {midCastAnswer && (
                <div className="p-4 bg-indigo-950/60 border border-indigo-500/40 rounded-2xl text-xs text-slate-200 space-y-2 mt-4">
                  <span className="font-black text-indigo-400 block uppercase tracking-wider text-[10px]">Tutor Response:</span>
                  <p className="leading-relaxed font-medium">{midCastAnswer}</p>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
export default StudyCast;
