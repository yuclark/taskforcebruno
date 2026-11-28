import { useId } from 'react';

/**
 * PageBackdrop — Soft, eye-friendly ambient background artwork that fills empty
 * margins & whitespace across every portal page in both Light & Dark modes.
 *
 * Uses muted, low-contrast warm maroon/gold washes, a subtle tiled paw & dot
 * micro-pattern, and page-specific architectural line-art watermarks positioned
 * cleanly in outer corners/margins so text & cards always remain crisp.
 */
function CornerWatermark({ variant }) {
  switch (variant) {
    case 'campus-map':
      return (
        <>
          {/* Top-right compass & topographic rings */}
          <svg
            viewBox="0 0 360 360"
            className="absolute -top-10 -right-10 w-[340px] h-[340px] sm:w-[440px] sm:h-[440px] text-[#5C0612] dark:text-[#D4AF37] opacity-[0.065] dark:opacity-[0.08]"
            fill="none"
            stroke="currentColor"
          >
            <circle cx="180" cy="180" r="150" strokeWidth="1.2" strokeDasharray="6 8" />
            <circle cx="180" cy="180" r="112" strokeWidth="1.2" />
            <circle cx="180" cy="180" r="74" strokeWidth="1" strokeDasharray="3 6" />
            <path d="M180 22 L194 166 L338 180 L194 194 L180 338 L166 194 L22 180 L166 166 Z" strokeWidth="1.2" />
            <circle cx="180" cy="180" r="16" strokeWidth="1.5" />
          </svg>
          {/* Bottom-left topographic contour curves */}
          <svg
            viewBox="0 0 420 280"
            className="absolute -bottom-8 -left-10 w-[340px] sm:w-[460px] text-[#8B6B22] dark:text-[#D4AF37] opacity-[0.075] dark:opacity-[0.07]"
            fill="none"
            stroke="currentColor"
          >
            <path d="M-20 260 C70 190 150 220 230 150 C295 95 340 120 420 50" strokeWidth="1.5" />
            <path d="M-20 220 C85 150 165 180 245 110 C310 55 355 80 435 10" strokeWidth="1.2" strokeDasharray="5 7" />
            <path d="M20 290 C110 225 190 250 270 185 C330 135 370 155 440 95" strokeWidth="1.2" />
          </svg>
        </>
      );

    case 'scanner':
      return (
        <>
          {/* Top-right geometric viewfinder & QR matrix */}
          <svg
            viewBox="0 0 320 320"
            className="absolute top-2 right-2 w-[260px] sm:w-[340px] text-[#5C0612] dark:text-[#D4AF37] opacity-[0.065] dark:opacity-[0.08]"
            fill="none"
            stroke="currentColor"
          >
            <path d="M40 95 V40 H95 M225 40 H280 V95 M280 225 V280 H225 M95 280 H40 V225" strokeWidth="3" strokeLinecap="round" />
            <rect x="85" y="85" width="46" height="46" rx="8" strokeWidth="2" />
            <rect x="189" y="85" width="46" height="46" rx="8" strokeWidth="2" />
            <rect x="85" y="189" width="46" height="46" rx="8" strokeWidth="2" />
            <rect x="148" y="148" width="24" height="24" rx="4" fill="currentColor" opacity="0.45" />
            <rect x="189" y="189" width="20" height="20" rx="4" fill="currentColor" opacity="0.35" />
            <rect x="217" y="217" width="18" height="18" rx="4" fill="currentColor" opacity="0.35" />
            <line x1="56" y1="160" x2="264" y2="160" strokeWidth="1.5" strokeDasharray="6 6" />
          </svg>
          <PawTrailCorner />
        </>
      );

    case 'adoption':
      return (
        <>
          {/* Top-right heart + paw emblem */}
          <svg
            viewBox="0 0 340 340"
            className="absolute -top-6 -right-6 w-[290px] sm:w-[380px] text-[#5C0612] dark:text-[#D4AF37] opacity-[0.065] dark:opacity-[0.08]"
            fill="none"
            stroke="currentColor"
          >
            <path
              d="M170 282 C170 282 54 210 54 126 C54 84 86 54 124 54 C148 54 163 67 170 82 C177 67 192 54 216 54 C254 54 286 84 286 126 C286 210 170 282 170 282 Z"
              strokeWidth="1.8"
            />
            <circle cx="142" cy="144" r="12" fill="currentColor" opacity="0.35" />
            <circle cx="170" cy="128" r="13" fill="currentColor" opacity="0.35" />
            <circle cx="198" cy="144" r="12" fill="currentColor" opacity="0.35" />
            <path
              d="M144 184 C144 168 156 158 170 158 C184 158 196 168 196 184 C196 198 184 205 170 202 C156 205 144 198 144 184 Z"
              fill="currentColor"
              opacity="0.35"
            />
          </svg>
          <PawTrailCorner />
        </>
      );

    case 'report':
    case 'sightings':
      return (
        <>
          {/* Concentric radar & location pin */}
          <svg
            viewBox="0 0 360 360"
            className="absolute -top-12 -right-12 w-[320px] sm:w-[420px] text-[#5C0612] dark:text-rose-400 opacity-[0.065] dark:opacity-[0.08]"
            fill="none"
            stroke="currentColor"
          >
            <circle cx="180" cy="180" r="145" strokeWidth="1.2" strokeDasharray="8 8" />
            <circle cx="180" cy="180" r="102" strokeWidth="1.2" />
            <circle cx="180" cy="180" r="58" strokeWidth="1.2" strokeDasharray="4 6" />
            <path
              d="M180 112 C154 112 134 132 134 158 C134 192 180 236 180 236 C180 236 226 192 226 158 C226 132 206 112 180 112 Z"
              strokeWidth="2"
            />
            <circle cx="180" cy="156" r="16" strokeWidth="2" />
          </svg>
          <PawTrailCorner />
        </>
      );

    case 'medical':
      return (
        <>
          {/* Veterinary shield + ECG pulse line */}
          <svg
            viewBox="0 0 380 340"
            className="absolute -top-4 -right-6 w-[310px] sm:w-[400px] text-[#5C0612] dark:text-[#D4AF37] opacity-[0.065] dark:opacity-[0.08]"
            fill="none"
            stroke="currentColor"
          >
            <path
              d="M190 42 L292 84 V166 C292 232 246 278 190 302 C134 278 88 232 88 166 V84 L190 42 Z"
              strokeWidth="1.8"
            />
            <path
              d="M28 178 H122 L144 134 L172 222 L198 150 L216 178 H352"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <PawTrailCorner />
        </>
      );

    case 'resources':
    case 'inventory':
      return (
        <>
          {/* Isometric supply cube lattice */}
          <svg
            viewBox="0 0 360 360"
            className="absolute -top-6 -right-8 w-[300px] sm:w-[390px] text-[#5C0612] dark:text-[#D4AF37] opacity-[0.065] dark:opacity-[0.08]"
            fill="none"
            stroke="currentColor"
          >
            <polygon points="180,46 286,104 286,222 180,280 74,222 74,104" strokeWidth="1.8" />
            <polyline points="74,104 180,162 286,104" strokeWidth="1.5" />
            <line x1="180" y1="162" x2="180" y2="280" strokeWidth="1.5" />
            <polygon points="180,96 238,128 180,160 122,128" strokeWidth="1.2" strokeDasharray="4 4" />
          </svg>
          <PawTrailCorner />
        </>
      );

    case 'support':
    case 'applications':
      return (
        <>
          {/* Community care emblem */}
          <svg
            viewBox="0 0 360 360"
            className="absolute -top-8 -right-8 w-[300px] sm:w-[400px] text-[#5C0612] dark:text-[#D4AF37] opacity-[0.065] dark:opacity-[0.08]"
            fill="none"
            stroke="currentColor"
          >
            <circle cx="180" cy="180" r="136" strokeWidth="1.4" strokeDasharray="6 6" />
            <circle cx="180" cy="180" r="92" strokeWidth="1.4" />
            <path
              d="M180 232 C180 232 122 196 122 156 C122 136 138 122 156 122 C168 122 176 129 180 137 C184 129 192 122 204 122 C222 122 238 136 238 156 C238 196 180 232 180 232 Z"
              strokeWidth="2"
            />
          </svg>
          <PawTrailCorner />
        </>
      );

    case 'broadcast':
      return (
        <>
          {/* Acoustic broadcast arcs */}
          <svg
            viewBox="0 0 360 360"
            className="absolute -top-6 -right-6 w-[300px] sm:w-[390px] text-[#5C0612] dark:text-[#D4AF37] opacity-[0.065] dark:opacity-[0.08]"
            fill="none"
            stroke="currentColor"
          >
            <path d="M110 250 A140 140 0 0 1 250 110" strokeWidth="1.8" strokeDasharray="8 6" />
            <path d="M145 250 A105 105 0 0 1 250 145" strokeWidth="1.8" />
            <path d="M180 250 A70 70 0 0 1 250 180" strokeWidth="1.8" strokeDasharray="4 5" />
            <circle cx="250" cy="250" r="24" strokeWidth="2" />
          </svg>
          <PawTrailCorner />
        </>
      );

    default:
      // 'newsfeed' | 'pet-listings' | 'add-pet' | 'auth'
      return (
        <>
          {/* Top-right ornate campus welfare medallion + paw */}
          <svg
            viewBox="0 0 380 380"
            className="absolute -top-12 -right-10 w-[320px] sm:w-[440px] text-[#5C0612] dark:text-[#D4AF37] opacity-[0.06] dark:opacity-[0.075]"
            fill="none"
            stroke="currentColor"
          >
            <circle cx="190" cy="190" r="158" strokeWidth="1.2" strokeDasharray="7 9" />
            <circle cx="190" cy="190" r="120" strokeWidth="1.2" />
            <circle cx="190" cy="190" r="82" strokeWidth="1" strokeDasharray="3 6" />
            {/* Stylized Wildcat Paw Centerpiece */}
            <ellipse cx="152" cy="158" rx="14" ry="18" transform="rotate(-18 152 158)" fill="currentColor" opacity="0.45" />
            <ellipse cx="180" cy="138" rx="14" ry="19" transform="rotate(-5 180 138)" fill="currentColor" opacity="0.45" />
            <ellipse cx="212" cy="142" rx="14" ry="19" transform="rotate(10 212 142)" fill="currentColor" opacity="0.45" />
            <ellipse cx="236" cy="166" rx="13" ry="17" transform="rotate(24 236 166)" fill="currentColor" opacity="0.45" />
            <path
              d="M150 216 C150 192 168 176 192 178 C216 180 232 198 228 220 C225 236 209 242 191 237 C173 242 150 234 150 216 Z"
              fill="currentColor"
              opacity="0.45"
            />
          </svg>
          <PawTrailCorner />
        </>
      );
  }
}

