import React from 'react';

/**
 * Ambient Glow Background Orbs for the Modern Gradient design system.
 * Uses fixed, pointer-events-none glowing radial blurs to create futuristic depth.
 */
export function AmbientGlow() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
      {/* Top-left Violet Glow */}
      <div className="absolute -top-32 -left-32 h-[500px] w-[500px] rounded-full bg-gradient-to-tr from-violet-600/25 to-purple-600/20 blur-[130px]" />

      {/* Top-right Fuchsia Glow */}
      <div className="absolute top-12 -right-32 h-[550px] w-[550px] rounded-full bg-gradient-to-bl from-fuchsia-600/20 via-pink-600/15 to-violet-600/10 blur-[140px]" />

      {/* Center Cyan/Blue Accent Glow */}
      <div className="absolute top-[45%] left-[20%] h-[400px] w-[400px] rounded-full bg-gradient-to-r from-cyan-500/10 to-blue-600/10 blur-[120px]" />

      {/* Bottom Violet Anchor */}
      <div className="absolute -bottom-40 right-[15%] h-[500px] w-[500px] rounded-full bg-gradient-to-tl from-violet-600/20 to-fuchsia-600/15 blur-[140px]" />
    </div>
  );
}
