import React, { useState } from 'react';

const RISK_ZONES = [
  {
    id: 'koramangala',
    name: 'Koramangala Zone',
    riskLevel: 'high',
    riskClass: 'High Risk',
    details: 'Heavy drainage blockages due to dense commercial layouts. Under extreme monsoons, storm runoff from higher elevation wards aggregates here, flooding Sectors 3 and 4.',
    activeInterventions: 18,
    wardsCount: 8,
    coords: { cx: 100, cy: 115, r: 24 },
    labelCoords: { x: 100, y: 115 }
  },
  {
    id: 'hsr-layout',
    name: 'HSR Layout Zone',
    riskLevel: 'medium',
    riskClass: 'Medium Risk',
    details: 'Low-lying sectors (specifically Sector 6) are prone to lake overflow backflows. Desilting of local channels is completed, but retention ponds require active monitoring.',
    activeInterventions: 12,
    wardsCount: 6,
    coords: { cx: 135, cy: 95, r: 22 },
    labelCoords: { x: 135, y: 95 }
  },
  {
    id: 'rajajinagar',
    name: 'Rajajinagar Zone',
    riskLevel: 'low',
    riskClass: 'Low Risk',
    details: 'Benefiting from stable natural elevation, stormwater drains operate efficiently with minimal waterlogging hotspots. Main activities focus on routine catch-pit maintenance.',
    activeInterventions: 6,
    wardsCount: 5,
    coords: { cx: 65, cy: 75, r: 20 },
    labelCoords: { x: 65, y: 75 }
  },
  {
    id: 'outer-ring-road',
    name: 'Outer Ring Road (ORR) Corridor',
    riskLevel: 'high',
    riskClass: 'High Risk',
    details: 'Highly urbanized concrete zone with low soil permeability. Heavy rainfall creates massive runoff sheets that flood commercial tech parks and underground basement power grids.',
    activeInterventions: 22,
    wardsCount: 12,
    coords: { cx: 160, cy: 130, r: 18 },
    labelCoords: { x: 160, y: 130 }
  }
];

const WATER_BODIES = [
  { name: 'Bellandur Lake', cx: 145, cy: 115, r: 5 },
  { name: 'Somasundarapalya Lake', cx: 102, cy: 132, r: 4 },
  { name: 'Jakkur Lake', cx: 112, cy: 45, r: 5 }
];

