import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const BggIntroduction = ({ onNavigateToCase, onSetActiveTab }) => {
  const navigate = useNavigate();

  // ==========================================
  // PREVIOUSLY PRESERVED DATA (COMMENTED FOR FUTURE USE)
  // ==========================================
  // const shockingNews = [
  //   {
  //     id: 'singapore',
  //     title: 'Singapore: ABC Waters Programme',
  //     description: "Reducing flood risk systematically. Facing limited reservoir space, Singapore converted concrete canals into natural floodplains, reducing flood-prone areas by 48%.",
  //     highlightText: 'ABC Waters Programme',
  //     targetCaseTitle: 'Singapore: ABC Waters Programme',
  //     metrics: [
  //       { value: '48%', label: 'Risk Area Reduced' },
  //       { value: '22-63%', label: 'Runoff Reduction' },
  //       { value: '30 min', label: 'Discharge Delay' },
  //       { value: '60+', label: 'Projects Built' }
  //     ]
  //   },
  //   {
  //     id: 'copenhagen',
  //     title: 'Copenhagen: Cloudburst Plan',
  //     description: 'Designing for extreme events. Following an €800M damage storm in 2011, Copenhagen redesigned streets and plazas to absorb and store stormwater, saving €200M+ over pipes.',
  //     highlightText: 'Cloudburst Plan',
  //     targetCaseTitle: 'Copenhagen: Cloudburst Plan',
  //     metrics: [
  //       { value: '€800M', label: 'Storm Damage' },
  //       { value: '€1.5B', label: 'Total Investment' },
  //       { value: '€200M+', label: 'Estimated Savings' },
  //       { value: '300', label: 'Projects Planned' }
  //     ]
  //   },
  //   {
  //     id: 'rotterdam',
  //     title: 'Rotterdam: Room for the River',
  //     description: 'Redesigning rivers for resilience. Relocating dikes inland and lowering floodplains allowed the Rhine to swell safely from 12,000 to 16,000 m³/sec capacity without disaster.',
  //     highlightText: 'Room for the River',
  //     targetCaseTitle: 'Rotterdam: Room for the River',
  //     metrics: [
  //       { value: '€2.3B', label: 'Total Investment' },
  //       { value: '30+', label: 'Locations on 4 Rivers' },
  //       { value: '16K m³/s', label: 'Discharge Capacity' },
  //       { value: '2023', label: 'Saved from Flood' }
  //     ]
  //   }
  // ];

  // const bangaloreStats = [
  //   { value: '1,400 mm', label: 'rainfall in 2022 (vs 970 mm avg)' },
  //   { value: '5 of 7', label: 'Years since 2015 had excess rainfall' },
  //   { value: '131.6 mm', label: 'in 12 hours (2022)' },
  //   { value: '↑30%', label: 'Increase in extreme rainfall events' }
  // ];

  // const interventions = [
  //   { icon: '💧', name: 'Recharge wells', desc: 'Infiltrate stormwater to restore groundwater' },
  //   { icon: '🌸', name: 'Bioswales', desc: 'Filter and slow stormwater flow' },
  //   { icon: '🌳', name: 'Urban forests', desc: 'Intercept rain, cool the city' },
  //   { icon: '🌊', name: 'Lake restoration', desc: 'Rejuvenate water bodies as recharge zones' }
  // ];

  const ASSETS = {
    background: "/assets/city-aerial.jpg",
    isoCity: "/images/homepage/BGGI_BGGI_full.png",
    govt: "/images/homepage/stakeholders-02.png",
    funder: "/images/homepage/stakeholders-05.png",
    designer: "/images/homepage/designer-combined.png",
    citizen: "/images/homepage/stakehold-03.png",
    iconWetlands: "/images/homepage/blue_Blue icons- wetlands.png",
    iconBioswale: "/images/homepage/green_green icons- bioswale.png",
    iconSidewalkPlanter: "/images/homepage/green_green icons- sidewalk planter.png",
    iconWtp: "/images/homepage/grey_grey icons- WTP.png",
  };

  const STATS = [
    { value: "2,632", label: "MLD demanded" },
    { value: "1,460", label: "MLD from Cauvery" },
    { value: "1,392", label: "MLD groundwater" },
  ];

  const PERSONAS = [
    { id: "govt", label: "Are you a Govt official?", img: ASSETS.govt },
    { id: "funder", label: "Are you a funder?", img: ASSETS.funder },
    { id: "designer", label: "Are you a designer?", img: ASSETS.designer },
    { id: "citizen", label: "Are you a citizen?", img: ASSETS.citizen },
  ];

  /** Map pins overlaid on the isometric illustration */
  const MARKERS = [
    { id: "stp", type: "label", text: "STP", x: 50.9, y: 20.9 },
    { id: "m1", type: "image", img: ASSETS.iconWtp, alt: "WTP", x: 38.9, y: 27.3 },
    { id: "m2", type: "image", img: ASSETS.iconWetlands, alt: "Wetlands", x: 76.4, y: 34.9 },
    { id: "m3", type: "image", img: ASSETS.iconSidewalkPlanter, alt: "Sidewalk Planter", x: 10.4, y: 56.6 },
    { id: "m4", type: "image", img: ASSETS.iconBioswale, alt: "Bioswale", x: 47.9, y: 57.4 },
  ];

  /** Detailed popup information for each marker */
  const MARKER_DETAILS = {
    m4: {
      title: "Bioswale",
      badge: "Green Infrastructure",
      badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
      description: "A planted channel that channelises, slows & cleans storm water naturally through vegetative bio-filtration.",
      highlight: "Absorbs heavy inflow events & replenishes local shallow aquifers",
      image: ASSETS.iconBioswale,
      targetTab: "interventions",
    },
    m2: {
      title: "Constructed Wetlands",
      badge: "Blue Infrastructure",
      badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
      description: "Engineered ecological water bodies that treat wastewater inflows, buffer stormwater surges, and support urban biodiversity.",
      highlight: "Removes up to 70% of organic pollutants & buffers peak catchment volume",
      image: ASSETS.iconWetlands,
      targetTab: "interventions",
    },
    m1: {
      title: "Water Treatment Plant (WTP)",
      badge: "Grey Infrastructure",
      badgeColor: "bg-slate-100 text-slate-800 border-slate-300",
      description: "Advanced secondary and tertiary water treatment facility rejuvenating cascaded lake systems and supplying non-potable water.",
      highlight: "Recharges downstream lake networks & mitigates raw effluent contamination",
      image: ASSETS.iconWtp,
      targetTab: "interventions",
    },
    m3: {
      title: "Sidewalk Planter",
      badge: "Green Infrastructure",
      badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
      description: "Linear vegetated curb planters integrated along streets to capture, filter, and infiltrate pedestrian and road runoff.",
      highlight: "Eliminates localized street waterlogging & provides urban micro-cooling",
      image: ASSETS.iconSidewalkPlanter,
      targetTab: "interventions",
    },
    stp: {
      title: "Sewage Treatment Plant (STP)",
      badge: "Water Infrastructure",
      badgeColor: "bg-red-50 text-red-700 border-red-200",
      description: "Decentralized sewage processing unit recycling urban wastewater and stopping raw effluent discharge into city drains.",
      highlight: "Prevents raw sewage mixing with stormwater & recovers usable water",
      image: null,
      labelText: "STP",
      targetTab: "interventions",
    },
  };

  const [selected, setSelected] = useState(null);
  const [activeMarker, setActiveMarker] = useState(null);

  const handleNavigateToCaseStudies = () => {
    if (onSetActiveTab) {
      onSetActiveTab('casestudy');
    } else if (onNavigateToCase) {
      onNavigateToCase();
    } else {
      navigate('/casestudy');
    }
  };

  const handleNavigateFromPopup = (targetTab) => {
    setActiveMarker(null);
    if (onSetActiveTab) {
      onSetActiveTab(targetTab || 'interventions');
    } else {
      navigate('/' + (targetTab || 'interventions'));
    }
  };

  const getPopupPlacement = () => {
    if (!activeMarker) return null;
    const m = MARKERS.find((item) => item.id === activeMarker);
    if (!m) return null;

    let style = {};
    if (m.x > 50) {
      style.right = `${Math.max(100 - m.x + 3.5, 2)}%`;
    } else {
      style.left = `${Math.max(m.x + 3.5, 2)}%`;
    }

    if (m.y > 45) {
      style.bottom = `${Math.max(100 - m.y - 2, 4)}%`;
    } else {
      style.top = `${Math.max(m.y - 2, 4)}%`;
    }
    return style;
  };

  const handlePersonaClick = (personaId) => {
    setSelected(personaId);
    if (personaId === 'funder') {
      if (onSetActiveTab) {
        onSetActiveTab('dashboard');
      } else {
        navigate('/dashboard');
      }
    }
  };

  return (
    <div className="w-full bg-white animate-[fadeIn_0.4s_ease-out_forwards]">
      {/* ========================================== */}
      {/* ACTIVE HERO SECTION WITH ISOMETRIC BANNER */}
      {/* ========================================== */}
      <div
        className="relative w-full aspect-[979/502] min-h-[520px] overflow-hidden bg-cover bg-center select-none"
        style={{
          backgroundImage: `linear-gradient(to bottom, rgba(255,255,255,.55), rgba(255,255,255,.15)), url(${ASSETS.background})`,
          backgroundColor: "#c9d8bd",
        }}
      >
        {/* Transparent Click-Away Overlay to dismiss popup without darkening background */}
        {activeMarker && (
          <div
            className="fixed inset-0 z-20 cursor-default"
            onClick={() => setActiveMarker(null)}
          />
        )}

        {/* ---------- RIGHT: isometric city + its clickable map pins ---------- */}
        <div className="absolute right-0 top-0 h-full w-[58%] select-none">
          <img
            src={ASSETS.isoCity}
            alt="Isometric view of a blue-green-grey Bengaluru"
            className="h-full w-full object-cover object-left-top pointer-events-none"
          />

          {/* Interactive Map Pins */}
          {MARKERS.map((m) => (
            <button
              key={m.id}
              onClick={() => setActiveMarker(m.id)}
              className="absolute -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer pointer-events-auto outline-none transition-transform duration-200 hover:scale-125 focus-visible:ring-2 focus-visible:ring-blue-500 rounded-full"
              style={{ left: `${m.x}%`, top: `${m.y}%` }}
              title={`Click to view details for ${MARKER_DETAILS[m.id]?.title || m.text}`}
            >
              {m.type === "label" ? (
                <span className="rounded-sm bg-[#9B2C1E] px-[0.6vw] py-[0.15vw] text-[0.65vw] font-bold tracking-wider text-white shadow-md hover:bg-red-700 transition-colors">
                  {m.text}
                </span>
              ) : m.type === "image" ? (
                <img
                  src={m.img}
                  alt={m.alt || ""}
                  className="h-[3.8vw] w-[3.8vw] object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.25)]"
                />
              ) : (
                <div
                  className={`flex h-[2.6vw] w-[2.6vw] items-center justify-center rounded-full border-2 border-white text-center text-[0.45vw] font-bold leading-[1.15] text-white shadow-lg ${
                    m.type === "dark" ? "bg-[#1B3A57]" : "bg-[#2F6B3A]"
                  }`}
                >
                  <span className="whitespace-pre-line px-[0.2vw]">{m.text}</span>
                </div>
              )}
            </button>
          ))}

          {/* ---------- CONTEXTUAL PIN POPUP (Positioned beside clicked marker, no dark bg) ---------- */}
          {activeMarker && MARKER_DETAILS[activeMarker] && (
            <div
              className="absolute z-30 w-[24vw] min-w-[280px] max-w-[340px] bg-white rounded-2xl p-4 shadow-[0_10px_30px_rgba(0,0,0,0.16)] border border-slate-200/90 flex flex-col gap-2.5 animate-[fadeIn_0.15s_ease-out] select-auto"
              style={getPopupPlacement()}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={() => setActiveMarker(null)}
                className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer text-xs font-bold"
                aria-label="Close popup"
              >
                ✕
              </button>

              {/* Popup Header: Image + Title/Badge */}
              <div className="flex items-start gap-3">
                {/* Left Side: Clicked Icon Image */}
                <div className="shrink-0 w-14 h-14 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center p-1.5 shadow-xs">
                  {MARKER_DETAILS[activeMarker].image ? (
                    <img
                      src={MARKER_DETAILS[activeMarker].image}
                      alt={MARKER_DETAILS[activeMarker].title}
                      className="h-full w-full object-contain drop-shadow-xs"
                    />
                  ) : (
                    <span className="rounded-md bg-[#9B2C1E] px-2.5 py-1 text-sm font-black tracking-wider text-white shadow-xs">
                      {MARKER_DETAILS[activeMarker].labelText || "STP"}
                    </span>
                  )}
                </div>

                {/* Right Side: Title & Badge */}
                <div className="flex flex-col gap-0.5 flex-1 pr-4 text-left">
                  <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border w-fit ${MARKER_DETAILS[activeMarker].badgeColor}`}>
                    {MARKER_DETAILS[activeMarker].badge}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 leading-tight m-0">
                    {MARKER_DETAILS[activeMarker].title}
                  </h3>
                </div>
              </div>

              {/* Core Description */}
              <p className="text-xs text-slate-600 leading-snug m-0 text-left">
                {MARKER_DETAILS[activeMarker].description}
              </p>

              {/* Benefit / Highlight Tag */}
              <div className="p-2 rounded-lg bg-emerald-50/70 border border-emerald-100 text-left">
                <p className="text-[11px] font-semibold text-emerald-800 leading-snug m-0">
                  {MARKER_DETAILS[activeMarker].highlight}
                </p>
              </div>

              {/* Simple & Small View Details Action */}
              <div className="flex items-center justify-end pt-0.5">
                <button
                  onClick={() => handleNavigateFromPopup(MARKER_DETAILS[activeMarker].targetTab)}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-md text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 hover:text-blue-700 border border-blue-200/80 transition-colors cursor-pointer"
                >
                  <span>view full details</span>
                  <span className="text-xs leading-none">→</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ---------- Stats card ---------- */}
        <div className="absolute left-[44%] top-[2%] z-10 flex gap-[2.5vw] rounded-xl bg-white/95 px-[1.2vw] py-[0.6vw] shadow-md backdrop-blur-sm border border-white/60">
          {STATS.map((s) => (
            <div key={s.label} className="text-center leading-tight">
              <div className="text-[1.15vw] font-black text-slate-800">{s.value}</div>
              <div className="text-[0.62vw] font-semibold tracking-wide text-slate-500 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* ---------- Headline ---------- */}
        <h1 className="absolute left-[2.5%] top-[2.2%] max-w-[41%] font-serif text-[2.05vw] leading-[1.22] font-extrabold text-slate-900 z-10">
          Transforming Bengaluru into a
          <br />
          <span className="font-bold text-[#1C6FB8]">Water-Secure</span> &amp;{" "}
          <span className="font-bold text-[#2F6B3A]">Climate-Resilient</span> City
        </h1>

        {/* ---------- Yellow banner (bleeds directly off the left edge) ---------- */}
        <div className="absolute left-0 top-[16%] w-[41%] rounded-r-2xl bg-[#F2C230] px-[2.8vw] py-[0.95vw] shadow-md z-10 border-y border-r border-amber-300/40">
          <p className="text-[1.35vw] font-semibold leading-tight text-white/95 uppercase tracking-wide">
            Let&apos;s turn Bengaluru into a
          </p>
          <p className="text-[2.2vw] font-black leading-tight text-white tracking-tight mt-0.5">
            Blue Green Grey City
          </p>
        </div>

        {/* ---------- Question ---------- */}
        <p className="absolute left-[3%] top-[33.5%] font-serif text-[1.18vw] font-semibold italic text-slate-700 z-10">
          But first — Who are you for the city?
        </p>

        {/* ---------- Persona cards (Enlarged with Spacing) ---------- */}
        <div className="absolute left-[2.5%] top-[39%] flex gap-[1.3vw] z-10">
          {PERSONAS.map((p) => {
            const active = selected === p.id;
            return (
              <button
                key={p.id}
                onClick={() => handlePersonaClick(p.id)}
                aria-pressed={active}
                className={`group flex h-[14.5vw] w-[9.1vw] flex-col items-center justify-between rounded-xl bg-white p-[0.6vw] shadow-md outline-none transition-all duration-200 border
                hover:-translate-y-1 hover:shadow-xl focus-visible:ring-2 focus-visible:ring-[#1C6FB8]
                ${active ? "ring-2 ring-[#F2C230] border-amber-400 bg-amber-50/20 shadow-lg" : "border-slate-200 hover:border-blue-300"}`}
              >
                <img
                  src={p.img}
                  alt=""
                  className="h-[10.2vw] w-full object-contain transition-transform duration-200 group-hover:scale-105"
                />
                <span className="pb-[0.2vw] text-center text-[0.76vw] font-bold leading-snug text-slate-800">
                  {p.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* ---------- Bottom Cards: Left (Did you know) & Right (How cities around the world solved flooding?) ---------- */}
        <div className="absolute bottom-[2.5%] left-[2.5%] right-[2.5%] flex justify-between items-center gap-[1.5vw] z-10">
          {/* Left Card: Did you know? (Informational, non-clickable) */}
          <div className="flex flex-1 items-center justify-between gap-[1vw] rounded-xl bg-white/95 px-[1.4vw] py-[0.85vw] shadow-md border border-amber-300/80 select-none">
            <div className="flex items-center gap-[1vw]">
              <svg viewBox="0 0 24 24" className="h-[2.4vw] w-[2.4vw] shrink-0 fill-[#F2C230]">
                <path d="M12 2a7 7 0 0 0-4 12.7V17a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-2.3A7 7 0 0 0 12 2Zm-3 18h6v1a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1v-1Z" />
              </svg>
              <div>
                <p className="text-[0.9vw] font-black uppercase tracking-wider text-[#C25E1C]">
                  Did you know?
                </p>
                <p className="text-[0.82vw] font-semibold leading-snug text-[#2F6B6B] mt-0.5">
                  60% of the lakes are encroached and 20% of open spaces are non permeable
                </p>
              </div>
            </div>
          </div>

          {/* Right Card: How cities around the world solved flooding? (Clickable -> Navigates to Case Studies) */}
          <div
            onClick={handleNavigateToCaseStudies}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleNavigateToCaseStudies(); }}
            className="flex flex-1 items-center justify-between gap-[1vw] rounded-xl bg-white/95 px-[1.4vw] py-[0.85vw] shadow-md border border-blue-300/80 cursor-pointer hover:shadow-xl hover:border-blue-400 hover:bg-blue-50/50 transition-all duration-200 active:scale-[0.99] group select-none"
          >
            <div className="flex items-center gap-[1vw]">
              <div className="h-[2.4vw] w-[2.4vw] rounded-xl bg-blue-50 border border-blue-200/80 flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:bg-blue-100 transition-all">
                <svg viewBox="0 0 24 24" className="h-[1.4vw] w-[1.4vw] fill-none stroke-[#1C6FB8]" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
                  <path d="M2 12h20" />
                </svg>
              </div>
              <div>
                <p className="text-[0.9vw] font-black uppercase tracking-wider text-[#1C6FB8]">
                  Global Case Studies
                </p>
                <p className="text-[0.82vw] font-bold leading-snug text-slate-800 mt-0.5">
                  How cities around the world solved flooding?
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-[0.8vw] font-bold text-[#1C6FB8] group-hover:translate-x-1 transition-transform shrink-0 pr-1">
              <span>View</span>
              <span>→</span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PREVIOUS SECTIONS PRESERVED IN COMMENTS BELOW FOR FUTURE REFERENCE/USAGE */}
      {/* ========================================================================= */}
      {/*
      <div className="max-w-[1400px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex flex-col gap-12 animate-[fadeIn_0.5s_ease-out_forwards]">
        <style>{`
          @keyframes floatIcon {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-8px); }
            100% { transform: translateY(0px); }
          }
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(12px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>

        <div className="px-6 py-12 md:px-10 rounded-[20px] bg-gradient-to-br from-[#eef2ff] to-[#e0e7ff] border border-indigo-200 shadow-[0_4px_16px_rgba(99,102,241,0.06)] flex flex-col items-center text-center gap-7">
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 m-0 leading-tight tracking-tight">Bangalore is flooding. Every monsoon season.</h1>
          <p className="text-base text-slate-600 leading-relaxed max-w-[900px] mx-auto m-0">
            In 2022, the city received 1,400 mm of rainfall—50% above normal. 131.6 mm fell in just 12 hours. 
            Inadequate drainage, encroached water bodies, and rapid urbanization are pushing Bangalore toward a water crisis.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-3 w-full">
            {bangaloreStats.map((stat, idx) => (
              <div key={idx} className="bg-white border border-slate-200 rounded-[18px] p-6 flex flex-col gap-2 text-left hover:bg-slate-50/60 hover:-translate-y-1 hover:shadow-lg hover:border-slate-300 transition-all duration-300">
                <div className="text-[32px] font-extrabold text-[#6f69dc] leading-none">{stat.value}</div>
                <div className="text-[12.5px] text-slate-500 font-medium leading-normal">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white/70 backdrop-blur-md border border-white/50 rounded-3xl p-8 md:p-10 flex flex-col gap-9 shadow-[0_8px_32px_0_rgba(31,38,135,0.04)]">
          <div className="flex justify-center items-center text-center">
            <div className="max-w-[800px] mx-auto">
              <h2 className="text-2xl font-extrabold text-slate-900 mb-2 tracking-tight">What is Solutions Explorer?</h2>
              <p className="text-base text-slate-500 leading-relaxed max-w-[800px] mx-auto mt-2">
                A comprehensive decision-support tool helping urban planners, engineers, and citizens understand flood risks and identify nature-based solutions.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white border border-slate-200 rounded-[20px] p-7 flex flex-col gap-4 shadow-sm hover:-translate-y-1 hover:shadow-indigo-500/10 hover:shadow-xl hover:border-indigo-500 transition-all duration-300 text-left">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">🗺️</span>
                <h3 className="text-base font-bold text-slate-900 m-0">Flood Risk Map</h3>
              </div>
              <p className="text-[13.5px] text-slate-600 leading-relaxed m-0 flex-1">
                Visualize vulnerable zones across Bangalore using topographic data and historical flood records.
              </p>
              <button className="text-xs font-bold text-indigo-600 flex items-center gap-1 hover:gap-2 transition-all cursor-pointer mt-2" onClick={() => onSetActiveTab('floodriskmap')}>
                Explore Map →
              </button>
            </div>

            <div className="bg-white border border-slate-200 rounded-[20px] p-7 flex flex-col gap-4 shadow-sm hover:-translate-y-1 hover:shadow-indigo-500/10 hover:shadow-xl hover:border-indigo-500 transition-all duration-300 text-left">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">🌿</span>
                <h3 className="text-base font-bold text-slate-900 m-0">Interventions</h3>
              </div>
              <p className="text-[13.5px] text-slate-600 leading-relaxed m-0 flex-1">
                Discover Blue-Green-Grey interventions suited for different urban typologies.
              </p>
              <button className="text-xs font-bold text-indigo-600 flex items-center gap-1 hover:gap-2 transition-all cursor-pointer mt-2" onClick={() => onSetActiveTab('interventions')}>
                View Solutions →
              </button>
            </div>

            <div className="bg-white border border-slate-200 rounded-[20px] p-7 flex flex-col gap-4 shadow-sm hover:-translate-y-1 hover:shadow-indigo-500/10 hover:shadow-xl hover:border-indigo-500 transition-all duration-300 text-left">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">📖</span>
                <h3 className="text-base font-bold text-slate-900 m-0">Case Studies</h3>
              </div>
              <p className="text-[13.5px] text-slate-600 leading-relaxed m-0 flex-1">
                Learn from global cities like Singapore, Copenhagen, and Rotterdam that solved urban flooding.
              </p>
              <button className="text-xs font-bold text-indigo-600 flex items-center gap-1 hover:gap-2 transition-all cursor-pointer mt-2" onClick={() => onSetActiveTab('casestudy')}>
                Read Cases →
              </button>
            </div>

            <div className="bg-white border border-slate-200 rounded-[20px] p-7 flex flex-col gap-4 shadow-sm hover:-translate-y-1 hover:shadow-indigo-500/10 hover:shadow-xl hover:border-indigo-500 transition-all duration-300 text-left">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">📊</span>
                <h3 className="text-base font-bold text-slate-900 m-0">Data Layers</h3>
              </div>
              <p className="text-[13.5px] text-slate-600 leading-relaxed m-0 flex-1">
                Overlay hydrological, ecological, and administrative layers for data-driven decisions.
              </p>
              <button className="text-xs font-bold text-indigo-600 flex items-center gap-1 hover:gap-2 transition-all cursor-pointer mt-2" onClick={() => onSetActiveTab('dashboard')}>
                Open Dashboard →
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white/70 backdrop-blur-md border border-white/50 rounded-3xl p-8 md:p-10 shadow-[0_8px_32px_0_rgba(31,38,135,0.04)]">
          <div className="grid grid-cols-1 md:grid-cols-[1.5fr_1fr] gap-10 items-center">
            <div className="flex flex-col gap-5 text-left">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">Decision-Making Framework</span>
              <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 m-0 tracking-tight">How Solutions Explorer works</h2>
              <p className="text-[14.5px] text-slate-600 leading-relaxed m-0">
                The platform brings together hydrological data, spatial analytics, and proven nature-based design patterns to help stakeholders prioritize climate adaptation projects.
              </p>
              <div className="flex flex-col gap-3">
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">1</span>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 m-0">Identify Flood Hazard Hotspots</h4>
                    <p className="text-xs text-slate-500 m-0 mt-0.5">Locate critical valleys, low-elevation catchments, and flood hazard zones.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">2</span>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 m-0">Match with Targeted Interventions</h4>
                    <p className="text-xs text-slate-500 m-0 mt-0.5">Select suitable blue, green, and grey solutions based on site typologies.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">3</span>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 m-0">Track & Implement Resilience Projects</h4>
                    <p className="text-xs text-slate-500 m-0 mt-0.5">Coordinate across city agencies, donors, and consultants.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 p-6 rounded-2xl bg-gradient-to-br from-slate-50 to-indigo-50/50 border border-slate-200 text-left">
              <h3 className="text-base font-bold text-slate-900 m-0 mb-1">Key Intervention Types</h3>
              {interventions.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 p-2.5 rounded-xl bg-white border border-slate-100 shadow-xs">
                  <span className="text-xl">{item.icon}</span>
                  <div>
                    <div className="text-xs font-bold text-slate-800">{item.name}</div>
                    <div className="text-[11px] text-slate-500">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white/70 backdrop-blur-md border border-white/50 rounded-3xl p-8 md:p-10 shadow-[0_8px_32px_0_rgba(31,38,135,0.04)]">
          <h2 className="text-2xl font-extrabold text-slate-900 mb-2 tracking-tight text-center">What is BGG?</h2>
          <p className="text-base text-slate-500 leading-relaxed max-w-[800px] mx-auto mt-2 text-center">
            Blue-Green-Grey infrastructure combines natural water systems (blue), ecological landscapes (green), and engineered drainage (grey) for holistic urban resilience.
          </p>

          <div className="flex justify-center gap-5 my-8 flex-wrap">
            <div className="flex items-center px-5 py-3 rounded-full text-sm font-medium border border-blue-200 bg-white hover:-translate-y-0.5 hover:shadow-md transition-all duration-200">
              <span className="w-2.5 h-2.5 rounded-full mr-3 bg-blue-500 shadow-[0_0_0_3px_rgba(59,130,246,0.2)]"></span>
              <strong className="text-slate-800 mr-1.5">Blue:</strong>
              <span className="text-slate-600">Lakes, wetlands, floodplains, swales</span>
            </div>
            <div className="flex items-center px-5 py-3 rounded-full text-sm font-medium border border-emerald-200 bg-white hover:-translate-y-0.5 hover:shadow-md transition-all duration-200">
              <span className="w-2.5 h-2.5 rounded-full mr-3 bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.2)]"></span>
              <strong className="text-slate-800 mr-1.5">Green:</strong>
              <span className="text-slate-600">Parks, tree canopies, bioswales, green roofs</span>
            </div>
            <div className="flex items-center px-5 py-3 rounded-full text-sm font-medium border border-slate-300 bg-white hover:-translate-y-0.5 hover:shadow-md transition-all duration-200">
              <span className="w-2.5 h-2.5 rounded-full mr-3 bg-slate-500 shadow-[0_0_0_3px_rgba(100,116,139,0.2)]"></span>
              <strong className="text-slate-800 mr-1.5">Grey:</strong>
              <span className="text-slate-600">Storm drains, culverts, pumping stations</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6 flex flex-col items-center text-center gap-2 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200">
              <div className="text-3xl mb-1">💧</div>
              <div className="text-sm font-bold text-slate-800">Retention & Detention</div>
              <div className="text-xs text-slate-500 leading-relaxed">Holding stormwater at source to delay runoff peaks and prevent flash flooding</div>
            </div>
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6 flex flex-col items-center text-center gap-2 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200">
              <div className="text-3xl mb-1">🌱</div>
              <div className="text-sm font-bold text-slate-800">Infiltration & Recharge</div>
              <div className="text-xs text-slate-500 leading-relaxed">Allowing rainwater to soak into the ground, replenishing over-extracted aquifers</div>
            </div>
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6 flex flex-col items-center text-center gap-2 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200">
              <div className="text-3xl mb-1">🌿</div>
              <div className="text-sm font-bold text-slate-800">Biofiltration</div>
              <div className="text-xs text-slate-500 leading-relaxed">Using soils and vegetation to naturally remove pollutants and sediments from runoff</div>
            </div>
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6 flex flex-col items-center text-center gap-2 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200">
              <div className="text-3xl mb-1">🏙️</div>
              <div className="text-sm font-bold text-slate-800">Co-Benefits</div>
              <div className="text-xs text-slate-500 leading-relaxed">Urban cooling, enhanced biodiversity, public amenity spaces, and climate resilience</div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col items-center text-center mb-6">
            <h2 className="text-2xl font-extrabold text-slate-900 mb-2 tracking-tight">How cities around the world solved flooding</h2>
            <p className="text-base text-slate-500 leading-relaxed max-w-[800px] mx-auto m-0">
              Click any case study to explore full project profiles, hydrological metrics, and actionable lessons for Bangalore.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {shockingNews.map((news) => (
              <div 
                key={news.id} 
                className="bg-white border border-slate-200 rounded-[20px] p-7 flex flex-col justify-between shadow-sm hover:-translate-y-1.5 hover:shadow-xl hover:border-indigo-400 transition-all duration-300 cursor-pointer relative overflow-hidden group"
                onClick={() => onNavigateToCase(news.targetCaseTitle)}
              >
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <h3 className="text-lg font-bold text-slate-900 m-0 mb-3.5 pr-12 leading-snug">{news.title}</h3>
                <p className="text-[13.5px] leading-relaxed text-slate-600 mb-6 flex-1">{news.description}</p>
                
                <div className="grid grid-cols-2 gap-3 mb-5 p-3 bg-slate-50 border border-slate-100 rounded-xl">
                  {news.metrics.map((m, mIdx) => (
                    <div key={mIdx} className="flex flex-col gap-0.5 text-left">
                      <span className="text-sm font-black text-indigo-600">{m.value}</span>
                      <span className="text-[10.5px] text-slate-500 leading-tight">{m.label}</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center text-xs font-bold text-indigo-600 gap-1 group-hover:gap-2 transition-all">
                  <span>Explore Case Study</span>
                  <span>→</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gradient-to-br from-indigo-500/8 to-blue-500/8 border border-dashed border-indigo-500/25 rounded-3xl p-8 md:p-10 text-center flex flex-col items-center gap-4">
          <h3 className="text-xl md:text-2xl font-bold text-slate-900 m-0">Ready to build BGG in Bangalore?</h3>
          <p className="text-[14.5px] text-slate-600 leading-relaxed max-w-[700px] m-0">
            Use gap analysis maps to identify where high-risk flood areas lack interventions — and invest where you'll save the most lives. 
            Together, we can transform Bangalore's flood crisis into a resilient, climate-adapted city.
          </p>
          <button className="mt-2 px-7 py-3 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-xl text-sm font-semibold hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-500/35 active:translate-y-0 transition-all duration-200 cursor-pointer" onClick={() => onSetActiveTab('floodriskmap')}>
            Learn More
          </button>
        </div>
      </div>
      */}
    </div>
  );
};

export default BggIntroduction;