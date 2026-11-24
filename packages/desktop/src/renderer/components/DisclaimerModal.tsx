import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  Scale,
  FileText,
  Lock,
  XCircle,
  AlertTriangle,
  Cpu,
  Globe,
  LogOut,
  RefreshCw,
  Check,
} from "lucide-react";
import { useI18n } from "../i18n";

interface DisclaimerModalProps {
  isOpen: boolean;
  onAccept: () => void;
}

export const DisclaimerModal: React.FC<DisclaimerModalProps> = ({
  isOpen,
  onAccept,
}) => {
  const { l, language, setLanguage } = useI18n();
  const [agreed, setAgreed] = useState(false);
  const [declined, setDeclined] = useState(false);

  // Strictly enforce non-dismissable behavior (prevent Esc or shortcuts from bypassing)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAccept = () => {
    if (!agreed) return;
    try {
      localStorage.setItem("decompflow_legal_accepted", "true");
    } catch {
      // ignore
    }
    onAccept();
  };

  const handleExitApp = () => {
    if (window.electronAPI?.quitApp) {
      window.electronAPI.quitApp();
    } else {
      window.close();
    }
  };

  const toggleLanguage = () => {
    setLanguage(language === "en" ? "ru" : "en");
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 sm:p-6 select-none animate-fadeIn"
      role="dialog"
      aria-modal="true"
    >
      {/* Declined / Access Restricted View */}
      {declined ? (
        <div className="w-full max-w-lg bg-[#0e1015] border border-red-900/50 rounded-2xl p-6 sm:p-8 shadow-2xl flex flex-col items-center text-center space-y-5 animate-scaleIn">
          <div className="w-14 h-14 rounded-2xl bg-red-950/40 border border-red-800/60 flex items-center justify-center text-red-400 shadow-inner">
            <Lock className="w-7 h-7" />
          </div>

          <div className="space-y-1.5">
            <h2 className="text-lg font-bold text-white tracking-wide">
              {l.disclaimer.declinedTitle}
            </h2>
            <p className="text-xs text-red-400 font-mono">
              {l.disclaimer.declinedSubtitle}
            </p>
          </div>

          <p className="text-xs text-zinc-300 leading-relaxed max-w-md bg-zinc-900/60 p-4 rounded-xl border border-zinc-800">
            {l.disclaimer.declinedBody}
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full pt-2">
            <button
              onClick={() => setDeclined(false)}
              className="w-full sm:flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-all flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              {l.disclaimer.reviewAgainBtn}
            </button>
            <button
              onClick={handleExitApp}
              className="w-full sm:flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold bg-red-900/60 hover:bg-red-800/80 text-red-100 border border-red-700/60 transition-all flex items-center justify-center gap-2"
            >
              <LogOut className="w-3.5 h-3.5" />
              {l.disclaimer.exitAppBtn}
            </button>
          </div>
        </div>
      ) : (
        /* Main Disclaimer Gate Modal */
        <div className="w-full max-w-3xl bg-[#0c0d11] border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-scaleIn">
          {/* Header */}
          <div className="px-6 py-4 border-b border-zinc-800/80 bg-zinc-950/60 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-orange-950/40 border border-orange-700/50 flex items-center justify-center text-orange-400 shadow-inner">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-white tracking-wide">
                  {l.disclaimer.title}
                </h2>
                <p className="text-[11px] text-zinc-400 font-mono">
                  {l.disclaimer.subtitle}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-medium bg-orange-500/10 text-orange-400 border border-orange-500/20">
                <ShieldCheck className="w-3 h-3" />
                {l.disclaimer.badge}
              </span>
              <button
                type="button"
                onClick={toggleLanguage}
                className="px-2.5 py-1 rounded-lg text-[11px] font-mono font-medium bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700/60 transition-all flex items-center gap-1.5"
                title="Switch Language"
              >
                <Globe className="w-3.5 h-3.5 text-zinc-400" />
                <span>{language.toUpperCase()}</span>
              </button>
            </div>
          </div>

          {/* Scrollable Legal Clauses */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 text-xs text-zinc-300 leading-relaxed custom-scrollbar">
            {/* Developer Attribution & Primary Notice */}
            <div className="p-3.5 rounded-xl bg-gradient-to-r from-orange-950/20 to-zinc-900/40 border border-orange-800/30 flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="text-[11px] font-mono font-bold text-orange-300 uppercase tracking-wider">
                  {l.disclaimer.authorNotice}
                </div>
                <p className="text-[11.5px] text-zinc-300 leading-normal">
                  DecompFlow Studio is open-source security engineering software created by dropt1m (@dropt1mx0). It is strictly provided under the terms of the MIT License for defensive cyber research.
                </p>
              </div>
            </div>

            {/* Clause 1: Authorized Scope */}
            <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/80 space-y-1.5">
              <div className="flex items-center gap-2 text-zinc-200 font-semibold text-xs">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{l.disclaimer.sec1Title}</span>
              </div>
              <p className="text-zinc-400 text-[11.5px] leading-relaxed pl-6">
                {l.disclaimer.sec1Body}
              </p>
            </div>

            {/* Clause 2: 'AS IS' Provision */}
            <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/80 space-y-1.5">
              <div className="flex items-center gap-2 text-zinc-200 font-semibold text-xs">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{l.disclaimer.sec2Title}</span>
              </div>
              <p className="text-zinc-400 text-[11.5px] leading-relaxed pl-6">
                {l.disclaimer.sec2Body}
              </p>
            </div>

            {/* Clause 3: Author Liability Limitation */}
            <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/80 space-y-1.5">
              <div className="flex items-center gap-2 text-zinc-200 font-semibold text-xs">
                <Scale className="w-4 h-4 text-orange-400 shrink-0" />
                <span>{l.disclaimer.sec3Title}</span>
              </div>
              <p className="text-zinc-400 text-[11.5px] leading-relaxed pl-6">
                {l.disclaimer.sec3Body}
              </p>
            </div>

            {/* Clause 4: IP & EULA Compliance */}
            <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/80 space-y-1.5">
              <div className="flex items-center gap-2 text-zinc-200 font-semibold text-xs">
                <FileText className="w-4 h-4 text-sky-400 shrink-0" />
                <span>{l.disclaimer.sec4Title}</span>
              </div>
              <p className="text-zinc-400 text-[11.5px] leading-relaxed pl-6">
                {l.disclaimer.sec4Body}
              </p>
            </div>

            {/* Clause 5: Local AI & Data Privacy */}
            <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/80 space-y-1.5">
              <div className="flex items-center gap-2 text-zinc-200 font-semibold text-xs">
                <Cpu className="w-4 h-4 text-purple-400 shrink-0" />
                <span>{l.disclaimer.sec5Title}</span>
              </div>
              <p className="text-zinc-400 text-[11.5px] leading-relaxed pl-6">
                {l.disclaimer.sec5Body}
              </p>
            </div>
          </div>

          {/* Footer with Checkbox & Gate Action */}
          <div className="px-6 py-4 border-t border-zinc-800/80 bg-zinc-950/70 space-y-3.5">
            {/* Agreement Checkbox */}
            <label
              htmlFor="disclaimer-checkbox"
              className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                agreed
                  ? "bg-orange-950/20 border-orange-500/50 text-white"
                  : "bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-300"
              }`}
            >
              <div
                className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center shrink-0 border transition-colors ${
                  agreed
                    ? "bg-orange-600 border-orange-500 text-white"
                    : "border-zinc-600 bg-zinc-950"
                }`}
              >
                {agreed && <Check className="w-3 h-3 stroke-[3]" />}
              </div>
              <input
                id="disclaimer-checkbox"
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="sr-only"
              />
              <span className="text-[11.5px] font-medium leading-snug">
                {l.disclaimer.agreeCheckbox}
              </span>
            </label>

            {/* Action Buttons */}
            <div className="flex items-center justify-between gap-3 pt-1">
              <button
                type="button"
                onClick={() => setDeclined(true)}
                className="px-4 py-2 rounded-xl text-xs font-mono text-zinc-400 hover:text-zinc-200 bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 transition-all flex items-center gap-1.5"
              >
                <XCircle className="w-3.5 h-3.5" />
                {l.disclaimer.declineBtn}
              </button>

              <button
                type="button"
                disabled={!agreed}
                onClick={handleAccept}
                className={`px-5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-lg ${
                  agreed
                    ? "bg-orange-600 hover:bg-orange-500 text-white shadow-orange-950/50 cursor-pointer active:scale-[0.98]"
                    : "bg-zinc-800/80 text-zinc-500 border border-zinc-800 cursor-not-allowed opacity-50"
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                {l.disclaimer.acceptBtn}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
