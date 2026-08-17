import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Map,
  ExternalLink,
  Copy,
  Check,
  FileCode,
  Globe,
  Compass,
  Download,
  BookOpen,
  Sparkles,
  Bot
} from 'lucide-react';

interface SitemapModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateSection?: (sectionId: string) => void;
}

export interface SitemapEntry {
  title: string;
  url: string;
  path: string;
  category: 'Core' | 'Features' | 'Tools & Hubs' | 'Discovery' | 'SEO & Crawlers' | 'Legal';
  description: string;
  priority: string;
  changeFreq: string;
}

export const SITEMAP_ENTRIES: SitemapEntry[] = [
  {
    title: 'Main Application & AI Study Dashboard',
    url: 'https://www.yourstudybuddy.online/',
    path: '/',
    category: 'Core',
    description: 'Primary AI homework solver, multi-modal study document processor, and live AI tutor workspace.',
    priority: '1.0',
    changeFreq: 'Daily'
  },
  {
    title: 'Visual Interactive Sitemap',
    url: 'https://www.yourstudybuddy.online/sitemap',
    path: '/sitemap',
    category: 'Core',
    description: 'Full human and machine navigational directory of all application endpoints.',
    priority: '0.9',
    changeFreq: 'Weekly'
  },
  {
    title: 'Core Features & Capabilities',
    url: 'https://www.yourstudybuddy.online/#features',
    path: '#features',
    category: 'Features',
    description: 'Zero-hallucination document synthesis, 3D active recall flashcards, quiz generator, and step-by-step solver.',
    priority: '0.9',
    changeFreq: 'Weekly'
  },
  {
    title: 'How It Works (Step-by-Step Learning Engine)',
    url: 'https://www.yourstudybuddy.online/#how-it-works',
    path: '#how-it-works',
    category: 'Features',
    description: 'Upload textbook PDFs, lecture notes, or voice recordings and get instant verified citations.',
    priority: '0.85',
    changeFreq: 'Weekly'
  },
  {
    title: 'Subject Study Hubs',
    url: 'https://www.yourstudybuddy.online/#subjects',
    path: '#subjects',
    category: 'Tools & Hubs',
    description: 'Specialized study workspaces for Mathematics, STEM, Engineering, Medicine, Humanities, and Law.',
    priority: '0.85',
    changeFreq: 'Weekly'
  },
  {
    title: 'Product Comparison (vs Anki, Quizlet, Chegg, ChatGPT)',
    url: 'https://www.yourstudybuddy.online/#compare',
    path: '#compare',
    category: 'Tools & Hubs',
    description: 'Detailed feature-by-feature benchmark of AI Study Buddy vs traditional learning tools.',
    priority: '0.85',
    changeFreq: 'Weekly'
  },
  {
    title: 'Global University Admissions Matcher',
    url: 'https://www.yourstudybuddy.online/#university-matcher',
    path: '#university-matcher',
    category: 'Discovery',
    description: 'Interactive admissions requirement calculator and global college predictor for 100+ universities.',
    priority: '0.8',
    changeFreq: 'Weekly'
  },
  {
    title: 'International Scholarships Tracker',
    url: 'https://www.yourstudybuddy.online/#scholarships',
    path: '#scholarships',
    category: 'Discovery',
    description: 'Curated directory of fully funded and merit-based global university scholarships.',
    priority: '0.8',
    changeFreq: 'Weekly'
  },
  {
    title: 'AI Research, Blog & Trend Analysis Hub',
    url: 'https://www.yourstudybuddy.online/#blog',
    path: '#blog',
    category: 'Discovery',
    description: 'In-depth research, cognitive study frameworks, Google Trends search analyses, and architectural breakdowns.',
    priority: '0.9',
    changeFreq: 'Daily'
  },
  {
    title: 'How AI is Revolutionizing in This Era: 2026 Analysis',
    url: 'https://www.yourstudybuddy.online/#blog/how-ai-is-revolutionizing-in-this-era',
    path: '#blog/how-ai-is-revolutionizing-in-this-era',
    category: 'Discovery',
    description: 'Comprehensive analysis on Agentic AI, Google Search behavior changes, reasoning models, and educational transformations.',
    priority: '0.95',
    changeFreq: 'Weekly'
  },
  {
    title: 'The Science of Active Recall & SM-2 Spaced Repetition',
    url: 'https://www.yourstudybuddy.online/#blog/sm2-spaced-repetition-active-recall-guide',
    path: '#blog/sm2-spaced-repetition-active-recall-guide',
    category: 'Discovery',
    description: 'Why cramming fails and how cognitive memory algorithms combined with 3D digital flashcards rewire memory retention.',
    priority: '0.85',
    changeFreq: 'Weekly'
  },
  {
    title: 'Zero Hallucinations: Grounded AI Document Retrieval',
    url: 'https://www.yourstudybuddy.online/#blog/zero-hallucination-grounded-learning',
    path: '#blog/zero-hallucination-grounded-learning',
    category: 'Discovery',
    description: 'How vector search with page-level PDF grounding guarantees 100% verifiable study notes without hallucinations.',
    priority: '0.85',
    changeFreq: 'Weekly'
  },
  {
    title: 'Core Leadership & Engineering Team',
    url: 'https://www.yourstudybuddy.online/#team',
    path: '#team',
    category: 'Core',
    description: 'Meet the founders, engineers, and designers building AI Study Buddy (Ayan, Shahzaib, Shahroz, Jahanzaib).',
    priority: '0.8',
    changeFreq: 'Weekly'
  },
  {
    title: 'Frequently Asked Questions (AEO/GEO Engine)',
    url: 'https://www.yourstudybuddy.online/#faq',
    path: '#faq',
    category: 'Core',
    description: 'Answers to student questions regarding AI accuracy, file formats, and zero hallucination guarantees.',
    priority: '0.8',
    changeFreq: 'Weekly'
  },
  {
    title: 'Pricing & Pro Subscription Tier',
    url: 'https://www.yourstudybuddy.online/#pricing',
    path: '#pricing',
    category: 'Core',
    description: 'Transparent free and Pro unlimited academic study plans.',
    priority: '0.7',
    changeFreq: 'Monthly'
  },
  {
    title: 'Robots.txt Crawler Directives',
    url: 'https://www.yourstudybuddy.online/robots.txt',
    path: '/robots.txt',
    category: 'SEO & Crawlers',
    description: 'Search engine and AI web crawler indexation instructions.',
    priority: '0.6',
    changeFreq: 'Monthly'
  },
  {
    title: 'XML Machine-Readable Sitemap',
    url: 'https://www.yourstudybuddy.online/sitemap.xml',
    path: '/sitemap.xml',
    category: 'SEO & Crawlers',
    description: 'Official XML Sitemap protocol document for Googlebot, Bingbot, and Perplexity.',
    priority: '0.6',
    changeFreq: 'Daily'
  },
  {
    title: 'Terms of Service',
    url: 'https://www.yourstudybuddy.online/#terms',
    path: '#terms',
    category: 'Legal',
    description: 'Academic integrity policies, fair usage guidelines, and terms of service.',
    priority: '0.4',
    changeFreq: 'Monthly'
  },
  {
    title: 'Privacy Policy',
    url: 'https://www.yourstudybuddy.online/#privacy',
    path: '#privacy',
    category: 'Legal',
    description: 'Student data protection, encryption, and zero student-data-selling privacy pledge.',
    priority: '0.4',
    changeFreq: 'Monthly'
  }
];

