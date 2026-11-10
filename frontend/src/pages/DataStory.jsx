import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import valleysGeoJson from '@/data/valleys.json';

// --- STORY STEPS EXACTLY MATCHING THE VERCEL REFERENCE STYLE ---
const STORY_STEPS = [
  {
    id: 'step-overview',
    stepNumber: 1,
    title: 'Regional Geography',
    center: [12.9716, 77.5946],
    zoom: 11,
    text: 'Bengaluru is perched high on a Deccan ridge at an elevation of 920 metres above sea level. Without a major perennial river, all rainfall naturally drains across three major river valleys: Hebbal in the north, Vrishabhavathi in the west, and Koramangala–Challaghatta (KC) in the southeast.',
    cardPosition: 'right', // 'right' | 'center'
    stage: 'valleys',
  },
  {
    id: 'step-cascade',
    stepNumber: 2,
    title: 'Historic Cascade Lakes',
    center: [12.965, 77.625],
    zoom: 12,
    text: 'Centuries ago, an interconnected chain of over 200 cascade lakes (Keres) was sculpted along these valleys. When upstream lakes filled, overflow traveled through natural unpaved streams (Rajakaluves) into downstream reservoirs, absorbing peak monsoons while recharging shallow aquifers.',
    cardPosition: 'right',
    stage: 'lakes',
  },
  {
    id: 'step-urbanization',
    stepNumber: 3,
    title: 'The Concrete Expansion',
    center: [12.945, 77.64],
    zoom: 12,
    text: 'Over the last 40 years, built-up concrete expanded by more than 1,000%. Permeable agricultural soils, grasslands, and wetlands were paved with asphalt roads, roofs, and concrete plazas. Nearly 79% of water bodies were encroached or fragmented.',
    cardPosition: 'right',
    stage: 'urban',
  },
  {
    id: 'step-cloudburst',
    stepNumber: 4,
    title: 'The 100mm Cloudburst Shock',
    center: [12.935, 77.665],
    zoom: 13,
    text: 'Climate change now triggers severe, concentrated monsoon storms. When a 100mm cloudburst hits in under 2 hours, 85% of rainfall turns into immediate surface runoff. The city’s stormwater drains, designed for only 25–30 mm/hr, are overwhelmed 4 times over their capacity.',
    cardPosition: 'right',
    stage: 'cloudburst',
  },
  {
    id: 'step-hotspots',
    stepNumber: 5,
    title: 'Chokepoints & 201 Flood Hotspots',
    center: [12.925, 77.678],
    zoom: 13,
    text: 'Runoff follows gravity into the lowest valley bottlenecks. Around the Outer Ring Road (ORR), Bellandur, Silk Board, and Manyata, storm drains choke under 0.5m to 1.5m of waterlogging—causing over ₹225 Crores in damages in a single event across 201 identified flood hotspots.',
    cardPosition: 'right',
    stage: 'hotspots',
  },
  {
    id: 'step-solutions',
    stepNumber: 6,
    title: 'The Blue-Green Sponge Strategy',
    center: [12.94, 77.65],
    zoom: 13,
    text: 'Building bigger concrete drains alone cannot stop flooding. The smart solution is decentralized Blue-Green Infrastructure: lake wetland buffers to store surge volumes, roadside bioswales to filter runoff, and thousands of shallow recharge wells injecting rainwater into deep aquifers.',
    cardPosition: 'right',
    stage: 'bgg',
  },
  {
    id: 'step-resilient',
    stepNumber: 7,
    title: 'A Flood-Resilient Bengaluru',
    center: [12.9716, 77.5946],
    zoom: 11,
    text: 'With decentralized sponge infrastructure active across the valleys, peak storm runoff is shaved by 38%, waterlogging clears in under 45 minutes, and 2.4 Billion Litres of fresh rainwater recharge Bengaluru’s groundwater table every year.',
    cardPosition: 'right',
    stage: 'resilient',
  },
];

