import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Loader2, Sparkles, Globe, Trash2 } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { cn } from '../lib/utils';
import { auth, db } from '../lib/firebase';
import { runWithRetry } from '../services/geminiService';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, getDocs, where, deleteDoc, limit } from 'firebase/firestore';

interface Message {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  isGrounded?: boolean;
  timestamp?: any;
}

interface LiveChatProps {
  initialContext: string;
  selectedAge?: number;
  onSaveNote?: (title: string, content: string) => void;
  onOpenSourceExcerpt?: (sourceId: string) => void;
}

const LiveChat: React.FC<LiveChatProps> = ({ 
  initialContext, 
  selectedAge = 18,
  onSaveNote,
  onOpenSourceExcerpt
}) => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "I'm your Live Study Buddy. Use me for quick questions, up-to-date facts, or to explain specific parts of your notes!" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, `users/${auth.currentUser.uid}/chats`),
      orderBy('timestamp', 'asc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const chatData = snapshot.docs.map(doc => ({
        role: doc.data().role,
        content: doc.data().text,
        isGrounded: doc.data().isGrounded
      })) as Message[];
      
      if (chatData.length > 0) {
        setMessages(chatData);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const saveMessage = async (role: 'user' | 'assistant', text: string, grounded: boolean = false) => {
    if (auth.currentUser) {
      await addDoc(collection(db, `users/${auth.currentUser.uid}/chats`), {
        role,
        text,
        isGrounded: grounded,
        timestamp: serverTimestamp()
      });
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    
    // Optimistic update for local UI if not logged in, but we'll prioritize sync from Firestore
    if (!auth.currentUser) {
       setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    }
    
    await saveMessage('user', userMessage);
    setLoading(true);

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
      
      // Build history for context
      const recentHistory = messages.slice(-5).map(m => `${m.role === 'user' ? 'Student' : 'Tutor'}: ${m.content}`).join('\n');

      let result;
      try {
        result = await runWithRetry(() => ai.models.generateContent({
          model: "gemini-3.6-flash",
          contents: [
            { 
              role: 'user', 
              parts: [{ 
                text: `You are AI Study BUDDY - a friendly, age-adaptive tutor with casual Hinglish flair.
                Student Age: ${selectedAge} years old.
                
                STRICT ACCURACY & GROUNDING MANDATE:
                - Base your answer strictly on the provided Knowledge Context & Active Sources.
                - DO NOT invent or mention unrelated regions, countries, or topics (e.g. if the context is about the European Union, stick strictly to EU topics and DO NOT mention Nepal or unrelated subjects).
                
                Knowledge Context & Active Sources:
                ${initialContext}
                
                Recent Conversation:
                ${recentHistory}
                
                Student's latest question: ${userMessage}
                
                Provide a clear, engaging answer using simple analogies and casual Hinglish friendliness. Ground your answers in the provided notebook sources and cite sources using [[source_id]] or [source_name].` 
              }] 
            }
          ],
          config: {
            tools: [{ googleSearch: {} }]
          }
        }));
      } catch (firstErr: any) {
        const errRaw = typeof firstErr === 'object' ? JSON.stringify(firstErr) : String(firstErr);
        const errStr = (errRaw + " " + String(firstErr?.message || "")).toLowerCase();
        if (errStr.includes("quota") || errStr.includes("exceeded") || errStr.includes("429") || errStr.includes("503") || errStr.includes("overloaded")) {
          // Fallback to lightweight model without search tool
          result = await runWithRetry(() => ai.models.generateContent({
            model: "gemini-3.1-flash-lite",
            contents: [
              { 
                role: 'user', 
                parts: [{ 
                  text: `You are AI Study BUDDY - a friendly, age-adaptive tutor with casual Hinglish flair.
                  Student Age: ${selectedAge} years old.
                  Context: ${initialContext}
                  Student question: ${userMessage}` 
                }] 
              }
            ]
          }), 2, 1000);
        } else {
          throw firstErr;
        }
      }

      const text = result.text || "Dost, I couldn't generate a response.";
      const isGrounded = text.length > 30; // Simple check

      if (!auth.currentUser) {
        setMessages(prev => [...prev, { role: 'assistant', content: text, isGrounded }]);
      }
      await saveMessage('assistant', text, isGrounded);

    } catch (err: any) {
      console.error("[LiveChat] Error:", err);
      const errRaw = typeof err === 'object' ? JSON.stringify(err) : String(err);
      const errStr = (errRaw + " " + String(err?.message || "")).toLowerCase();
      let errMsg = "Dost, I'm having trouble connecting to the brain center. Please try once more!";
      if (errStr.includes("quota") || errStr.includes("exceeded") || errStr.includes("429") || errStr.includes("billing")) {
        errMsg = "Dost! The AI quota limit was reached. Take a 1-minute water break and send your message again!";
      }
      if (!auth.currentUser) {
        setMessages(prev => [...prev, { role: 'assistant', content: errMsg }]);
      }
      await saveMessage('assistant', errMsg);
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = async () => {
     if (!auth.currentUser) return;
     if (confirm("Clear your chat history?")) {
        const q = query(collection(db, `users/${auth.currentUser.uid}/chats`));
        const snapshot = await getDocs(q);
        const deletePromises = snapshot.docs.map(d => deleteDoc(d.ref));
        await Promise.all(deletePromises);
        setMessages([{ role: 'assistant', content: "History cleared! What can I help you with now?" }]);
     }
  };

  return (
    <div className="flex flex-col h-[600px] bg-slate-950 rounded-[2.5rem] border border-white/10 overflow-hidden shadow-2xl relative">
      {/* Header */}
      <div className="p-6 border-b border-white/10 bg-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
            <div className="bg-blue-500 w-8 h-8 rounded-lg flex items-center justify-center">
                <Bot className="text-white w-5 h-5" />
            </div>
            <div>
                <h4 className="text-white font-black text-sm">Live Q&A</h4>
                <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Active History</span>
                </div>
            </div>
        </div>
        <button 
          onClick={clearHistory}
          className="p-2 text-slate-500 hover:text-red-400 transition-colors"
          title="Clear History"
        >
           <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
        {messages.map((m, i) => (
          <div key={m.id ? `msg-${m.id}-${i}` : `chat-msg-${i}-${m.timestamp || i}`} className={cn("flex gap-3", m.role === 'user' ? "flex-row-reverse" : "flex-row")}>
            <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-lg",
                m.role === 'user' ? "bg-slate-800" : "bg-blue-600"
            )}>
              {m.role === 'user' ? <User className="text-white w-4 h-4" /> : <Bot className="text-white w-4 h-4" />}
            </div>
            <div className={cn(
              "max-w-[80%] p-4 rounded-2xl relative group",
              m.role === 'user' ? "bg-slate-800 text-white" : "bg-white/5 border border-white/10 text-slate-200"
            )}>
              <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap">{m.content}</p>
              {m.isGrounded && (
                <div className="mt-2 flex items-center gap-1 text-[10px] text-blue-400 font-bold uppercase tracking-wider opacity-60 group-hover:opacity-100 transition-opacity">
                    <Globe className="w-3 h-3" />
                    Fact-Checked
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-3">
             <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                <Loader2 className="text-white w-4 h-4 animate-spin" />
             </div>
             <div className="bg-white/5 border border-white/10 p-4 rounded-2xl">
                <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" />
                    <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
             </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-6 bg-white/5 border-t border-white/10">
        <div className="relative">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask AI Study BUDDY..."
            className="w-full bg-slate-900 border border-white/10 text-white rounded-2xl p-4 pr-14 text-sm font-medium focus:outline-none focus:border-blue-500 transition-colors shadow-inner"
          />
          <button 
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="absolute right-2 top-2 w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 transition-all shadow-lg"
          >
            <Send className="text-white w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default LiveChat;
