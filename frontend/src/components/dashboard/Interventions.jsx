import React, { useState, useRef, useCallback, useEffect } from 'react';

const K100_STATS = [
  { value: '9.6 km', label: 'Pilot Stretch', desc: 'Desilted & restored channel', icon: '🛣️' },
  { value: '32 km²', label: 'Catchment Area', desc: 'Stormwater catchment basin', icon: '🗺️' },
  { value: '~₹175 cr', label: 'Project Cost', desc: 'Coordinated funding budget', icon: '💰' },
  { value: '15', label: 'Agencies', desc: 'Government bodies aligned', icon: '🏢' },
  { value: '135 → 5 MLD', label: 'Sewage Inflow', desc: 'Over 96% sewage diverted', icon: '💧' }
];

const K100_TIMELINE_DATA = [
  {
    yearKey: '1885-1983',
    phase: 'Origins',
    title: 'A king’s canal, slowly buried',
    status: 'Historical Origins',
    statusClass: 'historical',
    colorTheme: 'red',
    bullets: [
      'Part of Kempegowda’s historic rajakaluve network linking the city’s lakes and carrying monsoon overflow.',
      'Survey maps from 1885, 1948 and 1983 trace the canal being steadily channelised as the city grew.',
      'Maintenance lapsed; it became an open sewer and garbage dump, severed from civic life.'
    ],
    graphicId: 'origins'
  },
  {
    yearKey: '2021',
    phase: 'Conception & Pilot',
    title: 'The plan, the coalition, the mock-up',
    status: 'Planning & Design',
    statusClass: 'planning',
    colorTheme: 'orange',
    bullets: [
      'BBMP commissions the ~₹175 crore K100 Citizens’ Waterway pilot; Mod Foundation leads the design concept.',
      'Model adopted from Seoul’s Cheonggyecheon stream restoration — uncover the water rather than slab over it.',
      'A coalition of ~15 government agencies is assembled; household and catchment surveys begin.',
      'A ~300 m demonstration stretch is built opposite Shanthinagar bus station to prove the design.'
    ],
    graphicId: 'conception'
  },
  {
    yearKey: '2022-2023',
    phase: 'Desilt & Divert',
    title: 'Taking sewage out of storm-water',
    status: 'Active Engineering',
    statusClass: 'active',
    colorTheme: 'blue',
    bullets: [
      'Contaminated silt removed to restore gravity flow and carrying capacity.',
      'BWSSB lays a trunk sewer from Chickpet metro to NGV and diverts ~110 MLD of sewage (pipes 900–2400 mm).',
      'Culverts and bridges redesigned to widen flow; native stone edges and indigenous planting introduced as a bio-filter.',
      'The mid-2023 completion target slips — managing sewage inflow proves the hardest problem.'
    ],
    graphicId: 'desilt'
  },
  {
    yearKey: '2024',
    phase: 'Clean-Water Works',
    title: 'Closing the last sewage gaps',
    status: 'Final Pipeline Integration',
    statusClass: 'active',
    colorTheme: 'purple',
    bullets: [
      'Two new works added: a ₹4.42 crore sewer line (Hosur Road–Neelasandra) and a 15 MLD pumping station on KSRTC land.',
      'A 5 MLD sewage treatment plant near KR Market is readied to guarantee dry-weather flow.',
      'BBMP reports sewage inflow cut by ~97%; an Independence Day inauguration is targeted.'
    ],
    graphicId: 'cleanwater'
  },
  {
    yearKey: '2025-2026',
    phase: 'Recognition & Reckoning',
    title: 'A model — and a maintenance test',
    status: 'Completed & Replicating',
    statusClass: 'completed',
    colorTheme: 'green',
    bullets: [
      'Sewage inflow reported down from ~135 MLD to about 5 MLD; recognised by the WRI Prize for Cities and the Creative Bureaucracy Festival.',
      'Most civil work is complete, but reviews flag the real challenge: upkeep — residual sewage, litter and weathering.',
      'Officials walk a 26 km stretch in June 2026; the Greater Bengaluru Authority signals it will route treated water in and replicate the model.'
    ],
    graphicId: 'recognition'
  }
];



