import React from 'react';

/**
 * HomeBackground  (v2, richer)
 * Tone-on-tone backdrop for the home / role-selection page.
 *
 * The page keeps its exact #c9d8bd sage. Everything here is hairline strokes,
 * tiny dots or low-opacity turf-green / ocean-deep, and lives in the
 * empty areas so it never competes with the headline, cards or city.
 *
 *  1. Map-dot grid        : fine survey-style texture, fades out toward the city
 *  2. Water-flow lines    : three dashed currents travelling across the page
 *  3. Topographic rings   : lower corners
 *  4. Sensor network      : lower-left, nodes pulse, a drop of water travels the chain
 *  5. Rain ripples        : a few small, slow rings on the "surface"
 *  6. Lake birds          : three tiny birds gliding across the lower band
 *
 * Usage: first child of the hero wrapper (`relative`, no opaque background):
 *   <HomeBackground />
 */

const FLOWS = [
  { d: 'M-20 330 C 320 270, 700 400, 1460 300', stroke: '#3669A9', o: 0.18, dash: '70 46', dur: 60 },
  { d: 'M-20 600 C 400 660, 900 520, 1460 580', stroke: '#347745', o: 0.18, dash: '54 38', dur: 80, rev: true },
  { d: 'M-20 820 C 360 760, 980 860, 1460 790', stroke: '#3669A9', o: 0.16, dash: '80 52', dur: 70 },
];

const RINGS = [70, 120, 170, 220, 270];

const NODES = [
  [30, 205], [120, 140], [210, 192], [300, 112], [390, 164], [480, 72], [262, 38],
];
const CHAIN = 'M30 205 L120 140 L210 192 L300 112 L390 164 L480 72';
const SPUR = 'M300 112 L262 38';

const RIPPLES = [
  { x: 9, y: 78, size: 150, delay: 0 },
  { x: 33, y: 84, size: 190, delay: 3.2 },
  { x: 41, y: 72, size: 120, delay: 6.1 },
];

const BIRDS = [
  { top: 73, dur: 70, delay: -8, scale: 1 },
  { top: 77, dur: 82, delay: -30, scale: 0.75 },
  { top: 70, dur: 94, delay: -55, scale: 0.6 },
];

const Contours = ({ className, flip }) => (
  <div className={`hb-contours ${className}`}>
    <svg viewBox="-340 -260 680 520" preserveAspectRatio="xMidYMid meet">
      {RINGS.map((r, i) => (
        <ellipse
          key={r}
          rx={r * 1.2}
          ry={r * 0.82}
          transform={`rotate(${(flip ? -1 : 1) * i * 8})`}
          stroke="#347745"
          strokeOpacity={0.15 - i * 0.02}
        />
      ))}
    </svg>
  </div>
);

