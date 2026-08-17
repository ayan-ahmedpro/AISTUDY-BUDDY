import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Brain, 
  Sparkles, 
  Crown, 
  Cpu, 
  Palette, 
  TrendingUp, 
  Mail, 
  CheckCircle2, 
  Users, 
  Globe, 
  Award,
  Zap,
  Code2
} from 'lucide-react';
import { TEAM_MEMBERS, TeamMember } from '../data/teamData';

export type { TeamMember };
export { TEAM_MEMBERS };

interface MeetTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MeetTeamModal({ isOpen, onClose }: MeetTeamModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div 
        id="meet-team-modal"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-5xl my-8 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Modal Header */}
          <div className="p-6 sm:p-8 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/70 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-[10px] font-black uppercase tracking-wider border border-blue-200 dark:border-blue-800">
                    Core Leadership
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-display font-black text-slate-950 dark:text-white tracking-tight">
                  Meet Our Team
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
                  The builders, engineers, and visionaries shaping the future of AI study assistance
                </p>
              </div>
            </div>

            <button
              id="close-meet-team-btn"
              onClick={onClose}
              className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors cursor-pointer"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Body: Team Grid */}
          <div className="p-6 sm:p-8 overflow-y-auto space-y-8">
            
            {/* Overview Banner */}
            <div className="p-5 sm:p-6 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h3 className="font-display font-black text-slate-900 dark:text-white text-base flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-600" /> Dedicated To Student Academic Success
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 font-medium max-w-2xl leading-relaxed">
                  Our team combines deep expertise in artificial intelligence, cognitive learning models, user experience design, and global education outreach to build tools that genuinely improve learning outcomes.
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-black text-slate-900 dark:text-white">AI Study Buddy Team</div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase">50,000+ Students Helped</div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-sm shadow-md">
                  <Brain className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Team Members Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {TEAM_MEMBERS.map((member) => (
                <div
                  key={member.id}
                  id={`team-member-card-${member.id}`}
                  className="p-6 rounded-3xl bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 hover:border-blue-500/60 transition-all duration-300 flex flex-col justify-between space-y-5 shadow-sm hover:shadow-md"
                >
                  <div className="space-y-4">
                    {/* Avatar & Header */}
                    <div className="flex items-start gap-4">
                      {/* Photo or Clean Avatar Badge */}
                      <div className="relative shrink-0">
                        {member.hasPhoto && member.photoUrl ? (
                          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border-2 border-white dark:border-slate-800 shadow-md">
                            <img 
                              src={member.photoUrl} 
                              alt={`${member.name} – ${member.role} at AI Study Buddy`}
                              loading="lazy"
                              decoding="async"
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover object-center transform hover:scale-105 transition-transform duration-300" 
                            />
                          </div>
                        ) : (
                          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-950 dark:from-slate-800 dark:to-slate-900 border-2 border-slate-300 dark:border-slate-700 shadow-md flex flex-col items-center justify-center text-white p-2">
                            <member.icon className="w-8 h-8 text-blue-400 mb-1" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">
                              {member.name.split(' ')[0]}
                            </span>
                          </div>
                        )}
                        <div className="absolute -bottom-2 -right-2 p-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm">
                          <member.icon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        </div>
                      </div>

                      {/* Name & Role */}
                      <div className="space-y-1">
                        <span className={`inline-block px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border ${member.badgeBg}`}>
                          {member.titleBadge}
                        </span>
                        <h4 className="text-xl font-display font-black text-slate-950 dark:text-white tracking-tight">
                          {member.name}
                        </h4>
                        <p className="text-xs font-bold text-blue-600 dark:text-blue-400">
                          {member.role}
                        </p>
                      </div>
                    </div>

                    {/* Bio */}
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                      {member.bio}
                    </p>

                    {/* Responsibilities */}
                    <div className="space-y-1.5 pt-1">
                      <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                        Focus Areas &amp; Deliverables:
                      </div>
                      <ul className="space-y-1">
                        {member.responsibilities.map((resp, idx) => (
                          <li key={`resp-${member.id}-${idx}`} className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            <span>{resp}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-wrap gap-1.5">
                    {member.tags.map((tag, tIdx) => (
                      <span 
                        key={`tag-${member.id}-${tIdx}`}
                        className="px-2 py-0.5 rounded-md bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom Contact / Join Note */}
            <div className="p-6 rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-center space-y-2">
              <h4 className="font-display font-black text-slate-900 dark:text-white text-sm">
                Have questions or interested in academic collaboration?
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium max-w-xl mx-auto">
                Reach out to our leadership and engineering team directly at{' '}
                <a href="mailto:ayaicrypcoin@gmail.com" className="text-blue-600 dark:text-blue-400 font-bold hover:underline">
                  ayaicrypcoin@gmail.com
                </a>
              </p>
            </div>

          </div>

          {/* Modal Footer */}
          <div className="p-4 sm:p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex items-center justify-between">
            <div className="text-[11px] font-bold text-slate-500">
              AI Study Buddy Pro • Team &amp; Leadership Directory
            </div>
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md"
            >
              Back to Studying
            </button>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
