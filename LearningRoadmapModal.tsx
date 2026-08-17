import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Map, 
  Award, 
  CheckCircle2, 
  Lock, 
  Sparkles, 
  Download, 
  Copy, 
  Check, 
  Share2, 
  Flame, 
  Brain,
  Target,
  ArrowRight,
  ArrowLeft,
  GraduationCap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigation } from '../context/NavigationContext';

interface LearningRoadmapModalProps {
  isOpen: boolean;
  onClose: () => void;
  topicsStudied: string[];
  quizzesCompleted: number;
  masteryScoreAverage: number;
  currentStreak?: number;
  userName?: string;
}

export const LearningRoadmapModal: React.FC<LearningRoadmapModalProps> = ({
  isOpen,
  onClose,
  topicsStudied = [],
  quizzesCompleted = 0,
  masteryScoreAverage = 85,
  currentStreak = 3,
  userName = 'Scholar'
}) => {
  const { goBack, registerModal } = useNavigation();
  const [copiedMd, setCopiedMd] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const roadmapCardRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      return registerModal('LearningRoadmapModal', onClose);
    }
  }, [isOpen, onClose, registerModal]);

  if (!isOpen) return null;

  // Build default or dynamic roadmap milestones
  const defaultPillars = [
    {
      title: 'Foundational Knowledge & Definitions',
      description: 'Master core terminology, fundamental principles, and essential study materials.',
      skills: ['Vocabulary', 'Key Concepts', 'Core Principles']
    },
    {
      title: 'Applied Problem Solving & Analysis',
      description: 'Practice real-world case studies, scenario questions, and tactical exercises.',
      skills: ['Critical Thinking', 'Case Analysis', 'Problem Solving']
    },
    {
      title: 'Interconnected Mind Mapping & Synthesis',
      description: 'Synthesize cross-topic relationships and build visual cognitive maps.',
      skills: ['Concept Mapping', 'Pattern Recognition', 'Structural Synthesis']
    },
    {
      title: 'High-Yield Self Assessment & Mastery',
      description: 'Complete practice quizzes, spaced repetition flashcards, and weak spot testing.',
      skills: ['Active Recall', 'Spaced Repetition', 'Exam Preparedness']
    },
    {
      title: 'Advanced Capstone & Mastery Certification',
      description: 'Achieve 90%+ target mastery across all subject domains.',
      skills: ['Domain Expertise', 'Teaching Others', 'Capstone Excellence']
    }
  ];

  // Combine user topics with pillars
  const milestones = defaultPillars.map((pillar, idx) => {
    const userTopic = topicsStudied[idx] || null;
    const isCompleted = idx < Math.max(1, Math.min(topicsStudied.length, 4));
    const isInProgress = idx === Math.min(topicsStudied.length, 4);
    const score = isCompleted ? Math.min(100, Math.max(75, masteryScoreAverage + (idx * 2 - 3))) : isInProgress ? 65 : 0;

    return {
      step: idx + 1,
      title: userTopic ? `Topic: ${userTopic}` : pillar.title,
      subtitle: pillar.description,
      skills: pillar.skills,
      status: isCompleted ? 'completed' : isInProgress ? 'in_progress' : 'locked',
      score
    };
  });

  const getRankTitle = (avg: number) => {
    if (avg >= 92) return 'Level 8 • Grandmaster Scholar';
    if (avg >= 85) return 'Level 6 • Master Researcher';
    if (avg >= 75) return 'Level 4 • Tactical Scholar';
    return 'Level 2 • Apprentice Mind';
  };

  const handleCopyMarkdown = () => {
    let md = `# 🗺️ Learning Roadmap & Mastery Certificate\n`;
    md += `**Student:** ${userName}  \n`;
    md += `**Rank:** ${getRankTitle(masteryScoreAverage)}  \n`;
    md += `**Overall Mastery:** ${masteryScoreAverage}% | **Streak:** ${currentStreak} Days 🔥 | **Quizzes:** ${quizzesCompleted}\n\n`;
    md += `## 🎯 Learning Path Milestones\n\n`;

    milestones.forEach(m => {
      const statusIcon = m.status === 'completed' ? '✅ [COMPLETED]' : m.status === 'in_progress' ? '⚡ [IN PROGRESS]' : '🔒 [UPCOMING]';
      md += `### Step ${m.step}: ${m.title} ${statusIcon}\n`;
      md += `${m.subtitle}\n`;
      md += `- **Mastery Score:** ${m.score}%\n`;
      md += `- **Key Competencies:** ${m.skills.join(', ')}\n\n`;
    });

    md += `---\n*Exported from AI Study Buddy Learning Roadmap Visualizer*`;

    navigator.clipboard.writeText(md);
    setCopiedMd(true);
    setTimeout(() => setCopiedMd(false), 3000);
  };

  const handleDownloadRoadmapImage = () => {
    setIsDownloading(true);

    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1200;
      canvas.height = 1400;
      const ctx = canvas.getContext('2d');

      if (!ctx) return;

      // Dark Gradient Background
      const bgGrad = ctx.createLinearGradient(0, 0, 1200, 1400);
      bgGrad.addColorStop(0, '#0f172a'); // slate-900
      bgGrad.addColorStop(1, '#020617'); // slate-950
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, 1200, 1400);

      // Card Header Banner
      ctx.fillStyle = '#4f46e5';
      ctx.beginPath();
      ctx.roundRect(50, 50, 1100, 180, 24);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 36px sans-serif';
      ctx.fillText(`${userName}'s Learning Roadmap`, 90, 115);

      ctx.fillStyle = '#c7d2fe';
      ctx.font = '20px sans-serif';
      ctx.fillText(`Rank: ${getRankTitle(masteryScoreAverage)}  •  Mastery Score: ${masteryScoreAverage}%  •  Streak: ${currentStreak} Days 🔥`, 90, 165);

      // Render Milestones
      let startY = 280;
      milestones.forEach((m) => {
        // Box background
        ctx.fillStyle = m.status === 'completed' ? '#1e293b' : m.status === 'in_progress' ? '#1e1b4b' : '#0f172a';
        ctx.strokeStyle = m.status === 'completed' ? '#334155' : m.status === 'in_progress' ? '#6366f1' : '#1e293b';
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.roundRect(80, startY, 1040, 170, 20);
        ctx.fill();
        ctx.stroke();

        // Step Badge
        ctx.fillStyle = m.status === 'completed' ? '#10b981' : m.status === 'in_progress' ? '#6366f1' : '#64748b';
        ctx.font = 'bold 18px sans-serif';
        ctx.fillText(`STEP 0${m.step} • ${m.status.toUpperCase()}`, 120, startY + 45);

        // Title
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 24px sans-serif';
        ctx.fillText(m.title, 120, startY + 85);

        // Subtitle
        ctx.fillStyle = '#94a3b8';
        ctx.font = '16px sans-serif';
        ctx.fillText(m.subtitle, 120, startY + 120);

        // Score Badge on the right
        if (m.score > 0) {
          ctx.fillStyle = '#38bdf8';
          ctx.font = 'bold 28px sans-serif';
          ctx.fillText(`${m.score}%`, 1000, startY + 90);
        }

        startY += 200;
      });

      // Footer
      ctx.fillStyle = '#64748b';
      ctx.font = '16px sans-serif';
      ctx.fillText('Generated by AI Study Buddy • https://ai.studio', 80, 1340);

      const dataUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `Learning-Roadmap-${userName.replace(/\s+/g, '-')}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (e) {
      console.error('Failed to render roadmap image:', e);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] bg-slate-950/80 backdrop-blur-md overflow-y-auto p-4 md:p-8 flex justify-center items-center">
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="bg-slate-900 border border-slate-800 text-slate-100 w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden my-auto relative flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="bg-slate-950 p-6 md:p-8 border-b border-slate-800 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <Map className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-black text-white">Interactive Learning Roadmap</h3>
                  <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold text-[10px] uppercase tracking-wider">
                    Visual Progress Card
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Track completed subject milestones, mastery rings, and generate shareable certificates
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={goBack}
                className="px-3.5 py-2 rounded-xl bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer group"
                title="Return to AI Study Buddy Home"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform text-indigo-400" />
                <GraduationCap className="w-4 h-4 text-indigo-400 hidden sm:inline" />
                <span>Back to AI Study Buddy</span>
              </button>

              <button
                onClick={onClose}
                className="p-2.5 text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl transition-all cursor-pointer"
                title="Close Roadmap"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Scrollable Content Body */}
          <div className="p-6 md:p-8 overflow-y-auto space-y-8" ref={roadmapCardRef}>
            {/* Top Stats Overview Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-950/80 border border-slate-800/80 p-4 rounded-2xl space-y-1">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Mastery Index</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-emerald-400">{masteryScoreAverage}%</span>
                  <span className="text-[10px] text-emerald-500 font-bold">Target 90%+</span>
                </div>
              </div>

              <div className="bg-slate-950/80 border border-slate-800/80 p-4 rounded-2xl space-y-1">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Topics Mastered</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-indigo-400">{topicsStudied.length || 3}</span>
                  <span className="text-[10px] text-slate-500 font-bold">Modules</span>
                </div>
              </div>

              <div className="bg-slate-950/80 border border-slate-800/80 p-4 rounded-2xl space-y-1">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Quizzes Passed</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-amber-400">{quizzesCompleted}</span>
                  <span className="text-[10px] text-amber-500 font-bold">Assessments</span>
                </div>
              </div>

              <div className="bg-slate-950/80 border border-slate-800/80 p-4 rounded-2xl space-y-1">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Active Streak</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-orange-400">{currentStreak} Days</span>
                  <Flame className="w-4 h-4 text-orange-500 fill-orange-500/30" />
                </div>
              </div>
            </div>

            {/* Rank Banner */}
            <div className="bg-gradient-to-r from-indigo-900/40 via-purple-900/30 to-slate-900 border border-indigo-500/30 rounded-3xl p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-black">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-white">{getRankTitle(masteryScoreAverage)}</h4>
                  <p className="text-xs text-indigo-200">Keep completing quizzes and review sessions to unlock Level 9</p>
                </div>
              </div>
            </div>

            {/* Step-by-Step Roadmap Path */}
            <div className="space-y-4">
              <h4 className="text-sm font-black uppercase tracking-wider text-slate-400">
                Sequential Learning Path
              </h4>

              <div className="relative border-l-2 border-indigo-500/30 ml-4 pl-6 space-y-8">
                {milestones.map((m) => (
                  <div key={`ms-${m.step}`} className="relative group">
                    {/* Circle Node Icon on Line */}
                    <div className={`absolute -left-[35px] top-1.5 w-7 h-7 rounded-full flex items-center justify-center font-black text-xs border-2 transition-all ${
                      m.status === 'completed'
                        ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/30'
                        : m.status === 'in_progress'
                        ? 'bg-indigo-600 text-white border-indigo-400 animate-pulse'
                        : 'bg-slate-900 text-slate-500 border-slate-700'
                    }`}>
                      {m.status === 'completed' ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : m.status === 'locked' ? (
                        <Lock className="w-3.5 h-3.5" />
                      ) : (
                        <span>{m.step}</span>
                      )}
                    </div>

                    {/* Milestone Card */}
                    <div className={`p-5 rounded-2xl border transition-all ${
                      m.status === 'completed'
                        ? 'bg-slate-950/80 border-slate-800'
                        : m.status === 'in_progress'
                        ? 'bg-indigo-950/30 border-indigo-500/50 shadow-lg shadow-indigo-500/10'
                        : 'bg-slate-950/40 border-slate-800/50 opacity-60'
                    }`}>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">
                            Milestone 0{m.step}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            m.status === 'completed'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : m.status === 'in_progress'
                              ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                              : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}>
                            {m.status === 'completed' ? 'Completed 🏆' : m.status === 'in_progress' ? 'In Progress ⚡' : 'Upcoming 🔒'}
                          </span>
                        </div>

                        {m.score > 0 && (
                          <div className="text-xs font-black text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-xl">
                            {m.score}% Mastery
                          </div>
                        )}
                      </div>

                      <h5 className="text-base font-black text-white mb-1">{m.title}</h5>
                      <p className="text-xs text-slate-400 leading-relaxed mb-3">{m.subtitle}</p>

                      <div className="flex flex-wrap gap-1.5">
                        {m.skills.map((skill, sIdx) => (
                          <span
                            key={`sk-${m.step}-${sIdx}`}
                            className="text-[10px] font-semibold bg-slate-900 border border-slate-800 text-slate-300 px-2.5 py-1 rounded-lg"
                          >
                            #{skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="bg-slate-950 p-5 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={goBack}
                className="w-full sm:w-auto px-4 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-200 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer group"
              >
                <ArrowLeft className="w-4 h-4 text-indigo-400 group-hover:-translate-x-1 transition-transform" />
                <span>Back to AI Study Buddy</span>
              </button>

              <button
                onClick={handleCopyMarkdown}
                className="w-full sm:w-auto px-4 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-200 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {copiedMd ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
                <span>{copiedMd ? 'Markdown Copied!' : 'Copy Markdown'}</span>
              </button>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={handleDownloadRoadmapImage}
                disabled={isDownloading}
                className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>{isDownloading ? 'Generating Image...' : 'Download Roadmap PNG'}</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
