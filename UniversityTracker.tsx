import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  GraduationCap, 
  MapPin, 
  BookOpen, 
  Search, 
  Sparkles, 
  ArrowLeft, 
  Award, 
  DollarSign, 
  Calendar, 
  ExternalLink, 
  Bookmark, 
  BookmarkCheck, 
  CheckCircle2, 
  Briefcase, 
  Sliders, 
  Filter, 
  Share2, 
  Building2, 
  Compass, 
  Globe, 
  TrendingUp, 
  ChevronRight,
  Download,
  RefreshCw,
  Loader2,
  Zap,
  Lock,
  HelpCircle
} from 'lucide-react';
import { searchUniversitiesAndDegrees } from '../services/geminiService';
import { db } from '../lib/firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, query, where } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { useNavigation } from '../context/NavigationContext';
import HowItWorksModal from './HowItWorksModal';

export interface UniversityMatch {
  id?: string;
  name: string;
  country: string;
  matchScore: number;
  eligibilityCriteria: string;
  acceptanceRate: string;
  tuitionEstimate: string;
  recommendedDegrees: string[];
  scholarships: string;
  campusHighlights: string[];
  applicationDeadline: string;
  websiteUrl: string;
}

export interface RelatedDegree {
  title: string;
  field: string;
  description: string;
  demandLevel: string;
}

export interface UniversityTrackerProps {
  isOpen?: boolean;
  onClose: () => void;
  currentUser: User | null;
  targetLanguage?: string;
  isPro?: boolean;
  onOpenUpgrade?: () => void;
  onOpenScholarshipTracker?: () => void;
}