const HomeBackground = () => (
  <div className="hb-root" aria-hidden="true">
    <style>{`
      .hb-root { position: absolute; inset: 0; z-index: 0; overflow: hidden; pointer-events: none; }

      /* 1. Dot grid */
      .hb-dots {
        position: absolute; inset: 0;
        background-image: radial-gradient(rgba(52,119,69,.22) 1px, transparent 1.3px);
        background-size: 26px 26px;
        -webkit-mask-image: linear-gradient(100deg, #000 0%, rgba(0,0,0,.55) 40%, transparent 70%);
                mask-image: linear-gradient(100deg, #000 0%, rgba(0,0,0,.55) 40%, transparent 70%);
      }

      /* 2. Flow lines */
      .hb-flows { position: absolute; inset: 0; width: 100%; height: 100%; }
      .hb-flows path {
        fill: none; stroke-width: 1.6; stroke-linecap: round;
        vector-effect: non-scaling-stroke;
        animation: hb-flow linear infinite;
      }
      @keyframes hb-flow { to { stroke-dashoffset: -1000; } }

      /* 3. Contours */
      .hb-contours { position: absolute; width: 640px; height: 500px; }
      .hb-contours svg { width: 100%; height: 100%; overflow: visible; }
      .hb-contours ellipse { fill: none; stroke-width: 1.3; vector-effect: non-scaling-stroke; }
      .hb-c-left  { left: -230px;  bottom: -150px; animation: hb-sway 48s ease-in-out infinite; }
      .hb-c-right { right: -240px; bottom: -170px; animation: hb-sway 56s ease-in-out infinite reverse; }
      @keyframes hb-sway { 0%,100% { transform: rotate(-3deg); } 50% { transform: rotate(3deg); } }

      /* 4. Sensor network */
      .hb-net { position: absolute; left: 3.5%; bottom: 14%; width: 37%; max-width: 560px; aspect-ratio: 520 / 250; }
      .hb-net svg { width: 100%; height: 100%; overflow: visible; }

      /* 5. Ripples */
      .hb-ripple { position: absolute; transform: translate(-50%, -50%); }
      .hb-ripple i {
        position: absolute; inset: 0; border-radius: 50%;
        border: 1.2px solid #3669A9; opacity: 0; transform: scale(.08);
        animation: hb-ripple 9s cubic-bezier(.2,.6,.3,1) infinite;
      }
      .hb-ripple i:nth-child(2) { border-color: #347745; }
      @keyframes hb-ripple {
        0% { opacity: 0; transform: scale(.08); }
        10% { opacity: .38; }
        100% { opacity: 0; transform: scale(1); }
      }

      /* 6. Birds */
      .hb-bird { position: absolute; left: -60px; animation: hb-fly linear infinite; }
      .hb-bird svg { display: block; transform-origin: 50% 60%; animation: hb-flap 1.3s ease-in-out infinite; }
      @keyframes hb-fly {
        from { transform: translate3d(0, 0, 0); }
        50%  { transform: translate3d(50vw, -14px, 0); }
        to   { transform: translate3d(calc(100vw + 120px), 6px, 0); }
      }
      @keyframes hb-flap { 0%,100% { transform: scaleY(1); } 50% { transform: scaleY(.45); } }

      @media (max-width: 1023px) {
        .hb-net, .hb-ripple, .hb-bird { display: none; }
      }
      @media (max-width: 640px) { .hb-contours { width: 380px; height: 300px; } }
      @media (prefers-reduced-motion: reduce) {
        .hb-root * { animation: none !important; }
        .hb-pulse, .hb-packet, .hb-bird { display: none; }
      }
    `}</style>

    <div className="hb-dots" />

    <svg className="hb-flows" viewBox="0 0 1440 900" preserveAspectRatio="none">
      {FLOWS.map((f, i) => (
        <path
          key={i}
          d={f.d}
          stroke={f.stroke}
          strokeOpacity={f.o}
          strokeDasharray={f.dash}
          style={{ animationDuration: `${f.dur}s`, animationDirection: f.rev ? 'reverse' : 'normal' }}
        />
      ))}
    </svg>

    <Contours className="hb-c-left" />
    <Contours className="hb-c-right" flip />

    {/* Sensor network */}
    <div className="hb-net">
      <svg viewBox="0 0 520 250">
        <path d={CHAIN} fill="none" stroke="#347745" strokeOpacity=".28" strokeWidth="1.2" />
        <path d={SPUR} fill="none" stroke="#347745" strokeOpacity=".28" strokeWidth="1.2" strokeDasharray="3 4" />
        {NODES.map(([x, y], i) => (
          <g key={i}>
            <circle className="hb-pulse" cx={x} cy={y} r="4" fill="none" stroke="#3669A9" strokeWidth="1.2">
              <animate attributeName="r" values="4;18" dur="4.8s" begin={`${i * 0.9}s`} repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.5;0" dur="4.8s" begin={`${i * 0.9}s`} repeatCount="indefinite" />
            </circle>
            <circle cx={x} cy={y} r="3.5" fill="#347745" fillOpacity=".5" />
          </g>
        ))}
        <circle className="hb-packet" r="3" fill="#3669A9" fillOpacity=".7">
          <animateMotion dur="16s" repeatCount="indefinite" path={CHAIN} />
        </circle>
      </svg>
    </div>

    {/* Ripples */}
    {RIPPLES.map((r, i) => (
      <div key={i} className="hb-ripple" style={{ left: `${r.x}%`, top: `${r.y}%`, width: r.size, height: r.size }}>
        {[0, 1].map((n) => (
          <i key={n} style={{ animationDelay: `${r.delay + n * 1.1}s` }} />
        ))}
      </div>
    ))}

    {/* Birds */}
    {BIRDS.map((b, i) => (
      <div key={i} className="hb-bird" style={{ top: `${b.top}%`, animationDuration: `${b.dur}s`, animationDelay: `${b.delay}s` }}>
        <svg width={26 * b.scale} height={12 * b.scale} viewBox="0 0 26 12" style={{ animationDelay: `${i * 0.35}s` }}>
          <path d="M1 8 Q7 0 13 7 Q19 0 25 8" fill="none" stroke="#347745" strokeOpacity=".5" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    ))}
  </div>
);

export default HomeBackground;