import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// import LegalLinks from '@/components/LegalLinks';
import RandomLetterSwap from '@/styles/RandomLetterSwap';
import HomeBackground from '@/components/Homebackground';

// Matches Tailwind's `xl` breakpoint, where the hero switches to the absolutely positioned desktop layout
const DESKTOP_QUERY = '(min-width: 1280px)';

const BggIntroduction = ({ onNavigateToCase, onSetActiveTab }) => {
  const navigate = useNavigate();

  const ASSETS = {
    background: "/assets/city-aerial.jpg",
    isoCity: "/images/homepage/BGGI_BGGI_full.svg",
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
  const [isDesktop, setIsDesktop] = useState(() => window.matchMedia(DESKTOP_QUERY).matches);

  useEffect(() => {
    const mq = window.matchMedia(DESKTOP_QUERY);
    const onChange = (e) => setIsDesktop(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  // Keep full-screen document body background seamless with the home screen palette
  useEffect(() => {
    const originalBg = document.body.style.backgroundColor;
    document.body.style.backgroundColor = '#c9d8bd';
    return () => {
      document.body.style.backgroundColor = originalBg;
    };
  }, []);

  const handleNavigateToCaseStudies = () => {
    if (onSetActiveTab) {
      onSetActiveTab('casestudy');
    } else if (onNavigateToCase) {
      onNavigateToCase();
    } else {
      navigate('/casestudy');
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
    navigate(`/login?role=${personaId}`, { replace: true });
  };

  return (
    <div className="w-full min-h-[calc(100vh-80px)] bg-[#c9d8bd] animate-[fadeIn_0.4s_ease-out_forwards]">
      {/* ========================================== */}
      {/* ACTIVE HERO SECTION WITH ISOMETRIC BANNER */}
      {/* ========================================== */}
      <div
        className="relative w-full flex flex-col gap-5 sm:gap-6 px-4 sm:px-6 md:px-10 py-6 sm:py-8 overflow-hidden select-none xl:block xl:p-0 xl:aspect-[979/502] xl:min-h-[520px]"
      >
        <HomeBackground />
        {/* Transparent Click-Away Overlay to dismiss popup without darkening background */}
        {activeMarker && (
          <div
            className="fixed inset-0 z-20 cursor-default"
            onClick={() => setActiveMarker(null)}
          />
        )}

        {/* ---------- RIGHT: isometric city + its clickable map pins ---------- */}
        <div className="order-3 relative w-full max-w-3xl mx-auto aspect-[568/502] select-none xl:absolute xl:right-0 xl:top-0 xl:h-full xl:w-[58%] xl:max-w-none xl:mx-0 xl:aspect-auto">
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
                <span className="rounded-sm bg-[#9B2C1E] px-1.5 py-0.5 text-[10px] sm:text-xs xl:px-[0.6vw] xl:py-[0.15vw] xl:text-[0.65vw] font-bold tracking-wider text-white shadow-md hover:bg-red-700 transition-colors">
                  {m.text}
                </span>
              ) : m.type === "image" ? (
                <img
                  src={m.img}
                  alt={m.alt || ""}
                  className="h-9 w-9 sm:h-12 sm:w-12 xl:h-[3.8vw] xl:w-[3.8vw] object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.25)]"
                />
              ) : (
                <div
                  className={`flex h-[2.6vw] w-[2.6vw] items-center justify-center rounded-full border-2 border-white text-center text-[0.45vw] font-bold leading-[1.15] text-white shadow-lg ${m.type === "dark" ? "bg-[#1B3A57]" : "bg-[#2F6B3A]"
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
              className="absolute z-30 inset-x-2 bottom-2 sm:inset-x-auto sm:right-3 sm:w-[340px] xl:right-auto xl:bottom-auto xl:w-[24vw] xl:min-w-[280px] xl:max-w-[340px] bg-white rounded-2xl p-4 shadow-[0_10px_30px_rgba(0,0,0,0.16)] border border-slate-200/90 flex flex-col gap-2.5 animate-[fadeIn_0.15s_ease-out] select-auto"
              style={isDesktop ? getPopupPlacement() : undefined}
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

            </div>
          )}
        </div>

        {/* ---------- Stats card ---------- */}
        <div className="order-6 relative w-full max-w-3xl mx-auto z-10 flex justify-around gap-3 sm:gap-6 rounded-xl bg-white/95 px-3 sm:px-6 py-3 shadow-md backdrop-blur-sm border border-white/60 xl:absolute xl:left-[44%] xl:top-[2%] xl:w-auto xl:max-w-none xl:mx-0 xl:justify-start xl:gap-[2.5vw] xl:px-[1.2vw] xl:py-[0.6vw]">
          {STATS.map((s) => (
            <div key={s.label} className="text-center leading-tight">
              <div className="text-lg sm:text-2xl xl:text-[1.15vw] font-black text-slate-800">{s.value}</div>
              <div className="text-[10px] sm:text-xs xl:text-[0.62vw] font-semibold tracking-wide text-slate-500 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* ---------- Headline ---------- */}
        <h1 className="order-1 relative font-serif text-[26px] sm:text-4xl md:text-[42px] leading-[1.22] font-extrabold text-slate-900 z-10 xl:absolute xl:left-[2.5%] xl:top-[2.2%] xl:max-w-[41%] xl:text-[2.05vw]">
          Transforming Bengaluru into a
          <br />
          <span className="font-bold text-[#1C6FB8]">Water-Secure</span> &amp;{" "}
          <span className="font-bold text-[#2F6B3A]">Climate-Resilient</span> City
        </h1>

        {/* ---------- Yellow banner (bleeds directly off the left edge) ---------- */}
        <div className="order-2 relative -ml-4 sm:-ml-6 md:-ml-10 w-[calc(100%+1rem)] sm:w-[calc(100%+1.5rem)] md:w-2/3 rounded-r-2xl bg-[#F2C230] px-5 sm:px-8 py-3 sm:py-4 shadow-md z-10 border-y border-r border-amber-300/40 xl:absolute xl:left-0 xl:top-[16%] xl:ml-0 xl:w-[41%] xl:px-[2.8vw] xl:py-[0.95vw]">
          <p className="text-sm sm:text-lg xl:text-[1.35vw] font-semibold leading-tight text-white/95 uppercase tracking-wide">
            Let&apos;s turn Bengaluru into a
          </p>
          <div className="mt-0.5">
            <RandomLetterSwap
              label="Blue Green Grey City"
              mode="pingpong"
              color="#FFFFFF"
              className="text-2xl sm:text-4xl xl:text-[2.2vw] font-black leading-tight text-white tracking-tight cursor-pointer"
            />
          </div>
        </div>

        {/* ---------- Question ---------- */}
        <p className="order-4 relative font-serif text-base sm:text-xl xl:text-[1.18vw] font-semibold italic text-slate-700 z-10 xl:absolute xl:left-[3%] xl:top-[33.5%]">
          But first — Who are you for the city?
        </p>

        {/* ---------- Persona cards (Enlarged with Spacing) ---------- */}
        <div className="order-5 relative grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 z-10 xl:absolute xl:left-[2.5%] xl:top-[39%] xl:flex xl:gap-[1.3vw]">
          {PERSONAS.map((p) => {
            const active = selected === p.id;
            return (
              <button
                key={p.id}
                onClick={() => handlePersonaClick(p.id)}
                aria-pressed={active}
                className={`group flex w-full gap-2 xl:gap-0 xl:h-[14.5vw] xl:w-[9.1vw] flex-col items-center justify-between rounded-xl bg-white p-3 xl:p-[0.6vw] shadow-md outline-none transition-all duration-200 border
                hover:-translate-y-1 hover:shadow-xl focus-visible:ring-2 focus-visible:ring-[#1C6FB8]
                ${active ? "ring-2 ring-[#F2C230] border-amber-400 bg-amber-50/20 shadow-lg" : "border-slate-200 hover:border-blue-300"}`}
              >
                <img
                  src={p.img}
                  alt=""
                  className="h-28 sm:h-32 md:h-40 xl:h-[10.2vw] w-full object-contain transition-transform duration-200 group-hover:scale-105"
                />
                <span className="pb-0.5 xl:pb-[0.2vw] text-center text-xs sm:text-sm xl:text-[0.76vw] font-bold leading-snug text-slate-800">
                  {p.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* ---------- Bottom Cards: Left (Did you know) & Right (How cities around the world solved flooding?) ---------- */}
        <div className="order-7 relative flex flex-col md:flex-row justify-between md:items-stretch gap-3 sm:gap-4 z-10 xl:absolute xl:bottom-[2.5%] xl:left-[2.5%] xl:right-[2.5%] xl:items-center xl:gap-[1.5vw]">
          {/* Left Card: Did you know? (Informational, non-clickable) */}
          <div className="flex flex-1 items-center justify-between gap-3 xl:gap-[1vw] rounded-xl bg-white/95 px-4 py-3 xl:px-[1.4vw] xl:py-[0.85vw] shadow-md border border-amber-300/80 select-none">
            <div className="flex items-center gap-3 xl:gap-[1vw]">
              <svg viewBox="0 0 24 24" className="h-8 w-8 xl:h-[2.4vw] xl:w-[2.4vw] shrink-0 fill-[#F2C230]">
                <path d="M12 2a7 7 0 0 0-4 12.7V17a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-2.3A7 7 0 0 0 12 2Zm-3 18h6v1a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1v-1Z" />
              </svg>
              <div>
                <p className="text-xs sm:text-sm xl:text-[0.9vw] font-black uppercase tracking-wider text-[#C25E1C]">
                  Did you know?
                </p>
                <p className="text-sm xl:text-[0.82vw] font-semibold leading-snug text-[#2F6B6B] mt-0.5">
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
            className="flex flex-1 items-center justify-between gap-3 xl:gap-[1vw] rounded-xl bg-white/95 px-4 py-3 xl:px-[1.4vw] xl:py-[0.85vw] shadow-md border border-blue-300/80 cursor-pointer hover:shadow-xl hover:border-blue-400 hover:bg-blue-50/50 transition-all duration-200 active:scale-[0.99] group select-none"
          >
            <div className="flex items-center gap-3 xl:gap-[1vw]">
              <div className="h-9 w-9 xl:h-[2.4vw] xl:w-[2.4vw] rounded-xl bg-blue-50 border border-blue-200/80 flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:bg-blue-100 transition-all">
                <svg viewBox="0 0 24 24" className="h-5 w-5 xl:h-[1.4vw] xl:w-[1.4vw] fill-none stroke-[#1C6FB8]" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
                  <path d="M2 12h20" />
                </svg>
              </div>
              <div>
                <p className="text-xs sm:text-sm xl:text-[0.9vw] font-black uppercase tracking-wider text-[#1C6FB8]">
                  Global Case Studies
                </p>
                <p className="text-sm xl:text-[0.82vw] font-bold leading-snug text-slate-800 mt-0.5">
                  How cities around the world solved flooding?
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-sm xl:text-[0.8vw] font-bold text-[#1C6FB8] group-hover:translate-x-1 transition-transform shrink-0 pr-1">
              <span>View</span>
              <span>→</span>
            </div>
          </div>
        </div>
      </div>

      {/* <LegalLinks /> */}
    </div>
  );
};

export default BggIntroduction;