export default function SitemapModal({ isOpen, onClose, onNavigateSection }: SitemapModalProps) {
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'visual' | 'xml' | 'robots'>('visual');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');

  if (!isOpen) return null;

  const categories = ['All', 'Core', 'Features', 'Tools & Hubs', 'Discovery', 'SEO & Crawlers', 'Legal'];

  const filteredEntries = categoryFilter === 'All'
    ? SITEMAP_ENTRIES
    : SITEMAP_ENTRIES.filter(e => e.category === categoryFilter);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUrl(id);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${SITEMAP_ENTRIES.map(e => `  <url>
    <loc>${e.url}</loc>
    <lastmod>2026-08-15</lastmod>
    <changefreq>${e.changeFreq.toLowerCase()}</changefreq>
    <priority>${e.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  const robotsContent = `# Robots.txt for AI Study Buddy
# Canonical Domain: https://www.yourstudybuddy.online
User-agent: *
Allow: /
Allow: /#features
Allow: /#how-it-works
Allow: /#subjects
Allow: /#compare
Allow: /#faq
Allow: /#pricing
Allow: /#team
Allow: /#scholarships
Allow: /#university-matcher
Allow: /sitemap
Allow: /sitemap.xml
Disallow: /api/

Sitemap: https://www.yourstudybuddy.online/sitemap.xml`;

  return (
    <AnimatePresence>
      <div
        id="sitemap-modal"
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
          {/* Header */}
          <div className="p-6 sm:p-8 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/80 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md">
                <Map className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-[10px] font-black uppercase tracking-wider border border-blue-200 dark:border-blue-800">
                    www.yourstudybuddy.online
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-display font-black text-slate-950 dark:text-white tracking-tight">
                  Website Sitemap &amp; Crawler Index
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
                  Official human and search engine index directory for AI Study Buddy
                </p>
              </div>
            </div>

            <button
              id="close-sitemap-btn"
              onClick={onClose}
              className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors cursor-pointer"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="px-6 sm:px-8 pt-4 pb-2 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('visual')}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === 'visual'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
                Visual Directory ({SITEMAP_ENTRIES.length})
              </button>
              <button
                onClick={() => setActiveTab('xml')}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === 'xml'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                <FileCode className="w-3.5 h-3.5" />
                sitemap.xml
              </button>
              <button
                onClick={() => setActiveTab('robots')}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === 'robots'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                <Bot className="w-3.5 h-3.5" />
                robots.txt
              </button>
            </div>

            <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
              <a
                href="/sitemap.xml"
                target="_blank"
                rel="noreferrer"
                className="hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1 hover:underline"
              >
                Open /sitemap.xml <ExternalLink className="w-3 h-3" />
              </a>
              <span>•</span>
              <a
                href="/robots.txt"
                target="_blank"
                rel="noreferrer"
                className="hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1 hover:underline"
              >
                Open /robots.txt <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Modal Body */}
          <div className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-6">
            {activeTab === 'visual' && (
              <>
                {/* Category Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setCategoryFilter(cat)}
                      className={`px-3 py-1.5 rounded-lg font-bold shrink-0 transition-all cursor-pointer ${
                        categoryFilter === cat
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredEntries.map((entry, idx) => (
                    <div
                      key={`sitemap-entry-${idx}`}
                      className="p-5 rounded-2xl bg-slate-50/90 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 hover:border-blue-500/60 transition-all duration-200 flex flex-col justify-between space-y-3 shadow-sm hover:shadow-md group"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 text-[10px] font-black uppercase tracking-wider">
                            {entry.category}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400">
                            Priority: {entry.priority} • {entry.changeFreq}
                          </span>
                        </div>
                        <h4 className="text-base font-display font-black text-slate-900 dark:text-white tracking-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {entry.title}
                        </h4>
                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                          {entry.description}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/80 flex items-center justify-between gap-2">
                        <div className="text-[11px] font-mono text-blue-600 dark:text-blue-400 truncate max-w-[240px] sm:max-w-xs">
                          {entry.url}
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => handleCopy(entry.url, `entry-${idx}`)}
                            className="p-1.5 rounded-lg bg-slate-200/70 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                            title="Copy URL"
                          >
                            {copiedUrl === `entry-${idx}` ? (
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                          {entry.path.startsWith('#') && onNavigateSection ? (
                            <button
                              onClick={() => {
                                onClose();
                                onNavigateSection(entry.path.replace('#', ''));
                              }}
                              className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-black transition-colors cursor-pointer flex items-center gap-1"
                            >
                              Visit <ExternalLink className="w-3 h-3" />
                            </button>
                          ) : (
                            <a
                              href={entry.url}
                              className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-black transition-colors cursor-pointer flex items-center gap-1"
                            >
                              Open <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {activeTab === 'xml' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-slate-500">
                    Live XML output for search engine discovery and GEO indexing:
                  </div>
                  <button
                    onClick={() => handleCopy(xmlContent, 'xml-full')}
                    className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    {copiedUrl === 'xml-full' ? (
                      <>
                        <Check className="w-3.5 h-3.5" /> Copied XML
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" /> Copy Raw XML
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-4 rounded-2xl bg-slate-950 text-slate-200 text-xs font-mono overflow-x-auto border border-slate-800 leading-relaxed max-h-[50vh]">
                  {xmlContent}
                </pre>
              </div>
            )}

            {activeTab === 'robots' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-slate-500">
                    Robots crawler directives (Googlebot, Bingbot, PerplexityBot, GPTBot, ClaudeBot):
                  </div>
                  <button
                    onClick={() => handleCopy(robotsContent, 'robots-full')}
                    className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    {copiedUrl === 'robots-full' ? (
                      <>
                        <Check className="w-3.5 h-3.5" /> Copied robots.txt
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" /> Copy robots.txt
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-4 rounded-2xl bg-slate-950 text-slate-200 text-xs font-mono overflow-x-auto border border-slate-800 leading-relaxed max-h-[50vh]">
                  {robotsContent}
                </pre>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 sm:p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex items-center justify-between">
            <div className="text-[11px] font-bold text-slate-500">
              AI Study Buddy • Canonical Domain: https://www.yourstudybuddy.online
            </div>
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md"
            >
              Close Sitemap
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
