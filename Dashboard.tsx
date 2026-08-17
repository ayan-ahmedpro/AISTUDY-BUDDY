import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot, limit, getDocs, where } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { motion } from 'motion/react';
import { 
  TrendingUp, 
  BookOpen, 
  Clock, 
  Award, 
  ChevronRight, 
  BarChart3, 
  Target, 
  Layers,
  Sparkles,
  FileText,
  Brain,
  ArrowLeft
} from 'lucide-react';
import { cn } from '../lib/utils';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis
} from 'recharts';
import { useNavigation } from '../context/NavigationContext';
import { generateStudyProgressPDF } from '../lib/pdfExporter';

import TestMaker from './TestMaker';

interface StudySession {
  id: string;
  topic: string;
  subject: string;
  timestamp: any;
  quizScore: number;
  totalQuestions: number;
  total_questions_count?: number;
  durationMinutes?: number;
  masteryScore?: number;
}

interface DashboardProps {
  onBack?: () => void;
  onSelectSession?: (session: any) => void;
  onShowWeaknessDetector?: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onBack, onSelectSession, onShowWeaknessDetector }) => {
  const { goBack, registerModal } = useNavigation();
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [loading, setLoading] = useState(true);
  const [topTopics, setTopTopics] = useState<{ topic: string; count: number }[]>([]);
  const [showTestMaker, setShowTestMaker] = useState(false);

  useEffect(() => {
    if (onBack) {
      return registerModal('Dashboard', onBack);
    }
  }, [onBack, registerModal]);

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, `users/${auth.currentUser.uid}/sessions`),
      orderBy('timestamp', 'asc') // Ascending for chart
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const sessionData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as StudySession[];
      
      setSessions(sessionData);
      
      // Calculate top topics
      const topicCounts: Record<string, number> = {};
      sessionData.forEach(s => {
        topicCounts[s.topic] = (topicCounts[s.topic] || 0) + 1;
      });
      const sortedTopics = Object.entries(topicCounts)
        .map(([topic, count]) => ({ topic, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
      setTopTopics(sortedTopics);

      setLoading(false);
    }, (error) => {
      console.error("Dashboard Snapshot Error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const totalSessions = sessions.length;
  const avgMastery = sessions.length > 0 
    ? Math.round(sessions.reduce((acc, s) => acc + ((s.quizScore / (s.totalQuestions || 1)) * 100), 0) / sessions.length) 
    : 0;

  const handleExportReport = async () => {
    try {
      await generateStudyProgressPDF(sessions);
    } catch (err) {
      console.error("PDF Export failed:", err);
      alert("Failed to export report. Please try again.");
    }
  };
    
  const chartData = sessions.map(s => ({
    name: s.topic.split(' ')[0], // Short name
    mastery: Math.round((s.quizScore / (s.totalQuestions || 1)) * 100),
    date: s.timestamp?.toDate ? s.timestamp.toDate().toLocaleDateString() : 'New'
  }));

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 gap-4">
        <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
        <p className="text-slate-400 font-bold italic">Gathering your progress data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-20 h-full overflow-y-auto">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex flex-col gap-4">
          {onBack && (
            <button 
              onClick={goBack}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-all rounded-2xl font-black text-xs w-fit group shadow-sm cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform text-blue-600" />
              <span>Back to AI Study Buddy</span>
            </button>
          )}
          <div>
            <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Your Progress</h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">Analyzing your journey to mastery.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
            <button 
              type="button"
              onClick={() => setShowTestMaker(true)}
              className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-2xl font-black text-sm shadow-xl shadow-blue-100 dark:shadow-none hover:bg-blue-700 transition-all hover:-translate-y-0.5"
            >
                <Brain className="w-4 h-4" /> AI Test Maker
            </button>
            <button 
              type="button"
              onClick={onShowWeaknessDetector}
              className="flex items-center gap-2 bg-rose-600 text-white px-6 py-3 rounded-2xl font-black text-sm shadow-xl shadow-rose-100 dark:shadow-none hover:bg-rose-700 transition-all hover:-translate-y-0.5"
            >
                <Target className="w-4 h-4" /> Weakness 🎯
            </button>
            <button 
              type="button" 
              onClick={handleExportReport}
              className="flex items-center gap-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 px-6 py-3 rounded-2xl font-black text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
            >
                <FileText className="w-4 h-4" /> Export Report
            </button>
        </div>
      </div>
      
      {showTestMaker && (
        <TestMaker 
          topics={Array.from(new Set(sessions.map(s => s.topic)))} 
          onClose={() => setShowTestMaker(false)} 
        />
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <StatCard 
          label="Total Sessions" 
          value={totalSessions.toString()} 
          icon={<BookOpen className="w-6 h-6 text-blue-600" />}
          trend="+12% Core Growth"
        />
        <StatCard 
          label="Avg. Mastery" 
          value={`${avgMastery}%`} 
          icon={<Target className="w-6 h-6 text-emerald-600" />}
          trend="Consistent Logic"
        />
        <StatCard 
          label="Active Pulse" 
          value="3.5h" 
          icon={<Clock className="w-6 h-6 text-amber-600" />}
          trend="High Focus"
        />
        <StatCard 
          label="User Tier" 
          value="Grandmaster" 
          icon={<Award className="w-6 h-6 text-purple-600" />}
          trend="Top 1%"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* Progress Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-[3rem] p-10 border border-slate-100 dark:border-slate-800 shadow-lush relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-[80px] rounded-full pointer-events-none" />
          <div className="flex items-center justify-between mb-10 relative z-10">
            <h3 className="text-3xl font-display font-black text-slate-950 dark:text-white flex items-center gap-4">
              <TrendingUp className="text-blue-600 w-8 h-8" />
              Cognitive Path
            </h3>
            <div className="flex gap-4 items-center bg-slate-50 dark:bg-slate-800 p-2 px-4 rounded-2xl border border-slate-100 dark:border-slate-700">
              <div className="w-3 h-3 bg-blue-600 rounded-full shadow-[0_0_10px_rgba(37,99,235,0.5)]" />
              <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em]">Mastery Sync</span>
            </div>
          </div>
          <div className="h-[350px] w-full relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorMastery" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="8 8" vertical={false} stroke="#e2e8f0" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 11, fontWeight: 900 }}
                  dy={15}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 11, fontWeight: 900 }}
                  dx={-10}
                />
                <Tooltip 
                  cursor={{ stroke: '#2563eb', strokeWidth: 2 }}
                  contentStyle={{ 
                    borderRadius: '24px', 
                    border: 'none', 
                    boxShadow: 'var(--shadow-deep)', 
                    backgroundColor: 'rgba(255,255,255,0.9)',
                    backdropFilter: 'blur(10px)',
                    padding: '16px'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="mastery" 
                  stroke="#2563eb" 
                  strokeWidth={6}
                  fillOpacity={1} 
                  fill="url(#colorMastery)" 
                  animationDuration={2000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Columns: Focus Areas & Test Maker */}
        <div className="space-y-10">
           {/* Cognitive Balance Radar */}
           <div className="bg-slate-950 rounded-[3rem] p-10 text-white shadow-deep relative overflow-hidden group">
             <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-3xl rounded-full" />
             <h3 className="text-3xl font-display font-black mb-6 flex items-center gap-4 relative z-10">
               <Target className="text-indigo-400 w-8 h-8" />
               Cognitive Pulse
             </h3>
             
             <div className="h-[280px] w-full relative z-10">
               {topTopics.length > 2 ? (
                 <ResponsiveContainer width="100%" height="100%">
                   <RadarChart cx="50%" cy="50%" outerRadius="80%" data={topTopics}>
                     <PolarGrid stroke="#1e293b" />
                     <PolarAngleAxis dataKey="topic" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }} />
                     <Radar
                       name="Mastery"
                       dataKey="count"
                       stroke="#6366f1"
                       fill="#6366f1"
                       fillOpacity={0.5}
                     />
                     <Tooltip 
                       contentStyle={{ borderRadius: '16px', border: 'none', backgroundColor: '#0f172a', color: '#fff' }}
                     />
                   </RadarChart>
                 </ResponsiveContainer>
               ) : (
                 <div className="h-full flex flex-col items-center justify-center p-10 text-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-slate-900 flex items-center justify-center border border-slate-800">
                       <Brain className="w-8 h-8 text-slate-700" />
                    </div>
                    <p className="text-slate-500 text-xs font-black uppercase tracking-widest leading-relaxed">
                       Insufficient Neural Data for Radar Synthesis. <br />
                       Complete more sessions.
                    </p>
                 </div>
               )}
             </div>
             
             <div className="mt-6 flex flex-wrap gap-2 relative z-10">
               {topTopics.map((item, i) => (
                 <div key={`dash-topic-${i}-${item.topic}`} className="px-3 py-1 bg-white/5 rounded-lg border border-white/5 text-[9px] font-black uppercase tracking-widest text-slate-400">
                    {item.topic}
                 </div>
               ))}
             </div>
           </div>

           {/* Test Maker Promo */}
           <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-10 border border-slate-100 dark:border-slate-800 shadow-lush group relative overflow-hidden">
              <div className="absolute -right-4 -top-4 w-32 h-32 bg-blue-600/5 blur-3xl rounded-full group-hover:bg-blue-600/10 transition-colors" />
              <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-deep">
                <Sparkles className="w-8 h-8 text-white group-hover:rotate-12 transition-transform duration-700" />
              </div>
              <h3 className="text-2xl font-display font-black mb-3 text-slate-950 dark:text-white leading-tight">Mastery Exam</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-8 leading-relaxed">Synthesize a custom tactical exam based on current cognitive gaps.</p>
              <button 
                type="button" 
                onClick={() => setShowTestMaker(true)}
                className="w-full bg-slate-950 dark:bg-white text-white dark:text-slate-950 py-5 rounded-2xl font-display font-black text-sm uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-soft"
              >
                  Execute Synthesis
              </button>
           </div>
        </div>

      </div>

      {/* History Timeline */}
      <div className="bg-white dark:bg-slate-900 rounded-[3.5rem] p-12 border border-slate-100 dark:border-slate-800 shadow-lush">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
            <h3 className="text-4xl font-display font-black text-slate-950 dark:text-white flex items-center gap-5">
                <Clock className="text-blue-600 w-10 h-10" />
                Intelligence Log
            </h3>
            <div className="px-6 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-full">
               <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.4em]">Chronological Descent</span>
            </div>
        </div>
        
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {sessions.length === 0 ? (
            <div className="col-span-full py-32 text-center bg-slate-50/50 dark:bg-slate-900/50 rounded-[3rem] border border-dashed border-slate-100 dark:border-slate-800">
                <BookOpen className="w-16 h-16 text-slate-200 dark:text-slate-700 mx-auto mb-6" />
                <p className="text-slate-400 dark:text-slate-500 font-display font-black text-xl uppercase tracking-widest">Awaiting Neural Input</p>
            </div>
          ) : (
            [...sessions].reverse().map((session, i) => (
              <motion.button 
                key={session.id ? `session-${session.id}-${i}` : `session-idx-${i}`}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                onClick={() => onSelectSession?.(session)}
                className="w-full flex items-center justify-between p-8 bg-white dark:bg-slate-950 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-600 transition-all group shadow-soft hover:shadow-deep text-left relative overflow-hidden card-shine"
              >
                <div className="flex items-center gap-8 relative z-10">
                   <div className="w-16 h-16 bg-slate-950 dark:bg-slate-800 rounded-2xl flex items-center justify-center shadow-soft border border-slate-900 group-hover:bg-blue-600 group-hover:border-blue-600 transition-all duration-500 relative">
                      <div className="absolute inset-0 bg-blue-600/20 rounded-2xl animate-ping opacity-0 group-hover:opacity-100" />
                      <FileText className="w-7 h-7 text-white group-hover:scale-110 transition-transform relative z-10" />
                   </div>
                   <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-500/80">Active Memory Slot</span>
                      </div>
                      <h4 className="text-2xl font-display font-black text-slate-950 dark:text-white leading-tight group-hover:text-blue-600 transition-colors uppercase tracking-tight truncate">{session.topic}</h4>
                      <div className="flex flex-wrap items-center gap-3 mt-2">
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-[0.2em] px-3 py-1 bg-slate-50 dark:bg-slate-900 shadow-inner rounded-md border border-slate-100 dark:border-slate-800">{session.subject}</span>
                        <div className="h-1 w-1 rounded-full bg-slate-300" />
                        <span className="text-[10px] text-slate-500 font-bold flex items-center gap-1.5">
                           <Clock className="w-3 h-3" />
                           {session.timestamp?.toDate ? session.timestamp.toDate().toLocaleDateString() : 'Active'}
                        </span>
                        {session.durationMinutes && (
                          <>
                            <div className="h-1 w-1 rounded-full bg-slate-300" />
                            <span className="text-[10px] text-slate-500 font-bold">{session.durationMinutes}m Session</span>
                          </>
                        )}
                      </div>
                   </div>
                </div>
                <div className="flex items-center gap-8 relative z-10">
                   <div className="text-right">
                      <div className="text-4xl font-display font-black text-slate-950 dark:text-slate-200 tracking-tighter leading-none">
                        {Math.round((session.quizScore / (session.total_questions_count || session.totalQuestions || 1)) * 100)}%
                      </div>
                      <div className="text-[9px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-[0.3em] mt-1">Mastery</div>
                   </div>
                   <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center border border-slate-100 dark:border-slate-800 group-hover:bg-blue-600 group-hover:text-white transition-all">
                      <ChevronRight className="w-6 h-6 transform group-hover:translate-x-1 transition-transform" />
                   </div>
                </div>
              </motion.button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, icon, trend }: { label: string; value: string; icon: React.ReactNode; trend?: string }) => {
  return (
    <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-100/50 flex flex-col gap-4 relative overflow-hidden group">
      <div className="flex items-center justify-between z-10">
        <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl group-hover:scale-110 transition-transform">{icon}</div>
        <div className="text-[10px] font-black text-emerald-500 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> {trend}
        </div>
      </div>
      <div className="z-10 mt-2">
        <div className="text-3xl font-black text-slate-900 dark:text-white leading-none">{value}</div>
        <div className="font-bold uppercase tracking-widest text-[9px] text-slate-400 dark:text-slate-500 mt-2">{label}</div>
      </div>
      <div className="absolute -right-2 -bottom-2 w-20 h-20 bg-slate-50/50 dark:bg-slate-800/20 rounded-full group-hover:scale-150 transition-transform duration-700" />
    </div>
  );
};

export default Dashboard;
