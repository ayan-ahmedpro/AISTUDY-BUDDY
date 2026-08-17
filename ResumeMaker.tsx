import React, { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  Briefcase, 
  GraduationCap, 
  Wrench, 
  ChevronRight, 
  ChevronLeft, 
  Plus, 
  Trash2, 
  Download, 
  Sparkles,
  Layout,
  Type,
  FileText,
  Mail,
  Phone,
  MapPin,
  Globe,
  Loader2,
  Award,
  ShieldCheck,
  Languages as LangIcon,
  Crown,
  Save,
  Clock,
  ArrowLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { saveAs } from 'file-saver';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useNavigation } from '../context/NavigationContext';

interface ResumeData {
  personal: {
    fullName: string;
    title: string;
    email: string;
    phone: string;
    location: string;
    website: string;
    summary: string;
  };
  experience: {
    id: string;
    title: string;
    company: string;
    date: string;
    description: string;
  }[];
  education: {
    id: string;
    degree: string;
    school: string;
    date: string;
  }[];
  skills: string[];
  achievements: string[];
  certificates: string[];
  languages: string[];
}

const TEMPLATES = [
  { id: 'modern', name: 'Modern Minimal', color: '#0f172a' },
  { id: 'classic', name: 'Classic Professional', color: '#1e293b' },
  { id: 'creative', name: 'Creative Tech', color: '#2563eb' },
  { id: 'executive', name: 'Executive Elite', color: '#334155' },
  { id: 'split', name: 'Modern Split', color: '#6366f1' }
];