const FloodRiskMap = () => {
  const [activeSubTab, setActiveSubTab] = useState('all'); // 'all', 'high', 'medium', 'zones', 'waterlogging'
  const [selectedZone, setSelectedZone] = useState(RISK_ZONES[0]);

  const handleZoneClick = (zone) => {
    setSelectedZone(zone);
  };

  const isZoneFiltered = (zone) => {
    if (activeSubTab === 'all') return true;
    if (activeSubTab === 'high' && zone.riskLevel === 'high') return true;
    if (activeSubTab === 'medium' && zone.riskLevel === 'medium') return true;
    if (activeSubTab === 'zones') return true; // Show all zones
    return false;
  };

  return (
    <div className="flex flex-col gap-8 animate-[fadeInUp_0.4s_ease_both]">
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes lakePulse {
          0% { transform: scale(1); opacity: 0.85; }
          50% { transform: scale(1.05); opacity: 1; }
          100% { transform: scale(1); opacity: 0.85; }
        }
      `}</style>

      {/* Sub navigation mimicking the mockup */}
      <div className="flex gap-2 bg-slate-100 p-1.5 rounded-xl self-start flex-wrap">
        <button 
          className={`px-4 py-2 border-none rounded-lg text-[13.5px] font-bold transition-all duration-200 cursor-pointer ${activeSubTab === 'all' ? 'bg-[#1e3a1e] text-white shadow-sm' : 'bg-transparent text-slate-500 hover:text-slate-900'}`}
          onClick={() => { setActiveSubTab('all'); }}
        >
          All risk levels
        </button>
        <button 
          className={`px-4 py-2 border-none rounded-lg text-[13.5px] font-bold transition-all duration-200 cursor-pointer ${activeSubTab === 'high' ? 'bg-[#1e3a1e] text-white shadow-sm' : 'bg-transparent text-slate-500 hover:text-slate-900'}`}
          onClick={() => { setActiveSubTab('high'); }}
        >
          High risk
        </button>
        <button 
          className={`px-4 py-2 border-none rounded-lg text-[13.5px] font-bold transition-all duration-200 cursor-pointer ${activeSubTab === 'medium' ? 'bg-[#1e3a1e] text-white shadow-sm' : 'bg-transparent text-slate-500 hover:text-slate-900'}`}
          onClick={() => { setActiveSubTab('medium'); }}
        >
          Medium risk
        </button>
        <button 
          className={`px-4 py-2 border-none rounded-lg text-[13.5px] font-bold transition-all duration-200 cursor-pointer ${activeSubTab === 'zones' ? 'bg-[#1e3a1e] text-white shadow-sm' : 'bg-transparent text-slate-500 hover:text-slate-900'}`}
          onClick={() => { setActiveSubTab('zones'); }}
        >
          Flood zones
        </button>
        <button 
          className={`px-4 py-2 border-none rounded-lg text-[13.5px] font-bold transition-all duration-200 cursor-pointer ${activeSubTab === 'waterlogging' ? 'bg-[#1e3a1e] text-white shadow-sm' : 'bg-transparent text-slate-500 hover:text-slate-900'}`}
          onClick={() => { setActiveSubTab('waterlogging'); }}
        >
          Waterlogging
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-10 items-start">
        {/* Left Map Panel */}
        <div className="bg-white border border-slate-200 rounded-[24px] p-6 shadow-sm">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3.5 mb-5">
            <h4 className="text-base font-bold text-slate-900 m-0">Bengaluru flood risk map</h4>
            <span className="text-xs text-slate-400 font-medium">Last updated Jan 2025</span>
          </div>

          <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-3 overflow-hidden shadow-inner flex justify-center items-center">
            <svg viewBox="0 0 240 180" className="w-full max-w-[480px] h-auto block">
              {/* Outer boundary polygon from screenshot (light green shading) */}
              <polygon 
                points="80,20 140,25 180,50 200,80 185,120 160,150 110,165 70,145 50,110 45,70 55,40" 
                className="fill-emerald-100/50 stroke-emerald-200 stroke-[1.5] transition-all duration-300"
              />

              {/* Water Bodies (Blue Circles) */}
              {activeSubTab === 'waterlogging' || activeSubTab === 'all' ? (
                WATER_BODIES.map((lake, idx) => (
                  <circle 
                    key={idx}
                    cx={lake.cx}
                    cy={lake.cy}
                    r={lake.r}
                    className="fill-blue-500 stroke-blue-600 stroke-1 fill-opacity-85 origin-center animate-[lakePulse_3s_infinite_ease-in-out]"
                    style={{ transformOrigin: `${lake.cx}px ${lake.cy}px` }}
                    title={lake.name}
                  />
                ))
              ) : null}

              {/* Risk Zones Group */}
              {RISK_ZONES.map((zone) => {
                const visible = isZoneFiltered(zone);
                const isSelected = selectedZone?.id === zone.id;
                
                return (
                  <g 
                    key={zone.id} 
                    className={`cursor-pointer transition-all duration-250 ${visible ? 'opacity-100' : 'opacity-15 pointer-events-none'}`}
                    onClick={() => visible && handleZoneClick(zone)}
                  >
                    <circle 
                      cx={zone.coords.cx}
                      cy={zone.coords.cy}
                      r={zone.coords.r}
                      className={`fill-opacity-30 stroke-2 transition-all duration-250 ${isSelected ? 'fill-opacity-60 stroke-[4px] drop-shadow-md' : 'hover:fill-opacity-50 hover:stroke-[3px]'} ${zone.riskLevel === 'high' ? 'fill-red-500 stroke-red-500' : zone.riskLevel === 'medium' ? 'fill-orange-500 stroke-orange-500' : 'fill-yellow-500 stroke-yellow-500'}`}
                    />
                    <text 
                      x={zone.labelCoords.x} 
                      y={zone.labelCoords.y}
                      className="font-sans text-[7px] font-extrabold fill-slate-700 pointer-events-none tracking-tight"
                      textAnchor="middle"
                      dy=".3em"
                    >
                      {zone.id === 'outer-ring-road' ? 'ORR' : zone.name.split(' ')[0]}
                    </text>
                  </g>
                );
              })}

              {/* Compass Indicator */}
              <g transform="translate(210, 30)" className="pointer-events-none">
                <line x1="0" y1="-12" x2="0" y2="12" stroke="#64748b" strokeWidth="1" />
                <line x1="-12" y1="0" x2="12" y2="0" stroke="#64748b" strokeWidth="1" />
                <polygon points="0,-12 -3,-3 3,-3" fill="#ef4444" />
                <text x="0" y="-16" textAnchor="middle" className="font-sans text-[9px] font-extrabold fill-red-500">N</text>
              </g>
            </svg>
          </div>
        </div>

        {/* Right Info Panel */}
        <div className="lg:sticky lg:top-[100px] w-full">
          {selectedZone ? (
            <div className={`bg-white rounded-[24px] p-8 border border-slate-200 shadow-sm flex flex-col gap-5 border-t-[6px] ${selectedZone.riskLevel === 'high' ? 'border-t-red-500' : selectedZone.riskLevel === 'medium' ? 'border-t-orange-500' : 'border-t-yellow-500'}`}>
              <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                <h3 className="text-lg font-bold text-slate-900 m-0 tracking-tight">{selectedZone.name}</h3>
                <span className={`text-[9px] font-extrabold tracking-wider px-2.5 py-1 rounded uppercase ${selectedZone.riskLevel === 'high' ? 'bg-red-100 text-red-500' : selectedZone.riskLevel === 'medium' ? 'bg-orange-100 text-orange-500' : 'bg-yellow-100 text-yellow-600'}`}>
                  {selectedZone.riskClass}
                </span>
              </div>

              <div className="flex flex-col gap-5">
                <p className="text-[13.5px] leading-relaxed text-slate-500 m-0 text-left">{selectedZone.details}</p>
                
                <div className="flex flex-col gap-2.5 bg-slate-50 p-4 border border-slate-200 rounded-xl">
                  <div className="flex justify-between items-center text-xs md:text-sm">
                    <span className="text-slate-500 font-medium">Wards Affected:</span>
                    <strong className="text-slate-900 font-semibold">{selectedZone.wardsCount} Wards</strong>
                  </div>
                  <div className="flex justify-between items-center text-xs md:text-sm">
                    <span className="text-slate-500 font-medium">BGG Interventions:</span>
                    <strong className="text-slate-900 font-semibold">{selectedZone.activeInterventions} Sites</strong>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <h5 className="text-xs font-bold text-slate-500 m-0 uppercase tracking-wider text-left">🛡️ Risk Management Strategy</h5>
                  <ul className="margin-0 pl-[18px] flex flex-col gap-1.5 text-left list-disc">
                    {selectedZone.riskLevel === 'high' ? (
                      <>
                        <li className="text-sm text-slate-500 leading-normal">Enforcement of 30m buffer zones around buffer water bodies.</li>
                        <li className="text-sm text-slate-500 leading-normal">Expansion of storm canals and Rajakaluve desilting.</li>
                        <li className="text-sm text-slate-500 leading-normal">Real-time telemetry integration for emergency sluice gates.</li>
                      </>
                    ) : selectedZone.riskLevel === 'medium' ? (
                      <>
                        <li className="text-sm text-slate-500 leading-normal">Deploying roadside bioswales to catch road runoffs.</li>
                        <li className="text-sm text-slate-500 leading-normal">Adding shallow filtration shafts on sidewalk sidewalks.</li>
                        <li className="text-sm text-slate-500 leading-normal">Community co-management and silt traps at inflows.</li>
                      </>
                    ) : (
                      <>
                        <li className="text-sm text-slate-500 leading-normal">Bi-annual drain desilting prior to monsoon seasons.</li>
                        <li className="text-sm text-slate-500 leading-normal">Adding tree trenches to absorb local sidewalk sheetflows.</li>
                      </>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white border-1.5 border-dashed border-slate-300 rounded-[24px] p-8 text-center text-slate-400 text-sm">
              <p className="m-0">Click on any risk zone or water body on the map to review localized risk details and management strategies.</p>
            </div>
          )}
        </div>
      </div>

      {/* Risk Metrics Cards Panel matching the screenshot */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-3">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-center gap-1.5 text-center shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 border-b-4 border-b-red-500">
          <span className="text-3xl font-black leading-none text-red-500">42</span>
          <span className="text-[13px] font-semibold text-slate-500">High risk wards</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-center gap-1.5 text-center shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 border-b-4 border-b-orange-500">
          <span className="text-3xl font-black leading-none text-orange-500">71</span>
          <span className="text-[13px] font-semibold text-slate-500">Medium risk wards</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-center gap-1.5 text-center shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 border-b-4 border-b-indigo-500">
          <span className="text-3xl font-black leading-none text-indigo-600">247</span>
          <span className="text-[13px] font-semibold text-slate-500">Active interventions</span>
        </div>
      </div>
    </div>
  );
};

export default FloodRiskMap;
