import React from 'react';
import { motion } from 'motion/react';
import { 
  Map, 
  Zap, 
  Target, 
  ArrowRight,
  ArrowUpRight,
  Lightbulb
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';

interface NotebookInfographicProps {
  data: {
    topics: string[];
    summary: string[];
    chapters: any[];
    subject: string;
    schedule: { time: string; activity: string }[];
  };
  onDeepAnalysis?: () => void;
}

export default function NotebookInfographic({ data, onDeepAnalysis }: NotebookInfographicProps) {
  // Chart data for "topic weight" or similar
  const chartData = (data.topics || []).map((t, i) => ({
    name: t.substring(0, 10),
    weight: 100 - (i * 15),
    fullName: t
  }));

  const COLORS = ['#3B82F6', '#6366F1', '#8B5CF6', '#EC4899', '#F43F5E'];

  return (
    <div className="space-y-12">
      {/* Visual Blueprint Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Core Concept Hub */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-[3.5rem] p-10 shadow-2xl border border-slate-100 dark:border-slate-800 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/5 blur-[100px] -mr-40 -mt-40" />
          
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl">
                <Map className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Knowledge Map</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">NotebookLLM Infographic Mode</p>
              </div>
            </div>
            <div className="px-6 py-2 bg-slate-50 dark:bg-slate-800 rounded-full border border-slate-100 dark:border-slate-700 hidden sm:flex items-center gap-2">
               <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
               <span className="text-[10px] font-black uppercase text-slate-500">Optimizing View</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.5} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94A3B8', fontWeight: 700 }} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                      cursor={{ fill: '#F1F5F9', radius: 10 }}
                    />
                    <Bar dataKey="weight" radius={[6, 6, 0, 0]} barSize={24}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-[2rem] border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3 mb-2 text-indigo-600">
                  <Lightbulb className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Synthesis</span>
                </div>
                <p className="text-xs font-bold text-slate-600 dark:text-slate-400 leading-relaxed italic">
                  "Most topics revolve around {data.topics?.[0]}. Strengthening this core is vital."
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {(data.topics || []).slice(0, 4).map((topic, i) => (
                <motion.div 
                  key={`info-top-${i}-${topic}`}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="p-5 bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-lg hover:border-indigo-300 dark:hover:border-indigo-500 transition-all group/item"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center font-black text-slate-400 group-hover/item:bg-indigo-600 group-hover/item:text-white transition-all">
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-black text-slate-900 dark:text-white text-sm group-hover/item:text-indigo-600 transition-colors uppercase tracking-tight">{topic}</h4>
                        <span className="text-[10px] font-black text-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded-md">
                          Weight: {100 - i * 15}%
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${100 - i * 15}%` }}
                            transition={{ duration: 1, delay: 0.5 + i * 0.1 }}
                            className="h-full bg-gradient-to-r from-indigo-500 to-blue-400 shadow-[0_0_8px_rgba(99,102,241,0.4)]" 
                          />
                        </div>
                        {/* Mini Sparkline Simulation */}
                        <div className="flex items-end gap-0.5 h-3">
                          {[0.4, 0.7, 0.5, 0.9, 0.6].map((h, idx) => (
                            <motion.div
                              key={`sparkline-${idx}`}
                              initial={{ height: 0 }}
                              animate={{ height: `${h * 100}%` }}
                              transition={{ repeat: Infinity, duration: 1.5, repeatType: 'reverse', delay: idx * 0.2 }}
                              className="w-1 bg-indigo-300 dark:bg-indigo-700 rounded-t-sm"
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover/item:text-indigo-500 transition-colors" />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Action Center Card */}
        <div className="space-y-8 flex flex-col">
          <div className="flex-1 bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-indigo-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-700" />
            
            <div className="flex items-center gap-3 mb-8">
               <div className="p-3 bg-white/10 rounded-2xl border border-white/5">
                 <Target className="w-5 h-5 text-indigo-400" />
               </div>
               <h4 className="text-xl font-black">Success Loop</h4>
            </div>

            <div className="space-y-8 relative z-10">
              {(data.schedule || []).slice(0, 3).map((step, i) => (
                <div key={`info-step-${i}-${step.time}`} className="flex gap-4 group/step">
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 rounded-full bg-indigo-500 ring-4 ring-slate-900" />
                    {i < 2 && <div className="h-10 w-[2px] bg-slate-800" />}
                  </div>
                  <div>
                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{step.time}</div>
                    <div className="font-bold text-slate-200 group-hover/step:text-white transition-colors">{step.activity}</div>
                  </div>
                </div>
              ))}
            </div>

            <motion.div 
               onClick={onDeepAnalysis}
               whileHover={{ scale: 1.02 }}
               whileTap={{ scale: 0.98 }}
               className="mt-12 p-8 bg-indigo-600 rounded-[2.5rem] shadow-deep shadow-indigo-500/20 flex flex-col gap-6 group/link cursor-pointer relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl rounded-full translate-x-10 -translate-y-10 group-hover:scale-150 transition-transform duration-700" />
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
                    <Zap className="w-6 h-6 text-white animate-pulse" />
                  </div>
                  <div>
                    <span className="text-xs font-black uppercase tracking-[hash] text-indigo-100">Analytical Protocol</span>
                    <h5 className="text-xl font-black text-white">Deeper Concept Scan</h5>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center group-hover:bg-white group-hover:text-indigo-600 transition-all">
                  <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
              
              <div className="relative z-10 flex items-center gap-2 px-4 py-2 bg-black/20 rounded-xl border border-white/5">
                <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-200">Neural Syncing for cross-domain insights</span>
              </div>
            </motion.div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-xl overflow-hidden relative">
            <h4 className="text-xl font-black text-slate-900 dark:text-white mb-6 flex items-center gap-3">
              <Zap className="text-amber-500 w-5 h-5 fill-amber-500" /> Flash Analysis
            </h4>
            <div className="space-y-4">
               <div className="p-4 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl border border-emerald-100 dark:border-emerald-900/40">
                 <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300">Retention probability is high for this session based on concept clusters.</p>
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* Structured Chapters BENTO Grid */}
      <h3 className="text-3xl font-black text-slate-900 dark:text-white px-6">Curriculum Blueprint</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {(data.chapters || []).slice(0, 6).map((chapter, i) => (
          <motion.div 
            key={`info-chap-${i}-${chapter.title}`}
            whileHover={{ y: -8 }}
            className="bg-white dark:bg-slate-900 rounded-[3rem] p-10 border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/50 hover:shadow-2xl transition-all group"
          >
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center font-black text-slate-400 text-lg group-hover:bg-indigo-600 group-hover:text-white transition-all">
                {i + 1}
              </div>
              <div>
                 <h4 className="text-xl font-black text-slate-900 dark:text-white leading-tight group-hover:text-indigo-600 transition-colors uppercase tracking-tighter">{chapter.title}</h4>
                 <div className="h-1 w-12 bg-indigo-500 rounded-full mt-1" />
              </div>
            </div>
            
            <div className="space-y-6">
              {chapter.topics?.slice(0, 2).map((topic: any, j: number) => (
                <div key={`info-chap-${i}-top-${j}-${topic.title}`} className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-transparent hover:border-slate-200 transition-all">
                  <h5 className="font-black text-slate-800 dark:text-slate-200 text-sm mb-2">{topic.title}</h5>
                  <p className="text-xs text-slate-500 leading-relaxed line-clamp-2 italic">{topic.explanation}</p>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
