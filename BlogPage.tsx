import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, 
  Sparkles, 
  ArrowLeft, 
  Search, 
  Clock, 
  Calendar, 
  Share2, 
  Bookmark, 
  Check, 
  ChevronRight, 
  TrendingUp, 
  Volume2, 
  VolumeX, 
  Copy, 
  ExternalLink, 
  BrainCircuit, 
  CheckCircle2, 
  HelpCircle, 
  SlidersHorizontal,
  Flame,
  FileText,
  User,
  ShieldCheck,
  ChevronDown,
  ArrowRight,
  Sun,
  Moon
} from 'lucide-react';
import { BLOG_POSTS, BlogPost } from '../data/blogData';
import { cn } from '../lib/utils';

interface BlogPageProps {
  initialSlug?: string | null;
  onBackToHome: () => void;
  onEnterWorkspace: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export default function BlogPage({
  initialSlug,
  onBackToHome,
  onEnterWorkspace,
  isDarkMode,
  onToggleDarkMode
}: BlogPageProps) {
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(() => {
    if (initialSlug) {
      const match = BLOG_POSTS.find(p => p.slug === initialSlug || p.id === initialSlug);
      return match || null;
    }
    return null;
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [copiedLink, setCopiedLink] = useState(false);
  const [bookmarkedPosts, setBookmarkedPosts] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('study_buddy_saved_blogs');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [activeTocId, setActiveTocId] = useState<string>('');
  const [fontSizeMultiplier, setFontSizeMultiplier] = useState<'normal' | 'large' | 'xlarge'>('normal');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [expandedFaqs, setExpandedFaqs] = useState<Record<number, boolean>>({ 0: true });

  // Update selected post if initialSlug changes from URL
  useEffect(() => {
    if (initialSlug) {
      const match = BLOG_POSTS.find(p => p.slug === initialSlug || p.id === initialSlug);
      if (match) {
        setSelectedPost(match);
      }
    }
  }, [initialSlug]);

  // Scroll to top when opening an article and sync SEO meta & Schema.org JSON-LD
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (selectedPost) {
      window.location.hash = `blog/${selectedPost.slug}`;
      document.title = `${selectedPost.seoTitle} | AI Study Buddy Research`;
      
      // Update meta description
      let metaDesc = document.querySelector('meta[name="description"]');
      if (!metaDesc) {
        metaDesc = document.createElement('meta');
        metaDesc.setAttribute('name', 'description');
        document.head.appendChild(metaDesc);
      }
      metaDesc.setAttribute('content', selectedPost.metaDescription);

      // Inject Schema.org JSON-LD script
      let jsonLdScript = document.getElementById('blog-schema-ld');
      if (!jsonLdScript) {
        jsonLdScript = document.createElement('script');
        jsonLdScript.setAttribute('id', 'blog-schema-ld');
        jsonLdScript.setAttribute('type', 'application/ld+json');
        document.head.appendChild(jsonLdScript);
      }
      jsonLdScript.textContent = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        "headline": selectedPost.title,
        "description": selectedPost.metaDescription,
        "datePublished": selectedPost.publishedAt,
        "author": {
          "@type": "Person",
          "name": selectedPost.author.name,
          "jobTitle": selectedPost.author.role
        },
        "publisher": {
          "@type": "Organization",
          "name": "AI Study Buddy"
        },
        "keywords": selectedPost.targetKeywords.join(', ')
      });

    } else {
      window.location.hash = 'blog';
      document.title = 'AI Study Buddy Research & Blog | Google Trends & Cognitive Science';
    }
  }, [selectedPost]);

  // Update Table of Contents on scroll
  useEffect(() => {
    if (!selectedPost) return;

    const handleScroll = () => {
      const headings = selectedPost.tableOfContents.map(item => document.getElementById(item.id));
      const scrollPosition = window.scrollY + 180;

      for (let i = headings.length - 1; i >= 0; i--) {
        const heading = headings[i];
        if (heading && heading.offsetTop <= scrollPosition) {
          setActiveTocId(selectedPost.tableOfContents[i].id);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [selectedPost]);

  // Stop speech if navigating away
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const categories = ['All', 'Artificial Intelligence', 'Future of Education', 'Productivity & Agents', 'Tech Trends'];

  const filteredPosts = useMemo(() => {
    return BLOG_POSTS.filter(post => {
      const matchesCategory = selectedCategory === 'All' || post.category === selectedCategory;
      const matchesSearch = 
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.targetKeywords.some(kw => kw.toLowerCase().includes(searchQuery.toLowerCase())) ||
        post.relatedTags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, selectedCategory]);

  const toggleBookmark = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setBookmarkedPosts(prev => {
      const updated = prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id];
      try {
        localStorage.setItem('study_buddy_saved_blogs', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const handleShareTwitter = () => {
    if (!selectedPost) return;
    const text = encodeURIComponent(`"${selectedPost.title}" — Deep dive on AI education trends & cognitive research via AI Study Buddy:`);
    const url = encodeURIComponent(window.location.href);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank', 'noopener,noreferrer');
  };

  const handleShareLinkedIn = () => {
    if (!selectedPost) return;
    const url = encodeURIComponent(window.location.href);
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank', 'noopener,noreferrer');
  };

  const handleShareFacebook = () => {
    if (!selectedPost) return;
    const url = encodeURIComponent(window.location.href);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank', 'noopener,noreferrer');
  };

  const handleShareWhatsApp = () => {
    if (!selectedPost) return;
    const text = encodeURIComponent(`Check out this analysis on AI education trends: "${selectedPost.title}" — ${window.location.href}`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank', 'noopener,noreferrer');
  };

  const toggleTextToSpeech = () => {
    if (!('speechSynthesis' in window) || !selectedPost) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      window.speechSynthesis.cancel();
      const textToRead = `${selectedPost.title}. ${selectedPost.subtitle}. Key takeaways: ${selectedPost.keyTakeaways.join('. ')}`;
      const utterance = new SpeechSynthesisUtterance(textToRead);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
  };

  const toggleFaq = (index: number) => {
    setExpandedFaqs(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const featuredPost = BLOG_POSTS.find(p => p.featured) || BLOG_POSTS[0];

  return (
    <div className="min-h-screen w-full bg-[#fcfbf9] dark:bg-[#030712] text-slate-900 dark:text-slate-100 font-sans selection:bg-blue-600 selection:text-white transition-colors duration-300 flex flex-col">
      
      {/* 1. Header Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-4">
          
          {/* Back / Logo */}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => {
                if (selectedPost) {
                  setSelectedPost(null);
                } else {
                  onBackToHome();
                }
              }}
              className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
              title="Return"
            >
              <ArrowLeft className="w-4 h-4" /> {selectedPost ? 'All Articles' : 'Home'}
            </button>

            <div 
              className="flex items-center gap-2.5 cursor-pointer pl-2 border-l border-slate-200 dark:border-slate-800"
              onClick={() => {
                setSelectedPost(null);
                onBackToHome();
              }}
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-md">
                <BookOpen className="w-5 h-5" />
              </div>
              <div className="hidden sm:block">
                <div className="font-display font-black text-base sm:text-lg tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                  AI Study <span className="text-blue-600">BLOG</span>
                  <span className="text-[10px] bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
                    2026 Insights
                  </span>
                </div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Research &amp; Trends</p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={onToggleDarkMode}
              className="w-10 h-10 flex items-center justify-center rounded-2xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
              title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDarkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-blue-600" />}
            </button>

            <button
              onClick={onEnterWorkspace}
              className="px-4 sm:px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-xs uppercase tracking-wider shadow-md hover:scale-105 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
            >
              <BrainCircuit className="w-4 h-4" /> <span className="hidden md:inline">Open</span> Workspace
            </button>
          </div>
        </div>
      </header>

      {/* 2. Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-10">
        
        {/* ========================================================================= */}
        {/* VIEW 1: SINGLE ARTICLE READER VIEW */}
        {/* ========================================================================= */}
        {selectedPost ? (
          <article className="space-y-8 animate-fadeIn">
            
            {/* Breadcrumb Navigation */}
            <nav className="flex items-center gap-2 text-xs font-bold text-slate-500 flex-wrap">
              <button onClick={() => setSelectedPost(null)} className="hover:text-blue-600 cursor-pointer">
                Blog &amp; Research
              </button>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-blue-600 dark:text-blue-400">{selectedPost.category}</span>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="truncate max-w-xs text-slate-700 dark:text-slate-300">{selectedPost.title}</span>
            </nav>

            {/* Article Hero Banner & Header */}
            <div className="space-y-5">
              
              {/* Category, Date & Read Time */}
              <div className="flex flex-wrap items-center gap-3 text-xs font-black">
                <span className="px-3.5 py-1 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 rounded-full border border-blue-200 dark:border-blue-800 uppercase tracking-wider">
                  {selectedPost.category}
                </span>
                <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                  <Calendar className="w-4 h-4" /> {selectedPost.publishedAt}
                </span>
                <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                  <Clock className="w-4 h-4" /> {selectedPost.readTime}
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 rounded-full border border-blue-200 dark:border-blue-800">
                  <TrendingUp className="w-3.5 h-3.5" /> Google Trends Score: {selectedPost.googleTrendsScore}/100
                </span>
              </div>

              {/* Title & Subtitle */}
              <h1 className={cn(
                "font-display font-black text-slate-900 dark:text-white tracking-tight leading-[1.2]",
                fontSizeMultiplier === 'normal' ? "text-2xl sm:text-4xl lg:text-5xl" :
                fontSizeMultiplier === 'large' ? "text-3xl sm:text-5xl lg:text-6xl" :
                "text-4xl sm:text-6xl lg:text-7xl"
              )}>
                {selectedPost.title}
              </h1>

              <p className="text-base sm:text-xl text-slate-600 dark:text-slate-300 font-medium leading-relaxed max-w-4xl">
                {selectedPost.subtitle}
              </p>

              {/* Author & Reviewer Info Bar */}
              <div className="pt-4 pb-2 border-y border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
                
                <div className="flex items-center gap-3.5">
                  <img 
                    src={selectedPost.author.avatar} 
                    alt={`${selectedPost.author.name} – ${selectedPost.author.role}`}
                    loading="lazy"
                    decoding="async"
                    referrerPolicy="no-referrer"
                    className="w-12 h-12 rounded-2xl object-cover border-2 border-blue-600 shadow-sm"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-display font-black text-slate-900 dark:text-white text-sm sm:text-base">
                        {selectedPost.author.name}
                      </span>
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-md border border-blue-200 dark:border-blue-800">
                        Author
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">{selectedPost.author.role}</p>
                  </div>
                </div>

                {selectedPost.reviewer && (
                  <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 bg-slate-50 dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    <span>Fact-checked by <strong>{selectedPost.reviewer.name}</strong> ({selectedPost.reviewer.role})</span>
                  </div>
                )}

                {/* Reader Utility Tools */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={toggleTextToSpeech}
                    className={cn(
                      "px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer border shadow-sm",
                      isSpeaking ? "bg-amber-500 text-white border-amber-600 animate-pulse" : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
                    )}
                    title={isSpeaking ? "Stop Voice Narration" : "Listen to Article Summary"}
                  >
                    {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-blue-600" />}
                    <span className="hidden md:inline">{isSpeaking ? 'Stop Audio' : 'Listen Summary'}</span>
                  </button>

                  {/* Font Size Adjuster */}
                  <div className="flex items-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-0.5 text-xs font-black">
                    <button
                      onClick={() => setFontSizeMultiplier('normal')}
                      className={cn("px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors", fontSizeMultiplier === 'normal' ? "bg-blue-600 text-white" : "text-slate-600 dark:text-slate-400 hover:text-blue-600")}
                    >
                      A
                    </button>
                    <button
                      onClick={() => setFontSizeMultiplier('large')}
                      className={cn("px-2.5 py-1.5 rounded-lg text-sm cursor-pointer transition-colors", fontSizeMultiplier === 'large' ? "bg-blue-600 text-white" : "text-slate-600 dark:text-slate-400 hover:text-blue-600")}
                    >
                      A+
                    </button>
                  </div>

                  <button
                    onClick={() => toggleBookmark(selectedPost.id)}
                    className={cn(
                      "p-2 rounded-xl border transition-all cursor-pointer shadow-sm",
                      bookmarkedPosts.includes(selectedPost.id) ? "bg-amber-50 dark:bg-amber-950/60 text-amber-600 border-amber-300" : "bg-white dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-800 hover:text-slate-900 dark:hover:text-white"
                    )}
                    title="Bookmark Article"
                  >
                    <Bookmark className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Cover Image */}
              <div className="relative rounded-3xl overflow-hidden shadow-xl border border-slate-200 dark:border-slate-800 max-h-[480px]">
                <img 
                  src={selectedPost.coverImage} 
                  alt={`${selectedPost.title} – Detailed Research Article Banner`}
                  loading="lazy"
                  decoding="async"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-6 sm:p-8">
                  <div className="text-white space-y-1">
                    <p className="text-[11px] font-black uppercase tracking-widest text-blue-400">Featured In-Depth Investigation</p>
                    <p className="text-sm sm:text-base font-bold text-slate-200 max-w-2xl">
                      Synthesizing 2026 AI breakthroughs, Google Search query transformations, and cognitive learning models.
                    </p>
                  </div>
                </div>
              </div>

            </div>

            {/* Article Body Grid (Main Column + Sticky Sidebar) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-4">
              
              {/* Left Column: Table of Contents & Social Share (Sticky on Desktop) */}
              <aside className="lg:col-span-4 space-y-6 order-2 lg:order-1">
                
                {/* Table of Contents Box */}
                <div className="sticky top-24 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-md space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                    <h3 className="font-display font-black text-xs uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                      <SlidersHorizontal className="w-4 h-4 text-blue-600" /> Table of Contents
                    </h3>
                    <span className="text-[10px] font-bold text-slate-400">{selectedPost.tableOfContents.length} Sections</span>
                  </div>

                  <nav className="space-y-1 text-xs font-semibold max-h-[380px] overflow-y-auto pr-1">
                    {selectedPost.tableOfContents.map((item) => (
                      <a
                        key={item.id}
                        href={`#${item.id}`}
                        onClick={(e) => {
                          e.preventDefault();
                          const el = document.getElementById(item.id);
                          el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          setActiveTocId(item.id);
                        }}
                        className={cn(
                          "block py-2 px-3 rounded-xl transition-all leading-snug",
                          activeTocId === item.id 
                            ? "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-800 translate-x-1" 
                            : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                        )}
                      >
                        {item.title}
                      </a>
                    ))}
                  </nav>

                  {/* Share Article Bar */}
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Share Insights</p>
                      <Share2 className="w-3.5 h-3.5 text-slate-400" />
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={handleShareLinkedIn}
                        className="py-2.5 px-2 bg-[#0077b5]/10 hover:bg-[#0077b5]/20 text-[#0077b5] dark:text-[#38a0dc] rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                        title="Share on LinkedIn"
                      >
                        <svg className="w-3.5 h-3.5 fill-current shrink-0" viewBox="0 0 24 24">
                          <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.6 1.6 0 1 0 0-3.2 1.6 1.6 0 0 0 0 3.2m1.4 9.74V10.13H5.06v8.37h2.8z"/>
                        </svg>
                        <span>LinkedIn</span>
                      </button>

                      <button
                        onClick={handleShareTwitter}
                        className="py-2.5 px-2 bg-slate-900/10 dark:bg-white/10 hover:bg-slate-900/20 dark:hover:bg-white/20 text-slate-900 dark:text-white rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                        title="Share on Twitter / 𝕏"
                      >
                        <svg className="w-3.5 h-3.5 fill-current shrink-0" viewBox="0 0 24 24">
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                        </svg>
                        <span>𝕏 Post</span>
                      </button>

                      <button
                        onClick={handleShareFacebook}
                        className="py-2.5 px-2 bg-[#1877f2]/10 hover:bg-[#1877f2]/20 text-[#1877f2] dark:text-[#4294ff] rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                        title="Share on Facebook"
                      >
                        <svg className="w-3.5 h-3.5 fill-current shrink-0" viewBox="0 0 24 24">
                          <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c5.05-.5 9-4.76 9-9.95z"/>
                        </svg>
                        <span>Facebook</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleShareWhatsApp}
                        className="flex-1 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                        title="Share on WhatsApp"
                      >
                        WhatsApp
                      </button>
                      <button
                        onClick={handleCopyLink}
                        className={cn(
                          "flex-1 py-2 rounded-xl transition-all cursor-pointer border text-xs font-black flex items-center justify-center gap-1.5 active:scale-95",
                          copiedLink ? "bg-emerald-600 text-white border-emerald-600" : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700"
                        )}
                        title="Copy Link"
                      >
                        {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
                      </button>
                    </div>

                    {copiedLink && (
                      <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 text-center animate-fadeIn">
                        ✓ Link copied to clipboard!
                      </p>
                    )}
                  </div>

                  {/* Try Workspace Card */}
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white space-y-2.5 shadow-md">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span className="font-display font-black text-xs uppercase tracking-wider">Experience AI Study Buddy</span>
                    </div>
                    <p className="text-xs text-blue-100 font-medium">
                      Turn your 200+ page textbook into 3D flashcards, practice quizzes, and citation-grounded notes in seconds.
                    </p>
                    <button
                      onClick={onEnterWorkspace}
                      className="w-full py-2 bg-white text-blue-700 rounded-xl font-black text-xs uppercase tracking-wider hover:bg-blue-50 transition-all shadow-sm cursor-pointer"
                    >
                      Start Free Trial &rarr;
                    </button>
                  </div>

                </div>

              </aside>

              {/* Right Column: Full Rich Article Text */}
              <div className="lg:col-span-8 space-y-8 order-1 lg:order-2">
                
                {/* Key Takeaways Card */}
                <div className="bg-blue-50/80 dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-blue-200 dark:border-blue-900/60 shadow-sm space-y-4">
                  <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 font-display font-black text-sm uppercase tracking-wider">
                    <Sparkles className="w-5 h-5" /> Executive Summary &amp; Key Takeaways
                  </div>
                  <ul className="space-y-2.5">
                    {selectedPost.keyTakeaways.map((takeaway, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-xs sm:text-sm text-slate-700 dark:text-slate-200 font-medium leading-relaxed">
                        <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                        <span>{takeaway}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Key Industry Stats Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                  {selectedPost.stats.map((stat, idx) => (
                    <div key={idx} className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1 text-center sm:text-left">
                      <div className="font-display font-black text-2xl sm:text-3xl text-blue-600 dark:text-blue-400">
                        {stat.value}
                      </div>
                      <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300 leading-tight">
                        {stat.label}
                      </p>
                      <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest">
                        {stat.source}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Dynamic Content Renderer */}
                <div className={cn(
                  "space-y-6 text-slate-800 dark:text-slate-200 leading-relaxed font-sans",
                  fontSizeMultiplier === 'normal' ? "text-base sm:text-lg" :
                  fontSizeMultiplier === 'large' ? "text-lg sm:text-xl" :
                  "text-xl sm:text-2xl"
                )}>
                  {selectedPost.content.map((block, idx) => {
                    if (block.type === 'heading2') {
                      return (
                        <h2 
                          key={idx} 
                          id={block.id} 
                          className="font-display font-black text-slate-900 dark:text-white text-xl sm:text-3xl pt-6 pb-2 border-b border-slate-200 dark:border-slate-800 scroll-mt-24 tracking-tight"
                        >
                          {block.text}
                        </h2>
                      );
                    }

                    if (block.type === 'heading3') {
                      return (
                        <h3 
                          key={idx} 
                          className="font-display font-black text-slate-900 dark:text-white text-lg sm:text-2xl pt-4 scroll-mt-24"
                        >
                          {block.text}
                        </h3>
                      );
                    }

                    if (block.type === 'paragraph') {
                      return (
                        <p key={idx} className="leading-relaxed text-slate-700 dark:text-slate-300 font-normal">
                          {block.text}
                        </p>
                      );
                    }

                    if (block.type === 'callout') {
                      return (
                        <div key={idx} className="p-6 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 space-y-2">
                          {block.highlight && (
                            <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200 rounded-md">
                              {block.highlight}
                            </span>
                          )}
                          <p className="text-sm sm:text-base font-semibold text-amber-950 dark:text-amber-200 leading-relaxed pt-1">
                            {block.text}
                          </p>
                        </div>
                      );
                    }

                    if (block.type === 'quote') {
                      return (
                        <blockquote key={idx} className="p-6 sm:p-8 rounded-2xl bg-slate-900 text-white space-y-3 my-6 border-l-4 border-blue-500 shadow-md">
                          <p className="text-base sm:text-xl font-display font-bold italic leading-snug">
                            {block.text}
                          </p>
                          {block.highlight && (
                            <p className="text-xs font-black uppercase tracking-wider text-blue-400 text-right">
                              — {block.highlight}
                            </p>
                          )}
                        </blockquote>
                      );
                    }

                    if (block.type === 'list' && block.items) {
                      return (
                        <ul key={idx} className="space-y-3 my-4">
                          {block.items.map((item, itemIdx) => (
                            <li key={itemIdx} className="flex items-start gap-3 text-sm sm:text-base text-slate-700 dark:text-slate-300">
                              <div className="w-2 h-2 rounded-full bg-blue-600 mt-2 shrink-0" />
                              <span className="leading-relaxed">{item}</span>
                            </li>
                          ))}
                        </ul>
                      );
                    }

                    if (block.type === 'table' && block.tableData) {
                      return (
                        <div key={idx} className="my-6 overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
                          <table className="w-full text-left text-xs sm:text-sm">
                            <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-900 dark:text-white font-black uppercase tracking-wider text-[11px]">
                              <tr>
                                {block.tableData.headers.map((h, hIdx) => (
                                  <th key={hIdx} className="p-3.5 sm:p-4 border-b border-slate-200 dark:border-slate-700">
                                    {h}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                              {block.tableData.rows.map((row, rIdx) => (
                                <tr key={rIdx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                                  {row.map((cell, cIdx) => (
                                    <td key={cIdx} className={cn("p-3.5 sm:p-4", cIdx === 0 ? "font-bold text-slate-900 dark:text-white" : "text-slate-600 dark:text-slate-300")}>
                                      {cell}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      );
                    }

                    if (block.type === 'faq' && block.faqs) {
                      return (
                        <div key={idx} className="space-y-3 my-6">
                          {block.faqs.map((faq, fIdx) => {
                            const isOpen = Boolean(expandedFaqs[fIdx]);
                            return (
                              <div 
                                key={fIdx} 
                                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm transition-all"
                              >
                                <button
                                  onClick={() => toggleFaq(fIdx)}
                                  className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 font-display font-black text-sm sm:text-base text-slate-900 dark:text-white hover:text-blue-600 transition-colors cursor-pointer"
                                >
                                  <span className="flex items-center gap-2">
                                    <HelpCircle className="w-4 h-4 text-blue-600 shrink-0" /> {faq.question}
                                  </span>
                                  <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0", isOpen && "rotate-180 text-blue-600")} />
                                </button>
                                {isOpen && (
                                  <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium leading-relaxed border-t border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/50">
                                    {faq.answer}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      );
                    }

                    return null;
                  })}
                </div>

                {/* Related Topics Pill Cloud */}
                <div className="pt-6 border-t border-slate-200 dark:border-slate-800 space-y-3">
                  <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">Related Topics</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedPost.relatedTags.map((tag, idx) => (
                      <span key={idx} className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Social Media Sharing Banner */}
                <div className="p-6 sm:p-7 rounded-3xl bg-slate-50/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h4 className="font-display font-black text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
                        <Share2 className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Share This Research &amp; Insights
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                        Help fellow students, educators, and researchers discover grounded AI study workflows and cognitive trends.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5 pt-1">
                    <button
                      onClick={handleShareLinkedIn}
                      className="px-4 py-2.5 bg-[#0077b5] hover:bg-[#006097] text-white rounded-xl text-xs font-black transition-all flex items-center gap-2 shadow-xs cursor-pointer hover:scale-105 active:scale-95"
                      title="Share to LinkedIn Network"
                    >
                      <svg className="w-3.5 h-3.5 fill-current shrink-0" viewBox="0 0 24 24">
                        <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.6 1.6 0 1 0 0-3.2 1.6 1.6 0 0 0 0 3.2m1.4 9.74V10.13H5.06v8.37h2.8z"/>
                      </svg>
                      <span>Share on LinkedIn</span>
                    </button>

                    <button
                      onClick={handleShareTwitter}
                      className="px-4 py-2.5 bg-slate-900 hover:bg-black dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 rounded-xl text-xs font-black transition-all flex items-center gap-2 shadow-xs cursor-pointer hover:scale-105 active:scale-95"
                      title="Post on 𝕏 (Twitter)"
                    >
                      <svg className="w-3.5 h-3.5 fill-current shrink-0" viewBox="0 0 24 24">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                      </svg>
                      <span>Post on 𝕏</span>
                    </button>

                    <button
                      onClick={handleShareFacebook}
                      className="px-4 py-2.5 bg-[#1877f2] hover:bg-[#1567d3] text-white rounded-xl text-xs font-black transition-all flex items-center gap-2 shadow-xs cursor-pointer hover:scale-105 active:scale-95"
                      title="Share on Facebook"
                    >
                      <svg className="w-3.5 h-3.5 fill-current shrink-0" viewBox="0 0 24 24">
                        <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c5.05-.5 9-4.76 9-9.95z"/>
                      </svg>
                      <span>Share on Facebook</span>
                    </button>

                    <button
                      onClick={handleShareWhatsApp}
                      className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all flex items-center gap-2 shadow-xs cursor-pointer hover:scale-105 active:scale-95"
                      title="Share via WhatsApp"
                    >
                      <span>WhatsApp</span>
                    </button>

                    <button
                      onClick={handleCopyLink}
                      className={cn(
                        "px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 shadow-xs cursor-pointer border hover:scale-105 active:scale-95",
                        copiedLink 
                          ? "bg-emerald-600 text-white border-emerald-600" 
                          : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
                      )}
                      title="Copy Article Link"
                    >
                      {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedLink ? 'Link Copied!' : 'Copy Link'}</span>
                    </button>
                  </div>
                </div>

                {/* Author Bio Footer Box */}
                <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md flex flex-col sm:flex-row items-start sm:items-center gap-5">
                  <img 
                    src={selectedPost.author.avatar} 
                    alt={`${selectedPost.author.name} – ${selectedPost.author.role}`}
                    loading="lazy"
                    decoding="async"
                    referrerPolicy="no-referrer"
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-blue-600 shadow-sm shrink-0"
                  />
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-display font-black text-base text-slate-900 dark:text-white">{selectedPost.author.name}</h4>
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 rounded-md">
                        {selectedPost.author.role}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                      {selectedPost.author.bio}
                    </p>
                  </div>
                </div>

                {/* Bottom CTA Banner */}
                <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-700 to-slate-900 text-white text-center space-y-4 shadow-xl">
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-xs font-black uppercase tracking-wider text-amber-300">
                    <Flame className="w-4 h-4" /> Ready to Experience Citation-Grounded AI?
                  </div>
                  <h3 className="font-display font-black text-2xl sm:text-4xl tracking-tight">
                    Transform How You Learn in the AI Era
                  </h3>
                  <p className="text-sm sm:text-base text-blue-100 max-w-xl mx-auto font-medium">
                    Join over 50,000+ students mastering calculus, chemistry, medicine, and engineering with zero hallucinations.
                  </p>
                  <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
                    <button
                      onClick={onEnterWorkspace}
                      className="px-6 py-3.5 bg-white hover:bg-blue-50 text-blue-700 rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center gap-2"
                    >
                      <Sparkles className="w-4 h-4" /> Start Studying Free
                    </button>
                    <button
                      onClick={() => setSelectedPost(null)}
                      className="px-6 py-3.5 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-black text-xs uppercase tracking-wider border border-white/20 transition-all cursor-pointer"
                    >
                      Browse More Articles
                    </button>
                  </div>
                </div>

              </div>

            </div>

          </article>
        ) : (
          /* ========================================================================= */
          /* VIEW 2: BLOG LIST & DIRECTORY */
          /* ========================================================================= */
          <div className="space-y-10">
            
            {/* Page Header */}
            <div className="text-center space-y-4 max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 text-xs font-black uppercase tracking-wider border border-blue-200 dark:border-blue-800">
                <TrendingUp className="w-4 h-4" /> Educational AI Insights &amp; Google Trends Analysis
              </div>
              
              <h1 className="font-display font-black text-3xl sm:text-5xl text-slate-900 dark:text-white tracking-tight">
                Explore the Frontier of <span className="text-blue-600">AI &amp; Education</span>
              </h1>
              
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                In-depth research, cognitive study frameworks, Google Trends search analyses, and architectural breakdowns written by the AI Study Buddy engineering team.
              </p>
            </div>

            {/* Search and Category Filter Bar */}
            <div className="space-y-4 max-w-4xl mx-auto">
              
              {/* Search Box */}
              <div className="relative">
                <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search articles, keywords (e.g., 'how AI is revolutionizing', 'SM-2', 'reasoning')..."
                  className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={cn(
                      "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer shadow-sm",
                      selectedCategory === cat
                        ? "bg-blue-600 text-white shadow-blue-500/20"
                        : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Featured Hero Article Banner */}
            {(!searchQuery && selectedCategory === 'All') && (
              <div 
                onClick={() => setSelectedPost(featuredPost)}
                className="group relative rounded-3xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl cursor-pointer hover:border-blue-500/50 transition-all duration-300"
              >
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
                  
                  {/* Image half */}
                  <div className="lg:col-span-7 relative min-h-[300px] sm:min-h-[380px] overflow-hidden">
                    <img 
                      src={featuredPost.coverImage} 
                      alt={`${featuredPost.title} – Featured In-Depth AI Study Article Banner`}
                      loading="lazy"
                      decoding="async"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-4 left-4 flex flex-wrap items-center gap-2">
                      <span className="px-3.5 py-1 bg-amber-500 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-md flex items-center gap-1.5">
                        <Flame className="w-3.5 h-3.5" /> Featured Analysis
                      </span>
                      <span className="px-3 py-1 bg-black/60 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest rounded-full">
                        {featuredPost.readTime}
                      </span>
                    </div>
                  </div>

                  {/* Content half */}
                  <div className="lg:col-span-5 p-6 sm:p-10 flex flex-col justify-between space-y-6">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-xs font-black text-blue-600 dark:text-blue-400">
                        <span>{featuredPost.category}</span>
                        <span>•</span>
                        <span className="text-slate-400">{featuredPost.publishedAt}</span>
                      </div>

                      <h2 className="font-display font-black text-xl sm:text-2xl lg:text-3xl text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors leading-tight">
                        {featuredPost.title}
                      </h2>

                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium line-clamp-3 leading-relaxed">
                        {featuredPost.subtitle}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <img 
                          src={featuredPost.author.avatar} 
                          alt={`${featuredPost.author.name} – ${featuredPost.author.role}`}
                          loading="lazy"
                          decoding="async"
                          referrerPolicy="no-referrer"
                          className="w-9 h-9 rounded-xl object-cover border border-blue-500"
                        />
                        <div>
                          <p className="font-bold text-xs text-slate-900 dark:text-white">{featuredPost.author.name}</p>
                          <p className="text-[10px] text-slate-500">{featuredPost.author.role}</p>
                        </div>
                      </div>

                      <span className="text-xs font-black text-blue-600 dark:text-blue-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                        Read Article &rarr;
                      </span>
                    </div>

                  </div>
                </div>
              </div>
            )}

            {/* Grid of Articles */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-display font-black text-lg text-slate-900 dark:text-white">
                  {searchQuery ? `Search Results for "${searchQuery}"` : 'All Articles & Investigations'}
                </h3>
                <span className="text-xs font-bold text-slate-400">{filteredPosts.length} Articles</span>
              </div>

              {filteredPosts.length === 0 ? (
                <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
                  <Search className="w-10 h-10 text-slate-400 mx-auto" />
                  <h4 className="font-bold text-base text-slate-800 dark:text-slate-200">No articles matched your search</h4>
                  <p className="text-xs text-slate-500">Try searching for broader keywords like "AI", "Flashcards", or "Reasoning".</p>
                  <button
                    onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-wider"
                  >
                    Reset Filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredPosts.map((post) => (
                    <div
                      key={post.id}
                      onClick={() => setSelectedPost(post)}
                      className="group bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-md hover:shadow-xl hover:border-blue-500/50 transition-all duration-300 flex flex-col justify-between cursor-pointer"
                    >
                      <div>
                        {/* Thumbnail */}
                        <div className="relative h-48 overflow-hidden">
                          <img 
                            src={post.coverImage} 
                            alt={`${post.title} – Article Preview Thumbnail`}
                            loading="lazy"
                            decoding="async"
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute top-3 left-3">
                            <span className="px-3 py-1 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md text-slate-900 dark:text-white text-[10px] font-black uppercase tracking-wider rounded-full border border-slate-200/50 dark:border-slate-800/50 shadow-sm">
                              {post.category}
                            </span>
                          </div>
                          <button
                            onClick={(e) => toggleBookmark(post.id, e)}
                            className={cn(
                              "absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition-all shadow-sm",
                              bookmarkedPosts.includes(post.id) ? "bg-amber-500 text-white" : "bg-black/40 text-white hover:bg-black/60"
                            )}
                          >
                            <Bookmark className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Text Details */}
                        <div className="p-6 space-y-3">
                          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400">
                            <span>{post.publishedAt}</span>
                            <span>•</span>
                            <span>{post.readTime}</span>
                          </div>

                          <h3 className="font-display font-black text-base sm:text-lg text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug">
                            {post.title}
                          </h3>

                          <p className="text-xs text-slate-600 dark:text-slate-300 font-medium line-clamp-2 leading-relaxed">
                            {post.subtitle}
                          </p>
                        </div>
                      </div>

                      {/* Footer Info */}
                      <div className="px-6 pb-6 pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-2">
                          <img 
                            src={post.author.avatar} 
                            alt={`${post.author.name} – ${post.author.role}`}
                            loading="lazy"
                            decoding="async"
                            referrerPolicy="no-referrer"
                            className="w-7 h-7 rounded-lg object-cover border border-blue-500"
                          />
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{post.author.name}</span>
                        </div>

                        <span className="text-xs font-black text-blue-600 dark:text-blue-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                          Read &rarr;
                        </span>
                      </div>

                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

      </main>

      {/* 3. Footer */}
      <footer className="mt-16 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center space-y-4">
          <div className="flex items-center justify-center gap-2 cursor-pointer" onClick={() => setSelectedPost(null)}>
            <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center text-white">
              <BookOpen className="w-4 h-4" />
            </div>
            <span className="font-display font-black text-base tracking-tight text-slate-900 dark:text-white">
              AI Study <span className="text-blue-600">BUDDY</span> Research &amp; Blog
            </span>
          </div>

          <p className="text-xs text-slate-500 max-w-xl mx-auto font-medium">
            Advancing educational AI with citation-grounded architecture, Socratic dialogue, and cognitive spaced repetition.
          </p>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-4 text-xs font-bold text-blue-600 dark:text-blue-400">
            <button onClick={onBackToHome} className="hover:underline cursor-pointer">Landing Page</button>
            <span>•</span>
            <button onClick={onEnterWorkspace} className="hover:underline cursor-pointer">Study Workspace</button>
            <span>•</span>
            <button onClick={() => setSelectedPost(null)} className="hover:underline cursor-pointer">All Blog Posts</button>
          </div>

          <p className="text-[11px] font-semibold text-slate-400">
            © {new Date().getFullYear()} AI Study Buddy. Created by Ayan Ahmed. All rights reserved.
          </p>
        </div>
      </footer>

    </div>
  );
}
