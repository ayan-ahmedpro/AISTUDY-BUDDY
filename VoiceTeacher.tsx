import React, { useEffect, useRef, useState } from 'react';
import { GoogleGenAI, type LiveServerMessage } from "@google/genai";
import { Mic, MicOff, X, Volume2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface VoiceTeacherProps {
  initialContext?: string;
  initialImage?: string; // base64
  age?: number;
  onClose: () => void;
}

export default function VoiceTeacher({ initialContext, initialImage, age = 20, onClose }: VoiceTeacherProps) {
  const [isActive, setIsActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<string>("");

  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sessionRef = useRef<any>(null);
  const audioQueue = useRef<Int16Array[]>([]);
  const isPlayingRef = useRef(false);

  // System instruction based on age
  const getSystemInstruction = (studentAge: number) => {
    let persona = "";
    if (studentAge < 12) {
      persona = "You are a fun, magical, and super patient teacher for kids. Use very simple words, fun sound effects (verbally like 'Boom!', 'Zip!'), and exciting metaphors. Keep them engaged like a cartoon character.";
    } else if (studentAge < 20) {
      persona = "You are a cool, relatable high school mentor. Use modern examples, stay energetic, and understand their stress. Use some Gen-Z friendly tone but keep it educational.";
    } else if (studentAge < 35) {
      persona = "You are a professional, efficient academic tutor. Focus on deep concepts, time-saving tips, and career relevance. Be clear and scholarly.";
    } else if (studentAge < 50) {
      persona = "You are a sophisticated, mature academic guide. Use highly professional language, connect concepts to high-level strategy and real-world executive applications. Be articulated and intellectual.";
    } else {
      persona = "You are a respectful, wise, and patient companion tutor. Use clear, deliberate speech, connect concepts to life experience, and be very encouraging. Value their wisdom while teaching.";
    }

    return `You are AI Study BUDDY, an intelligent and friendly AI tutor created by Ayan Ahmed. ${persona} You have access to Google Search to provide up-to-date information. You help students understand concepts deeply, not just memorize. Talk naturally, use simple Urdu + English where appropriate, and be motivating. The student is ${studentAge} years old.`;
  };

  const startSession = async () => {
    setIsConnecting(true);
    setError(null);

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY is not defined. Please check your project settings.");
      }
      const ai = new GoogleGenAI({ 
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
      
      const sessionPromise = ai.live.connect({
        model: "gemini-3.1-flash-live-preview",
        callbacks: {
          onopen: () => {
            setIsActive(true);
            setIsConnecting(false);
            setupAudioInput();
            
            // Send initial context if provided
            if (initialContext || initialImage) {
              sessionPromise.then((session) => {
                if (initialContext) {
                  session.sendRealtimeInput({ 
                    text: `Context about the study material: ${initialContext}. Now act as AI Study BUDDY and greet the student in a way appropriate for a ${age} year old.` 
                  });
                }
                if (initialImage) {
                  const base64Data = initialImage.includes('base64,') 
                    ? initialImage.split('base64,')[1] 
                    : initialImage;
                  session.sendRealtimeInput({ 
                    video: { data: base64Data, mimeType: 'image/jpeg' } 
                  });
                }
              });
            }
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data) {
              const base64Audio = message.serverContent.modelTurn.parts[0].inlineData.data;
              const arrayBuffer = base64ToArrayBuffer(base64Audio);
              const pcmData = new Int16Array(arrayBuffer);
              audioQueue.current.push(pcmData);
              processAudioQueue();
            }
            
            if (message.serverContent?.interrupted) {
              audioQueue.current = [];
              isPlayingRef.current = false;
            }

            if (message.serverContent?.modelTurn) {
                setIsSpeaking(true);
            }

            // Handle transcription
            const textPart = message.serverContent?.modelTurn?.parts?.find(p => p.text);
            if (textPart?.text) {
                setTranscript(prev => prev + " " + textPart.text);
            }
          },
          onerror: (err: any) => {
            console.error("Live API Error:", err);
            const friendlyErr = getFriendlyErrorMessage(err);
            setError(friendlyErr);
            stopSession();
          },
          onclose: () => {
            stopSession();
          }
        },
        config: {
          responseModalities: ["AUDIO" as any], // Must be an array with a single AUDIO element
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
          },
          tools: [
            { googleSearch: {} }
          ],
          outputAudioTranscription: {},
          inputAudioTranscription: {},
          systemInstruction: getSystemInstruction(age),
        },
      });

      sessionRef.current = await sessionPromise;
    } catch (err: any) {
      console.error("[VoiceTeacher] startSession outer caught error:", err);
      const friendlyErr = getFriendlyErrorMessage(err);
      setError(friendlyErr);
      setIsConnecting(false);
      stopSession();
    }
  };

  const getFriendlyErrorMessage = (err: any): string => {
    let errRaw = "";
    try {
      errRaw = typeof err === 'object' ? JSON.stringify(err) : String(err);
    } catch (e) {
      errRaw = String(err);
    }
    const errStr = (errRaw + " " + String(err?.message || err?.statusText || err?.status || err?.reason || "")).toLowerCase();

    if (
      errStr.includes("quota") || 
      errStr.includes("billing") || 
      errStr.includes("limit") || 
      errStr.includes("exhausted") || 
      errStr.includes("429") ||
      errStr.includes("exceeded") ||
      errStr.includes("live api error")
    ) {
      return "API Quota Limit: The Gemini Live API real-time voice session has reached its rate or token limit. Please try again in a few minutes, or close this window to use the standard Live Chat on the main dashboard!";
    }
    if (errStr.includes("api key") || errStr.includes("not valid") || errStr.includes("key not configured")) {
      return "Invalid API Key: The live session could not start because the Gemini API key is missing or invalid. Please check your project settings.";
    }
    return "Connection error: Could not establish real-time voice session. Please ensure your mic is connected or try again in a few moments.";
  };

  const setupAudioInput = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const audioContext = new AudioContext({ sampleRate: 16000 });
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }
      audioContextRef.current = audioContext;
      
      const source = audioContext.createMediaStreamSource(stream);
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      
      processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        const pcmData = floatTo16BitPCM(inputData);
        if (sessionRef.current) {
          const base64Data = arrayBufferToBase64(pcmData.buffer);
          sessionRef.current.sendRealtimeInput({
            audio: { data: base64Data, mimeType: 'audio/pcm;rate=16000' }
          });
        }
      };
      
      source.connect(processor);
      processor.connect(audioContext.destination);
      processorRef.current = processor;
    } catch (err) {
      console.error("Microphone access denied:", err);
      setError("Microphone access required for voice mode.");
    }
  };

  const processAudioQueue = async () => {
    if (isPlayingRef.current || audioQueue.current.length === 0) return;
    
    isPlayingRef.current = true;
    while (audioQueue.current.length > 0) {
      const pcmData = audioQueue.current.shift();
      if (pcmData) {
        await playPCM(pcmData);
      }
    }
    isPlayingRef.current = false;
    setIsSpeaking(false);
  };

  const playPCM = (pcmData: Int16Array) => {
    return new Promise<void>((resolve) => {
      if (!audioContextRef.current) {
        resolve();
        return;
      }

      if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
      }
      
      const sampleRate = 24000; // Gemini Live API usually returns 24kHz
      const floatData = new Float32Array(pcmData.length);
      for (let i = 0; i < pcmData.length; i++) {
        floatData[i] = pcmData[i] / 32768.0;
      }
      
      const buffer = audioContextRef.current.createBuffer(1, floatData.length, sampleRate);
      buffer.getChannelData(0).set(floatData);
      
      const source = audioContextRef.current.createBufferSource();
      source.buffer = buffer;
      source.connect(audioContextRef.current.destination);
      source.onended = () => resolve();
      source.start();
    });
  };

  const stopSession = () => {
    sessionRef.current?.close();
    sessionRef.current = null;
    
    processorRef.current?.disconnect();
    processorRef.current = null;
    
    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;
    
    audioContextRef.current?.close();
    audioContextRef.current = null;
    
    setIsActive(false);
    setIsConnecting(false);
    setIsSpeaking(false);
  };

  useEffect(() => {
    startSession();
    return () => stopSession();
  }, []);

  // Helpers
  const base64ToArrayBuffer = (base64: string) => {
    const binaryString = window.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  };

  const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  };

  const floatTo16BitPCM = (floatData: Float32Array) => {
    const pcmData = new Int16Array(floatData.length);
    for (let i = 0; i < floatData.length; i++) {
      const s = Math.max(-1, Math.min(1, floatData[i]));
      pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return pcmData;
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-md overflow-y-auto p-4 md:p-8 flex justify-center items-start">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white w-full max-w-lg my-auto rounded-[3rem] overflow-hidden shadow-2xl relative"
      >
        {/* Header */}
        <div className="p-6 border-b flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center text-white">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800">Live Voice Tutor</h3>
              <p className="text-xs text-slate-500">Engaging with AI Study BUDDY</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded-full transition-colors"
          >
            <X className="text-slate-600 w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-10 flex flex-col items-center justify-center min-h-[400px] gap-8">
          {isConnecting ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mx-auto" />
              <p className="font-medium text-slate-600">Connecting to your tutor...</p>
            </div>
          ) : error ? (
            <div className="text-center space-y-4 p-2">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto text-amber-600">
                <MicOff className="w-8 h-8" />
              </div>
              <p className="text-slate-700 text-xs sm:text-sm font-medium leading-relaxed max-w-sm mx-auto">{error}</p>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button 
                  onClick={startSession}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-full font-bold text-xs transition-all shadow-md cursor-pointer"
                >
                  Try Again
                </button>
                <button 
                  onClick={onClose}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-2.5 rounded-full font-bold text-xs transition-all cursor-pointer"
                >
                  Close & Use Main Dashboard
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Voice Visualizer */}
              <div className="relative">
                <motion.div 
                  className="w-32 h-32 bg-blue-600 rounded-full flex items-center justify-center z-10 relative"
                  animate={{ 
                    scale: isSpeaking ? [1, 1.1, 1] : 1,
                    boxShadow: isSpeaking ? [
                      "0 0 0 0 rgba(37, 99, 235, 0.4)",
                      "0 0 0 20px rgba(37, 99, 235, 0)",
                      "0 0 0 0 rgba(37, 99, 235, 0)"
                    ] : "none"
                  }}
                  transition={{ 
                    duration: 1.5, 
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <Volume2 className="text-white w-10 h-10" />
                </motion.div>
                
                {/* Secondary wave */}
                <AnimatePresence>
                  {isSpeaking && (
                    <motion.div 
                      key="wave"
                      initial={{ scale: 1, opacity: 0.5 }}
                      animate={{ scale: 1.8, opacity: 0 }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute inset-0 bg-blue-400 rounded-full -z-10"
                    />
                  )}
                </AnimatePresence>
              </div>

              <div className="text-center space-y-2">
                <h4 className="text-2xl font-bold text-slate-900">
                  {isSpeaking ? "Teacher is speaking..." : "Listening to you..."}
                </h4>
                <p className="text-slate-500 italic max-w-xs mx-auto text-sm">
                  Asking follow-up questions is the best way to learn!
                </p>
              </div>

              {/* Real-time Transcription */}
              <AnimatePresence>
                {transcript && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-h-32 overflow-y-auto p-6 bg-slate-50 rounded-[2rem] border border-slate-100 shadow-inner"
                  >
                    <p className="text-slate-600 text-sm font-medium leading-relaxed">
                      {transcript}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex gap-4">
                <div className="px-4 py-2 bg-slate-100 rounded-full flex items-center gap-2">
                  <Mic className="w-4 h-4 text-emerald-500" />
                  <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Live Audio</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 bg-slate-50 border-t text-center">
            <p className="text-xs text-slate-400 font-medium">
                Your conversation is private and used to help you study better.
            </p>
        </div>
      </motion.div>
    </div>
  );
}