const K100_ASSETS = {
  publicRealm: [
    { title: 'Restored channel', desc: '9.6 km of desilted, re-graded waterway with restored gravity flow.', icon: '🌊' },
    { title: 'Walkway & promenade', desc: 'Pedestrian paths along the channel edge — the new public space.', icon: '🚶' },
    { title: 'Bridges & culverts', desc: 'Redesigned arched crossings that widen flow and let people cross.', icon: '🌉' },
    { title: 'Stone edges & planting', desc: 'Native granite edging and indigenous species as a living bio-filter.', icon: '🌿' },
    { title: 'Seating & park space', desc: 'Plazas, seating and Bengaluru’s first new park in nearly four decades.', icon: '🌳' },
    { title: 'Wayfinding & signage', desc: 'A dedicated identity and signage system for the corridor.', icon: '🪧' },
    { title: 'Lighting', desc: 'New lighting that made the edge feel safe and usable after dark.', icon: '💡' }
  ],
  hydraulicSystem: [
    { title: '5 MLD STP', desc: 'Treatment plant near KR Market supplying clean dry-weather flow.', icon: '⚙️' },
    { title: 'Decentralised treatment', desc: 'On-site wastewater treatment serving the D’Souza Garden settlement.', icon: '🏘️' },
    { title: 'Trunk & interceptor sewers', desc: 'New / rectified lines (Chickpet–NGV; Hosur Rd–Neelasandra) diverting sewage away.', icon: '🚰' },
    { title: 'Pumping stations', desc: 'Intermediate stations, incl. a 15 MLD wastewater pump on KSRTC land.', icon: '⛽' },
    { title: 'Compact substations', desc: 'BESCOM CSS units replacing exposed overhead lines along the corridor.', icon: '⚡' },
    { title: 'Sensor network', desc: 'KSNDMC flood-line and choke-point sensors for risk monitoring.', icon: '📡' },
    { title: 'Demonstration stretch', desc: 'The ~300 m Shanthinagar mock-up that de-risked the full build.', icon: '🧱' }
  ]
};

// ─── Before/After Comparison Slider ──────────────────────────────────────────
const SLIDER_PAIRS = [
  {
    id: 'channel',
    label: 'Channel Structure Restoration',
    beforeSrc: '/images/channelised_drain.png',
    afterSrc: '/images/reopened_channel.png',
    beforeAlt: 'Channelised Drain Before',
    afterAlt: 'Reopened Planted Waterway After',
    beforeCaption: 'The channelised drain — silted, sewage-fed, fenced off from the city.',
    afterCaption: 'The reopened channel — native stone edges, planting, a walkable promenade.'
  },
  {
    id: 'urban',
    label: 'Urban Context & Relationship',
    beforeSrc: '/images/Gray_Infrastructure.png',
    afterSrc: '/images/Ecological_corridor.png',
    beforeAlt: 'Grey Infrastructure Before',
    afterAlt: 'Ecological Corridor After',
    beforeCaption: 'Grey infrastructure: the drain as the city\'s back-of-house.',
    afterCaption: 'Ecological corridor: an open channel people can walk beside.'
  }
];

