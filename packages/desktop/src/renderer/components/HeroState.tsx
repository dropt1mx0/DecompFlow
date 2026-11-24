import React from "react";
import { PixelMascot } from "./PixelMascot";
import { Cpu, Shield, Globe, Sparkles, Folder } from "lucide-react";
import { TargetMode } from "../types";
import { useI18n } from "../i18n";

interface HeroStateProps {
  workspaceName: string;
  targetPath: string;
  onSelectAction: (actionText: string, mode: TargetMode, skill: string, needFilePicker?: boolean) => void;
  onSelectTarget: () => void;
}

export const HeroState: React.FC<HeroStateProps> = ({
  workspaceName,
  targetPath,
  onSelectAction,
  onSelectTarget,
}) => {
  const { l } = useI18n();

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center select-none max-w-2xl mx-auto my-auto animate-in fade-in duration-300 font-sans">
      {/* Pixel Mascot Brand Icon with glowing wand */}
      <div className="mb-6 hover:scale-105 transition-transform cursor-pointer">
        <PixelMascot size={58} glow={true} />
      </div>

      {/* Main Heading */}
      <h1 className="text-2xl font-bold text-[#f0f1f5] tracking-tight mb-2">
        {l.hero.title}
      </h1>

      {/* Context hints matching screenshot */}
      <p className="text-sm text-[#8b8f9e] mb-2 leading-relaxed">
        {l.hero.subtitlePrefix}
        <span className="font-semibold text-[#f0f1f5]">{workspaceName}</span>
      </p>

      {/* Real target status badge */}
      <div
        onClick={onSelectTarget}
        title={l.hero.targetSelectPrompt}
        className="text-xs text-[#8b8f9e] hover:text-[#f0f1f5] font-mono mb-8 bg-[#181a20] hover:bg-[#20232c] px-3.5 py-1.5 rounded-full border border-[#232630] hover:border-[#f97316]/50 inline-flex items-center gap-2 cursor-pointer transition-colors shadow-sm"
      >
        <Folder className="w-3.5 h-3.5 text-[#f97316]" />
        <span>· {targetPath ? targetPath : l.hero.targetSelectPrompt}</span>
        <span className="text-[10px] text-[#22c55e] ml-1">● {l.common.ready}</span>
      </div>

      {/* Quick Action Suggestion Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-2.5">
        <button
          onClick={() =>
            onSelectAction(
              l.hero.promptReconstruct,
              "source",
              "feature-reconstruct"
            )
          }
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#181a20] hover:bg-[#20232b] text-xs font-medium text-[#f0f1f5] border border-[#262933] hover:border-[#f97316]/60 transition-all shadow-sm active:scale-95 group cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#f97316] group-hover:scale-110 transition-transform" />
          <span>{l.hero.reconstructFeature}</span>
        </button>

        <button
          onClick={() =>
            onSelectAction(
              l.hero.promptPlan,
              "source",
              "repo-onboarding"
            )
          }
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#181a20] hover:bg-[#20232b] text-xs font-medium text-[#f0f1f5] border border-[#262933] hover:border-[#f97316]/60 transition-all shadow-sm active:scale-95 group cursor-pointer"
        >
          <Cpu className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
          <span>{l.hero.planArchitecture}</span>
        </button>

        <button
          onClick={() =>
            onSelectAction(
              l.hero.promptAudit,
              "source",
              "security-audit"
            )
          }
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#181a20] hover:bg-[#20232b] text-xs font-medium text-[#f0f1f5] border border-[#262933] hover:border-[#f97316]/60 transition-all shadow-sm active:scale-95 group cursor-pointer"
        >
          <Shield className="w-3.5 h-3.5 text-rose-400 group-hover:scale-110 transition-transform" />
          <span>{l.hero.auditRepo}</span>
        </button>

        <button
          onClick={() =>
            onSelectAction(
              l.hero.promptDecompile,
              "binary",
              "binary-architecture",
              !targetPath || targetPath.endsWith("/")
            )
          }
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#181a20] hover:bg-[#20232b] text-xs font-medium text-[#f0f1f5] border border-[#262933] hover:border-[#f97316]/60 transition-all shadow-sm active:scale-95 group cursor-pointer"
        >
          <Cpu className="w-3.5 h-3.5 text-[#38bdf8] group-hover:scale-110 transition-transform" />
          <span>{l.hero.decompileBinary}</span>
        </button>

        <button
          onClick={() =>
            onSelectAction(
              l.hero.promptWeb,
              "web",
              "web-api-mapper"
            )
          }
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#181a20] hover:bg-[#20232b] text-xs font-medium text-[#f0f1f5] border border-[#262933] hover:border-[#f97316]/60 transition-all shadow-sm active:scale-95 group cursor-pointer"
        >
          <Globe className="w-3.5 h-3.5 text-sky-400 group-hover:scale-110 transition-transform" />
          <span>{l.hero.inspectWebApp}</span>
        </button>
      </div>
    </div>
  );
};
