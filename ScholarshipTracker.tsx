import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Award, 
  MapPin, 
  GraduationCap, 
  Search, 
  Sparkles, 
  ArrowLeft, 
  DollarSign, 
  Calendar, 
  ExternalLink, 
  Bookmark, 
  BookmarkCheck, 
  CheckCircle2, 
  Filter, 
  Download, 
  Loader2, 
  Zap, 
  FileText, 
  BookOpen, 
  Share2, 
  Check, 
  Clock, 
  Lock,
  Globe,
  TrendingUp,
  Percent,
  HelpCircle
} from 'lucide-react';
import { searchScholarships, ScholarshipMatch, ScholarshipSearchResponse } from '../services/geminiService';
import { db } from '../lib/firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, query, where } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { useNavigation } from '../context/NavigationContext';
import HowItWorksModal from './HowItWorksModal';

export interface ScholarshipTrackerProps {
  isOpen?: boolean;
  onClose: () => void;
  currentUser: User | null;
  targetLanguage?: string;
  isPro?: boolean;
  onOpenUpgrade?: () => void;
  onOpenUniversityTracker?: () => void;
}

export default function ScholarshipTracker({
  isOpen,
  onClose,
  currentUser,
  targetLanguage = 'English',
  isPro = false,
  onOpenUpgrade,
  onOpenUniversityTracker
}: ScholarshipTrackerProps) {
  const { goBack, registerModal } = useNavigation();
  const [activeTab, setActiveTab] = useState<'search' | 'results' | 'saved'>('search');
  const [showHowItWorks, setShowHowItWorks] = useState(false);

  useEffect(() => {
    return registerModal('ScholarshipTracker', onClose);
  }, [onClose, registerModal]);

  if (isOpen !== undefined && !isOpen) return null;
  
  // Inputs
  const [educationLevel, setEducationLevel] = useState<string>("Undergraduate / Bachelor's");
  const [location, setLocation] = useState<string>('United States & Global');
  const [marksGpa, setMarksGpa] = useState<string>('3.7 GPA / 85%');
  const [fieldOfStudy, setFieldOfStudy] = useState<string>('Computer Science & Tech');
  const [fundingType, setFundingType] = useState<string>('Fully Funded');

  // Loading & Results
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<ScholarshipSearchResponse | null>(null);
  const [savedScholarships, setSavedScholarships] = useState<ScholarshipMatch[]>([]);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [selectedFundingFilter, setSelectedFundingFilter] = useState<string>('All');
  const [selectedScholarshipForDetail, setSelectedScholarshipForDetail] = useState<ScholarshipMatch | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Load saved scholarships from Firestore/localStorage on mount
  useEffect(() => {
    loadSavedScholarships();
  }, [currentUser]);

  const loadSavedScholarships = async () => {
    if (currentUser) {
      try {
        const ref = collection(db, 'users', currentUser.uid, 'saved_scholarships');
        const snapshot = await getDocs(ref);
        const loaded: ScholarshipMatch[] = snapshot.docs.map(docSnap => ({
          ...(docSnap.data() as ScholarshipMatch),
          id: docSnap.id
        }));
        setSavedScholarships(loaded);
        setSavedIds(new Set(loaded.map(s => s.title)));
      } catch (e) {
        console.warn("Firestore saved scholarships fallback to localStorage:", e);
        loadLocalSaved();
      }
    } else {
      loadLocalSaved();
    }
  };

  const loadLocalSaved = () => {
    try {
      const cached = localStorage.getItem('saved_scholarships');
      if (cached) {
        const parsed = JSON.parse(cached);
        setSavedScholarships(parsed);
        setSavedIds(new Set(parsed.map((s: ScholarshipMatch) => s.title)));
      }
    } catch (e) {}
  };

  const toggleSaveScholarship = async (scholarship: ScholarshipMatch) => {
    const isSaved = savedIds.has(scholarship.title);
    if (isSaved) {
      // Remove
      const nextSaved = savedScholarships.filter(s => s.title !== scholarship.title);
      setSavedScholarships(nextSaved);
      setSavedIds(new Set(nextSaved.map(s => s.title)));

      if (currentUser) {
        try {
          const q = query(
            collection(db, 'users', currentUser.uid, 'saved_scholarships'), 
            where('title', '==', scholarship.title)
          );
          const snap = await getDocs(q);
          snap.forEach(d => deleteDoc(doc(db, 'users', currentUser.uid, 'saved_scholarships', d.id)));
        } catch (e) {}
      }
      localStorage.setItem('saved_scholarships', JSON.stringify(nextSaved));
    } else {
      // Save
      const nextSaved = [...savedScholarships, scholarship];
      setSavedScholarships(nextSaved);
      setSavedIds(new Set(nextSaved.map(s => s.title)));

      if (currentUser) {
        try {
          await addDoc(collection(db, 'users', currentUser.uid, 'saved_scholarships'), scholarship);
        } catch (e) {}
      }
      localStorage.setItem('saved_scholarships', JSON.stringify(nextSaved));
    }
  };

  const handleRunSearch = async () => {
    if (!fieldOfStudy.trim() || !marksGpa.trim()) return;

    const searchesUsed = parseInt(localStorage.getItem('scholarship_searches_used') || '0', 10);
    if (!isPro && searchesUsed >= 10) {
      if (onOpenUpgrade) onOpenUpgrade();
      return;
    }

    setIsSearching(true);
    setErrorMsg(null);

    try {
      const data = await searchScholarships({
        educationLevel,
        location,
        marksGpa,
        fieldOfStudy,
        fundingType,
        language: targetLanguage
      });
      localStorage.setItem('scholarship_searches_used', (searchesUsed + 1).toString());
      setResults(data);
      setActiveTab('results');
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to find scholarships. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleExportPdf = async () => {
    if (!results) return;
    const { jsPDF } = await import('jspdf');
    const docPdf = new jsPDF();
    
    docPdf.setFontSize(20);
    docPdf.setTextColor(30, 41, 59);
    docPdf.text('AI Scholarship Match & Application Report', 14, 20);

    docPdf.setFontSize(10);
    docPdf.setTextColor(100, 116, 139);
    docPdf.text(`Student Level: ${educationLevel} | GPA/Marks: ${marksGpa} | Field: ${fieldOfStudy}`, 14, 28);
    docPdf.text(`Target Destination: ${location} | Preferred Funding: ${fundingType}`, 14, 34);

    let y = 45;

    docPdf.setFontSize(14);
    docPdf.setTextColor(15, 23, 42);
    docPdf.text('Top Eligible Scholarships:', 14, y);
    y += 8;

    results.scholarships.forEach((s, idx) => {
      if (y > 270) {
        docPdf.addPage();
        y = 20;
      }

      docPdf.setFontSize(12);
      docPdf.setTextColor(79, 70, 229);
      docPdf.text(`${idx + 1}. ${s.title} (${s.matchScore}% Match)`, 14, y);
      y += 6;

      docPdf.setFontSize(10);
      docPdf.setTextColor(51, 65, 85);
      docPdf.text(`Provider: ${s.provider} | Coverage: ${s.amount}`, 16, y);
      y += 5;
      docPdf.text(`Deadline: ${s.deadline} | Min Req: ${s.minGradeGpa}`, 16, y);
      y += 5;
      docPdf.text(`Documents: ${s.requiredDocuments.join(', ')}`, 16, y);
      y += 5;
      
      const strategyLines = docPdf.splitTextToSize(`Winning Strategy: ${s.winningStrategy}`, 180);
      docPdf.text(strategyLines, 16, y);
      y += (strategyLines.length * 5) + 6;
    });

    docPdf.save(`Scholarship_Application_Plan_${fieldOfStudy.replace(/\s+/g, '_')}.pdf`);
  };

  const popularLocations = [
    '🇩🇪 Germany (DAAD)',
    '🇵🇰 Pakistan (Honhaar & HEC)',
    '🇺🇸 United States (Fulbright)',
    '🇬🇧 United Kingdom (Chevening)',
    '🇦🇺 Australia Awards',
    '🇹🇷 Turkey Bursları',
    '🇯🇵 Japan (MEXT)',
    '🇨🇦 Canada (Vanier/Pearson)',
    '🇨🇳 China (CSC)',
    'Worldwide / Any Country'
  ];

  const POPULAR_FEATURED_SCHOLARSHIPS: ScholarshipMatch[] = [
    {
      title: "DAAD Scholarship (Deutscher Akademischer Austauschdienst)",
      provider: "German Academic Exchange Service & Federal Govt",
      amount: "Fully Funded (€934 - €1,200/mo Stipend + 100% Tuition Waiver + Health Insurance + Flight Allowance)",
      fundingType: "Fully Funded",
      location: "Germany (Top Public Universities)",
      targetEducationLevel: "Master's & PhD",
      minGradeGpa: "GPA 3.0+ / 75% or Upper Second-Class",
      eligibleMajors: ["Engineering", "Computer Science & AI", "Environmental Science", "Public Policy", "Medicine"],
      matchScore: 98,
      deadline: "October - November Annual Deadline",
      requiredDocuments: ["Hand-signed Europass CV", "Motivation Letter", "Academic Transcripts", "2 Recommendation Letters", "IELTS (6.5+) or German B2"],
      applicationUrl: "https://www.daad.de/en/study-and-research-in-germany/scholarships/",
      description: "Germany's flagship international fellowship fully covering tuition, monthly stipend, health insurance, and round-trip travel for foreign graduates across technical and humanistic disciplines.",
      winningStrategy: "Focus your motivation letter on practical, real-world development impact and how studying at a German university directly equips you to solve key industrial or social challenges."
    },
    {
      title: "Honhaar Scholarship Program (Punjab & Federal Govt)",
      provider: "Government of Punjab & Higher Education Dept",
      amount: "100% Full Tuition Fee Waiver for 4-Year Bachelor's Degrees",
      fundingType: "Fully Funded",
      location: "Pakistan (68 Public & Top Private Universities)",
      targetEducationLevel: "Undergraduate / Bachelor's",
      minGradeGpa: "70%+ Marks in FSc / Intermediate / A-Levels",
      eligibleMajors: ["Computer Science & IT", "Software Engineering", "Medicine & Nursing", "Agriculture", "Business & Finance"],
      matchScore: 99,
      deadline: "October 18 Annual Deadline",
      requiredDocuments: ["CNIC / B-Form", "FSc / Matric Marksheets", "Parental Income Certificate", "Domicile Certificate", "University Admission Offer"],
      applicationUrl: "https://honhaarscholarship.punjab.gov.pk/",
      description: "The largest merit-cum-need undergraduate scholarship in Pakistan funding 30,000+ students annually across top universities like NUST, FAST, UET, LUMS, PU, and COMSATS.",
      winningStrategy: "Ensure all income verification slips and academic transcripts match your admission records. Highlight high FSc/A-Level board percentages and verified university admission."
    },
    {
      title: "HEC Ehsaas / USAID Merit & Needs-Based Scholarship",
      provider: "Higher Education Commission (HEC) & USAID",
      amount: "Full Tuition Waiver + PKR 6,000 / Month Living Stipend",
      fundingType: "Fully Funded",
      location: "Pakistan (HEC Recognized Public Universities)",
      targetEducationLevel: "Undergraduate / Bachelor's & Master's",
      minGradeGpa: "60%+ Marks in Matric & FSc",
      eligibleMajors: ["All Faculties & STEM Disciplines"],
      matchScore: 96,
      deadline: "November Annual Deadline",
      requiredDocuments: ["HEC Online Application", "Family Income Certificate", "Electricity Utility Bills", "CNIC Copies"],
      applicationUrl: "https://www.hec.gov.pk/english/scholarships/pages/default.aspx",
      description: "Empowers deserving students from lower-income backgrounds to pursue higher education in HEC-recognized public sector universities across Pakistan.",
      winningStrategy: "Combine accurate family income documentation with strong academic performance in previous board examinations."
    },
    {
      title: "Fulbright Foreign Student Program",
      provider: "U.S. Department of State & USEFP",
      amount: "Fully Funded (Full Tuition + $1,800 - $2,500/mo Stipend + Air travel + J-1 Visa)",
      fundingType: "Fully Funded",
      location: "United States (Top U.S. Universities)",
      targetEducationLevel: "Master's & PhD",
      minGradeGpa: "GPA 3.5+ / 80% Equivalent",
      eligibleMajors: ["Engineering & IT", "Public Health", "Environmental Policy", "Data Science", "Education"],
      matchScore: 95,
      deadline: "May - September Annual Deadline",
      requiredDocuments: ["GRE General Test Score", "3 Recommendation Letters", "Personal Statement", "Study Objective Essay", "Transcripts"],
      applicationUrl: "https://fulbrightprogram.org/",
      description: "The premier U.S. government international exchange scholarship funding full tuition, housing, health insurance, and travel for master's and doctoral studies in America.",
      winningStrategy: "Craft a visionary Study Objective essay showing how your American academic training will drive leadership, research innovation, and social impact upon returning home."
    },
    {
      title: "Chevening & Commonwealth Scholarships",
      provider: "UK Foreign, Commonwealth & Development Office (FCDO)",
      amount: "Fully Funded (Full UK Tuition + £1,300 - £1,600/mo Stipend + Flights)",
      fundingType: "Fully Funded",
      location: "United Kingdom (Oxford, Cambridge, Imperial, UCL, Edinburgh, etc.)",
      targetEducationLevel: "1-Year Master's Degree",
      minGradeGpa: "Upper Second-Class (2:1) Honors or GPA 3.3+",
      eligibleMajors: ["STEM", "Governance & Law", "International Relations", "Finance", "Healthcare"],
      matchScore: 97,
      deadline: "November 5 Annual Deadline",
      requiredDocuments: ["2 Years Work/Volunteering Experience (2,800 hrs)", "4 Leadership/Networking Essays", "3 Unconditional UK Offers"],
      applicationUrl: "https://www.chevening.org/",
      description: "The UK government's global scholarship for emerging leaders to undertake a fully funded one-year master's degree at any UK university.",
      winningStrategy: "Structure your 4 Chevening essays with specific STAR-format (Situation, Task, Action, Result) leadership examples and concrete 5-year post-graduation career targets."
    },
    {
      title: "Australia Awards Scholarship (DFAT)",
      provider: "Australian Government Dept of Foreign Affairs and Trade",
      amount: "Fully Funded (Full Tuition + Return Airfare + Living Allowance CLE + Health Cover OSHC)",
      fundingType: "Fully Funded",
      location: "Australia (Top Australian Universities)",
      targetEducationLevel: "Bachelor's, Master's & PhD",
      minGradeGpa: "GPA 3.0+ / 70%",
      eligibleMajors: ["Climate & Energy", "Cyber & AI", "Health", "Governance & Trade"],
      matchScore: 94,
      deadline: "April 30 Annual Deadline",
      requiredDocuments: ["Development Impact Statement", "IELTS (6.5+)", "Academic Transcripts", "Passport"],
      applicationUrl: "https://www.dfat.gov.au/people-to-people/australia-awards",
      description: "Administered by the Australian Government for emerging leaders from developing countries to pursue full-time study at Australian institutions.",
      winningStrategy: "Explicitly align your degree choice with DFAT's priority development sectors for your home country and detail your Development Impact Plan."
    },
    {
      title: "Türkiye Bursları Scholarship",
      provider: "Government of Turkey & YTB",
      amount: "Fully Funded (100% Tuition + Monthly Stipend + Free Dormitory + Turkish Language Course + Flights)",
      fundingType: "Fully Funded",
      location: "Turkey (Istanbul Univ, METU, Bilkent, Ankara Univ)",
      targetEducationLevel: "Bachelor's, Master's & PhD",
      minGradeGpa: "70% Undergrad, 75% Master's, 90% Medicine",
      eligibleMajors: ["Medicine", "Engineering", "International Relations", "Architecture", "Business"],
      matchScore: 96,
      deadline: "February 20 Annual Deadline",
      requiredDocuments: ["High School / University Diploma", "Letter of Intent", "Recommendations", "Passport"],
      applicationUrl: "https://tbbs.turkiyeburslari.gov.tr/",
      description: "Comprehensive state-funded scholarship offering university placement, monthly stipends, campus housing, language preparatory year, and flights.",
      winningStrategy: "Draft a clear Letter of Intent emphasizing academic dedication, regional diplomatic/trade bridges, and career vision."
    },
    {
      title: "MEXT Japanese Government Scholarship",
      provider: "Japanese Ministry of Education, Culture, Sports, Science and Tech",
      amount: "Fully Funded (100% Tuition Waiver + ¥117,000 - ¥145,000/mo Stipend + Airfare)",
      fundingType: "Fully Funded",
      location: "Japan (University of Tokyo, Kyoto, Osaka, Tokyo Tech)",
      targetEducationLevel: "Undergraduate, Research, Master's & PhD",
      minGradeGpa: "GPA 3.2+ or 80%+ Marks",
      eligibleMajors: ["Robotics & AI", "Engineering", "Biotechnology", "Japanese Studies"],
      matchScore: 95,
      deadline: "May - June Embassy Deadline",
      requiredDocuments: ["MEXT Application Form", "Research Proposal", "Embassy Exam Results", "Health Cert"],
      applicationUrl: "https://www.mext.go.jp/a_menu/koutou/ryugaku/boshu/1417124.htm",
      description: "Japan's prestigious state scholarship providing full tuition coverage, preparative Japanese language education, generous monthly living allowances, and roundtrip flights.",
      winningStrategy: "For graduate research, write a precise research proposal identifying specific professors and laboratory facilities in Japanese national universities."
    }
  ];

  const popularFields = [
    'Computer Science & AI',
    'Medicine & Public Health',
    'Business & Finance',
    'Engineering & Tech',
    'Environmental & Climate Studies',
    'International Relations & Law',
    'Arts & Creative Media'
  ];

  const filteredScholarships = results?.scholarships.filter(s => {
    if (selectedFundingFilter === 'All') return true;
    return s.fundingType === selectedFundingFilter;
  }) || [];

  return (
    <div className="bg-white dark:bg-slate-900 text-slate-950 dark:text-white rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden max-w-6xl w-full mx-auto my-4 flex flex-col h-full overflow-y-auto max-h-[92vh]">
      {/* Top Bar Header with Prominent Back Button & How It Works */}
      <div className="bg-slate-50 dark:bg-slate-950 px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              onClose();
              goBack();
            }}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-200 hover:text-white transition-all flex items-center gap-2 font-bold text-xs group cursor-pointer shadow-sm hover:border-amber-500/50"
            title="Return to Main Workspace"
          >
            <ArrowLeft className="w-4 h-4 text-amber-400 group-hover:-translate-x-1 transition-transform" />
            <span>Back to AI Workspace</span>
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-white tracking-tight">AI Scholarship Tracker</h2>
              <span className="text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Fully Funded & Merit Grants
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">Match GPA, degree level, and location to active global scholarships</p>
          </div>
        </div>

        {/* Tab Navigation & How It Works Button */}
        <div className="flex items-center gap-2 flex-wrap justify-end w-full md:w-auto">
          <button
            onClick={() => setShowHowItWorks(true)}
            className="px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-black transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <HelpCircle className="w-4 h-4 text-amber-400" />
            <span>How It Works</span>
          </button>

          <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-2xl border border-slate-800">
            <button
              onClick={() => setActiveTab('search')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'search'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Search className="w-3.5 h-3.5" /> Search & Match
            </button>

            <button
              onClick={() => {
                if (results) setActiveTab('results');
              }}
              disabled={!results}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'results'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" /> Matched ({results?.scholarships.length || 0})
            </button>

            <button
              onClick={() => setActiveTab('saved')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'saved'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" /> Saved ({savedScholarships.length})
            </button>
          </div>
        </div>
      </div>

      {/* Main Body */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {activeTab === 'search' && (
          <div className="max-w-3xl mx-auto space-y-8 py-4">
            {/* Hero banner */}
            <div className="bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-indigo-500/10 border border-amber-500/20 rounded-3xl p-6 relative overflow-hidden">
              <div className="relative z-10 space-y-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 bg-amber-500/20 px-2.5 py-1 rounded-full border border-amber-500/30">
                  Global Scholarship Search Engine
                </span>
                <h3 className="text-2xl font-black text-white">Find 100% Fully Funded Scholarships for Your Profile</h3>
                <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
                  Enter your current grades, field of study, and target country. Gemini AI cross-references global databases (Fulbright, Chevening, DAAD, Australia Awards, MEXT, university grants) and crafts a winning application strategy.
                </p>
              </div>
            </div>

            {/* Inputs Form */}
            <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Education Level */}
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-amber-400" /> Current / Target Degree Level
                  </label>
                  <select
                    value={educationLevel}
                    onChange={(e) => setEducationLevel(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 text-xs font-semibold text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="High School / Grade 12">High School / Senior Secondary / Grade 12</option>
                    <option value="Undergraduate / Bachelor's">Undergraduate / Bachelor's Degree</option>
                    <option value="Master's / Postgraduate">Master's / Postgraduate Degree</option>
                    <option value="PhD / Doctorate">PhD / Doctorate / Research Fellowship</option>
                  </select>
                </div>

                {/* Target Location */}
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-emerald-400" /> Target Study Destination / Region
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. USA, UK, Canada, Germany, Australia, Global"
                    className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 text-xs font-semibold text-white focus:outline-none focus:border-amber-500"
                  />
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {popularLocations.map((loc, locIdx) => (
                      <button
                        key={`loc-pop-${locIdx}-${loc}`}
                        type="button"
                        onClick={() => {
                          const cleanLoc = loc.replace(/^[^\w]+/, '').trim();
                          setLocation(cleanLoc);
                        }}
                        className="text-[10px] bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-amber-300 px-2 py-1 rounded-lg transition-colors font-medium"
                      >
                        {loc}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Marks / GPA */}
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
                    <Percent className="w-4 h-4 text-indigo-400" /> Academic Marks / GPA / Percentage
                  </label>
                  <input
                    type="text"
                    value={marksGpa}
                    onChange={(e) => setMarksGpa(e.target.value)}
                    placeholder="e.g. 3.8 / 4.0 GPA, 88%, Grade A+, First Class"
                    className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 text-xs font-semibold text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Major / Field of Study */}
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-purple-400" /> Major / Field of Study
                  </label>
                  <input
                    type="text"
                    value={fieldOfStudy}
                    onChange={(e) => setFieldOfStudy(e.target.value)}
                    placeholder="e.g. Computer Science, Medicine, Mechanical Engineering"
                    className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 text-xs font-semibold text-white focus:outline-none focus:border-amber-500"
                  />
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {popularFields.slice(0, 3).map((f, fIdx) => (
                      <button
                        key={`field-pop-${fIdx}-${f}`}
                        type="button"
                        onClick={() => setFieldOfStudy(f)}
                        className="text-[10px] bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 px-2 py-1 rounded-lg transition-colors"
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>

              </div>

              {/* Funding Type Preference */}
              <div className="space-y-2 pt-2 border-t border-slate-800/80">
                <label className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-400" /> Preferred Scholarship Type
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    'Fully Funded',
                    'Tuition Waiver',
                    'Partial Grant',
                    'Stipend + Allowance'
                  ].map((type, tIdx) => (
                    <button
                      key={`pref-type-${tIdx}-${type}`}
                      type="button"
                      onClick={() => setFundingType(type)}
                      className={`p-3 rounded-2xl text-xs font-bold border transition-all text-center ${
                        fundingType === type
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-md shadow-amber-500/10'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {errorMsg && (
                <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-300 text-xs rounded-2xl font-semibold">
                  {errorMsg}
                </div>
              )}

              {/* Search Button */}
              <button
                type="button"
                onClick={handleRunSearch}
                disabled={isSearching || !fieldOfStudy.trim() || !marksGpa.trim()}
                className="w-full py-4 bg-gradient-to-r from-amber-500 to-emerald-500 text-slate-950 font-black text-sm rounded-2xl hover:opacity-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 disabled:opacity-50 cursor-pointer"
              >
                {isSearching ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Searching Global Scholarship Databases...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    <span>Find Eligible Scholarships</span>
                    {!isPro && (
                      <span className="ml-2 bg-slate-950/40 text-amber-300 text-[10px] px-2 py-0.5 rounded font-black flex items-center gap-1 border border-amber-500/30">
                        <Lock className="w-3 h-3" /> PRO
                      </span>
                    )}
                  </>
                )}
              </button>
            </div>

            {/* Featured Popular Global & Regional Scholarships (Direct View) */}
            <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 space-y-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-4">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                    Direct Directory
                  </span>
                  <h3 className="text-lg font-black text-white mt-1">
                    Top Popular World & Regional Scholarships
                  </h3>
                  <p className="text-xs text-slate-400">
                    Explore high-value fully funded scholarships including Germany DAAD, Pakistan Honhaar, USA Fulbright & UK Chevening
                  </p>
                </div>
                <span className="text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full shrink-0">
                  ⚡ Popular Programs
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {POPULAR_FEATURED_SCHOLARSHIPS.map((sch, idx) => {
                  const isSaved = savedIds.has(sch.title);
                  return (
                    <div
                      key={`feat-${idx}-${sch.title}`}
                      className="bg-slate-900 border border-slate-800 hover:border-amber-500/40 rounded-2xl p-5 space-y-3 flex flex-col justify-between transition-all"
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                            {sch.fundingType}
                          </span>
                          <button
                            onClick={() => toggleSaveScholarship(sch)}
                            className={`p-1.5 rounded-lg text-xs transition-colors ${
                              isSaved
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                : 'bg-slate-800 text-slate-400 hover:text-white'
                            }`}
                            title={isSaved ? "Saved" : "Save to My Bookmarks"}
                          >
                            {isSaved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                          </button>
                        </div>

                        <h4 className="text-sm font-black text-white leading-snug">
                          {sch.title}
                        </h4>
                        <p className="text-xs text-emerald-400 font-bold">
                          {sch.provider} • {sch.location}
                        </p>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          {sch.description}
                        </p>
                      </div>

                      <div className="space-y-2 pt-2 border-t border-slate-800/80">
                        <div className="flex items-center justify-between text-[11px] text-slate-300">
                          <span className="text-slate-400 font-semibold">Min Requirement:</span>
                          <span className="font-bold text-amber-300">{sch.minGradeGpa}</span>
                        </div>
                        <div className="flex gap-2 pt-1">
                          <button
                            onClick={() => {
                              const cleanLoc = sch.location.replace(/\([^)]*\)/g, '').trim();
                              setLocation(cleanLoc);
                              if (sch.targetEducationLevel.toLowerCase().includes("bachelor") || sch.targetEducationLevel.toLowerCase().includes("undergraduate")) {
                                setEducationLevel("Undergraduate / Bachelor's");
                              } else if (sch.targetEducationLevel.toLowerCase().includes("master") || sch.targetEducationLevel.toLowerCase().includes("postgraduate")) {
                                setEducationLevel("Master's / Postgraduate");
                              }
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-all text-center cursor-pointer"
                          >
                            🎯 Set Form Parameters
                          </button>
                          <a
                            href={sch.applicationUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1 shrink-0"
                          >
                            <span>Official Portal</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Back to Dashboard Footer Button */}
            <div className="flex justify-center pt-2 pb-6">
              <button
                onClick={goBack}
                className="px-6 py-3 bg-slate-950 hover:bg-slate-800 border border-slate-700/80 text-slate-200 hover:text-white rounded-2xl font-bold text-xs transition-all flex items-center gap-2 shadow-lg cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4 text-amber-400" />
                <span>Return to Main Study Dashboard</span>
              </button>
            </div>
          </div>
        )}

        {/* Results Tab */}
        {activeTab === 'results' && results && (
          <div className="space-y-6">
            {/* Header info & PDF Export */}
            <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                  {results.scholarships.length} Scholarships Matched
                </span>
                <h3 className="text-xl font-black text-white mt-1">
                  Tailored Scholarship Opportunities
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Based on: {fieldOfStudy} • {marksGpa} • {educationLevel}
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={handleExportPdf}
                  className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-2"
                >
                  <Download className="w-4 h-4 text-emerald-400" /> Export Application Plan (PDF)
                </button>
              </div>
            </div>

            {/* Candidate Profile Strengths & Action Plan */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-950/80 border border-slate-800 rounded-3xl p-5 space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> Profile Strengths
                </h4>
                <ul className="space-y-2">
                  {results.profileStrengths?.map((str, i) => (
                    <li key={`str-${i}-${str.substring(0, 10)}`} className="text-xs text-slate-300 flex items-start gap-2 leading-relaxed">
                      <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full mt-1.5 shrink-0" />
                      <span>{str}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-slate-950/80 border border-slate-800 rounded-3xl p-5 space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" /> AI Application Roadmap
                </h4>
                <ul className="space-y-2">
                  {results.suggestedActionPlan?.map((plan, i) => (
                    <li key={`plan-${i}-${plan.substring(0, 10)}`} className="text-xs text-slate-300 flex items-start gap-2 leading-relaxed">
                      <span className="w-1.5 h-1.5 bg-amber-400 rounded-full mt-1.5 shrink-0" />
                      <span>{plan}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Funding Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <span className="text-xs font-bold text-slate-400 mr-2 shrink-0">Filter Coverage:</span>
              {['All', 'Fully Funded', 'Tuition Waiver', 'Partial', 'Stipend + Allowance'].map((f, fIdx) => (
                <button
                  key={`filter-coverage-${fIdx}-${f}`}
                  onClick={() => setSelectedFundingFilter(f)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    selectedFundingFilter === f
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

            {/* Scholarship Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredScholarships.map((sch, idx) => {
                const isSaved = savedIds.has(sch.title);
                return (
                  <div
                    key={`sch-${idx}-${sch.title}`}
                    className="bg-slate-950 border border-slate-800 rounded-3xl p-6 space-y-5 relative group hover:border-amber-500/50 transition-all shadow-xl"
                  >
                    {/* Top match score & provider */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                          {sch.fundingType}
                        </span>
                        <h4 className="text-lg font-black text-white mt-1.5 leading-snug">
                          {sch.title}
                        </h4>
                        <p className="text-xs font-bold text-amber-400 mt-0.5">
                          {sch.provider} • {sch.location}
                        </p>
                      </div>

                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <button
                          onClick={() => toggleSaveScholarship(sch)}
                          className={`p-2 rounded-xl transition-colors ${
                            isSaved
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                              : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800'
                          }`}
                          title={isSaved ? "Saved" : "Save Scholarship"}
                        >
                          {isSaved ? <BookmarkCheck className="w-5 h-5" /> : <Bookmark className="w-5 h-5" />}
                        </button>
                        <span className="text-xs font-black bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-lg">
                          {sch.matchScore}% Match
                        </span>
                      </div>
                    </div>

                    {/* Coverage & Deadline stats */}
                    <div className="grid grid-cols-2 gap-3 bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800/80 text-xs">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Coverage Value</span>
                        <span className="font-extrabold text-emerald-400">{sch.amount}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Deadline</span>
                        <span className="font-extrabold text-amber-300 flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> {sch.deadline}
                        </span>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {sch.description}
                    </p>

                    {/* Minimum Criteria & Documents */}
                    <div className="space-y-2 pt-2 border-t border-slate-900">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>Min Requirement: <span className="text-white font-extrabold">{sch.minGradeGpa}</span></span>
                      </div>

                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {sch.requiredDocuments?.map((docItem, dIdx) => (
                          <span
                            key={`doc-${dIdx}-${docItem}`}
                            className="text-[10px] font-medium bg-slate-900 text-slate-300 px-2 py-0.5 rounded-lg border border-slate-800"
                          >
                            📄 {docItem}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* AI Winning Strategy Box */}
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 space-y-1">
                      <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1">
                        <Zap className="w-3 h-3" /> AI Winning Strategy Tip
                      </span>
                      <p className="text-xs text-amber-200/90 leading-relaxed font-medium">
                        {sch.winningStrategy}
                      </p>
                    </div>

                    {/* Official Portal Button */}
                    <a
                      href={sch.applicationUrl?.startsWith('http') ? sch.applicationUrl : `https://${sch.applicationUrl || 'scholarships.gov'}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-3 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 group/btn"
                    >
                      <span>Apply on Official Website</span>
                      <ExternalLink className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
                    </a>
                  </div>
                );
              })}
            </div>

            {/* Back to Dashboard Footer Button */}
            <div className="flex justify-center pt-4 pb-6">
              <button
                onClick={goBack}
                className="px-6 py-3 bg-slate-950 hover:bg-slate-800 border border-slate-700/80 text-slate-200 hover:text-white rounded-2xl font-bold text-xs transition-all flex items-center gap-2 shadow-lg cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4 text-amber-400" />
                <span>Return to Main Study Dashboard</span>
              </button>
            </div>
          </div>
        )}

        {/* Saved Scholarships Tab */}
        {activeTab === 'saved' && (
          <div className="space-y-6">
            <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-white">Your Saved Scholarships</h3>
                <p className="text-xs text-slate-400">Keep track of your bookmark list and application links</p>
              </div>
              <span className="text-xs font-black bg-amber-500/20 text-amber-400 border border-amber-500/30 px-3 py-1 rounded-full">
                {savedScholarships.length} Saved
              </span>
            </div>

            {savedScholarships.length === 0 ? (
              <div className="text-center py-16 bg-slate-950 border border-slate-800 rounded-3xl p-8 space-y-4">
                <Bookmark className="w-12 h-12 text-slate-600 mx-auto" />
                <h4 className="font-bold text-white text-base">No Saved Scholarships Yet</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Run a search in the "Search & Match" tab and click the bookmark icon to save top grants here.
                </p>
                <button
                  onClick={() => setActiveTab('search')}
                  className="px-5 py-2.5 bg-amber-500 text-slate-950 rounded-xl font-bold text-xs"
                >
                  Start Scholarship Search
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {savedScholarships.map((sch, idx) => (
                  <div
                    key={`saved-${idx}-${sch.title}`}
                    className="bg-slate-950 border border-slate-800 rounded-3xl p-6 space-y-4 relative"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                          {sch.fundingType}
                        </span>
                        <h4 className="text-base font-black text-white mt-1">
                          {sch.title}
                        </h4>
                        <p className="text-xs font-bold text-amber-400">{sch.provider}</p>
                      </div>

                      <button
                        onClick={() => toggleSaveScholarship(sch)}
                        className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-red-500/20 hover:text-red-400 transition-colors"
                        title="Remove Bookmark"
                      >
                        <BookmarkCheck className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="text-xs text-slate-300 space-y-1">
                      <p><span className="text-slate-400 font-semibold">Amount:</span> {sch.amount}</p>
                      <p><span className="text-slate-400 font-semibold">Deadline:</span> {sch.deadline}</p>
                    </div>

                    <a
                      href={sch.applicationUrl?.startsWith('http') ? sch.applicationUrl : `https://${sch.applicationUrl || 'scholarships.gov'}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
                    >
                      <span>Visit Application Portal</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                ))}
              </div>
            )}

            {/* Back to Dashboard Footer Button */}
            <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 pb-6">
              <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Need help applying for grants or structuring your SOP? Check our guide.</span>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                <button
                  onClick={() => setShowHowItWorks(true)}
                  className="px-4 py-2.5 rounded-2xl bg-slate-950 hover:bg-slate-800 text-amber-300 border border-amber-900/60 text-xs font-black transition-all flex items-center gap-2 cursor-pointer"
                >
                  <HelpCircle className="w-4 h-4 text-amber-400" />
                  <span>How It Works Instructions</span>
                </button>

                <button
                  onClick={() => {
                    onClose();
                    goBack();
                  }}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-2xl transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-amber-500/20"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to AI Workspace</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* How It Works Modal */}
      <HowItWorksModal
        isOpen={showHowItWorks}
        onClose={() => setShowHowItWorks(false)}
        initialTab="scholarship"
        onOpenUniversityTracker={onOpenUniversityTracker}
      />
    </div>
  );
}