const BeforeAfterSlider = ({ beforeSrc, afterSrc, beforeAlt, afterAlt, beforeCaption, afterCaption }) => {
  const [position, setPosition] = React.useState(0);
  const [isDragging, setIsDragging] = React.useState(false);
  const containerRef = React.useRef(null);

  const getPositionFromEvent = React.useCallback((clientX) => {
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    return Math.min(100, Math.max(0, (x / rect.width) * 100));
  }, []);

  const onMouseMove = React.useCallback((e) => {
    if (!isDragging) return;
    setPosition(getPositionFromEvent(e.clientX));
  }, [isDragging, getPositionFromEvent]);

  const onMouseUp = React.useCallback(() => setIsDragging(false), []);

  const onTouchMove = React.useCallback((e) => {
    if (!isDragging) return;
    setPosition(getPositionFromEvent(e.touches[0].clientX));
  }, [isDragging, getPositionFromEvent]);

  const onTouchEnd = React.useCallback(() => setIsDragging(false), []);

  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
      document.addEventListener('touchmove', onTouchMove, { passive: false });
      document.addEventListener('touchend', onTouchEnd);
    }
    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', onTouchEnd);
    };
  }, [isDragging, onMouseMove, onMouseUp, onTouchMove, onTouchEnd]);

  const showBeforeLabel = position < 85;
  const showAfterLabel = position > 15;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Slider image area */}
      <div
        ref={containerRef}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '16 / 9',
          borderRadius: '16px',
          overflow: 'hidden',
          cursor: isDragging ? 'grabbing' : 'ew-resize',
          userSelect: 'none',
          boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
          border: '1px solid #e2e8f0',
          background: '#f8fafc',
        }}
      >
        {/* AFTER image — full background */}
        <img
          src={afterSrc}
          alt={afterAlt}
          draggable={false}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />

        {/* BEFORE image — clipped to left of slider */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            clipPath: `inset(0 ${100 - position}% 0 0)`,
          }}
        >
          <img
            src={beforeSrc}
            alt={beforeAlt}
            draggable={false}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        </div>

        {/* BEFORE label */}
        <span style={{
          position: 'absolute', top: '12px', left: '12px', fontSize: '9px', fontWeight: 800,
          letterSpacing: '0.1em', textTransform: 'uppercase', padding: '4px 8px', borderRadius: '6px',
          background: 'rgba(254,226,226,0.92)', color: '#b91c1c', border: '1px solid rgba(239,68,68,0.15)',
          backdropFilter: 'blur(4px)', opacity: showBeforeLabel ? 1 : 0, transition: 'opacity 0.2s ease',
          pointerEvents: 'none', zIndex: 10,
        }}>
          BEFORE
        </span>

        {/* AFTER label */}
        <span style={{
          position: 'absolute', top: '12px', right: '12px', fontSize: '9px', fontWeight: 800,
          letterSpacing: '0.1em', textTransform: 'uppercase', padding: '4px 8px', borderRadius: '6px',
          background: 'rgba(209,250,229,0.92)', color: '#065f46', border: '1px solid rgba(16,185,129,0.15)',
          backdropFilter: 'blur(4px)', opacity: showAfterLabel ? 1 : 0, transition: 'opacity 0.2s ease',
          pointerEvents: 'none', zIndex: 10,
        }}>
          AFTER
        </span>

        {/* Vertical divider line */}
        <div style={{
          position: 'absolute', top: 0, bottom: 0,
          left: `${position}%`, transform: 'translateX(-50%)',
          width: '2px', background: 'rgba(255,255,255,0.95)',
          boxShadow: '0 0 10px rgba(0,0,0,0.4)', zIndex: 20, pointerEvents: 'none',
        }} />

        {/* Drag handle circle */}
        <div
          onMouseDown={(e) => { e.preventDefault(); setIsDragging(true); }}
          onTouchStart={(e) => { setIsDragging(true); }}
          style={{
            position: 'absolute', top: '50%', left: `${position}%`,
            transform: 'translate(-50%, -50%)',
            width: '44px', height: '44px', borderRadius: '50%',
            background: 'white',
            boxShadow: isDragging ? '0 4px 24px rgba(0,0,0,0.45)' : '0 2px 16px rgba(0,0,0,0.28)',
            border: '2px solid rgba(255,255,255,0.9)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: isDragging ? 'grabbing' : 'ew-resize', zIndex: 30,
          }}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M7 4L1 10L7 16" stroke="#475569" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M13 4L19 10L13 16" stroke="#475569" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        {/* Initial hint */}
        {position === 0 && (
          <div style={{
            position: 'absolute', bottom: '16px', left: '50%', transform: 'translateX(-50%)',
            background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)', color: 'white',
            fontSize: '11px', fontWeight: 600, padding: '6px 14px', borderRadius: '20px',
            whiteSpace: 'nowrap', zIndex: 10, pointerEvents: 'none',
            animation: 'baHintPulse 2s ease-in-out infinite',
          }}>
            ← Drag to reveal After →
          </div>
        )}
      </div>

      {/* Captions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
        <p style={{ margin: 0, fontSize: '11.5px', color: '#64748b', lineHeight: 1.5, flex: 1,
          opacity: showBeforeLabel ? 1 : 0.35, transition: 'opacity 0.3s ease' }}>
          <span style={{ fontWeight: 700, color: '#dc2626' }}>Before: </span>{beforeCaption}
        </p>
        <p style={{ margin: 0, fontSize: '11.5px', color: '#64748b', lineHeight: 1.5, flex: 1, textAlign: 'right',
          opacity: showAfterLabel ? 1 : 0.35, transition: 'opacity 0.3s ease' }}>
          <span style={{ fontWeight: 700, color: '#059669' }}>After: </span>{afterCaption}
        </p>
      </div>
    </div>
  );
};

const BeforeAfterSection = () => {
  const [activeSlider, setActiveSlider] = React.useState('channel');
  const active = SLIDER_PAIRS.find(p => p.id === activeSlider);

  return (
    <div style={{
      background: 'white', border: '1px solid #e2e8f0', borderRadius: '24px',
      padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: '20px',
      boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
    }}>
      <style>{`
        @keyframes baHintPulse {
          0%, 100% { opacity: 0.9; transform: translateX(-50%) scale(1); }
          50% { opacity: 1; transform: translateX(-50%) scale(1.04); }
        }
      `}</style>

      <div>
        <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: 0, marginBottom: '4px' }}>
          🔄 Transformation: Before &amp; After
        </h3>
        <p style={{ fontSize: '13.5px', color: '#64748b', margin: 0, lineHeight: 1.6 }}>
          Drag the handle left or right to reveal the full transformation — from neglected grey infrastructure to a living ecological waterway corridor.
        </p>
      </div>

      {/* Tab switcher */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '2px solid #f1f5f9' }}>
        {SLIDER_PAIRS.map(pair => (
          <button key={pair.id} onClick={() => setActiveSlider(pair.id)} style={{
            background: 'none', border: 'none',
            borderBottom: activeSlider === pair.id ? '2px solid #4f46e5' : '2px solid transparent',
            marginBottom: '-2px', padding: '8px 16px', fontSize: '13px', fontWeight: 700,
            color: activeSlider === pair.id ? '#4f46e5' : '#94a3b8',
            cursor: 'pointer', transition: 'color 0.15s, border-color 0.15s', whiteSpace: 'nowrap',
          }}>
            {pair.label}
          </button>
        ))}
      </div>

      {/* Slider with horizontal breathing room */}
      <div style={{ paddingLeft: '32px', paddingRight: '32px' }}>
        <BeforeAfterSlider
          key={active.id}
          beforeSrc={active.beforeSrc}
          afterSrc={active.afterSrc}
          beforeAlt={active.beforeAlt}
          afterAlt={active.afterAlt}
          beforeCaption={active.beforeCaption}
          afterCaption={active.afterCaption}
        />
      </div>
    </div>
  );
};

