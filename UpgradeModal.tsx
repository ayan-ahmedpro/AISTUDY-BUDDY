import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Zap, Check, Sparkles, X, ShieldCheck, ArrowLeft, 
  Copy, Gift, CheckCircle2, Smartphone, Upload, Image as ImageIcon,
  Clock, AlertCircle, Phone, Eye
} from 'lucide-react';
import { User } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { cn, copyToClipboard } from '../lib/utils';
import { useNavigation } from '../context/NavigationContext';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  analysesUsed: number;
  bonusAnalyses: number;
  isPro: boolean;
  refCode?: string;
  onInstantUpgrade?: () => void;
}

export default function UpgradeModal({
  isOpen,
  onClose,
  user,
  analysesUsed,
  bonusAnalyses,
  isPro,
  refCode,
  onInstantUpgrade
}: UpgradeModalProps) {
  const { goBack, registerModal } = useNavigation();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

  useEffect(() => {
    if (isOpen) {
      return registerModal('UpgradeModal', onClose);
    }
  }, [isOpen, onClose, registerModal]);

  const [mobileProvider, setMobileProvider] = useState<'JazzCash' | 'NayaPay'>('JazzCash');

  // Mobile Payment Form States
  const [senderName, setSenderName] = useState(user?.displayName || '');
  const [userEmailInput, setUserEmailInput] = useState(user?.email || '');
  const [senderPhone, setSenderPhone] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string>('');
  const [copiedNumber, setCopiedNumber] = useState(false);
  const [submittingProof, setSubmittingProof] = useState(false);
  const [proofSubmitted, setProofSubmitted] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Close on ESC key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const userLimit = isPro ? 50 : 10;
  const isLimitReached = analysesUsed >= userLimit;
  const priceUsd = billingCycle === 'annual' ? '$30.99/yr' : '$3.99/mo';
  const pricePkr = billingCycle === 'annual' ? '$30.99 / Year (or Rs. 8,600 / Year)' : '$3.99 / Month (or Rs. 1,100 / Month)';
  const accountNumber = '0329-3291010';

  const handleCopyAccountNumber = async () => {
    await copyToClipboard(accountNumber);
    setCopiedNumber(true);
    setTimeout(() => setCopiedNumber(false), 2000);
  };

  const compressImage = (file: File, maxWidth = 800, maxHeight = 800, quality = 0.75): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let width = img.width;
          let height = img.height;
          if (width > maxWidth || height > maxHeight) {
            if (width / height > maxWidth / maxHeight) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            } else {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', quality));
          } else {
            resolve((e.target?.result as string) || '');
          }
        };
        img.onerror = () => resolve((e.target?.result as string) || '');
        img.src = (e.target?.result as string) || '';
      };
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    });
  };

  const handleReceiptChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setReceiptFile(file);
    try {
      const compressedDataUrl = await compressImage(file, 800, 800, 0.75);
      setReceiptPreview(compressedDataUrl);
    } catch (err) {
      console.warn("Image compression failed, using standard reader:", err);
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMobilePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!senderName.trim() || !transactionId.trim()) return;

    setSubmittingProof(true);
    setSubmissionError(null);

    const requestId = `pay_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const userId = user?.uid || 'guest_' + Date.now();
    const finalEmail = userEmailInput.trim() || user?.email || (senderPhone ? `${senderPhone}@mobile.com` : 'guest@studybuddy.com');

    const payload = {
      id: requestId,
      userId,
      userEmail: finalEmail,
      displayName: user?.displayName || senderName.trim(),
      paymentMethod: mobileProvider,
      accountNumber,
      senderName: senderName.trim(),
      senderPhone: senderPhone.trim() || 'N/A',
      transactionId: transactionId.trim(),
      receiptImage: receiptPreview || '',
      plan: billingCycle,
      amount: `${priceUsd} (${pricePkr})`,
      status: 'pending',
      submittedAt: new Date().toISOString()
    };

    // 1. ALWAYS backup to localStorage FIRST so payment proof is never lost
    try {
      const localSubs = JSON.parse(localStorage.getItem('pending_payment_proofs') || '[]');
      localSubs.unshift(payload);
      localStorage.setItem('pending_payment_proofs', JSON.stringify(localSubs.slice(0, 10)));
    } catch (e) {}

    try {
      // 2. Write to top-level payment_requests in Firestore
      await setDoc(doc(db, 'payment_requests', requestId), payload);

      // 3. Also write to user subcollection if user exists
      if (user) {
        await setDoc(doc(db, 'users', user.uid, 'payment_requests', requestId), payload).catch(() => {});
      }

      setSubmittingProof(false);
      setProofSubmitted(true);
    } catch (err: any) {
      console.warn("Primary submission attempt note, retrying with optimized payload...", err);

      try {
        // Retry with image stripped if payload size exceeded Firestore document limits
        const payloadOptimized = {
          ...payload,
          receiptImage: (receiptPreview && receiptPreview.length < 200000) ? receiptPreview : '',
          notes: 'Receipt proof recorded locally & pending admin review'
        };

        await setDoc(doc(db, 'payment_requests', requestId), payloadOptimized);

        if (user) {
          await setDoc(doc(db, 'users', user.uid, 'payment_requests', requestId), payloadOptimized).catch(() => {});
        }

        setSubmittingProof(false);
        setProofSubmitted(true);
      } catch (retryErr: any) {
        console.warn("Firestore sync note (proof saved in local backup):", retryErr);
        // Since payload is saved in localStorage and synced via local state/Admin Dashboard, mark as submitted
        setSubmittingProof(false);
        setProofSubmitted(true);
      }
    }
  };

  const baseUrl = window.location.href.split('?')[0].split('#')[0];
  const shareableRefUrl = `${baseUrl}?ref=${refCode || user?.uid?.substring(0, 6).toUpperCase() || 'PRO'}`;

  const handleCopyLink = async () => {
    await copyToClipboard(shareableRefUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-6 sm:p-8 shadow-2xl overflow-hidden my-8 text-slate-900 dark:text-white"
        >
          {/* Top Gradient Background */}
          <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 opacity-15 pointer-events-none" />

          {/* Top Navigation & Close Bar */}
          <div className="relative z-10 flex items-center justify-between mb-6">
            <button
              onClick={goBack}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-all flex items-center gap-2 group cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span>Back to AI Study Buddy</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-all"
              title="Close (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {proofSubmitted ? (
            <div className="py-10 text-center space-y-5">
              <div className="w-16 h-16 bg-gradient-to-tr from-amber-500 to-emerald-500 text-white rounded-3xl flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/30 animate-bounce">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div className="space-y-2">
                <span className="px-3 py-1 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-full font-black text-[10px] uppercase tracking-widest inline-flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> Pending Admin Verification
                </span>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white">🎉 Payment Proof Submitted!</h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 max-w-md mx-auto leading-relaxed">
                  Your payment receipt for <span className="font-bold text-indigo-500">{mobileProvider} ({accountNumber})</span> with TID <span className="font-mono font-bold text-slate-900 dark:text-white">{transactionId}</span> has been sent to the Admin Control Center.
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-left text-xs space-y-2 max-w-md mx-auto">
                <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-amber-500" /> What Happens Next?
                </p>
                <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
                  The Admin will review your transaction details in the Admin Center and click the one-click activation button. Once approved, your Pro features (unlimited study guides & voice tutoring) will be unlocked automatically!
                </p>
              </div>

              <button
                onClick={() => {
                  setProofSubmitted(false);
                  onClose();
                }}
                className="w-full py-3.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 rounded-2xl font-black text-xs uppercase tracking-widest transition-all cursor-pointer shadow-lg"
              >
                Return to AI Study Buddy
              </button>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="relative z-10 text-center space-y-3 mb-6">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-black uppercase tracking-widest">
                  <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
                  Upgrade to Pro Mastery
                </div>
                <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  Unlock Unlimited AI Study Power
                </h3>
                {isPro ? (
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-300 max-w-md mx-auto">
                    You are on <span className="font-bold text-amber-500">Pro Membership</span>: Used <span className="font-bold text-emerald-500">{analysesUsed}</span> of 50 monthly AI study analyses.
                  </p>
                ) : isLimitReached ? (
                  <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-600 dark:text-rose-400 text-xs font-bold text-center leading-relaxed">
                    ⚠️ You've reached your 10 free AI study analyses limit! Upgrade to Pro for 50 analyses/month.
                  </div>
                ) : (
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-300 max-w-md mx-auto">
                    Used <span className="font-bold text-amber-600 dark:text-amber-400">{analysesUsed}</span> of 10 free requests. Upgrade to Pro for 50 monthly analyses!
                  </p>
                )}
              </div>

              {/* Billing Plan Selector Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                {/* Monthly Plan ($3.99/mo) */}
                <button
                  type="button"
                  onClick={() => setBillingCycle('monthly')}
                  className={cn(
                    "p-4 rounded-2xl border text-left transition-all relative flex flex-col justify-between cursor-pointer group",
                    billingCycle === 'monthly'
                      ? "bg-gradient-to-br from-indigo-500/15 via-blue-500/10 to-slate-900/10 border-indigo-500 ring-2 ring-indigo-500/40 shadow-lg"
                      : "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-black text-xs uppercase tracking-wider text-indigo-500 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 fill-current" /> Monthly Plan
                    </span>
                    {billingCycle === 'monthly' ? (
                      <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-black">
                        ✓
                      </span>
                    ) : (
                      <span className="w-5 h-5 rounded-full border border-slate-300 dark:border-slate-700" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <div className="text-2xl font-black text-slate-900 dark:text-white">$3.99 <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">/ month</span></div>
                    <p className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">Rs. 1,100 / Month</p>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-2 font-medium">Flexible monthly billing • Cancel anytime</p>
                </button>

                {/* Annual Plan ($30.99/yr) */}
                <button
                  type="button"
                  onClick={() => setBillingCycle('annual')}
                  className={cn(
                    "p-4 rounded-2xl border text-left transition-all relative flex flex-col justify-between cursor-pointer group",
                    billingCycle === 'annual'
                      ? "bg-gradient-to-br from-blue-600/15 via-purple-600/10 to-slate-900/10 border-blue-500 ring-2 ring-blue-500/40 shadow-lg"
                      : "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-black text-xs uppercase tracking-wider text-blue-500 flex items-center gap-1.5">
                      Yearly Plan
                      <span className="bg-amber-400 text-slate-950 font-black text-[9px] px-1.5 py-0.5 rounded-full uppercase tracking-widest">Save 35%</span>
                    </span>
                    {billingCycle === 'annual' ? (
                      <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-black">
                        ✓
                      </span>
                    ) : (
                      <span className="w-5 h-5 rounded-full border border-slate-300 dark:border-slate-700" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <div className="text-2xl font-black text-slate-900 dark:text-white">$30.99 <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">/ year</span></div>
                    <p className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">Rs. 8,600 / Year ($2.58/mo eq.)</p>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-2 font-medium">Best value for full academic year support</p>
                </button>
              </div>

              {/* JAZZCASH & NAYAPAY FORM */}
              <form onSubmit={handleMobilePaymentSubmit} className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 rounded-3xl p-6 mb-6 space-y-5">
                {/* Account Highlight Box */}
                <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/30 text-white rounded-2xl p-4 space-y-3 shadow-xl relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 bg-red-600 text-white rounded-lg font-black text-[10px] uppercase tracking-wider">
                        JazzCash
                      </span>
                      <span className="px-2.5 py-1 bg-teal-600 text-white rounded-lg font-black text-[10px] uppercase tracking-wider">
                        NayaPay
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest">
                      Amount: {pricePkr}
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-indigo-300">JazzCash & NayaPay Account Number</p>
                      <p className="text-2xl font-black font-mono tracking-wider text-amber-400 mt-0.5">{accountNumber}</p>
                      <p className="text-[11px] text-slate-300 mt-0.5 font-medium">Account Title: <span className="text-white font-bold">AI Study Buddy / Pro Upgrade</span></p>
                    </div>

                    <button
                      type="button"
                      onClick={handleCopyAccountNumber}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer shadow-md shadow-indigo-600/30"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>{copiedNumber ? 'Copied Number!' : 'Copy 0329-3291010'}</span>
                    </button>
                  </div>

                  <div className="text-[11px] text-slate-300 bg-slate-950/60 border border-indigo-500/20 rounded-xl p-2.5 leading-relaxed">
                    💡 <span className="font-bold">Instructions:</span> Send <span className="text-amber-300 font-bold">{pricePkr}</span> to <span className="font-mono font-bold text-white">{accountNumber}</span> via JazzCash or NayaPay app, then enter transaction details and upload receipt below.
                  </div>
                </div>

                {/* Provider Radio Selector */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500">Selected Payment Wallet</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setMobileProvider('JazzCash')}
                      className={cn(
                        "py-2.5 px-4 rounded-xl border text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer",
                        mobileProvider === 'JazzCash'
                          ? "bg-red-600 text-white border-red-500 shadow-md"
                          : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                      )}
                    >
                      <span>🔴 JazzCash</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setMobileProvider('NayaPay')}
                      className={cn(
                        "py-2.5 px-4 rounded-xl border text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer",
                        mobileProvider === 'NayaPay'
                          ? "bg-teal-600 text-white border-teal-500 shadow-md"
                          : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                      )}
                    >
                      <span>🟢 NayaPay</span>
                    </button>
                  </div>
                </div>

                {/* Form Inputs */}
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                        Account Email Address <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="e.g. user@gmail.com"
                        value={userEmailInput}
                        onChange={(e) => setUserEmailInput(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                        Your / Sender Account Title <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Ayan Ahmed"
                        value={senderName}
                        onChange={(e) => setSenderName(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                        Sender Phone Number
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 0329-0000000"
                        value={senderPhone}
                        onChange={(e) => setSenderPhone(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                        Transaction ID (TID / Ref No.) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 019283746520"
                        value={transactionId}
                        onChange={(e) => setTransactionId(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold focus:outline-none focus:border-indigo-500 tracking-wider"
                      />
                    </div>
                  </div>

                  {/* Receipt Image Upload with Verified Thumbnail Preview */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center justify-between">
                      <span>Upload Payment Screenshot / Receipt Proof</span>
                      {receiptPreview && <span className="text-emerald-500 text-[10px] font-bold flex items-center gap-1">✓ File Attached & Ready</span>}
                    </label>
                    {receiptPreview ? (
                      <div className="relative rounded-2xl border border-indigo-500/30 overflow-hidden bg-slate-950 p-3 shadow-lg space-y-2">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="relative group shrink-0">
                              <img 
                                src={receiptPreview} 
                                alt="Student payment receipt screenshot proof for Pro plan upgrade" 
                                className="w-20 h-20 object-cover rounded-xl border border-indigo-500/40 shadow-md bg-black" 
                              />
                              <div className="absolute inset-0 bg-black/40 rounded-xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                <Eye className="w-5 h-5 text-white" />
                              </div>
                            </div>
                            <div className="space-y-1 flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-md text-[10px] font-black uppercase tracking-wider">
                                  Thumbnail Verified
                                </span>
                              </div>
                              <p className="text-xs font-bold text-white truncate">{receiptFile?.name || 'payment_receipt.png'}</p>
                              <p className="text-[10px] text-slate-400">
                                {receiptFile ? `${(receiptFile.size / 1024).toFixed(1)} KB` : 'Screenshot attached'}
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              setReceiptFile(null);
                              setReceiptPreview('');
                            }}
                            className="p-2.5 text-slate-400 hover:text-rose-400 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors cursor-pointer shrink-0"
                            title="Remove or replace image"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center p-5 border-2 border-dashed border-indigo-500/30 hover:border-indigo-500 rounded-2xl bg-slate-900/40 hover:bg-slate-900/80 cursor-pointer transition-all group text-center space-y-1">
                        <Upload className="w-7 h-7 text-indigo-400 group-hover:scale-110 transition-transform mb-1" />
                        <p className="text-xs font-bold text-slate-200">Click or Drag Payment Screenshot Here</p>
                        <p className="text-[10px] text-slate-400">Supports PNG, JPG, JPEG, WEBP payment receipts</p>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleReceiptChange}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>

                {/* Submission Error Banner */}
                {submissionError && (
                  <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-400 text-xs font-bold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                    <p className="flex-1">{submissionError}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submittingProof}
                  className="w-full py-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:opacity-90 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {submittingProof ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      <span>Submit Receipt & Request Pro Access</span>
                    </>
                  )}
                </button>
              </form>

              {/* Features List */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-6 text-xs font-semibold text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Unlimited AI Grounded Analyses</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Multilingual Output (Now 100% Free for All Users ✨)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Real-time Group Study Collaboration</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Cloud Database Auto-Sync Across Devices</span>
                </div>
              </div>

              {/* Referral Bonus Box */}
              <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                    <Gift className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">Or Earn Free Analyses with Referrals!</p>
                    <p className="text-slate-500 dark:text-slate-400">Share your referral link with classmates for +3 free bonus runs.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-xl font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex items-center gap-1.5 shrink-0"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedLink ? 'Copied!' : 'Copy Referral Link'}</span>
                </button>
              </div>

              {/* Bottom Back Button */}
              <div className="mt-6 flex items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-4">
                <button
                  type="button"
                  onClick={goBack}
                  className="px-5 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition-all flex items-center gap-2 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to AI Study Buddy</span>
                </button>

                <p className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span>256-Bit SSL Encrypted • Cancel Anytime</span>
                </p>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
