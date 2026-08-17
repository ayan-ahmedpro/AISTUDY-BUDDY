import React, { useState } from 'react';
import { 
  BookOpen, 
  Plus, 
  Search, 
  Layers, 
  Clock, 
  Trash2, 
  Sparkles, 
  Video, 
  Upload, 
  Globe, 
  FileText, 
  ArrowRight,
  ArrowLeft,
  GraduationCap,
  CheckCircle2,
  Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Notebook, NotebookSource } from '../types';
import { extractTextFromFile } from '../lib/textExtractor';
import notebookBg from '../assets/images/notebook_study_bg_1785298807343.jpg';

interface NotebooksHomeProps {
  notebooks: Notebook[];
  onOpenNotebook: (notebook: Notebook) => void;
  onCreateNotebook: (title: string, subject: string, age: number, initialSources: NotebookSource[]) => void;
  onDeleteNotebook: (notebookId: string) => void;
  onOpenUniversityTracker?: () => void;
}

export const NotebooksHome: React.FC<NotebooksHomeProps> = ({
  notebooks,
  onOpenNotebook,
  onCreateNotebook,
  onDeleteNotebook,
  onOpenUniversityTracker
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [age, setAge] = useState<number>(18);
  const [pastedText, setPastedText] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  const categories = ['All', 'Science', 'Mathematics', 'Computer Science', 'History', 'General'];

  const filteredNotebooks = notebooks.filter(nb => {
    const matchesSearch = nb.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          nb.subject.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || 
                            nb.subject.toLowerCase().includes(selectedCategory.toLowerCase());
    return matchesSearch && matchesCategory;
  });

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsCreating(true);
    try {
      const initialSources: NotebookSource[] = [];

      // Process uploaded files
      for (const file of files) {
        const text = await extractTextFromFile(file);

        const convertToBase64 = (f: File): Promise<string> => {
          return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve((reader.result as string).split(',')[1]);
            reader.onerror = reject;
            reader.readAsDataURL(f);
          });
        };

        const base64Data = await convertToBase64(file);

        initialSources.push({
          id: `source-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          name: file.name,
          type: 'file',
          extractedText: text,
          mimeType: file.type || 'application/octet-stream',
          base64Data,
          addedAt: new Date().toISOString(),
          isActive: true
        });
      }

      // Process pasted text if provided
      if (pastedText.trim()) {
        initialSources.push({
          id: `source-${Date.now()}-txt`,
          name: 'Initial Prompt & Notes',
          type: 'pasted_text',
          extractedText: pastedText.trim(),
          addedAt: new Date().toISOString(),
          isActive: true
        });
      }

      // Process video URL if provided
      if (videoUrl.trim()) {
        initialSources.push({
          id: `source-${Date.now()}-vid`,
          name: `Video Reference: ${videoUrl.slice(0, 30)}`,
          type: 'video_ref',
          url: videoUrl.trim(),
          extractedText: `Reference Video/Web Link: ${videoUrl.trim()}\nNotes: Synthetic grounded material from user input.`,
          addedAt: new Date().toISOString(),
          isActive: true
        });
      }

      onCreateNotebook(title.trim(), subject.trim() || 'General Study', age, initialSources);

      // Reset
      setTitle('');
      setSubject('');
      setPastedText('');
      setVideoUrl('');
      setFiles([]);
      setShowCreateModal(false);
    } catch (err) {
      console.error('Error creating notebook:', err);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-2 md:px-4 py-4 md:py-8 h-full overflow-y-auto">
      {/* Hero Banner with Generated Background Image */}
      <div className="relative rounded-[3rem] overflow-hidden border border-slate-800/80 shadow-2xl bg-slate-950 min-h-[260px] md:min-h-[300px] flex flex-col justify-between p-6 md:p-10">
        {/* Background Image Layer with Overlay */}
        <div className="absolute inset-0 z-0">
          <img 
            src={notebookBg} 
            alt="AI Study Buddy interactive notebook workspace ambient background banner" 
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-center opacity-40 mix-blend-luminosity filter brightness-110 contrast-125"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/90 to-indigo-950/60" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
          {/* Subtle Ambient Radial Lighting */}
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-10 w-72 h-72 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
        </div>

        {/* Foreground Content */}
        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3.5 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 rounded-full font-black text-[10px] uppercase tracking-widest backdrop-blur-md flex items-center gap-1.5 shadow-sm">
                <Sparkles className="w-3 h-3 text-indigo-400 animate-pulse" />
                Grounded Knowledge Hub
              </span>
              <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 rounded-full font-black text-[10px] uppercase tracking-widest backdrop-blur-md flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                100% Citation Backed
              </span>
            </div>

            <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white leading-tight">
              Study Buddy <span className="bg-gradient-to-r from-indigo-300 via-blue-200 to-sky-300 bg-clip-text text-transparent">Notebooks</span>
            </h1>
            <p className="text-xs md:text-sm text-slate-300 font-medium leading-relaxed max-w-xl">
              Synthesize documents, lecture notes, textbook scans, and custom study materials into AI-grounded interactive workspaces with age-adaptive tutoring.
            </p>
          </div>

          {/* Action Buttons Header */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {onOpenUniversityTracker && (
              <button
                onClick={onOpenUniversityTracker}
                className="px-5 py-3.5 bg-slate-900/80 hover:bg-slate-800 text-white rounded-2xl font-black text-xs uppercase tracking-wider flex items-center transition-all border border-slate-700/80 shadow-lg active:scale-95 cursor-pointer backdrop-blur-md group"
              >
                <span>University Tracker</span>
              </button>
            )}

            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3.5 bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-500 hover:from-indigo-500 hover:to-blue-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 transition-all shadow-xl shadow-indigo-600/30 active:scale-95 cursor-pointer border border-indigo-400/30 group"
            >
              <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
              <span>Create Notebook</span>
            </button>
          </div>
        </div>
      </div>

      {/* Search and Category Filter Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 p-4 rounded-3xl shadow-lg backdrop-blur-xl">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
          <input
            type="text"
            placeholder="Search notebooks by title, subject, or keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        {/* Categories Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1 hidden sm:block" />
          {categories.map((cat, catIdx) => (
            <button
              key={`cat-${cat}-${catIdx}`}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Notebook Grid */}
      {filteredNotebooks.length === 0 ? (
        <div className="text-center py-16 px-4 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[3rem] bg-white/50 dark:bg-slate-900/40">
          <BookOpen className="w-12 h-12 text-indigo-500/60 dark:text-indigo-400/40 mx-auto mb-3" />
          <h3 className="text-lg font-black text-slate-900 dark:text-white">No Notebooks Found</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto mb-6 font-medium">
            Create your first multi-source notebook by uploading PDFs, pasting text, or adding reference links.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest cursor-pointer shadow-lg"
          >
            + Create First Notebook
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNotebooks.map((nb, nbIdx) => (
            <motion.div
              key={nb.id ? `nb-${nb.id}-${nbIdx}` : `nb-idx-${nbIdx}`}
              whileHover={{ y: -6 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500/60 pl-8 pr-6 py-6 rounded-[2.5rem] shadow-md hover:shadow-xl flex flex-col justify-between space-y-5 transition-all group relative overflow-hidden"
            >
              {/* Subtle accent bar on hover */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity" />

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800 px-3 py-1 rounded-xl">
                    {nb.subject || 'General'}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteNotebook(nb.id);
                    }}
                    className="text-slate-400 hover:text-rose-500 transition-colors p-1.5 rounded-lg hover:bg-rose-500/10 cursor-pointer"
                    title="Delete Notebook"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <h3 className="text-xl font-black text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-snug">
                  {nb.title}
                </h3>

                {/* Sub-documents inside Notebook */}
                {nb.sources && nb.sources.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Documents Inside:</p>
                    <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
                      {nb.sources.slice(0, 3).map((src, sIdx) => (
                        <div key={`nb-src-${sIdx}-${src.id}`} className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 px-2.5 py-1 rounded-lg border border-slate-200/60 dark:border-slate-700/60 truncate">
                          <FileText className="w-3 h-3 text-indigo-500 shrink-0" />
                          <span className="truncate font-semibold">{src.name}</span>
                        </div>
                      ))}
                      {nb.sources.length > 3 && (
                        <p className="text-[10px] text-indigo-500 font-bold pl-1">+ {nb.sources.length - 3} more sub-documents</p>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 font-medium pt-1">
                  <span className="flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-indigo-500" />
                    {nb.sources?.length || 0} Documents
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-blue-500" />
                    Age {nb.age || 18}
                  </span>
                </div>
              </div>

              <button
                onClick={() => onOpenNotebook(nb)}
                className="w-full py-3.5 bg-slate-100 dark:bg-slate-800/80 group-hover:bg-gradient-to-r group-hover:from-indigo-600 group-hover:to-blue-600 text-slate-800 dark:text-slate-200 group-hover:text-white rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm group-hover:shadow-md"
              >
                <span>Open Workspace</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create Notebook Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-[120] bg-slate-950/80 backdrop-blur-md overflow-y-auto p-4 md:p-8 flex justify-center items-start">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden my-auto p-6 md:p-8 relative"
            >
              <div className="flex items-center justify-between pb-6 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white">New Study Notebook</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Combine text, files, and reference notes</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-2xl font-black text-xs flex items-center gap-2 transition-all cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
              </div>

              <form onSubmit={handleCreateSubmit} className="space-y-4 mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Notebook Title *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Physics Chapter 5 - Electromagnetism"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Subject</label>
                    <input
                      type="text"
                      placeholder="e.g. Physics / Mathematics / History"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Student Age Preference (Tutor Tone)</label>
                  <div className="flex gap-2 p-1 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => setAge(10)}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        age < 12 ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      Child (10)
                    </button>
                    <button
                      type="button"
                      onClick={() => setAge(16)}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        age >= 12 && age <= 17 ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      Teen (16)
                    </button>
                    <button
                      type="button"
                      onClick={() => setAge(21)}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        age >= 18 ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      Adult (21)
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Upload Study Material (PDF, Images, DOCX, TXT)</label>
                  <input
                    type="file"
                    multiple
                    onChange={(e) => setFiles(Array.from(e.target.files || []))}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs text-slate-700 dark:text-slate-300"
                    accept=".pdf,.docx,.txt,.md,.png,.jpg,.webp"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Custom Notes / Initial Instructions</label>
                  <textarea
                    rows={3}
                    placeholder="Write initial notes, prompts, or key questions to ground the AI..."
                    value={pastedText}
                    onChange={(e) => setPastedText(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isCreating || !title.trim()}
                  className="w-full py-4 bg-gradient-to-r from-indigo-600 to-blue-600 disabled:opacity-50 hover:from-indigo-500 hover:to-blue-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg cursor-pointer"
                >
                  {isCreating ? 'Synthesizing Notebook...' : 'Create Notebook Workspace'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotebooksHome;