const Interventions = () => {
  const [selectedPhase, setSelectedPhase] = useState('1885-1983');
  const [selectedAssetTab, setSelectedAssetTab] = useState('publicRealm');

  const activePhase = K100_TIMELINE_DATA.find(item => item.yearKey === selectedPhase) || K100_TIMELINE_DATA[0];



  const getDotClass = (item, isSelected) => {
    let colorTheme = item.colorTheme;
    if (colorTheme === 'green') colorTheme = 'emerald';
    const borderColors = {
      red: 'border-red-500',
      orange: 'border-orange-500',
      blue: 'border-blue-500',
      purple: 'border-purple-500',
      emerald: 'border-emerald-500'
    };
    const activeStyles = {
      red: 'bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.4)]',
      orange: 'bg-orange-500 shadow-[0_0_12px_rgba(249,115,22,0.4)]',
      blue: 'bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.4)]',
      purple: 'bg-purple-500 shadow-[0_0_12px_rgba(168,85,247,0.4)]',
      emerald: 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.4)]'
    };
    return `w-4 h-4 rounded-full border-3 flex items-center justify-center transition-all duration-300 shadow-[0_0_0_4px_white] shrink-0 ${borderColors[colorTheme] || 'border-slate-300'} ${isSelected ? (activeStyles[colorTheme] || '') : 'bg-white'}`;
  };

  return (
    <div className="flex flex-col gap-8 animate-[fadeInUp_0.4s_ease_both]">
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="text-center flex flex-col items-center w-full">
        <h2 className="text-black text-3xl font-black tracking-tight m-0">K100 Citizens’ Waterway</h2>
        <h3 className="text-base font-semibold text-slate-500 mt-1 mb-2 text-center">From open sewer to citizens’ waterway</h3>
        <p className="text-sm leading-relaxed text-slate-600 max-w-full mt-2 mx-auto text-center">
          A 9.6 km pilot project that restores a neglected storm-water drain (rajakaluve) as a working part of Bengaluru’s water ecosystem, and as a vibrant public space. Formerly carrying up to 135 million litres of sewage a day from Majestic bus stand to Bellandur Lake, the drain was desilted, intercepted, and reopened as a stone-edged, planted public waterway.
        </p>
      </div>

      {/* 2. Top KPIs stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-2">
        {K100_STATS.map((stat, idx) => (
          <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-4.5 flex items-start gap-3.5 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 text-left">
            <div className="text-2xl bg-slate-100 w-11 h-11 flex items-center justify-center rounded-xl shrink-0">{stat.icon}</div>
            <div className="flex flex-col gap-0.5">
              <div className="text-lg font-black text-slate-900 leading-tight">{stat.value}</div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none mt-1">{stat.label}</div>
              <div className="text-[11px] text-slate-400 mt-0.5 leading-snug">{stat.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* 3. Main Timeline Workspace */}
      <h3 className="text-2xl font-bold text-slate-900 text-center mt-4 mb-6 w-full">Timeline</h3>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
        {/* Left pane: Interactive timeline tree */}
        <div className="flex flex-col gap-5 relative pl-6">
          <div className="absolute top-6 bottom-6 left-[31px] w-0.5 bg-slate-200 z-1"></div>
          {K100_TIMELINE_DATA.map((item) => {
            const isSelected = item.yearKey === selectedPhase;
            return (
              <div 
                key={item.yearKey}
                className="flex items-center gap-5 cursor-pointer z-2 relative transition-all duration-250 hover:translate-x-1"
                onClick={() => setSelectedPhase(item.yearKey)}
              >
                <div className={getDotClass(item, isSelected)}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-transparent'}`}></span>
                </div>
                <div className={`flex-1 bg-white border rounded-2xl px-5 py-4 flex items-center gap-4 shadow-sm transition-all duration-250 ${isSelected ? 'border-slate-300 bg-slate-50 shadow-md' : 'border-slate-100'}`}>
                  <span className={`text-xs font-extrabold px-2.5 py-1 rounded-md whitespace-nowrap transition-colors ${isSelected ? 'bg-slate-200 text-slate-900' : 'bg-slate-100 text-slate-500'}`}>{item.yearKey}</span>
                  <div className="flex flex-col flex-1 min-w-0 text-left">
                    <strong className="text-sm font-bold text-slate-900">{item.phase}</strong>
                    <span className="text-[12.5px] text-slate-500 whitespace-nowrap overflow-hidden text-ellipsis">{item.title}</span>
                  </div>
                  <span className={`text-[9px] font-bold tracking-wider px-2 py-1 rounded uppercase whitespace-nowrap ${item.statusClass === 'historical' ? 'text-red-600 bg-red-100' : item.statusClass === 'planning' ? 'text-amber-600 bg-amber-100' : item.statusClass === 'active' ? 'text-blue-600 bg-blue-100' : 'text-emerald-600 bg-emerald-100'}`}>{item.status}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right pane: Expanded detail visualization */}
        <div className="lg:sticky lg:top-[100px] w-full">
          <div className={`bg-white border border-slate-200 rounded-[24px] p-7 md:p-8 shadow-sm flex flex-col gap-5 text-left border-l-[6px] ${activePhase.colorTheme === 'red' ? 'border-l-red-500' : activePhase.colorTheme === 'orange' ? 'border-l-orange-500' : activePhase.colorTheme === 'blue' ? 'border-l-blue-500' : activePhase.colorTheme === 'purple' ? 'border-l-purple-500' : 'border-l-emerald-500'}`}>
            <div className="flex flex-col gap-2 items-start border-b border-slate-100 pb-4 w-full text-left">
              <div className="text-lg font-black text-slate-900 bg-slate-100 px-3.5 py-1 rounded-lg whitespace-nowrap self-start">{activePhase.yearKey}</div>
              <h3 className="text-lg font-bold text-slate-900 m-0 tracking-tight text-left">{activePhase.title}</h3>
              <span className={`text-[9px] font-bold tracking-wider px-2 py-1 rounded uppercase ${activePhase.statusClass === 'historical' ? 'text-red-600 bg-red-100' : activePhase.statusClass === 'planning' ? 'text-amber-600 bg-amber-100' : activePhase.statusClass === 'active' ? 'text-blue-600 bg-blue-100' : 'text-emerald-600 bg-emerald-100'}`}>{activePhase.status}</span>
            </div>

            <div className="flex flex-col gap-4 text-left">
              <div className="flex flex-col gap-2 text-left">
                <h4 className="text-[11px] font-bold text-slate-500 m-0 uppercase tracking-wider text-left">🌱 Phase Milestones & Accomplishments</h4>
                <ul className="pl-[18px] margin-0 flex flex-col gap-2 text-left list-disc">
                  {activePhase.bullets.map((bullet, index) => (
                    <li key={index} className="text-sm text-slate-600 leading-relaxed text-left">{bullet}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Before & After Ecological Transformation — Drag Slider */}
      <BeforeAfterSection />

      {/* 5. Dual-Layer Asset Explorer */}
      <div className="bg-white border border-slate-200 rounded-[24px] p-6 md:p-8 flex flex-col gap-6 shadow-sm text-left">
        <div className="text-left">
          <h3 className="text-lg font-bold text-slate-900 m-0 mb-1">📐 K100 System Layer Assets</h3>
          <p className="text-[13.5px] text-slate-500 m-0 leading-relaxed">The pilot produced two layers of assets: a visible public realm on top and a hidden hydraulic system keeping the water clean.</p>
        </div>

        <div className="flex gap-3 border-b-2 border-slate-100 pb-0.5">
          <button
            className={`text-[13.5px] font-bold px-4 py-2.5 cursor-pointer transition-colors duration-200 bg-transparent border-b-2 -mb-[2px] ${selectedAssetTab === 'publicRealm' ? 'text-indigo-600 border-indigo-600' : 'text-slate-500 hover:text-slate-900 border-transparent'}`}
            onClick={() => setSelectedAssetTab('publicRealm')}
          >
            🌳 Public Realm
          </button>
          <button
            className={`text-[13.5px] font-bold px-4 py-2.5 cursor-pointer transition-colors duration-200 bg-transparent border-b-2 -mb-[2px] ${selectedAssetTab === 'hydraulicSystem' ? 'text-indigo-600 border-indigo-600' : 'text-slate-500 hover:text-slate-900 border-transparent'}`}
            onClick={() => setSelectedAssetTab('hydraulicSystem')}
          >
            ⚙️ Hydraulic System
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {K100_ASSETS[selectedAssetTab].map((asset, idx) => (
            <div key={idx} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex gap-3.5 items-start transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white hover:shadow-md text-left">
              <div className="text-xl bg-white w-9 h-9 rounded-xl flex items-center justify-center shadow-sm border border-slate-200 shrink-0">{asset.icon}</div>
              <div className="flex flex-col gap-1 text-left">
                <h4 className="text-[13.5px] font-bold text-slate-900 m-0">{asset.title}</h4>
                <p className="text-[12.5px] leading-relaxed text-slate-500 m-0">{asset.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Interventions;
