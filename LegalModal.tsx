import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShieldCheck, FileText, Check, ExternalLink, Printer, Mail, Scale } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { TERMS_OF_SERVICE_TEXT, PRIVACY_POLICY_TEXT } from '../data/legalDocs';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'terms' | 'privacy';
}

export default function LegalModal({ isOpen, onClose, initialTab = 'terms' }: LegalModalProps) {
  const [activeTab, setActiveTab] = useState<'terms' | 'privacy'>(initialTab);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab, isOpen]);

  if (!isOpen) return null;

  const currentText = activeTab === 'terms' ? TERMS_OF_SERVICE_TEXT : PRIVACY_POLICY_TEXT;

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>${activeTab === 'terms' ? 'Terms of Service' : 'Privacy Policy'} - AI Study Buddy</title>
            <style>
              body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; padding: 40px; color: #1e293b; max-width: 800px; margin: 0 auto; }
              h1 { color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; }
              h2 { color: #334155; margin-top: 28px; }
              ul { padding-left: 20px; }
              li { margin-bottom: 8px; }
            </style>
          </head>
          <body>
            <div>${currentText.replace(/# (.*)/, '<h1>$1</h1>').replace(/## (.*)/g, '<h2>$1</h2>').replace(/\n/g, '<br/>')}</div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => printWindow.print(), 250);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-slate-950/70 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Top Header */}
          <div className="px-6 sm:px-8 py-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-600/10 text-blue-600 dark:text-blue-400 rounded-2xl">
                {activeTab === 'terms' ? <Scale className="w-6 h-6" /> : <ShieldCheck className="w-6 h-6" />}
              </div>
              <div>
                <h2 className="text-xl font-display font-black text-slate-900 dark:text-white tracking-tight">
                  Legal Documents & Policies
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  AI Study Buddy • Operated by Ayan Ahmed (Lahore, Pakistan)
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-all cursor-pointer"
              title="Close Legal View"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="px-6 sm:px-8 pt-4 pb-2 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 overflow-x-auto">
            <div className="flex items-center gap-2 p-1 bg-slate-200/60 dark:bg-slate-800/60 rounded-2xl w-fit">
              <button
                onClick={() => setActiveTab('terms')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  activeTab === 'terms'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <FileText className="w-4 h-4" />
                Terms of Service
              </button>
              <button
                onClick={() => setActiveTab('privacy')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  activeTab === 'privacy'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                Privacy Policy
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
                title="Print document"
              >
                <Printer className="w-4 h-4" />
                Print
              </button>
              <a
                href="mailto:ayaicrypcoin@gmail.com"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
                title="Contact Support"
              >
                <Mail className="w-4 h-4 text-blue-500" />
                Contact
              </a>
            </div>
          </div>

          {/* Body Content - Markdown Viewer */}
          <div className="p-6 sm:p-10 overflow-y-auto flex-grow prose dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 text-sm leading-relaxed space-y-4">
            <ReactMarkdown
              components={{
                h1: ({ children }) => (
                  <h1 className="text-2xl sm:text-3xl font-display font-black text-slate-900 dark:text-white tracking-tight pb-3 border-b border-slate-200 dark:border-slate-800 mb-6">
                    {children}
                  </h1>
                ),
                h2: ({ children }) => (
                  <h2 className="text-lg font-black text-slate-900 dark:text-white mt-8 mb-3 tracking-tight flex items-center gap-2">
                    <span className="w-1.5 h-4 bg-blue-600 rounded-full inline-block"></span>
                    {children}
                  </h2>
                ),
                p: ({ children }) => (
                  <p className="mb-4 leading-relaxed font-medium text-slate-600 dark:text-slate-300 text-sm">
                    {children}
                  </p>
                ),
                ul: ({ children }) => (
                  <ul className="list-disc list-inside space-y-2 mb-4 pl-2 font-medium text-slate-600 dark:text-slate-300 text-sm">
                    {children}
                  </ul>
                ),
                li: ({ children }) => (
                  <li className="leading-relaxed">{children}</li>
                ),
                strong: ({ children }) => (
                  <strong className="font-bold text-slate-900 dark:text-white">{children}</strong>
                ),
                a: ({ href, children }) => (
                  <a
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 dark:text-blue-400 font-bold underline hover:text-blue-800 dark:hover:text-blue-300"
                  >
                    {children}
                  </a>
                )
              }}
            >
              {currentText}
            </ReactMarkdown>
          </div>

          {/* Footer Bar */}
          <div className="px-6 sm:px-8 py-4 bg-slate-50/90 dark:bg-slate-900/90 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>By using AI Study Buddy, you agree to these transparent terms.</span>
            </div>
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
            >
              I Understand & Agree
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
