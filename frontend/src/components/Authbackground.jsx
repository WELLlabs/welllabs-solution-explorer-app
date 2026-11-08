import React from 'react';

/**
 * AuthBackground
 * A "watershed" backdrop for Login / Register:
 *  - tea-green sky with a soft Tuscan-sun glow
 *  - slow-breathing topographic contour lines (lake / terrain feel)
 *  - rain ripples spreading across the surface (the memorable moment)
 *  - three layered river waves drifting at different speeds
 *
 * Palette: tea-green, turf-green, blue-grey, ocean-deep, tuscan-sun.
 * Pure CSS + SVG, no dependencies. Respects prefers-reduced-motion.
 *
 * Usage (inside a `relative` wrapper):  <AuthBackground />
 */

// Builds a seamless wave path. `segments` must be even so a -50% shift loops perfectly.
const wavePath = (base, amp, seg = 720, segments = 4, height = 400) => {
  let d = `M0 ${base}`;
  for (let i = 0; i < segments; i++) {
    const x = i * seg;
    d += ` C ${x + seg / 3} ${base - amp}, ${x + (2 * seg) / 3} ${base + amp}, ${x + seg} ${base}`;
  }
  return `${d} V ${height} H0 Z`;
};

const WAVES = [
  { path: wavePath(120, 38, 720), fill: '#6D9EC9', opacity: 0.22, cls: 'ab-wave-slow', h: '38vh' },
  { path: wavePath(150, 30, 960), fill: '#347745', opacity: 0.14, cls: 'ab-wave-rev', h: '32vh' },
  { path: wavePath(190, 24, 720), fill: '#3669A9', opacity: 0.2, cls: 'ab-wave-fast', h: '26vh' },
];

// Rain ripples: position (%) + start delay (s) + size (px)
const RIPPLES = [
  { x: 14, y: 24, delay: 0, size: 240 },
  { x: 84, y: 20, delay: 2.4, size: 200 },
  { x: 72, y: 66, delay: 4.6, size: 280 },
  { x: 24, y: 70, delay: 1.2, size: 220 },
  { x: 50, y: 10, delay: 5.8, size: 160 },
];

const CONTOUR_RINGS = [60, 105, 150, 195, 240, 285];

const AuthBackground = () => (
  <div className="ab-root" aria-hidden="true">
    <style>{`
      .ab-root {
        position: absolute; inset: 0; z-index: 0;
        overflow: hidden; pointer-events: none;
        background: linear-gradient(180deg, #dfebd5 0%, #eef4e8 55%, #f8faf6 100%);
      }

      /* Sun glow */
      .ab-sun {
        position: absolute; top: -140px; right: -100px;
        width: 520px; height: 520px; border-radius: 50%;
        background: radial-gradient(circle, rgba(242,194,48,.38) 0%, rgba(242,194,48,.12) 45%, transparent 70%);
        animation: ab-sun 9s ease-in-out infinite;
      }
      @keyframes ab-sun { 0%,100% { transform: scale(1); opacity: .85; } 50% { transform: scale(1.1); opacity: 1; } }

      /* Contours */
      .ab-contours { position: absolute; }
      .ab-contours svg { width: 100%; height: 100%; overflow: visible; }
      .ab-contours ellipse { fill: none; vector-effect: non-scaling-stroke; }
      .ab-contours-a { top: -120px; left: -160px; width: 640px; height: 520px; animation: ab-breathe 26s ease-in-out infinite; }
      .ab-contours-b { bottom: 22vh; right: -200px; width: 700px; height: 520px; animation: ab-breathe 32s ease-in-out infinite reverse; }
      @keyframes ab-breathe {
        0%,100% { transform: rotate(-4deg) scale(1); }
        50%     { transform: rotate(5deg) scale(1.06); }
      }

      /* Ripples */
      .ab-ripple { position: absolute; transform: translate(-50%, -50%); }
      .ab-ripple i {
        position: absolute; inset: 0; border-radius: 50%;
        border: 1.5px solid #3669A9;
        opacity: 0; transform: scale(.05);
        animation: ab-ripple 7s cubic-bezier(.2,.6,.3,1) infinite;
      }
      .ab-ripple i:nth-child(2) { animation-delay: .7s; border-color: #6D9EC9; }
      .ab-ripple i:nth-child(3) { animation-delay: 1.4s; border-color: #347745; }
      @keyframes ab-ripple {
        0%   { opacity: 0;   transform: scale(.05); }
        8%   { opacity: .45; }
        100% { opacity: 0;   transform: scale(1); }
      }

      /* Waves */
      .ab-wave { position: absolute; left: 0; bottom: 0; width: 200%; }
      .ab-wave svg { display: block; width: 100%; height: 100%; }
      .ab-wave-slow { animation: ab-drift 48s linear infinite; }
      .ab-wave-rev  { animation: ab-drift 64s linear infinite reverse; }
      .ab-wave-fast { animation: ab-drift 30s linear infinite; }
      @keyframes ab-drift { from { transform: translateX(0); } to { transform: translateX(-50%); } }

      @media (max-width: 640px) {
        .ab-contours-a { width: 420px; height: 340px; }
        .ab-contours-b { display: none; }
        .ab-ripple:nth-of-type(n+4) { display: none; }
      }
      @media (prefers-reduced-motion: reduce) {
        .ab-root *, .ab-root *::before, .ab-root *::after { animation: none !important; }
        .ab-ripple i { opacity: .15; transform: scale(.7); }
      }
    `}</style>

    <div className="ab-sun" />

    {/* Topographic contours */}
    <div className="ab-contours ab-contours-a">
      <svg viewBox="-320 -260 640 520" preserveAspectRatio="xMidYMid meet">
        {CONTOUR_RINGS.map((r, i) => (
          <ellipse
            key={r}
            cx="0" cy="0" rx={r * 1.15} ry={r * 0.85}
            stroke={i % 2 ? '#3669A9' : '#347745'}
            strokeOpacity={0.2 - i * 0.02}
            strokeWidth="1.4"
            transform={`rotate(${i * 7})`}
          />
        ))}
      </svg>
    </div>
    <div className="ab-contours ab-contours-b">
      <svg viewBox="-350 -260 700 520" preserveAspectRatio="xMidYMid meet">
        {CONTOUR_RINGS.map((r, i) => (
          <ellipse
            key={r}
            cx="0" cy="0" rx={r * 1.2} ry={r * 0.8}
            stroke={i % 2 ? '#347745' : '#3669A9'}
            strokeOpacity={0.18 - i * 0.02}
            strokeWidth="1.4"
            transform={`rotate(${-i * 9})`}
          />
        ))}
      </svg>
    </div>

    {/* Rain ripples */}
    {RIPPLES.map((r, i) => (
      <div
        key={i}
        className="ab-ripple"
        style={{ left: `${r.x}%`, top: `${r.y}%`, width: r.size, height: r.size, animationDelay: `${r.delay}s` }}
      >
        {[0, 1, 2].map((n) => (
          <i key={n} style={{ animationDelay: `${r.delay + n * 0.7}s` }} />
        ))}
      </div>
    ))}

    {/* Layered waves */}
    {WAVES.map((w, i) => (
      <div key={i} className={`ab-wave ${w.cls}`} style={{ height: w.h }}>
        <svg viewBox="0 0 2880 400" preserveAspectRatio="none">
          <path d={w.path} fill={w.fill} fillOpacity={w.opacity} />
        </svg>
      </div>
    ))}
  </div>
);

export default AuthBackground;