import React, { useState } from 'react';
import { 
  Bookmark, 
  Trash2, 
  Pin, 
  Search, 
  X, 
  Download, 
  FileText, 
  Check, 
  Sparkles, 
  Layers 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { NotebookNote } from '../types';

interface NotesPanelProps {
  notes: NotebookNote[];
  isOpen: boolean;
  onClose: () => void;
  onDeleteNote: (noteId: string) => void;
  onTogglePin: (noteId: string) => void;
  onAddCustomNote: (title: string, content: string) => void;
}

export const NotesPanel: React.FC<NotesPanelProps> = ({
  notes,
  isOpen,
  onClose,
  onDeleteNote,
  onTogglePin,
  onAddCustomNote
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNoteIds, setSelectedNoteIds] = useState<string[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  const filteredNotes = notes.filter(n => 
    n.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.content?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedNotes = [...filteredNotes].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));

  const toggleSelect = (id: string) => {
    setSelectedNoteIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleExportPDF = async () => {
    const notesToExport = notes.filter(n => selectedNoteIds.includes(n.id));
    if (notesToExport.length === 0) return;

    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Study Buddy - Exported Notes', 14, 20);

    let yPos = 32;
    notesToExport.forEach((n, idx) => {
      if (yPos > 260) {
        doc.addPage();
        yPos = 20;
      }
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`${idx + 1}. ${n.title}`, 14, yPos);
      yPos += 8;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const lines = doc.splitTextToSize(n.content, 180);
      doc.text(lines, 14, yPos);
      yPos += lines.length * 5 + 10;
    });

    doc.save(`Study_Buddy_Notes_${Date.now()}.pdf`);
  };

  const handleCreateCustomNote = () => {
    if (!newContent.trim()) return;
    onAddCustomNote(newTitle.trim() || 'Quick Note', newContent.trim());
    setNewTitle('');
    setNewContent('');
    setShowAddForm(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] bg-slate-950/60 backdrop-blur-sm overflow-y-auto p-4 md:p-8 flex justify-end items-start">
          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="bg-slate-900 border border-slate-800 text-slate-100 w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col my-auto max-h-[88vh]"
          >
            {/* Header */}
            <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-600/20 text-indigo-400 rounded-xl flex items-center justify-center border border-indigo-500/30">
                  <Bookmark className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">Saved Notes</h3>
                  <p className="text-xs text-slate-400">{notes.length} saved snippets & summaries</p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-white bg-slate-800/50 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search & Actions Bar */}
            <div className="p-4 border-b border-slate-800 bg-slate-950/40 space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search saved notes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-between">
                <button
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="text-xs font-bold text-indigo-400 hover:underline flex items-center gap-1"
                >
                  {showAddForm ? 'Cancel Form' : '+ Create Note'}
                </button>

                {selectedNoteIds.length > 0 && (
                  <button
                    onClick={handleExportPDF}
                    className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Export ({selectedNoteIds.length}) PDF
                  </button>
                )}
              </div>
            </div>

            {/* Add Custom Note Form */}
            {showAddForm && (
              <div className="p-4 notebook-grid-black border-b border-slate-800 space-y-2">
                <input
                  type="text"
                  placeholder="Note Title"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full p-2.5 bg-slate-950/90 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-indigo-500 font-bold"
                />
                <textarea
                  rows={3}
                  placeholder="Write your note here..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="w-full p-2.5 bg-slate-950/90 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none resize-none"
                />
                <button
                  onClick={handleCreateCustomNote}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md"
                >
                  Save Notebook Entry
                </button>
              </div>
            )}

            {/* Notes List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {sortedNotes.length === 0 ? (
                <div className="text-center py-12 px-4 border-2 border-dashed border-slate-800 rounded-3xl notebook-grid-black">
                  <Bookmark className="w-8 h-8 text-indigo-400 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-200">No saved notebook pages yet</p>
                  <p className="text-[10px] text-slate-400 mt-1">Click "Save as note" on chat responses, FAQs, or flashcards.</p>
                </div>
              ) : (
                sortedNotes.map((note, noteIdx) => {
                  const isSelected = selectedNoteIds.includes(note.id);
                  return (
                    <div
                      key={note.id ? `note-${note.id}-${noteIdx}` : `note-idx-${noteIdx}`}
                      className={`notebook-page-black notebook-binder-holes pl-12 pr-4 py-4 rounded-2xl border transition-all space-y-2 relative overflow-hidden ${
                        note.pinned 
                          ? 'border-indigo-500/60 shadow-indigo-500/10 shadow-lg' 
                          : 'border-slate-800/80 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 border-b border-white/5 pb-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelect(note.id)}
                            className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-0 cursor-pointer"
                          />
                          <h4 className="text-xs font-black text-white truncate tracking-tight">{note.title}</h4>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => onTogglePin(note.id)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              note.pinned ? 'text-indigo-400 bg-indigo-500/20' : 'text-slate-500 hover:text-slate-300'
                            }`}
                          >
                            <Pin className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteNote(note.id)}
                            className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <p className="text-xs text-slate-300 font-medium leading-relaxed whitespace-pre-wrap">
                        {note.content}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
export default NotesPanel;