function PawTrailCorner() {
  return (
    <svg
      viewBox="0 0 420 260"
      className="absolute -bottom-6 -left-6 w-[300px] sm:w-[420px] text-[#7D5A18] dark:text-[#D4AF37] opacity-[0.065] dark:opacity-[0.07]"
      fill="currentColor"
    >
      {/* Subtle ascending paw trail */}
      <g transform="translate(46 188) rotate(-26) scale(0.75)">
        <ellipse cx="14" cy="14" rx="6" ry="8" />
        <ellipse cx="28" cy="8" rx="6" ry="8" />
        <ellipse cx="42" cy="11" rx="6" ry="8" />
        <ellipse cx="52" cy="21" rx="5.5" ry="7.5" />
        <path d="M16 38 C16 28 24 23 33 24 C42 25 48 31 46 40 C44 47 38 49 32 47 C26 49 16 46 16 38 Z" />
      </g>
      <g transform="translate(132 142) rotate(-18) scale(0.68)">
        <ellipse cx="14" cy="14" rx="6" ry="8" />
        <ellipse cx="28" cy="8" rx="6" ry="8" />
        <ellipse cx="42" cy="11" rx="6" ry="8" />
        <ellipse cx="52" cy="21" rx="5.5" ry="7.5" />
        <path d="M16 38 C16 28 24 23 33 24 C42 25 48 31 46 40 C44 47 38 49 32 47 C26 49 16 46 16 38 Z" />
      </g>
      <g transform="translate(216 112) rotate(-28) scale(0.6)">
        <ellipse cx="14" cy="14" rx="6" ry="8" />
        <ellipse cx="28" cy="8" rx="6" ry="8" />
        <ellipse cx="42" cy="11" rx="6" ry="8" />
        <ellipse cx="52" cy="21" rx="5.5" ry="7.5" />
        <path d="M16 38 C16 28 24 23 33 24 C42 25 48 31 46 40 C44 47 38 49 32 47 C26 49 16 46 16 38 Z" />
      </g>
      <g transform="translate(294 68) rotate(-16) scale(0.52)">
        <ellipse cx="14" cy="14" rx="6" ry="8" />
        <ellipse cx="28" cy="8" rx="6" ry="8" />
        <ellipse cx="42" cy="11" rx="6" ry="8" />
        <ellipse cx="52" cy="21" rx="5.5" ry="7.5" />
        <path d="M16 38 C16 28 24 23 33 24 C42 25 48 31 46 40 C44 47 38 49 32 47 C26 49 16 46 16 38 Z" />
      </g>
    </svg>
  );
}

