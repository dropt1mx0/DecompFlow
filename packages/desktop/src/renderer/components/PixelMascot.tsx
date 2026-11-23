import React from "react";

interface PixelMascotProps {
  size?: number;
  glow?: boolean;
}

export const PixelMascot: React.FC<PixelMascotProps> = ({ size = 48, glow = true }) => {
  return (
    <div
      className={`relative inline-flex items-center justify-center ${
        glow ? "drop-shadow-[0_0_18px_rgba(249,115,22,0.65)]" : ""
      }`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 24 24"
        width={size}
        height={size}
        fill="currentColor"
        className="text-[#f97316]"
        shapeRendering="crispEdges"
      >
        {/* Antennas / Ears */}
        <rect x="5" y="4" width="2" height="2" />
        <rect x="15" y="4" width="2" height="2" />
        
        {/* Head Top */}
        <rect x="7" y="6" width="8" height="2" />
        
        {/* Face Row 1 */}
        <rect x="4" y="8" width="14" height="2" />
        
        {/* Face Row 2 with Eyes */}
        <rect x="3" y="10" width="16" height="2" />
        {/* Eye cutouts */}
        <rect x="6" y="10" width="2" height="2" fill="#131418" />
        <rect x="14" y="10" width="2" height="2" fill="#131418" />
        
        {/* Face Row 3 */}
        <rect x="3" y="12" width="16" height="2" />
        {/* Mouth/detail cutout */}
        <rect x="9" y="12" width="4" height="1" fill="#131418" />
        
        {/* Body Main */}
        <rect x="4" y="14" width="14" height="3" />
        
        {/* Legs / Feet */}
        <rect x="5" y="17" width="3" height="3" />
        <rect x="14" y="17" width="3" height="3" />
        <rect x="9" y="16" width="4" height="1" />

        {/* Magic Wand / Sparkle on right */}
        <rect x="19" y="7" width="1" height="6" fill="#fb923c" />
        <rect x="20" y="5" width="2" height="2" fill="#facc15" />
        <rect x="19" y="4" width="1" height="1" fill="#fef08a" />
        <rect x="22" y="6" width="1" height="1" fill="#fef08a" />
      </svg>
    </div>
  );
};