export default function ResumeMaker({ onClose }: { onClose: () => void }) {
  const { goBack, registerModal } = useNavigation();
  const [step, setStep] = useState(1);

  useEffect(() => {
    return registerModal('ResumeMaker', onClose);
  }, [onClose, registerModal]);
  const [template, setTemplate] = useState('modern');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [data, setData] = useState<ResumeData>({
    personal: { fullName: '', title: '', email: '', phone: '', location: '', website: '', summary: '' },
    experience: [{ id: '1', title: '', company: '', date: '', description: '' }],
    education: [{ id: '1', degree: '', school: '', date: '' }],
    skills: [''],
    achievements: [''],
    certificates: [''],
    languages: ['']
  });

  // Load draft on mount
  useEffect(() => {
    const loadDraft = async () => {
      // 1. Try local storage
      const localDraft = localStorage.getItem('resume_draft');
      if (localDraft) {
        try {
          setData(JSON.parse(localDraft));
        } catch (e) {
          console.error("Failed to parse local draft");
        }
      }

      // 2. Try Firestore if logged in
      if (auth.currentUser) {
        try {
          const docRef = doc(db, 'resumes', auth.currentUser.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setData(docSnap.data().data as ResumeData);
            setLastSaved(docSnap.data().updatedAt?.toDate() || null);
          }
        } catch (e) {
          console.error("Failed to load Firestore draft", e);
        }
      }
    };

    loadDraft();
  }, []);

  // Auto-save logic
  useEffect(() => {
    const saveToLocal = () => {
      localStorage.setItem('resume_draft', JSON.stringify(data));
    };

    const saveToFirestore = async () => {
      if (!auth.currentUser) return;
      setIsSaving(true);
      try {
        await setDoc(doc(db, 'resumes', auth.currentUser.uid), {
          data,
          updatedAt: serverTimestamp(),
          ownerId: auth.currentUser.uid
        }, { merge: true });
        setLastSaved(new Date());
      } catch (e) {
        console.error("Failed to save to Firestore", e);
      } finally {
        setIsSaving(false);
      }
    };

    saveToLocal();
    const timer = setTimeout(saveToFirestore, 2000); // Debounce Cloud Save
    return () => clearTimeout(timer);
  }, [data]);

  const updatePersonal = (field: keyof ResumeData['personal'], value: string) => {
    setData(prev => ({
      ...prev,
      personal: { ...prev.personal, [field]: value }
    }));
  };

  const addExperience = () => {
    setData(prev => ({
      ...prev,
      experience: [...prev.experience, { id: Math.random().toString(), title: '', company: '', date: '', description: '' }]
    }));
  };

  const addEducation = () => {
    setData(prev => ({
      ...prev,
      education: [...prev.education, { id: Math.random().toString(), degree: '', school: '', date: '' }]
    }));
  };

  const generatePDF = async () => {
    setIsGenerating(true);
    try {
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([595.28, 841.89]); // A4
      const { width, height } = page.getSize();
      const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

      const currentTemplate = TEMPLATES.find(t => t.id === template) || TEMPLATES[0];
      const hexToRgb = (hex: string) => {
        const r = parseInt(hex.slice(1, 3), 16) / 255;
        const g = parseInt(hex.slice(3, 5), 16) / 255;
        const b = parseInt(hex.slice(5, 7), 16) / 255;
        return rgb(r, g, b);
      };
      
      const primaryColor = hexToRgb(currentTemplate.color);
      const isSplit = template === 'split';

      let y = height - 50;

      if (isSplit) {
        // Draw Sidebar background
        page.drawRectangle({
          x: 0,
          y: 0,
          width: 200,
          height: height,
          color: primaryColor,
        });

        // Sidebar Content
        let sy = height - 50;
        page.drawText(data.personal.fullName || 'Full Name', { x: 20, y: sy, size: 18, font: fontBold, color: rgb(1,1,1) });
        sy -= 20;
        if (data.personal.title) {
          page.drawText(data.personal.title, { x: 20, y: sy, size: 12, font: fontRegular, color: rgb(0.9, 0.9, 0.9) });
          sy -= 40;
        } else {
          sy -= 30;
        }

        // Contact info in sidebar
        const drawSidebarContact = (text: string, icon: string) => {
          if (!text) return;
          page.drawText(text, { x: 20, y: sy, size: 8, font: fontRegular, color: rgb(0.9, 0.9, 0.9) });
          sy -= 15;
        };

        drawSidebarContact(data.personal.email, 'E:');
        drawSidebarContact(data.personal.phone, 'P:');
        drawSidebarContact(data.personal.location, 'L:');
        if (data.personal.website) drawSidebarContact(data.personal.website, 'W:');

        sy -= 20;
        page.drawText('SKILLS', { x: 20, y: sy, size: 10, font: fontBold, color: rgb(1,1,1) });
        sy -= 15;
        data.skills.filter(s => s.trim()).forEach(skill => {
          page.drawText(`• ${skill}`, { x: 20, y: sy, size: 8, font: fontRegular, color: rgb(0.9, 0.9, 0.9) });
          sy -= 12;
        });

        sy -= 15;
        if (data.languages.some(l => l.trim())) {
          page.drawText('LANGUAGES', { x: 20, y: sy, size: 10, font: fontBold, color: rgb(1,1,1) });
          sy -= 15;
          data.languages.filter(l => l.trim()).forEach(lang => {
            page.drawText(`• ${lang}`, { x: 20, y: sy, size: 8, font: fontRegular, color: rgb(0.9, 0.9, 0.9) });
            sy -= 12;
          });
        }

        // Main Content (Right Side)
        let my = height - 50;
        const mainX = 220;
        const mainW = width - 240;

        if (data.personal.summary) {
          page.drawText('SUMMARY', { x: mainX, y: my, size: 10, font: fontBold, color: primaryColor });
          my -= 15;
          const summaryLines = data.personal.summary.match(/.{1,70}(\s|$)/g) || [data.personal.summary];
          summaryLines.forEach(line => {
            page.drawText(line.trim(), { x: mainX, y: my, size: 9, font: fontRegular });
            my -= 12;
          });
          my -= 20;
        }

        page.drawText('EXPERIENCE', { x: mainX, y: my, size: 10, font: fontBold, color: primaryColor });
        my -= 15;
        data.experience.forEach(exp => {
          page.drawText(exp.title || 'Role', { x: mainX, y: my, size: 11, font: fontBold });
          page.drawText(exp.date || '', { x: width - 100, y: my, size: 9, font: fontRegular });
          my -= 14;
          page.drawText(exp.company || 'Company', { x: mainX, y: my, size: 9, font: fontRegular, color: rgb(0.4, 0.4, 0.4) });
          my -= 15;
          const descLines = (exp.description || '').split('\n').flatMap(d => d.match(/.{1,70}(\s|$)/g) || []);
          descLines.forEach(line => {
            page.drawText(`• ${line.trim()}`, { x: mainX + 10, y: my, size: 8, font: fontRegular });
            my -= 11;
          });
          my -= 12;
        });

        my -= 5;
        page.drawText('EDUCATION', { x: mainX, y: my, size: 10, font: fontBold, color: primaryColor });
        my -= 15;
        data.education.forEach(edu => {
          page.drawText(edu.degree || 'Degree', { x: mainX, y: my, size: 10, font: fontBold });
          page.drawText(edu.date || '', { x: width - 100, y: my, size: 9, font: fontRegular });
          my -= 14;
          page.drawText(edu.school || 'University', { x: mainX, y: my, size: 9, font: fontRegular });
          my -= 18;
        });

        if (data.achievements.some(a => a.trim())) {
          my -= 5;
          page.drawText('ACHIEVEMENTS', { x: mainX, y: my, size: 10, font: fontBold, color: primaryColor });
          my -= 15;
          data.achievements.filter(a => a.trim()).forEach(ach => {
            page.drawText(`• ${ach}`, { x: mainX + 10, y: my, size: 9, font: fontRegular });
            my -= 13;
          });
        }
      } else {
        // ... existing classic/modern layout ...
        page.drawText(data.personal.fullName || 'Full Name', { x: 50, y, size: 22, font: fontBold, color: primaryColor });
        y -= 25;
        
        if (data.personal.title) {
          page.drawText(data.personal.title, { x: 50, y, size: 14, font: fontBold, color: rgb(0.3, 0.3, 0.3) });
          y -= 25;
        }
        
        const contactInfo = `${data.personal.email} | ${data.personal.phone} | ${data.personal.location}`;
        page.drawText(contactInfo, { x: 50, y, size: 9, font: fontRegular, color: rgb(0.4, 0.4, 0.4) });
        y -= 15;
        
        if (data.personal.website) {
          page.drawText(data.personal.website, { x: 50, y, size: 9, font: fontRegular, color: primaryColor });
          y -= 20;
        } else {
          y -= 15;
        }

        // Summary
        if (data.personal.summary) {
          page.drawText('SUMMARY', { x: 50, y, size: 10, font: fontBold, color: primaryColor });
          y -= 5;
          page.drawLine({ start: { x: 50, y }, end: { x: width - 50, y }, thickness: 1, color: primaryColor, opacity: 0.2 });
          y -= 15;
          const summaryLines = data.personal.summary.match(/.{1,95}(\s|$)/g) || [data.personal.summary];
          summaryLines.forEach(line => {
            page.drawText(line.trim(), { x: 50, y, size: 9, font: fontRegular });
            y -= 12;
          });
          y -= 15;
        }

        // Experience
        page.drawText('EXPERIENCE', { x: 50, y, size: 10, font: fontBold, color: primaryColor });
        y -= 5;
        page.drawLine({ start: { x: 50, y }, end: { x: width - 50, y }, thickness: 1, color: primaryColor, opacity: 0.2 });
        y -= 15;
        data.experience.forEach(exp => {
          page.drawText(exp.title || 'Role', { x: 50, y, size: 11, font: fontBold });
          page.drawText(exp.date || '', { x: width - 150, y, size: 9, font: fontRegular });
          y -= 14;
          page.drawText(exp.company || 'Company', { x: 50, y, size: 9, font: fontRegular, color: rgb(0.3, 0.3, 0.3) });
          y -= 18;
          const descLines = (exp.description || '').split('\n').flatMap(d => d.match(/.{1,95}(\s|$)/g) || []);
          descLines.forEach(line => {
            page.drawText(`• ${line.trim()}`, { x: 60, y, size: 8, font: fontRegular });
            y -= 11;
          });
          y -= 12;
        });

        // Education
        y -= 5;
        page.drawText('EDUCATION', { x: 50, y, size: 10, font: fontBold, color: primaryColor });
        y -= 5;
        page.drawLine({ start: { x: 50, y }, end: { x: width - 50, y }, thickness: 1, color: primaryColor, opacity: 0.2 });
        y -= 15;
        data.education.forEach(edu => {
          page.drawText(edu.degree || 'Degree', { x: 50, y, size: 11, font: fontBold });
          page.drawText(edu.date || '', { x: width - 150, y, size: 9, font: fontRegular });
          y -= 14;
          page.drawText(edu.school || 'University', { x: 50, y, size: 9, font: fontRegular });
          y -= 18;
        });

        // Skills
        y -= 5;
        page.drawText('SKILLS', { x: 50, y, size: 10, font: fontBold, color: primaryColor });
        y -= 5;
        page.drawLine({ start: { x: 50, y }, end: { x: width - 50, y }, thickness: 1, color: primaryColor, opacity: 0.2 });
        y -= 15;
        const skillsText = data.skills.filter(s => s.trim()).join(', ');
        page.drawText(skillsText, { x: 50, y, size: 9, font: fontRegular });

        // Achievements
        if (data.achievements.some(a => a.trim())) {
          y -= 25;
          page.drawText('ACHIEVEMENTS', { x: 50, y, size: 10, font: fontBold, color: primaryColor });
          y -= 5;
          page.drawLine({ start: { x: 50, y }, end: { x: width - 50, y }, thickness: 1, color: primaryColor, opacity: 0.2 });
          y -= 15;
          data.achievements.filter(a => a.trim()).forEach(ach => {
            page.drawText(`• ${ach}`, { x: 55, y, size: 9, font: fontRegular });
            y -= 13;
          });
        }

        // Certificates
        if (data.certificates.some(c => c.trim())) {
          y -= 15;
          page.drawText('CERTIFICATES', { x: 50, y, size: 10, font: fontBold, color: primaryColor });
          y -= 5;
          page.drawLine({ start: { x: 50, y }, end: { x: width - 50, y }, thickness: 1, color: primaryColor, opacity: 0.2 });
          y -= 15;
          data.certificates.filter(c => c.trim()).forEach(cert => {
            page.drawText(`• ${cert}`, { x: 55, y, size: 9, font: fontRegular });
            y -= 13;
          });
        }

        // Languages
        if (data.languages.some(l => l.trim())) {
          y -= 15;
          page.drawText('LANGUAGES', { x: 50, y, size: 10, font: fontBold, color: primaryColor });
          y -= 5;
          page.drawLine({ start: { x: 50, y }, end: { x: width - 50, y }, thickness: 1, color: primaryColor, opacity: 0.2 });
          y -= 15;
          const langText = data.languages.filter(l => l.trim()).join(', ');
          page.drawText(langText, { x: 50, y, size: 9, font: fontRegular });
        }
      }

      const pdfBytes = await pdfDoc.save();
      saveAs(new Blob([pdfBytes]), `Resume_${data.personal.fullName.replace(/\s+/g, '_')}.pdf`);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/60 backdrop-blur-md overflow-y-auto h-full p-4 md:p-8 flex justify-center items-start">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white w-full max-w-5xl min-h-[85vh] max-h-[92vh] my-auto rounded-[3rem] shadow-2xl overflow-hidden flex flex-col md:flex-row"
      >
        {/* Sidebar Navigation */}
        <div className="w-full md:w-64 bg-slate-900 p-8 flex flex-col gap-6 overflow-y-auto shrink-0">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <Sparkles className="text-white w-5 h-5" />
            </div>
            <span className="text-white font-black tracking-tight">Resume Maker</span>
          </div>
          
          <nav className="flex flex-col gap-2">
            {[
              { s: 1, label: 'Templates', icon: <Layout className="w-4 h-4" /> },
              { s: 2, label: 'Personal', icon: <User className="w-4 h-4" /> },
              { s: 3, label: 'Work', icon: <Briefcase className="w-4 h-4" /> },
              { s: 4, label: 'Education', icon: <GraduationCap className="w-4 h-4" /> },
              { s: 5, label: 'Skills', icon: <Wrench className="w-4 h-4" /> },
              { s: 6, label: 'Achievements', icon: <Award className="w-4 h-4" /> },
              { s: 7, label: 'Certificates', icon: <ShieldCheck className="w-4 h-4" /> },
              { s: 8, label: 'Languages', icon: <LangIcon className="w-4 h-4" /> },
            ].map((nav) => (
              <button
                key={nav.s}
                onClick={() => setStep(nav.s)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all",
                  step === nav.s 
                    ? "bg-white text-slate-900 shadow-lg" 
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                )}
              >
                {nav.icon}
                {nav.label}
              </button>
            ))}
          </nav>

          <div className="mt-auto pt-8 border-t border-white/10 space-y-4">
            <div className="px-4 py-2 bg-white/5 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isSaving ? (
                  <Loader2 className="w-3 h-3 text-blue-400 animate-spin" />
                ) : (
                  <Save className="w-3 h-3 text-emerald-400" />
                )}
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  {isSaving ? 'Saving...' : 'Synced'}
                </span>
              </div>
              {lastSaved && !isSaving && (
                <div className="flex items-center gap-1 opacity-50">
                  <Clock className="w-3 h-3 text-slate-500" />
                  <span className="text-[10px] font-bold text-slate-500">
                    {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              )}
            </div>

            <button 
              onClick={generatePDF}
              disabled={isGenerating}
              className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-xl shadow-blue-900/40"
            >
              {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
              {isGenerating ? 'Drafting...' : 'Export PDF'}
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white relative">
           <button 
             onClick={goBack} 
             className="absolute top-6 right-6 px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-2xl transition-all z-20 font-black text-xs flex items-center gap-2 cursor-pointer shadow-sm border border-transparent dark:border-slate-700"
           >
             <ArrowLeft className="w-4 h-4" />
             <span>Back to AI Study Buddy</span>
           </button>

           <div className="flex-1 overflow-y-auto p-8 md:p-12">
             <AnimatePresence mode="wait">
               {step === 1 && (
                 <motion.div 
                   key="step1" 
                   initial={{ opacity: 0, x: 20 }} 
                   animate={{ opacity: 1, x: 0 }} 
                   exit={{ opacity: 0, x: -20 }}
                   className="space-y-8"
                 >
                   <div>
                     <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-2">Choose Your Look</h1>
                     <p className="text-slate-500 font-medium">Select a template that matches your professional identity.</p>
                   </div>
                   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                     {TEMPLATES.map((t) => (
                       <button
                         key={t.id}
                         onClick={() => setTemplate(t.id)}
                         className={cn(
                           "relative aspect-[3/4] bg-white rounded-3xl border-4 overflow-hidden shadow-xl transition-all group",
                           template === t.id ? "border-blue-600 scale-105" : "border-transparent hover:scale-102"
                         )}
                       >
                         <div className="absolute inset-0 bg-slate-100 p-4">
                            <div className="w-1/2 h-4 bg-slate-300 rounded mb-4" />
                            <div className="w-full h-2 bg-slate-200 rounded mb-2" />
                            <div className="w-3/4 h-2 bg-slate-200 rounded mb-8" />
                            <div className="space-y-4">
                              {[1,2,3].map(i => (
                                <div key={`skel-line-${i}`} className="space-y-2">
                                  <div className="w-1/3 h-3 bg-slate-300 rounded" />
                                  <div className="w-full h-2 bg-slate-200 rounded" />
                                </div>
                              ))}
                            </div>
                         </div>
                         <div className={cn(
                           "absolute bottom-0 inset-x-0 p-4 backdrop-blur-md flex items-center justify-between",
                           template === t.id ? "bg-blue-600 text-white" : "bg-white/80 text-slate-900"
                         )}>
                           <span className="font-bold text-xs uppercase tracking-widest">{t.name}</span>
                         </div>
                       </button>
                     ))}
                   </div>
                 </motion.div>
               )}

               {step === 2 && (
                 <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8 max-w-2xl">
                    <h1 className="text-3xl font-black text-slate-900">Personal Information</h1>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Full Name</label>
                        <input 
                          type="text" 
                          value={data.personal.fullName}
                          onChange={(e) => updatePersonal('fullName', e.target.value)}
                          placeholder="John Carter"
                          className="w-full bg-white border-2 border-slate-200 rounded-2xl px-6 py-4 font-bold text-slate-900 focus:border-blue-600 transition-all outline-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Professional Title</label>
                        <input 
                          type="text" 
                          value={data.personal.title}
                          onChange={(e) => updatePersonal('title', e.target.value)}
                          placeholder="Senior Product Designer"
                          className="w-full bg-white border-2 border-slate-200 rounded-2xl px-6 py-4 font-bold text-slate-900 focus:border-blue-600 transition-all outline-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Email Address</label>
                        <input 
                          type="email" 
                          value={data.personal.email}
                          onChange={(e) => updatePersonal('email', e.target.value)}
                          className="w-full bg-white border-2 border-slate-200 rounded-2xl px-6 py-4 font-bold text-slate-900 focus:border-blue-600 transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Phone Number</label>
                        <input 
                          type="text" 
                          value={data.personal.phone}
                          onChange={(e) => updatePersonal('phone', e.target.value)}
                          className="w-full bg-white border-2 border-slate-200 rounded-2xl px-6 py-4 font-bold text-slate-900 focus:border-blue-600 transition-all"
                        />
                      </div>
                      <div className="md:col-span-2 space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Professional Summary</label>
                        <textarea 
                          rows={4}
                          value={data.personal.summary}
                          onChange={(e) => updatePersonal('summary', e.target.value)}
                          className="w-full bg-white border-2 border-slate-200 rounded-2xl px-6 py-4 font-bold text-slate-900 focus:border-blue-600 transition-all resize-none outline-none"
                          placeholder="Write a brief introduction about your professional journey..."
                        />
                      </div>
                    </div>
                 </motion.div>
               )}

               {step === 3 && (
                 <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                    <div className="flex items-center justify-between">
                      <h1 className="text-3xl font-black text-slate-900">Work Experience</h1>
                      <button 
                        onClick={addExperience}
                        className="p-3 bg-slate-900 text-white rounded-2xl hover:scale-105 active:scale-95 transition-all"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>
                    
                    <div className="space-y-6">
                      {data.experience.map((exp, idx) => (
                        <div key={exp.id ? `exp-${exp.id}-${idx}` : `exp-${idx}`} className="bg-white p-8 rounded-[2rem] border-2 border-slate-100 shadow-sm space-y-6 relative group">
                          <button 
                            onClick={() => setData(prev => ({ ...prev, experience: prev.experience.filter(e => e.id !== exp.id) }))}
                            className="absolute top-6 right-6 p-2 text-slate-300 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Job Title</label>
                              <input 
                                type="text" 
                                value={exp.title}
                                onChange={(e) => {
                                  const newExp = [...data.experience];
                                  newExp[idx].title = e.target.value;
                                  setData({ ...data, experience: newExp });
                                }}
                                className="w-full bg-slate-50 border-2 border-transparent rounded-xl px-4 py-3 font-bold text-slate-900 focus:bg-white focus:border-blue-600 outline-none"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Company</label>
                              <input 
                                type="text"
                                value={exp.company}
                                onChange={(e) => {
                                  const newExp = [...data.experience];
                                  newExp[idx].company = e.target.value;
                                  setData({ ...data, experience: newExp });
                                }}
                                className="w-full bg-slate-50 border-2 border-transparent rounded-xl px-4 py-3 font-bold text-slate-900 focus:bg-white focus:border-blue-600 outline-none"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Timeline</label>
                              <input 
                                type="text"
                                value={exp.date}
                                onChange={(e) => {
                                  const newExp = [...data.experience];
                                  newExp[idx].date = e.target.value;
                                  setData({ ...data, experience: newExp });
                                }}
                                placeholder="e.g., 2021 - Present"
                                className="w-full bg-slate-50 border-2 border-transparent rounded-xl px-4 py-3 font-bold text-slate-900 focus:bg-white focus:border-blue-600 outline-none"
                              />
                            </div>
                            <div className="md:col-span-2 space-y-2">
                              <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Description</label>
                              <textarea 
                                rows={3}
                                value={exp.description}
                                onChange={(e) => {
                                  const newExp = [...data.experience];
                                  newExp[idx].description = e.target.value;
                                  setData({ ...data, experience: newExp });
                                }}
                                className="w-full bg-slate-50 border-2 border-transparent rounded-xl px-4 py-3 font-bold text-slate-900 focus:bg-white focus:border-blue-600 outline-none resize-none"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                 </motion.div>
               )}

               {step === 4 && (
                 <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                    <div className="flex items-center justify-between">
                      <h1 className="text-3xl font-black text-slate-900">Education</h1>
                      <button 
                        onClick={addEducation}
                        className="p-3 bg-slate-900 text-white rounded-2xl hover:scale-105 active:scale-95 transition-all"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="space-y-6">
                      {data.education.map((edu, idx) => (
                        <div key={edu.id ? `edu-${edu.id}-${idx}` : `edu-${idx}`} className="bg-white p-8 rounded-[2rem] border-2 border-slate-100 space-y-6 relative">
                          <button 
                             onClick={() => setData(prev => ({ ...prev, education: prev.education.filter(e => e.id !== edu.id) }))}
                             className="absolute top-6 right-6 p-2 text-slate-300 hover:text-red-500 transition-colors"
                          >
                             <Trash2 className="w-5 h-5" />
                          </button>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Degree / Major</label>
                              <input 
                                type="text"
                                value={edu.degree}
                                onChange={(e) => {
                                  const newEdu = [...data.education];
                                  newEdu[idx].degree = e.target.value;
                                  setData({ ...data, education: newEdu });
                                }}
                                className="w-full bg-slate-50 border-2 border-transparent rounded-xl px-4 py-3 font-bold text-slate-900 focus:bg-white focus:border-blue-600 outline-none"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Institution</label>
                              <input 
                                type="text"
                                value={edu.school}
                                onChange={(e) => {
                                  const newEdu = [...data.education];
                                  newEdu[idx].school = e.target.value;
                                  setData({ ...data, education: newEdu });
                                }}
                                className="w-full bg-slate-50 border-2 border-transparent rounded-xl px-4 py-3 font-bold text-slate-900 focus:bg-white focus:border-blue-600 outline-none"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Graduation Date</label>
                              <input 
                                type="text"
                                value={edu.date}
                                onChange={(e) => {
                                  const newEdu = [...data.education];
                                  newEdu[idx].date = e.target.value;
                                  setData({ ...data, education: newEdu });
                                }}
                                className="w-full bg-slate-50 border-2 border-transparent rounded-xl px-4 py-3 font-bold text-slate-900 focus:bg-white focus:border-blue-600 outline-none"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                 </motion.div>
               )}

               {step === 5 && (
                 <motion.div key="step5" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8 max-w-2xl">
                    <h1 className="text-3xl font-black text-slate-900">Core Skills</h1>
                    <p className="text-slate-500 font-medium">Add the key skills that highlight your technical and soft expertise.</p>
                    
                    <div className="flex flex-wrap gap-3">
                      {data.skills.map((skill, idx) => (
                        <div key={`sk-${idx}`} className="flex items-center gap-2 group">
                          <input 
                            type="text"
                            value={skill}
                            onChange={(e) => {
                              const newSkills = [...data.skills];
                              newSkills[idx] = e.target.value;
                              setData({ ...data, skills: newSkills });
                            }}
                            className="bg-white border-2 border-slate-200 rounded-xl px-4 py-2 font-bold text-slate-900 focus:border-blue-600 outline-none w-32"
                          />
                          <button 
                            onClick={() => setData(prev => ({ ...prev, skills: prev.skills.filter((_, i) => i !== idx) }))}
                            className={cn("opacity-0 group-hover:opacity-100 p-2 text-slate-300 hover:text-red-500 transition-all", data.skills.length <= 1 && "hidden")}
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      <button 
                        onClick={() => setData(prev => ({ ...prev, skills: [...prev.skills, ''] }))}
                        className="px-6 py-2 bg-slate-900 text-white rounded-xl font-bold hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Add Skill
                      </button>
                    </div>
                 </motion.div>
               )}

               {step === 6 && (
                 <motion.div key="step6" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8 max-w-2xl">
                    <h1 className="text-3xl font-black text-slate-900">Key Achievements</h1>
                    <p className="text-slate-500 font-medium">Notable milestones or awards you've earned.</p>
                    
                    <div className="space-y-4">
                      {data.achievements.map((ach, idx) => (
                        <div key={`ach-${idx}`} className="flex items-center gap-4 group">
                          <input 
                            type="text"
                            value={ach}
                            onChange={(e) => {
                              const newAch = [...data.achievements];
                              newAch[idx] = e.target.value;
                              setData({ ...data, achievements: newAch });
                            }}
                            className="flex-1 bg-white border-2 border-slate-200 rounded-xl px-6 py-4 font-bold text-slate-900 focus:border-blue-600 outline-none"
                            placeholder="e.g. Employee of the Year 2023"
                          />
                          <button 
                            onClick={() => setData(prev => ({ ...prev, achievements: prev.achievements.filter((_, i) => i !== idx) }))}
                            className={cn("opacity-0 group-hover:opacity-100 p-2 text-slate-300 hover:text-red-500 transition-all", data.achievements.length <= 1 && "hidden")}
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      ))}
                      <button 
                        onClick={() => setData(prev => ({ ...prev, achievements: [...prev.achievements, ''] }))}
                        className="px-8 py-3 bg-slate-100 text-slate-900 rounded-2xl font-black hover:bg-slate-200 transition-all flex items-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Add Achievement
                      </button>
                    </div>
                 </motion.div>
               )}

               {step === 7 && (
                 <motion.div key="step7" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8 max-w-2xl">
                    <h1 className="text-3xl font-black text-slate-900">Certifications</h1>
                    <p className="text-slate-500 font-medium">Courses and official certifications you've completed.</p>
                    
                    <div className="space-y-4">
                      {data.certificates.map((cert, idx) => (
                        <div key={`cert-${idx}`} className="flex items-center gap-4 group">
                          <input 
                            type="text"
                            value={cert}
                            onChange={(e) => {
                              const newCert = [...data.certificates];
                              newCert[idx] = e.target.value;
                              setData({ ...data, certificates: newCert });
                            }}
                            className="flex-1 bg-white border-2 border-slate-200 rounded-xl px-6 py-4 font-bold text-slate-900 focus:border-blue-600 outline-none"
                            placeholder="e.g. AWS Solutions Architect"
                          />
                          <button 
                            onClick={() => setData(prev => ({ ...prev, certificates: prev.certificates.filter((_, i) => i !== idx) }))}
                            className={cn("opacity-0 group-hover:opacity-100 p-2 text-slate-300 hover:text-red-500 transition-all", data.certificates.length <= 1 && "hidden")}
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      ))}
                      <button 
                        onClick={() => setData(prev => ({ ...prev, certificates: [...prev.certificates, ''] }))}
                        className="px-8 py-3 bg-slate-100 text-slate-900 rounded-2xl font-black hover:bg-slate-200 transition-all flex items-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Add Certificate
                      </button>
                    </div>
                 </motion.div>
               )}

               {step === 8 && (
                 <motion.div key="step8" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8 max-w-2xl">
                    <h1 className="text-3xl font-black text-slate-900">Languages</h1>
                    <p className="text-slate-500 font-medium">Any additional languages you speak.</p>
                    
                    <div className="flex flex-wrap gap-4">
                      {data.languages.map((lang, idx) => (
                        <div key={`lang-${idx}`} className="flex items-center gap-2 group">
                          <input 
                            type="text"
                            value={lang}
                            onChange={(e) => {
                              const newLang = [...data.languages];
                              newLang[idx] = e.target.value;
                              setData({ ...data, languages: newLang });
                            }}
                            className="bg-white border-2 border-slate-200 rounded-xl px-6 py-3 font-bold text-slate-900 focus:border-blue-600 outline-none w-40"
                            placeholder="e.g. English"
                          />
                          <button 
                            onClick={() => setData(prev => ({ ...prev, languages: prev.languages.filter((_, i) => i !== idx) }))}
                            className={cn("opacity-0 group-hover:opacity-100 p-2 text-slate-300 hover:text-red-500 transition-all", data.languages.length <= 1 && "hidden")}
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      <button 
                        onClick={() => setData(prev => ({ ...prev, languages: [...prev.languages, ''] }))}
                        className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Add Language
                      </button>
                    </div>
                 </motion.div>
               )}
             </AnimatePresence>
           </div>

           {/* Footer Buttons */}
           <div className="p-8 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between">
              <button 
                onClick={() => setStep(prev => Math.max(1, prev - 1))}
                disabled={step === 1}
                className={cn(
                  "flex items-center gap-2 px-8 py-4 rounded-xl font-black transition-all",
                  step === 1 ? "opacity-0 cursor-default" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                )}
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>

              {step < 8 ? (
                <button 
                  onClick={() => setStep(prev => Math.min(8, prev + 1))}
                  className="bg-slate-900 text-white px-10 py-4 rounded-xl font-black flex items-center gap-2 hover:scale-105 active:scale-95 shadow-xl transition-all"
                >
                  Next Step
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button 
                  onClick={generatePDF}
                  className="bg-emerald-600 text-white px-10 py-4 rounded-xl font-black flex items-center gap-2 hover:scale-105 active:scale-95 shadow-xl shadow-emerald-500/20 transition-all"
                >
                  Finalize & Export
                  <Download className="w-4 h-4" />
                </button>
              )}
           </div>
        </div>
      </motion.div>
    </div>
  );
}