export default function PageBackdrop({ variant = 'newsfeed', className = '' }) {
  const uid = useId().replace(/:/g, '');
  const patternId = `tfb-paw-grid-${uid}`;

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none select-none absolute inset-0 overflow-hidden z-0 ${className}`}
    >
      {/* Layer 1: Eye-friendly warm parchment (light) / deep plum-obsidian (dark) corner washes */}
      <div className="absolute -top-36 -left-32 w-[460px] h-[460px] rounded-full bg-[#5C0612]/[0.055] dark:bg-[#9E162B]/[0.16] blur-3xl" />
      <div className="absolute top-1/3 -right-32 w-[440px] h-[440px] rounded-full bg-[#D4AF37]/[0.10] dark:bg-[#D4AF37]/[0.075] blur-3xl" />
      <div className="absolute -bottom-36 left-1/4 w-[480px] h-[480px] rounded-full bg-[#8B1A2B]/[0.045] dark:bg-[#5C0612]/[0.18] blur-3xl" />

      {/* Layer 2: Seamless low-contrast paw-print & architectural dot pattern */}
      <svg
        className="absolute inset-0 w-full h-full text-[#5C0612] dark:text-[#D4AF37] opacity-[0.042] dark:opacity-[0.048]"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id={patternId} width="144" height="144" patternUnits="userSpaceOnUse">
            {/* Subtle architectural crosshairs & dots */}
            <circle cx="16" cy="16" r="1.4" fill="currentColor" opacity="0.6" />
            <circle cx="88" cy="88" r="1.4" fill="currentColor" opacity="0.6" />
            <path d="M124 22 H132 M128 18 V26" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.45" />
            <path d="M22 124 H30 M26 120 V128" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.45" />

            {/* Soft minimalist paw motif #1 */}
            <g transform="translate(50 28) rotate(-15) scale(0.36)" fill="currentColor">
              <ellipse cx="14" cy="14" rx="6" ry="8" />
              <ellipse cx="28" cy="8" rx="6" ry="8" />
              <ellipse cx="42" cy="11" rx="6" ry="8" />
              <ellipse cx="52" cy="21" rx="5.5" ry="7.5" />
              <path d="M16 38 C16 28 24 23 33 24 C42 25 48 31 46 40 C44 47 38 49 32 47 C26 49 16 46 16 38 Z" />
            </g>

            {/* Soft minimalist paw motif #2 (staggered) */}
            <g transform="translate(106 94) rotate(18) scale(0.32)" fill="currentColor" opacity="0.75">
              <ellipse cx="14" cy="14" rx="6" ry="8" />
              <ellipse cx="28" cy="8" rx="6" ry="8" />
              <ellipse cx="42" cy="11" rx="6" ry="8" />
              <ellipse cx="52" cy="21" rx="5.5" ry="7.5" />
              <path d="M16 38 C16 28 24 23 33 24 C42 25 48 31 46 40 C44 47 38 49 32 47 C26 49 16 46 16 38 Z" />
            </g>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${patternId})`} />
      </svg>

      {/* Layer 3: Page-specific architectural watermarks in outer margins */}
      <CornerWatermark variant={variant} />

      {/* Layer 4: Subtle soft-edge vignette to soothe glare on wide screens */}
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_58%,rgba(92,6,18,0.045)_100%)] dark:bg-[radial-gradient(ellipse_at_center,transparent_50%,rgba(0,0,0,0.32)_100%)]"
      />
    </div>
  );
}
