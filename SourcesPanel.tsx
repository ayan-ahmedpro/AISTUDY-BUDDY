import React, { useState } from 'react';
import { 
  FileText, 
  Link as LinkIcon, 
  Youtube, 
  Plus, 
  Check, 
  Trash2, 
  X, 
  Video, 
  Sparkles, 
  Layers, 
  Info, 
  Upload,
  Globe,
  CheckSquare,
  Square,
  Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { NotebookSource } from '../types';
import { extractTextFromFile } from '../lib/textExtractor';

interface SourcesPanelProps {
  sources: NotebookSource[];
  onToggleSource: (sourceId: string) => void;
  onAddSource: (newSource: NotebookSource) => void;
  onDeleteSource: (sourceId: string) => void;
  onViewSourceExcerpt: (source: NotebookSource) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const SourcesPanel: React.FC<SourcesPanelProps> = ({
  sources,
  onToggleSource,
  onAddSource,
  onDeleteSource,
  onViewSourceExcerpt,
  isOpen,
  onClose,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'file' | 'text' | 'url' | 'video'>('file');
  
  // Form states
  const [isProcessing, setIsProcessing] = useState(false);
  const [pastedTitle, setPastedTitle] = useState('');
  const [pastedContent, setPastedContent] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [urlTitle, setUrlTitle] = useState('');
  const [videoRefUrl, setVideoRefUrl] = useState('');
  const [videoNotes, setVideoNotes] = useState('');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsProcessing(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const extractedText = await extractTextFromFile(file);

        // Convert base64 for vision/video models
        const convertToBase64 = (file: File): Promise<string> => {
          return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve((reader.result as string).split(',')[1]);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
        };

        const base64Data = await convertToBase64(file);

        const newSource: NotebookSource = {
          id: `source-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          name: file.name,
          type: 'file',
          extractedText: extractedText || `Content from ${file.name}`,
          mimeType: file.type || 'application/octet-stream',
          base64Data,
          addedAt: new Date().toISOString(),
          isActive: true
        };

        onAddSource(newSource);
      }
      setShowAddModal(false);
    } catch (err) {
      console.error('Error adding file source:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddTextSource = () => {
    if (!pastedContent.trim()) return;
    const newSource: NotebookSource = {
      id: `source-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      name: pastedTitle.trim() || 'Pasted Notes',
      type: 'pasted_text',
      extractedText: pastedContent.trim(),
      addedAt: new Date().toISOString(),
      isActive: true
    };
    onAddSource(newSource);
    setPastedTitle('');
    setPastedContent('');
    setShowAddModal(false);
  };

  const handleAddUrlSource = () => {
    if (!urlInput.trim()) return;
    const isYoutube = urlInput.includes('youtube.com') || urlInput.includes('youtu.be');
    const name = urlTitle.trim() || (isYoutube ? 'YouTube Video Reference' : 'Web Article Reference');

    const newSource: NotebookSource = {
      id: `source-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      name,
      type: isYoutube ? 'youtube' : 'url',
      url: urlInput.trim(),
      extractedText: `Reference URL: ${urlInput.trim()}\nTitle: ${name}\nSummary: Web grounded content linked for study grounding.`,
      addedAt: new Date().toISOString(),
      isActive: true
    };
    onAddSource(newSource);
    setUrlInput('');
    setUrlTitle('');
    setShowAddModal(false);
  };

  const handleAddVideoRefSource = () => {
    if (!videoRefUrl.trim() && !videoNotes.trim()) return;
    const newSource: NotebookSource = {
      id: `source-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      name: `Video / Visual Ref: ${videoRefUrl.slice(0, 30) || 'Custom Note'}`,
      type: 'video_ref',
      url: videoRefUrl.trim(),
      notes: videoNotes.trim(),
      extractedText: `Video Reference URL: ${videoRefUrl.trim()}\nStudent Custom Focus Notes: ${videoNotes.trim()}`,
      addedAt: new Date().toISOString(),
      isActive: true
    };
    onAddSource(newSource);
    setVideoRefUrl('');
    setVideoNotes('');
    setShowAddModal(false);
  };

  return (
    <>
      {/* Sliding Drawer or Modal */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[110] bg-slate-950/60 backdrop-blur-sm overflow-y-auto p-4 md:p-8 flex justify-end items-start">
            <motion.div
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col my-auto max-h-[88vh]"
            >
              {/* Header */}
              <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-500/20 text-indigo-400 rounded-xl flex items-center justify-center border border-indigo-500/30">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black tracking-tight text-white">Notebook Sources</h3>
                    <p className="text-xs text-slate-400">{sources.filter(s => s.isActive).length} of {sources.length} active in AI context</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800 rounded-xl transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Source List */}
              <div className="flex-1 overflow-y-auto p-6 space-y-3">
                {sources.length === 0 ? (
                  <div className="text-center py-12 px-4 border-2 border-dashed border-slate-800 rounded-3xl">
                    <Info className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                    <p className="text-sm font-bold text-slate-300">No sources added yet</p>
                    <p className="text-xs text-slate-500 mt-1">Add PDFs, notes, YouTube links, or web pages to ground your tutor.</p>
                  </div>
                ) : (
                  sources.map((src, srcIdx) => {
                    const Icon = src.type === 'youtube' ? Youtube : src.type === 'url' ? Globe : src.type === 'video_ref' ? Video : FileText;
                    return (
                      <div
                        key={src.id ? `src-${src.id}-${srcIdx}` : `src-idx-${srcIdx}`}
                        className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                          src.isActive 
                            ? 'bg-slate-800/80 border-indigo-500/40 text-slate-100 shadow-lg' 
                            : 'bg-slate-950/40 border-slate-800/80 text-slate-400 opacity-70'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <button
                            onClick={() => onToggleSource(src.id)}
                            className="p-1 text-indigo-400 hover:text-indigo-300 transition-colors shrink-0"
                            title={src.isActive ? "Exclude from AI context" : "Include in AI context"}
                          >
                            {src.isActive ? (
                              <CheckSquare className="w-5 h-5 text-indigo-400" />
                            ) : (
                              <Square className="w-5 h-5 text-slate-500" />
                            )}
                          </button>

                          <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center shrink-0">
                            <Icon className="w-4 h-4 text-indigo-400" />
                          </div>

                          <div className="min-w-0 flex-1">
                            <h4 className="text-xs font-bold truncate text-slate-100">{src.name}</h4>
                            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                              {src.type.replace('_', ' ')} • {src.extractedText.length} chars
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => onViewSourceExcerpt(src)}
                            className="p-2 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded-lg transition-all"
                            title="Preview Source Text"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onDeleteSource(src.id)}
                            className="p-2 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-all"
                            title="Delete Source"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer Add Button */}
              <div className="p-6 border-t border-slate-800 bg-slate-950/80">
                <button
                  onClick={() => setShowAddModal(true)}
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-600/30 active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  Add Source to Notebook
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Source Dialog Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[120] bg-slate-950/70 backdrop-blur-md overflow-y-auto p-4 md:p-8 flex justify-center items-start">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 text-slate-100 w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden my-auto p-6 md:p-8 relative"
            >
              <div className="flex items-center justify-between pb-6 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-600/20 text-indigo-400 rounded-xl flex items-center justify-center">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white">Add Grounding Material</h3>
                    <p className="text-xs text-slate-400">Ground AI tutor in real documents & sources</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-2 text-slate-400 hover:text-white bg-slate-800/50 rounded-xl"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Category Tabs */}
              <div className="flex gap-2 p-1.5 bg-slate-950 rounded-2xl my-6 border border-slate-800">
                <button
                  onClick={() => setActiveTab('file')}
                  className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                    activeTab === 'file' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  File Upload
                </button>
                <button
                  onClick={() => setActiveTab('text')}
                  className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                    activeTab === 'text' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  Paste Text
                </button>
                <button
                  onClick={() => setActiveTab('url')}
                  className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                    activeTab === 'url' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Globe className="w-3.5 h-3.5" />
                  URL / YouTube
                </button>
                <button
                  onClick={() => setActiveTab('video')}
                  className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                    activeTab === 'video' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Video className="w-3.5 h-3.5" />
                  Video Ref
                </button>
              </div>

              {/* Tab Contents */}
              <div className="space-y-4 min-h-[220px] flex flex-col justify-center">
                {activeTab === 'file' && (
                  <label className="border-2 border-dashed border-slate-700 hover:border-indigo-500 bg-slate-950/50 p-8 rounded-3xl cursor-pointer flex flex-col items-center justify-center text-center transition-all group">
                    <input
                      type="file"
                      multiple
                      onChange={handleFileUpload}
                      className="hidden"
                      accept=".pdf,.docx,.txt,.md,.png,.jpg,.jpeg,.webp"
                    />
                    <div className="w-14 h-14 bg-indigo-600/10 text-indigo-400 group-hover:scale-110 rounded-2xl flex items-center justify-center mb-3 transition-transform">
                      <Upload className="w-7 h-7" />
                    </div>
                    <p className="font-bold text-slate-200 text-sm">Click or Drag & Drop Documents</p>
                    <p className="text-xs text-slate-500 mt-1">Supports PDF, DOCX, Text, Markdown & Image Scans</p>
                    {isProcessing && <p className="text-xs text-indigo-400 font-bold mt-3 animate-pulse">Extracting text & processing...</p>}
                  </label>
                )}

                {activeTab === 'text' && (
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Source Title (e.g., Chapter 4 Lecture Notes)"
                      value={pastedTitle}
                      onChange={(e) => setPastedTitle(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-sm font-medium text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                    <textarea
                      rows={6}
                      placeholder="Paste text notes or transcript here..."
                      value={pastedContent}
                      onChange={(e) => setPastedContent(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-sm font-medium text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
                    />
                    <button
                      onClick={handleAddTextSource}
                      disabled={!pastedContent.trim()}
                      className="w-full py-3 bg-indigo-600 disabled:opacity-50 hover:bg-indigo-500 text-white rounded-2xl font-bold text-xs uppercase tracking-wider transition-all"
                    >
                      Save Text Source
                    </button>
                  </div>
                )}

                {activeTab === 'url' && (
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Optional Title (e.g., Khan Academy Calculus Video)"
                      value={urlTitle}
                      onChange={(e) => setUrlTitle(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-sm font-medium text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                    <input
                      type="url"
                      placeholder="Paste URL or YouTube Link (e.g. https://youtube.com/watch?v=...)"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-sm font-medium text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                    <button
                      onClick={handleAddUrlSource}
                      disabled={!urlInput.trim()}
                      className="w-full py-3 bg-indigo-600 disabled:opacity-50 hover:bg-indigo-500 text-white rounded-2xl font-bold text-xs uppercase tracking-wider transition-all"
                    >
                      Add URL Source
                    </button>
                  </div>
                )}

                {activeTab === 'video' && (
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Video Link / Reference URL (e.g. YouTube lecture)"
                      value={videoRefUrl}
                      onChange={(e) => setVideoRefUrl(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-sm font-medium text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                    <textarea
                      rows={4}
                      placeholder="Custom notes or topics to search & synthesize from this video..."
                      value={videoNotes}
                      onChange={(e) => setVideoNotes(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-sm font-medium text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
                    />
                    <button
                      onClick={handleAddVideoRefSource}
                      disabled={!videoRefUrl.trim() && !videoNotes.trim()}
                      className="w-full py-3 bg-indigo-600 disabled:opacity-50 hover:bg-indigo-500 text-white rounded-2xl font-bold text-xs uppercase tracking-wider transition-all"
                    >
                      Add Video Reference
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
export default SourcesPanel;