// Highlighted Hotspots for satellite view
const NOTABLE_HOTSPOTS = [
  { name: 'Bellandur / ORR Inlet', lat: 12.9348, lng: 77.6748, depth: '1.5m' },
  { name: 'Silk Board Junction', lat: 12.9172, lng: 77.6228, depth: '0.9m' },
  { name: 'Ecospace Bellandur ORR', lat: 12.9265, lng: 77.6835, depth: '1.4m' },
  { name: 'Hebbal Flyover Low-Point', lat: 13.0358, lng: 77.597, depth: '0.8m' },
  { name: 'Manyata Tech Park Boundary', lat: 13.048, lng: 77.621, depth: '1.1m' },
];

// Key BGG Interventions
const NOTABLE_BGG = [
  { name: 'K100 Citizens’ Waterway', lat: 12.954359, lng: 77.594161, icon: '🌊' },
  { name: 'Jakkur Lake Wetland Cascade', lat: 13.086453, lng: 77.610669, icon: '🌿' },
  { name: 'Kaikondrahalli Lake Buffer', lat: 12.91314, lng: 77.673041, icon: '🌱' },
  { name: 'Ferns Residency Recharge Cluster', lat: 13.055703, lng: 77.638429, icon: '💧' },
  { name: 'Puttenahalli Lake Sponge', lat: 12.889912, lng: 77.587416, icon: '🌱' },
];

