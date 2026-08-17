import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Cookie, ShieldCheck, FileText, Check, X, AlertCircle } from 'lucide-react';

interface CookieConsentBannerProps {
  onOpenPrivacyPolicy: () => void;
  onOpenTermsOfService: () => void;
  onAccept?: () => void;
  onDecline?: () => void;
}

export default function CookieConsentBanner({
  onOpenPrivacyPolicy,
  onOpenTermsOfService,
  onAccept,
  onDecline
}: CookieConsentBannerProps) {
  const [isVisible, setIsVisible] = useState(() => {
    return !localStorage.getItem('cookie_consent_status');
  });

  useEffect(() => {
    const consent = localStorage.getItem('cookie_consent_status');
    if (!consent) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookie_consent_status', 'accepted');
    localStorage.setItem('cookie_consent_date', new Date().toISOString());
    setIsVisible(false);
    if (onAccept) onAccept();
  };

  const handleDecline = () => {
    localStorage.setItem('cookie_consent_status', 'declined');
    localStorage.setItem('cookie_consent_date', new Date().toISOString());
    setIsVisible(false);
    if (onDecline) onDecline();
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-xl z-[90] p-5 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-blue-500/30 dark:border-blue-400/20 backdrop-blur-xl"
      >
        <div className="flex items-start gap-4">
          <div className="p-3 bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-2xl shrink-0 mt-1">
            <Cookie className="w-6 h-6 animate-pulse" />
          </div>

          <div className="space-y-3 flex-grow">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-base font-display font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                Privacy & Cookie Preferences
                <span className="text-[10px] font-bold uppercase tracking-widest bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full">
                  Action Required
                </span>
              </h3>
              <button
                onClick={handleDecline}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg transition-all"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
              We use essential cookies and local storage to keep you logged in, save your study notebooks, and process AI study interactions. Please accept our use of cookies and review our legal policies.
            </p>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-bold text-blue-600 dark:text-blue-400">
              <button
                onClick={onOpenPrivacyPolicy}
                className="hover:underline flex items-center gap-1 cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                Privacy Policy
              </button>
              <span>•</span>
              <button
                onClick={onOpenTermsOfService}
                className="hover:underline flex items-center gap-1 cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                Terms of Service
              </button>
            </div>

            <div className="pt-2 flex flex-wrap items-center gap-2">
              <button
                onClick={handleAccept}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-xs font-black rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                Accept Cookies & Terms
              </button>
              <button
                onClick={handleDecline}
                className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Decline Non-Essential
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
