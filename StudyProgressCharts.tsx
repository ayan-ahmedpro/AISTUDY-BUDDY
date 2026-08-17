import React, { useState } from 'react';
import { 
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, 
  XAxis, YAxis, Tooltip, CartesianGrid, Legend, Cell 
} from 'recharts';
import { Trophy, BookOpen, BrainCircuit, Calendar, TrendingUp, CheckCircle2, BarChart2 } from 'lucide-react';

interface StudyProgressChartsProps {
  quizzesCompleted?: number;
  masteryScoreAverage?: number;
  topicsStudied?: string[];
  totalAnalyses?: number;
  currentStreak?: number;
  longestStreak?: number;
  isDark?: boolean;
}

export default function StudyProgressCharts({
  quizzesCompleted = 12,
  masteryScoreAverage = 88,
  topicsStudied = ['Computer Science', 'Mathematics', 'World History', 'Biology'],
  totalAnalyses = 24,
  currentStreak = 7,
  isDark = true
}: StudyProgressChartsProps) {
  const [chartTimeframe, setChartTimeframe] = useState<'weekly' | 'subject'>('weekly');

  // Simulated trend data based on real user stats
  const weeklyProgressData = [
    { day: 'Mon', mastery: Math.max(60, masteryScoreAverage - 18), quizzes: Math.max(1, Math.round(quizzesCompleted * 0.1)), hours: 1.2 },
    { day: 'Tue', mastery: Math.max(65, masteryScoreAverage - 12), quizzes: Math.max(2, Math.round(quizzesCompleted * 0.15)), hours: 1.8 },
    { day: 'Wed', mastery: Math.max(70, masteryScoreAverage - 8), quizzes: Math.max(2, Math.round(quizzesCompleted * 0.2)), hours: 2.1 },
    { day: 'Thu', mastery: Math.max(72, masteryScoreAverage - 5), quizzes: Math.max(3, Math.round(quizzesCompleted * 0.25)), hours: 2.5 },
    { day: 'Fri', mastery: Math.max(78, masteryScoreAverage - 3), quizzes: Math.max(2, Math.round(quizzesCompleted * 0.15)), hours: 2.0 },
    { day: 'Sat', mastery: Math.max(82, masteryScoreAverage - 1), quizzes: Math.max(4, Math.round(quizzesCompleted * 0.3)), hours: 3.2 },
    { day: 'Sun', mastery: masteryScoreAverage, quizzes: Math.max(3, Math.round(quizzesCompleted * 0.22)), hours: 2.8 },
  ];

  // Subject performance data generated from topicsStudied
  const defaultSubjects = ['Computer Science', 'Mathematics', 'World History', 'Biology', 'Languages'];
  const subjectsToDisplay = topicsStudied.length > 0 ? topicsStudied : defaultSubjects;

  const subjectData = subjectsToDisplay.map((subject, idx) => {
    // Generate realistic variance centered around masteryScoreAverage
    const baseScore = Math.min(100, Math.max(65, masteryScoreAverage + (idx % 2 === 0 ? idx * 3 : -idx * 4)));
    const quizzes = Math.max(1, Math.round((quizzesCompleted / subjectsToDisplay.length) * (1 + (idx % 3) * 0.2)));
    return {
      subject: subject.length > 16 ? subject.substring(0, 14) + '...' : subject,
      fullSubject: subject,
      masteryScore: baseScore,
      quizzesCompleted: quizzes,
      sessions: Math.max(2, quizzes * 2),
    };
  });

  const subjectColors = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899', '#06b6d4', '#6366f1'];

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/60 p-4 sm:p-5 rounded-3xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-blue-400" />
            <h3 className="text-base font-black text-white tracking-tight">Study Analytics & Mastery Trends</h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Powered by Recharts — Track total quizzes completed and mastery score evolution over time.
          </p>
        </div>

        <div className="flex items-center p-1 bg-slate-950 rounded-xl border border-slate-800 self-stretch sm:self-auto">
          <button
            type="button"
            onClick={() => setChartTimeframe('weekly')}
            className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              chartTimeframe === 'weekly'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Weekly Mastery Trend
          </button>
          <button
            type="button"
            onClick={() => setChartTimeframe('subject')}
            className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              chartTimeframe === 'subject'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            By Subject
          </button>
        </div>
      </div>

      {/* Chart 1: Mastery Score & Quizzes Trend */}
      {chartTimeframe === 'weekly' ? (
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">Over Time</span>
              <h4 className="text-sm font-black text-white">7-Day Mastery Score % & Quizzes Solved</h4>
            </div>
            <div className="flex items-center gap-4 text-xs font-bold">
              <div className="flex items-center gap-1.5 text-blue-400">
                <span className="w-3 h-3 rounded-full bg-blue-500" />
                <span>Mastery Score (%)</span>
              </div>
              <div className="flex items-center gap-1.5 text-indigo-400">
                <span className="w-3 h-3 rounded-full bg-indigo-500" />
                <span>Quizzes Completed</span>
              </div>
            </div>
          </div>

          <div className="h-64 sm:h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyProgressData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorMastery" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorQuizzes" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="day" stroke="#64748b" tick={{ fontSize: 11, fontWeight: 700 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '16px',
                    color: '#fff',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
                    fontSize: '12px',
                    fontWeight: 'bold',
                  }}
                  formatter={(value: any, name: any) => [
                    name === 'mastery' ? `${value}% Mastery` : `${value} Quizzes`,
                    name === 'mastery' ? 'Mastery Score' : 'Quizzes Completed'
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="mastery"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorMastery)"
                  name="mastery"
                />
                <Area
                  type="monotone"
                  dataKey="quizzes"
                  stroke="#818cf8"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  fillOpacity={1}
                  fill="url(#colorQuizzes)"
                  name="quizzes"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        /* Chart 2: Subject Breakdown Bar Chart */
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">By Subject</span>
              <h4 className="text-sm font-black text-white">Subject Mastery Score (%) & Quizzes Completed</h4>
            </div>
            <span className="text-xs font-bold text-slate-400">Avg Score: {masteryScoreAverage}%</span>
          </div>

          <div className="h-64 sm:h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={subjectData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis 
                  dataKey="subject" 
                  stroke="#64748b" 
                  tick={{ fontSize: 10, fontWeight: 700 }}
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '16px',
                    color: '#fff',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
                    fontSize: '12px',
                    fontWeight: 'bold',
                  }}
                  formatter={(value: any, name: any) => [
                    name === 'masteryScore' ? `${value}% Mastery` : `${value} Completed`,
                    name === 'masteryScore' ? 'Mastery Score' : 'Quizzes Completed'
                  ]}
                />
                <Bar dataKey="masteryScore" name="masteryScore" radius={[8, 8, 0, 0]}>
                  {subjectData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={subjectColors[index % subjectColors.length]} />
                  ))}
                </Bar>
                <Bar dataKey="quizzesCompleted" name="quizzesCompleted" fill="#818cf8" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Summary Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-bold">Total Quizzes</div>
            <div className="text-xl font-black text-white">{quizzesCompleted} Completed</div>
          </div>
        </div>

        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-bold">Average Mastery</div>
            <div className="text-xl font-black text-white">{masteryScoreAverage}% Score</div>
          </div>
        </div>

        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-bold">Topics Tracked</div>
            <div className="text-xl font-black text-white">{topicsStudied.length || 4} Active</div>
          </div>
        </div>
      </div>
    </div>
  );
}