const DataStory = () => {
  const navigate = useNavigate();
  const [activeStepIndex, setActiveStepIndex] = useState(0);

  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const valleysLayerRef = useRef(null);
  const markersLayerRef = useRef(null);
  const stepSectionRefs = useRef([]);

  // -------------------------------------------------------------------------
  // 1. LEAFLET INITIALIZATION WITH ESRI HIGH-RES SATELLITE IMAGERY
  // (Completely locked: pointer-events-none, no dragging, no clicking, no zooming)
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapRef.current) return;

    const initial = STORY_STEPS[0];

    const map = L.map(mapContainerRef.current, {
      center: initial.center,
      zoom: initial.zoom,
      zoomControl: false,
      attributionControl: true,
      dragging: false,
      touchZoom: false,
      doubleClickZoom: false,
      scrollWheelZoom: false,
      boxZoom: false,
      keyboard: false,
      fadeAnimation: true,
    });

    // High-Resolution Esri World Imagery (Same source as user reference screenshots)
    L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {
        attribution:
          'Imagery &copy; Esri, Maxar, Earthstar Geographics, and the GIS User Community',
        maxZoom: 19,
      }
    ).addTo(map);

    // Layer group for pins & highlights
    const markersGroup = L.layerGroup().addTo(map);
    markersLayerRef.current = markersGroup;

    // Load Valleys GeoJSON (crisp glowing white & cyan boundary vectors)
    if (valleysGeoJson) {
      try {
        const vLayer = L.geoJSON(valleysGeoJson, {
          style: {
            color: '#ffffff',
            weight: 2,
            opacity: 0.9,
            fillColor: '#3669A9',
            fillOpacity: 0.08,
            dashArray: '4, 4',
          },
        }).addTo(map);
        valleysLayerRef.current = vLayer;
      } catch (err) {
        console.warn('Valleys render error:', err);
      }
    }

    mapRef.current = map;

    // Invalidate size once mounted to ensure full edge-to-edge coverage
    map.invalidateSize();
    const t1 = setTimeout(() => map.invalidateSize(), 100);
    const t2 = setTimeout(() => map.invalidateSize(), 400);

    const handleResize = () => {
      map.invalidateSize();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener('resize', handleResize);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // -------------------------------------------------------------------------
  // 2. MAP UPDATE ON ACTIVE STEP CHANGE (Camera glide & vector overlay states)
  // -------------------------------------------------------------------------
  useEffect(() => {
    const map = mapRef.current;
    const markersGroup = markersLayerRef.current;
    if (!map || !markersGroup) return;

    const step = STORY_STEPS[activeStepIndex];

    // Smooth cinematic glide to target location & zoom
    map.flyTo(step.center, step.zoom, {
      duration: 1.8,
      easeLinearity: 0.25,
    });

    markersGroup.clearLayers();

    if (step.stage === 'valleys') {
      if (valleysLayerRef.current) {
        valleysLayerRef.current.setStyle({
          color: '#ffffff',
          weight: 2.2,
          opacity: 0.95,
          fillColor: '#347745',
          fillOpacity: 0.12,
          dashArray: '5, 5',
        });
      }
    } else if (step.stage === 'lakes') {
      if (valleysLayerRef.current) {
        valleysLayerRef.current.setStyle({
          color: '#60a5fa',
          weight: 2,
          opacity: 0.85,
          fillColor: '#2563eb',
          fillOpacity: 0.1,
          dashArray: '4, 4',
        });
      }
      // Glowing cascade waterway line
      L.polyline(
        [
          [13.086, 77.61],
          [13.035, 77.625],
          [12.975, 77.64],
          [12.935, 77.674],
          [12.92, 77.72],
        ],
        {
          color: '#38bdf8',
          weight: 3.5,
          opacity: 0.9,
          dashArray: '8, 6',
        }
      ).addTo(markersGroup);
    } else if (step.stage === 'urban') {
      // Highlight high-density concrete boundary
      L.circle([12.9716, 77.5946], {
        radius: 9000,
        color: '#fbbf24',
        weight: 2,
        fillColor: '#f59e0b',
        fillOpacity: 0.16,
        dashArray: '6, 6',
      }).addTo(markersGroup);
    } else if (step.stage === 'cloudburst') {
      // Pulsing cloudburst storm epicenter
      L.circle([12.935, 77.665], {
        radius: 6500,
        color: '#38bdf8',
        weight: 3,
        fillColor: '#0284c7',
        fillOpacity: 0.25,
      }).addTo(markersGroup);
    } else if (step.stage === 'hotspots') {
      // Chokepoints with glowing red alert icons
      NOTABLE_HOTSPOTS.forEach((spot) => {
        const icon = L.divIcon({
          className: 'custom-satellite-hotspot',
          html: `
            <div style="position:relative; display:flex; align-items:center; justify-content:center;">
              <span style="position:absolute; width:34px; height:34px; background:rgba(239,68,68,0.4); border-radius:9999px; animation:ping 1.6s cubic-bezier(0,0,0.2,1) infinite;"></span>
              <span style="position:relative; width:22px; height:22px; background:#ef4444; border:2px solid #ffffff; border-radius:9999px; display:flex; align-items:center; justify-content:center; color:#ffffff; font-size:11px; font-weight:900; box-shadow:0 4px 6px rgba(0,0,0,0.3);">
                !
              </span>
            </div>
          `,
          iconSize: [22, 22],
          iconAnchor: [11, 11],
        });
        L.marker([spot.lat, spot.lng], { icon }).addTo(markersGroup);
      });
    } else if (step.stage === 'bgg') {
      // Blue-Green sponge pins
      NOTABLE_BGG.forEach((proj) => {
        const icon = L.divIcon({
          className: 'custom-satellite-bgg',
          html: `
            <div style="position:relative; display:flex; align-items:center; justify-content:center;">
              <span style="position:absolute; width:32px; height:32px; background:rgba(52,211,153,0.4); border-radius:9999px; animation:pulse 2s cubic-bezier(0.4,0,0.6,1) infinite;"></span>
              <span style="position:relative; width:26px; height:26px; background:#059669; border:2px solid #ffffff; border-radius:9999px; display:flex; align-items:center; justify-content:center; color:#ffffff; font-size:13px; box-shadow:0 4px 6px rgba(0,0,0,0.3);">
                ${proj.icon}
              </span>
            </div>
          `,
          iconSize: [26, 26],
          iconAnchor: [13, 13],
        });
        L.marker([proj.lat, proj.lng], { icon }).addTo(markersGroup);
      });
    } else if (step.stage === 'resilient') {
      if (valleysLayerRef.current) {
        valleysLayerRef.current.setStyle({
          color: '#34d399',
          weight: 2.5,
          opacity: 0.95,
          fillColor: '#10b981',
          fillOpacity: 0.18,
          dashArray: 'none',
        });
      }
    }
  }, [activeStepIndex]);

  // -------------------------------------------------------------------------
  // 3. WINDOW SCROLL LISTENER (The entire window scrolls naturally)
  // -------------------------------------------------------------------------
  useEffect(() => {
    const handleScroll = () => {
      const windowHeight = window.innerHeight;
      const midPoint = windowHeight * 0.45;

      let closestIndex = 0;
      let minDistance = Infinity;

      stepSectionRefs.current.forEach((section, idx) => {
        if (!section) return;
        const rect = section.getBoundingClientRect();
        // Distance of section center to viewport midPoint
        const sectionCenter = rect.top + rect.height / 2;
        const dist = Math.abs(sectionCenter - midPoint);
        if (dist < minDistance) {
          minDistance = dist;
          closestIndex = idx;
        }
      });

      if (closestIndex !== activeStepIndex) {
        setActiveStepIndex(closestIndex);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [activeStepIndex]);

  return (
    <div className="relative w-full min-h-screen bg-transparent font-sans text-slate-900 select-none">
      {/* ========================================================================= */}
      {/* 1. FIXED FULLSCREEN SATELLITE MAP (Z-index 0, non-clickable) */}
      {/* ========================================================================= */}
      <div
        ref={mapContainerRef}
        className="fixed inset-0 w-screen h-screen z-0 pointer-events-none select-none bg-slate-900"
        style={{ pointerEvents: 'none' }}
      />

      {/* ========================================================================= */}
      {/* 2. MINIMAL FLOATING TOP HEADER */}
      {/* ========================================================================= */}
      <div className="fixed top-4 left-4 z-30 flex items-center gap-3 pointer-events-auto">
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="px-4 py-2 bg-black/60 hover:bg-black/80 backdrop-blur-md text-white text-xs font-bold rounded-lg border border-white/20 transition-all cursor-pointer shadow-lg flex items-center gap-2"
        >
          <span>←</span>
          <span>Exit Story</span>
        </button>
      </div>

      {/* STEP PROGRESS DOTS (Minimalist on the left side) */}
      <div className="fixed left-6 top-1/2 -translate-y-1/2 z-30 hidden md:flex flex-col gap-2.5 pointer-events-auto">
        {STORY_STEPS.map((step, idx) => (
          <button
            key={step.id}
            type="button"
            onClick={() => {
              stepSectionRefs.current[idx]?.scrollIntoView({ behavior: 'smooth' });
            }}
            className={`w-2.5 h-2.5 rounded-full transition-all cursor-pointer ${
              activeStepIndex === idx
                ? 'bg-white scale-125 shadow-[0_0_8px_rgba(255,255,255,0.9)]'
                : 'bg-white/40 hover:bg-white/70'
            }`}
            title={`Step ${idx + 1}: ${step.title}`}
          />
        ))}
      </div>

      {/* ========================================================================= */}
      {/* 3. SCROLLING STORY SECTIONS (User scrolls the page; cards float above map) */}
      {/* ========================================================================= */}
      <div className="relative z-10 w-full flex flex-col pointer-events-none">
        {STORY_STEPS.map((step, idx) => {
          const isActive = activeStepIndex === idx;

          return (
            <section
              key={step.id}
              ref={(el) => (stepSectionRefs.current[idx] = el)}
              className="min-h-screen w-full flex items-center justify-end px-5 sm:px-10 md:px-16 lg:px-24 py-20 pointer-events-none"
            >
              {/* Floating Story Card (Identical layout & typography to user screenshot) */}
              <div
                className={`w-full max-w-[460px] lg:max-w-[500px] p-6 sm:p-8 rounded-lg shadow-2xl border transition-all duration-500 pointer-events-auto ${
                  isActive
                    ? 'bg-white/95 backdrop-blur-md border-white/80 opacity-100 scale-100'
                    : 'bg-white/75 backdrop-blur-xs border-white/40 opacity-40 scale-95'
                }`}
              >
                {/* Story Paragraph in clean, simple English */}
                <p className="text-sm sm:text-base text-slate-800 leading-relaxed font-sans font-normal m-0">
                  {step.text}
                </p>

                {/* Final step action button */}
                {idx === STORY_STEPS.length - 1 && (
                  <div className="mt-5 pt-4 border-t border-slate-200 flex flex-wrap gap-2.5">
                    <button
                      type="button"
                      onClick={() => navigate('/dashboard')}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition-all cursor-pointer shadow-md"
                    >
                      Explore Interactive Map →
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate('/design-calculator')}
                      className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-300 transition-all cursor-pointer"
                    >
                      Design Calculator
                    </button>
                  </div>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
};

export default DataStory;