export default function UniversityTracker({
  isOpen,
  onClose,
  currentUser,
  targetLanguage = 'English',
  isPro = false,
  onOpenUpgrade,
  onOpenScholarshipTracker
}: UniversityTrackerProps) {
  const { goBack, registerModal } = useNavigation();
  const [showHowItWorks, setShowHowItWorks] = useState(false);

  useEffect(() => {
    return registerModal('UniversityTracker', onClose);
  }, [onClose, registerModal]);

  if (isOpen !== undefined && !isOpen) return null;

  // Input Form States
  const [interest, setInterest] = useState('Computer Science & Artificial Intelligence');
  const [education, setEducation] = useState('High School (+2 / A-Levels / IB) - GPA 3.6');
  const [location, setLocation] = useState('Anywhere / Global');
  const [customLocation, setCustomLocation] = useState('');
  const [degreeLevel, setDegreeLevel] = useState("Undergraduate / Bachelor's");
  const [scholarshipPreference, setScholarshipPreference] = useState('Scholarship & Financial Aid Needed');

  // Result States
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{
    universities: UniversityMatch[];
    relatedDegrees: RelatedDegree[];
    careerProspects: string;
  } | null>(null);

  // Saved Shortlist State
  const [savedUniversities, setSavedUniversities] = useState<UniversityMatch[]>([]);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'tracker' | 'shortlist'>('tracker');
  const [savingId, setSavingId] = useState<string | null>(null);

  // Load Saved Shortlist from Firestore or localStorage
  useEffect(() => {
    loadSavedUniversities();
  }, [currentUser]);

  const loadSavedUniversities = async () => {
    if (currentUser) {
      try {
        const q = query(collection(db, `users/${currentUser.uid}/university_shortlist`));
        const snapshot = await getDocs(q);
        const loaded: UniversityMatch[] = snapshot.docs.map(docSnap => ({
          id: docSnap.id,
          ...docSnap.data()
        })) as UniversityMatch[];
        setSavedUniversities(loaded);
        setSavedIds(new Set(loaded.map(u => u.name)));
      } catch (err) {
        console.warn("Firestore error loading shortlist:", err);
      }
    } else {
      const saved = localStorage.getItem('study_buddy_saved_unis');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setSavedUniversities(parsed);
          setSavedIds(new Set(parsed.map((u: UniversityMatch) => u.name)));
        } catch (e) {}
      }
    }
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    const searchesUsed = parseInt(localStorage.getItem('uni_searches_used') || '0', 10);
    if (!isPro && searchesUsed >= 10) {
      if (onOpenUpgrade) onOpenUpgrade();
      return;
    }
    if (!interest.trim() || !education.trim()) return;

    setLoading(true);
    const finalLocation = location === 'Custom Location' ? (customLocation || 'Global') : location;

    try {
      const data = await searchUniversitiesAndDegrees({
        interest,
        education,
        location: finalLocation,
        degreeLevel,
        scholarshipPreference,
        targetLanguage
      });

      localStorage.setItem('uni_searches_used', (searchesUsed + 1).toString());
      setResults(data);
    } catch (err: any) {
      console.error("University search error:", err);
      alert(err?.message || "Failed to find matching universities. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleBookmark = async (uni: UniversityMatch) => {
    const isAlreadySaved = savedIds.has(uni.name);
    setSavingId(uni.name);

    if (isAlreadySaved) {
      // Remove
      const updated = savedUniversities.filter(u => u.name !== uni.name);
      setSavedUniversities(updated);
      const newSet = new Set(savedIds);
      newSet.delete(uni.name);
      setSavedIds(newSet);

      if (currentUser && uni.id) {
        try {
          await deleteDoc(doc(db, `users/${currentUser.uid}/university_shortlist`, uni.id));
        } catch (e) {}
      } else {
        localStorage.setItem('study_buddy_saved_unis', JSON.stringify(updated));
      }
    } else {
      // Add
      if (currentUser) {
        try {
          const docRef = await addDoc(collection(db, `users/${currentUser.uid}/university_shortlist`), {
            ...uni,
            savedAt: new Date().toISOString()
          });
          const uniWithId = { ...uni, id: docRef.id };
          const updated = [...savedUniversities, uniWithId];
          setSavedUniversities(updated);
          setSavedIds(new Set([...savedIds, uni.name]));
        } catch (err) {
          console.error("Firestore save error:", err);
        }
      } else {
        const updated = [...savedUniversities, uni];
        setSavedUniversities(updated);
        setSavedIds(new Set([...savedIds, uni.name]));
        localStorage.setItem('study_buddy_saved_unis', JSON.stringify(updated));
      }
    }
    setSavingId(null);
  };

  const handleExportPDF = async () => {
    const listToExport = activeTab === 'shortlist' ? savedUniversities : (results?.universities || []);
    if (listToExport.length === 0) return;

    const { jsPDF } = await import('jspdf');
    const pdf = new jsPDF();
    pdf.setFontSize(18);
    pdf.text("AI University & Degree Recommendations", 14, 20);
    pdf.setFontSize(10);
    pdf.text(`Interest: ${interest} | Education: ${education} | Location: ${location}`, 14, 28);
    pdf.text(`Generated by StudyBuddy AI • ${new Date().toLocaleDateString()}`, 14, 34);

    let y = 44;
    listToExport.forEach((uni, i) => {
      if (y > 260) {
        pdf.addPage();
        y = 20;
      }
      pdf.setFontSize(14);
      pdf.text(`${i + 1}. ${uni.name} (${uni.country})`, 14, y);
      y += 6;
      pdf.setFontSize(10);
      pdf.text(`Match Score: ${uni.matchScore}% | Acceptance: ${uni.acceptanceRate}`, 14, y);
      y += 5;
      pdf.text(`Degrees: ${uni.recommendedDegrees.join(', ')}`, 14, y);
      y += 5;
      pdf.text(`Eligibility: ${uni.eligibilityCriteria}`, 14, y);
      y += 5;
      pdf.text(`Tuition: ${uni.tuitionEstimate} | Deadline: ${uni.applicationDeadline}`, 14, y);
      y += 10;
    });

    pdf.save(`University_Matches_${interest.replace(/\s+/g, '_')}.pdf`);
  };

  const locationOptions = [
    'Anywhere / Global',
    'Nepal',
    'Pakistan',
    'United States',
    'United Kingdom',
    'Canada',
    'Australia',
    'Germany',
    'India',
    'Japan',
    'Custom Location'
  ];

  const popularInterests = [
    'Computer Science & AI',
    'Medicine & Surgery (MBBS)',
    'Biomedical Engineering',
    'Business & Finance',
    'Data Science & Analytics',
    'Public Health & Nursing',
    'Civil Engineering',
    'Graphic Design & Multimedia',
    'Law & International Relations'
  ];

  return (
    <div className="min-h-screen h-full overflow-y-auto bg-[#fdfcfb] dark:bg-slate-950 text-slate-950 dark:text-white p-4 sm:p-8 flex flex-col items-center transition-colors">
      <div className="w-full max-w-6xl space-y-8">
        
        {/* Top Header Bar with Back Button & How It Works */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white/90 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl backdrop-blur-xl shadow-2xl">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => {
                onClose();
                goBack();
              }}
              className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-extrabold text-xs flex items-center gap-2 transition-all cursor-pointer group border border-slate-700/60 shadow-md hover:border-blue-500/50"
              title="Return to Main Workspace"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform text-blue-400" />
              <span>Back to AI Workspace</span>
            </button>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-white">
                  AI University & Degree Tracker
                </h1>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                Find real-world top universities, eligibility criteria, & matching degrees tailored to your interests and location
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
            <button
              type="button"
              onClick={() => setShowHowItWorks(true)}
              className="px-3.5 py-2 rounded-xl bg-sky-950/60 hover:bg-sky-900/80 text-sky-300 border border-sky-800/80 text-xs font-black transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <HelpCircle className="w-4 h-4 text-sky-400" />
              <span>How It Works</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('tracker')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'tracker'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Compass className="w-4 h-4" />
              <span>University Finder</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('shortlist')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'shortlist'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Bookmark className="w-4 h-4" />
              <span>Shortlist ({savedUniversities.length})</span>
            </button>
          </div>
        </div>

        {/* Free Uses Indicator if not Pro */}
        {!isPro && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-md">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-600/20 text-blue-400 rounded-xl border border-blue-500/30 shrink-0">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-black text-white text-sm">University & Degree Matcher</h4>
                <p className="text-xs text-slate-400">
                  Search top global and regional universities. 10 Free searches included.
                </p>
              </div>
            </div>
            {onOpenUpgrade && (
              <button
                type="button"
                onClick={onOpenUpgrade}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
              >
                <Zap className="w-3.5 h-3.5 fill-current text-amber-400" />
                <span>Unlimited Pro</span>
              </button>
            )}
          </div>
        )}

        {/* Tab 1: Tracker & Search Form */}
        {activeTab === 'tracker' && (
          <div className="space-y-8">
            
            {/* Search Input Panel */}
            <form onSubmit={handleSearch} className="bg-slate-900/90 border border-slate-800 p-6 sm:p-8 rounded-[2.5rem] shadow-2xl space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
                  <h2 className="text-sm font-black uppercase tracking-wider text-slate-300">
                    Your Academic & Career Profile
                  </h2>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 px-3 py-1 rounded-full border border-blue-500/20">
                  Real Web Grounded Search
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Field 1: Interest / Choice */}
                <div className="space-y-2">
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-400">
                    Choice / Subject Interest
                  </label>
                  <input
                    type="text"
                    required
                    value={interest}
                    onChange={(e) => setInterest(e.target.value)}
                    placeholder="e.g. Artificial Intelligence, Medicine, Business, Cybersecurity..."
                    className="w-full p-3.5 bg-slate-950 border border-slate-800 rounded-2xl text-xs font-bold text-white focus:outline-none focus:border-blue-500 transition-all placeholder:text-slate-600"
                  />
                  {/* Quick Pills */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {popularInterests.slice(0, 5).map((item, iIdx) => (
                      <button
                        key={`pop-interest-${iIdx}-${item}`}
                        type="button"
                        onClick={() => setInterest(item)}
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all ${
                          interest === item
                            ? 'bg-blue-600/30 text-blue-300 border-blue-500/50'
                            : 'bg-slate-950/60 text-slate-500 border-slate-800 hover:text-slate-300'
                        }`}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Field 2: Education & Eligibility */}
                <div className="space-y-2">
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-400">
                    Current Education & Grades / GPA
                  </label>
                  <input
                    type="text"
                    required
                    value={education}
                    onChange={(e) => setEducation(e.target.value)}
                    placeholder="e.g. High School GPA 3.6, Bachelor in Engineering 80%, A-Levels..."
                    className="w-full p-3.5 bg-slate-950 border border-slate-800 rounded-2xl text-xs font-bold text-white focus:outline-none focus:border-blue-500 transition-all placeholder:text-slate-600"
                  />
                </div>

                {/* Field 3: Location Option */}
                <div className="space-y-2">
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-400">
                    Preferred Location / Country
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {locationOptions.map((loc, lIdx) => (
                      <button
                        key={`loc-opt-${lIdx}-${loc}`}
                        type="button"
                        onClick={() => setLocation(loc)}
                        className={`p-2.5 rounded-xl text-xs font-bold transition-all border text-left flex items-center justify-between ${
                          location === loc
                            ? 'bg-blue-600/20 text-blue-400 border-blue-500'
                            : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-white'
                        }`}
                      >
                        <span className="truncate">{loc}</span>
                        {location === loc && <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />}
                      </button>
                    ))}
                  </div>

                  {location === 'Custom Location' && (
                    <input
                      type="text"
                      value={customLocation}
                      onChange={(e) => setCustomLocation(e.target.value)}
                      placeholder="Type specific country or city (e.g. Kathmandu, Munich, London)..."
                      className="w-full mt-2 p-3 bg-slate-950 border border-blue-500/50 rounded-xl text-xs font-bold text-white focus:outline-none"
                    />
                  )}
                </div>

                {/* Field 4: Degree Level & Scholarship */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-2">
                      Target Degree Level
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {["Undergraduate / Bachelor's", "Master's / Post-graduate", "PhD / Doctorate", "Diploma / Certificate"].map((lvl, lvlIdx) => (
                        <button
                          key={`deg-lvl-${lvlIdx}-${lvl}`}
                          type="button"
                          onClick={() => setDegreeLevel(lvl)}
                          className={`p-2.5 rounded-xl text-xs font-bold border transition-all text-center ${
                            degreeLevel === lvl
                              ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500'
                              : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                          }`}
                        >
                          {lvl}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-2">
                      Scholarship Preference
                    </label>
                    <select
                      value={scholarshipPreference}
                      onChange={(e) => setScholarshipPreference(e.target.value)}
                      className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-white focus:outline-none"
                    >
                      <option value="Scholarship & Financial Aid Needed">High Scholarship / Financial Aid Needed</option>
                      <option value="Low Tuition / Free Education Focus">Low Tuition / Public University Focus</option>
                      <option value="Flexible Budget">Flexible Budget (All Options)</option>
                    </select>
                  </div>
                </div>

              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-indigo-600/20 transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin text-white" />
                    <span>Searching Global Universities & Matching Degrees...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    <span>Find Matching Universities & Degrees</span>
                  </>
                )}
              </button>
            </form>

            {/* Loading Indicator */}
            {loading && (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center space-y-4">
                <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto" />
                <h3 className="text-lg font-black text-white">Analyzing Admission Requirements & Programs...</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Querying real university portals for eligibility criteria, tuition estimates, and scholarship availability matching "{interest}" in {location === 'Custom Location' ? customLocation : location}.
                </p>
              </div>
            )}

            {/* Results Display */}
            {results && !loading && (
              <div className="space-y-8 animate-fadeIn">
                
                {/* Header Summary Bar */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-500/20 p-6 rounded-3xl">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-blue-400">
                      Top Recommendations Matched
                    </span>
                    <h2 className="text-xl font-black text-white">
                      Best University & Degree Matches for "{interest}"
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                      Location: <strong className="text-white">{location === 'Custom Location' ? customLocation : location}</strong> • Degree Level: <strong className="text-white">{degreeLevel}</strong>
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleExportPDF}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shadow-md cursor-pointer shrink-0"
                  >
                    <Download className="w-4 h-4 text-emerald-400" />
                    <span>Export Matches PDF</span>
                  </button>
                </div>

                {/* Universities Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {results.universities.map((uni, idx) => {
                    const isSaved = savedIds.has(uni.name);
                    return (
                      <motion.div
                        key={`uni-${idx}-${uni.name}`}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.08 }}
                        className="bg-slate-900/90 border border-slate-800 hover:border-slate-700/80 rounded-3xl p-6 space-y-5 flex flex-col justify-between shadow-xl relative overflow-hidden group"
                      >
                        {/* Top Badge */}
                        <div>
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-lg flex items-center justify-center shrink-0 shadow-lg">
                                {uni.name.substring(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <h3 className="text-base font-black text-white group-hover:text-blue-400 transition-colors">
                                  {uni.name}
                                </h3>
                                <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5 font-medium">
                                  <MapPin className="w-3.5 h-3.5 text-red-400" />
                                  <span>{uni.country}</span>
                                </div>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleToggleBookmark(uni)}
                              disabled={savingId === uni.name}
                              className={`p-2.5 rounded-2xl border transition-all cursor-pointer ${
                                isSaved
                                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                                  : 'bg-slate-800 text-slate-400 hover:text-white border-slate-700'
                              }`}
                              title={isSaved ? "Remove from Shortlist" : "Save to Shortlist"}
                            >
                              {isSaved ? <BookmarkCheck className="w-5 h-5" /> : <Bookmark className="w-5 h-5" />}
                            </button>
                          </div>

                          {/* Match Bar */}
                          <div className="flex items-center gap-3 bg-slate-950/80 p-3 rounded-2xl border border-slate-800/80 my-3">
                            <div className="flex-1">
                              <div className="flex justify-between text-[11px] font-bold mb-1">
                                <span className="text-slate-400">Match Accuracy</span>
                                <span className="text-emerald-400">{uni.matchScore}% Match</span>
                              </div>
                              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                                <div 
                                  className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-1000"
                                  style={{ width: `${uni.matchScore}%` }}
                                />
                              </div>
                            </div>
                            <div className="text-right border-l border-slate-800 pl-3">
                              <div className="text-[10px] text-slate-400 font-bold uppercase">Acceptance</div>
                              <div className="text-xs font-black text-white">{uni.acceptanceRate}</div>
                            </div>
                          </div>

                          {/* Recommended Degrees */}
                          <div className="space-y-1.5 my-3">
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                              Matched Degree Programs
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {uni.recommendedDegrees.map((deg, dIdx) => (
                                <span 
                                  key={`deg-${dIdx}-${deg}`}
                                  className="px-2.5 py-1 bg-blue-500/10 text-blue-300 border border-blue-500/20 rounded-lg text-xs font-bold flex items-center gap-1"
                                >
                                  <BookOpen className="w-3 h-3 text-blue-400" />
                                  {deg}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* Eligibility Requirements */}
                          <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800 space-y-1 my-3">
                            <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1">
                              <Award className="w-3 h-3" />
                              Eligibility & Admission Criteria
                            </span>
                            <p className="text-xs text-slate-300 leading-relaxed font-medium">
                              {uni.eligibilityCriteria}
                            </p>
                          </div>

                          {/* Tuition & Scholarship */}
                          <div className="grid grid-cols-2 gap-2 my-3 text-xs">
                            <div className="bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/60">
                              <span className="text-[10px] font-bold text-slate-400 block">Tuition Estimate</span>
                              <span className="font-bold text-slate-200">{uni.tuitionEstimate}</span>
                            </div>
                            <div className="bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/60">
                              <span className="text-[10px] font-bold text-slate-400 block">Deadline Intake</span>
                              <span className="font-bold text-indigo-300">{uni.applicationDeadline}</span>
                            </div>
                          </div>

                          {uni.scholarships && (
                            <p className="text-xs text-emerald-400 font-bold bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20">
                              💡 {uni.scholarships}
                            </p>
                          )}
                        </div>

                        {/* Direct Link Footer */}
                        {uni.websiteUrl && (
                          <a
                            href={uni.websiteUrl.startsWith('http') ? uni.websiteUrl : `https://${uni.websiteUrl}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 mt-2"
                          >
                            <span>Visit Official Portal</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </motion.div>
                    );
                  })}
                </div>

                {/* Related Degrees & Career Prospects Section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
                  
                  {/* Related Degrees */}
                  <div className="md:col-span-2 bg-slate-900/90 border border-slate-800 p-6 rounded-3xl space-y-4">
                    <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                      <TrendingUp className="w-5 h-5 text-indigo-400" />
                      <h3 className="text-sm font-black uppercase tracking-wider text-white">
                        Closely Related Degree Alternatives
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {results.relatedDegrees.map((deg, rIdx) => (
                        <div key={`rel-deg-${rIdx}-${deg.title}`} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                          <div className="flex justify-between items-start">
                            <h4 className="text-xs font-black text-white">{deg.title}</h4>
                            <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 rounded-md text-[9px] font-bold uppercase">
                              {deg.demandLevel} Demand
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 leading-snug">
                            {deg.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Career Market Overview */}
                  <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-3xl space-y-3">
                    <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                      <Briefcase className="w-5 h-5 text-emerald-400" />
                      <h3 className="text-sm font-black uppercase tracking-wider text-white">
                        Career & Job Prospects
                      </h3>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed font-medium">
                      {results.careerProspects}
                    </p>
                  </div>

                </div>

              </div>
            )}

          </div>
        )}

        {/* Tab 2: Saved Shortlist */}
        {activeTab === 'shortlist' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between bg-slate-900/90 border border-slate-800 p-6 rounded-3xl">
              <div>
                <h2 className="text-lg font-black text-white">Your Bookmarked Universities Shortlist</h2>
                <p className="text-xs text-slate-400 font-medium">
                  {currentUser ? 'Saved securely in your Cloud Firestore Profile' : 'Saved in browser storage'}
                </p>
              </div>

              {savedUniversities.length > 0 && (
                <button
                  type="button"
                  onClick={handleExportPDF}
                  className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-md cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Export Shortlist PDF</span>
                </button>
              )}
            </div>

            {savedUniversities.length === 0 ? (
              <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-12 text-center space-y-3">
                <Bookmark className="w-12 h-12 text-slate-600 mx-auto" />
                <h3 className="text-sm font-black text-white">No Universities Saved Yet</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Click the bookmark icon on any university recommendation card to save it to your personal shortlist.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {savedUniversities.map((uni, idx) => (
                  <div key={`saved-uni-${idx}-${uni.name}`} className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-base font-black text-white">{uni.name}</h3>
                        <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3.5 h-3.5 text-red-400" />
                          {uni.country}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleToggleBookmark(uni)}
                        className="p-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-xl text-xs font-bold transition-all"
                        title="Remove from shortlist"
                      >
                        Remove
                      </button>
                    </div>

                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-1">
                      <div><strong>Degrees:</strong> {uni.recommendedDegrees.join(', ')}</div>
                      <div><strong>Eligibility:</strong> {uni.eligibilityCriteria}</div>
                      <div><strong>Tuition:</strong> {uni.tuitionEstimate}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Bottom Backlink Navigation Footer Bar */}
        <div className="pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold">
            <Sparkles className="w-4 h-4 text-blue-400" />
            <span>Need help understanding eligibility criteria or PDF export? Check our guide.</span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={() => setShowHowItWorks(true)}
              className="px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-sky-400 border border-sky-900/60 text-xs font-black transition-all flex items-center gap-2 cursor-pointer"
            >
              <HelpCircle className="w-4 h-4" />
              <span>How It Works Instructions</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                goBack();
              }}
              className="px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-blue-600/30"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to AI Workspace</span>
            </button>
          </div>
        </div>

      </div>

      {/* How It Works Modal */}
      <HowItWorksModal
        isOpen={showHowItWorks}
        onClose={() => setShowHowItWorks(false)}
        initialTab="university"
        onOpenScholarshipTracker={onOpenScholarshipTracker}
      />
    </div>
  );
}
