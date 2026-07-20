import React from 'react';

const BggIntroduction = ({ onNavigateToCase, onSetActiveTab }) => {
  const shockingNews = [
    {
      id: 'singapore',
      title: 'Singapore: ABC Waters Programme',
      description: "Reducing flood risk systematically. Facing limited reservoir space, Singapore converted concrete canals into natural floodplains, reducing flood-prone areas by 48%.",
      highlightText: 'ABC Waters Programme',
      targetCaseTitle: 'Singapore: ABC Waters Programme',
      metrics: [
        { value: '48%', label: 'Risk Area Reduced' },
        { value: '22-63%', label: 'Runoff Reduction' },
        { value: '30 min', label: 'Discharge Delay' },
        { value: '60+', label: 'Projects Built' }
      ]
    },
    {
      id: 'copenhagen',
      title: 'Copenhagen: Cloudburst Plan',
      description: 'Designing for extreme events. Following an €800M damage storm in 2011, Copenhagen redesigned streets and plazas to absorb and store stormwater, saving €200M+ over pipes.',
      highlightText: 'Cloudburst Plan',
      targetCaseTitle: 'Copenhagen: Cloudburst Plan',
      metrics: [
        { value: '€800M', label: 'Storm Damage' },
        { value: '€1.5B', label: 'Total Investment' },
        { value: '€200M+', label: 'Estimated Savings' },
        { value: '300', label: 'Projects Planned' }
      ]
    },
    {
      id: 'rotterdam',
      title: 'Rotterdam: Room for the River',
      description: 'Redesigning rivers for resilience. Relocating dikes inland and lowering floodplains allowed the Rhine to swell safely from 12,000 to 16,000 m³/sec capacity without disaster.',
      highlightText: 'Room for the River',
      targetCaseTitle: 'Rotterdam: Room for the River',
      metrics: [
        { value: '€2.3B', label: 'Total Investment' },
        { value: '30+', label: 'Locations on 4 Rivers' },
        { value: '16K m³/s', label: 'Discharge Capacity' },
        { value: '2023', label: 'Saved from Flood' }
      ]
    }
  ];

  const bangaloreStats = [
    { value: '1,400 mm', label: 'rainfall in 2022 (vs 970 mm avg)' },
    { value: '5 of 7', label: 'Years since 2015 had excess rainfall' },
    { value: '131.6 mm', label: 'in 12 hours (2022)' },
    { value: '↑30%', label: 'Increase in extreme rainfall events' }
  ];

  const interventions = [
    { icon: '💧', name: 'Recharge wells', desc: 'Infiltrate stormwater to restore groundwater' },
    { icon: '🌸', name: 'Bioswales', desc: 'Filter and slow stormwater flow' },
    { icon: '🌳', name: 'Urban forests', desc: 'Intercept rain, cool the city' },
    { icon: '🌊', name: 'Lake restoration', desc: 'Rejuvenate water bodies as recharge zones' }
  ];

  return (
    <div className="flex flex-col gap-12 animate-[fadeIn_0.5s_ease-out_forwards]">
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

      {/* Hero Header Section */}
      <div className="px-6 py-12 md:px-10 rounded-[20px] bg-gradient-to-br from-[#eef2ff] to-[#e0e7ff] border border-indigo-200 shadow-[0_4px_16px_rgba(99,102,241,0.06)] flex flex-col items-center text-center gap-7">
        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 m-0 leading-tight tracking-tight">Bangalore is flooding. Every monsoon season.</h1>
        <p className="text-base text-slate-600 leading-relaxed max-w-[900px] mx-auto m-0">
          In 2022, the city received 1,400 mm of rainfall—50% above normal. 131.6 mm fell in just 12 hours. 
          Inadequate drainage, encroached water bodies, and rapid urbanization are pushing Bangalore toward a water crisis.
        </p>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-3 w-full">
          {bangaloreStats.map((stat, idx) => (
            <div key={idx} className="bg-white border border-slate-200 rounded-[18px] p-6 flex flex-col gap-2 text-left hover:bg-slate-50/60 hover:-translate-y-1 hover:shadow-lg hover:border-slate-300 transition-all duration-300">
              <div className="text-[32px] font-extrabold text-[#6f69dc] leading-none">{stat.value}</div>
              <div className="text-[12.5px] text-slate-500 font-medium leading-normal">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Platform Overview */}
      <div className="bg-white/70 backdrop-blur-md border border-white/50 rounded-3xl p-8 md:p-10 flex flex-col gap-9 shadow-[0_8px_32px_0_rgba(31,38,135,0.04)]">
        <div className="flex justify-center items-center text-center">
          <div className="max-w-[800px] mx-auto">
            <h2 className="text-xl md:text-2xl font-extrabold text-slate-900 mb-2 tracking-tight">Bangalore's flood problem has a blueprint. Blue-green-grey infrastructure, modeled and costed for our city.</h2>
          </div>
        </div>

        {/* Separated Platform Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white border border-slate-200 rounded-[20px] p-7 flex flex-col gap-4 shadow-sm hover:-translate-y-1 hover:shadow-indigo-500/10 hover:shadow-xl hover:border-indigo-500 transition-all duration-300 text-left">
            <div className="flex items-center gap-2.5">
              <div className="text-2xl w-11 h-11 flex items-center justify-center bg-slate-50 border border-slate-100 rounded-xl shrink-0">🔍</div>
              <h3 className="text-base font-bold text-slate-900 m-0">Automated Suitability</h3>
            </div>
            <p className="text-[13.5px] text-slate-500 leading-relaxed m-0">Analyze optimal locations for BGG interventions using gap analysis and flood risk maps.</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-[20px] p-7 flex flex-col gap-4 shadow-sm hover:-translate-y-1 hover:shadow-indigo-500/10 hover:shadow-xl hover:border-indigo-500 transition-all duration-300 text-left">
            <div className="flex items-center gap-2.5">
              <div className="text-2xl w-11 h-11 flex items-center justify-center bg-slate-50 border border-slate-100 rounded-xl shrink-0">🧮</div>
              <h3 className="text-base font-bold text-slate-900 m-0">Design Calculator</h3>
            </div>
            <p className="text-[13.5px] text-slate-500 leading-relaxed m-0">Estimate site-specific construction costs and run hydrological simulation designs.</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-[20px] p-7 flex flex-col gap-4 shadow-sm hover:-translate-y-1 hover:shadow-indigo-500/10 hover:shadow-xl hover:border-indigo-500 transition-all duration-300 text-left">
            <div className="flex items-center gap-2.5">
              <div className="text-2xl w-11 h-11 flex items-center justify-center bg-slate-50 border border-slate-100 rounded-xl shrink-0">📊</div>
              <h3 className="text-base font-bold text-slate-900 m-0">Real-Time Tracking</h3>
            </div>
            <p className="text-[13.5px] text-slate-500 leading-relaxed m-0">Track live water table levels, ward-wise flood impacts, and local telemetry dashboards.</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-[20px] p-7 flex flex-col gap-4 shadow-sm hover:-translate-y-1 hover:shadow-indigo-500/10 hover:shadow-xl hover:border-indigo-500 transition-all duration-300 text-left">
            <div className="flex items-center gap-2.5">
              <div className="text-2xl w-11 h-11 flex items-center justify-center bg-slate-50 border border-slate-100 rounded-xl shrink-0">🤝</div>
              <h3 className="text-base font-bold text-slate-900 m-0">Collaborative Network</h3>
            </div>
            <p className="text-[13.5px] text-slate-500 leading-relaxed m-0">Connect government bodies, researchers, field implementers, and CSR funding partners.</p>
          </div>
        </div>
      </div>

      {/* What is this platform? Section */}
      <div className="bg-white/70 backdrop-blur-md border border-white/50 rounded-3xl p-8 md:p-10 shadow-[0_8px_32px_0_rgba(31,38,135,0.04)]">
        <div className="grid grid-cols-1 md:grid-cols-[1.5fr_1fr] gap-10 items-center">
          <div className="flex flex-col gap-5 text-left">
            <h2 className="text-2xl font-extrabold text-slate-900 mb-2 tracking-tight text-left">What is Solutions Explorer?</h2>
            <p className="text-base text-slate-700 leading-relaxed m-0">
              A data-driven decision support system for designing, implementing, and tracking blue-green-grey interventions at city scale.
            </p>
            <p className="text-base text-slate-700 leading-relaxed m-0">
              Get flood risk maps, automated BGG designs, cost estimates, and real-time dashboards showing impact across your city.
            </p>
            <p className="text-base text-slate-700 leading-relaxed m-0">
              Connect government, CSR partners, implementers, researchers, and donors around a shared vision for urban water resilience.
            </p>
          </div>
          <div className="flex justify-center items-center md:order-none order-first">
            <div className="text-[80px] drop-shadow-[0_10px_15px_rgba(0,0,0,0.05)] animate-[floatIcon_4s_ease-in-out_infinite]">🗺️</div>
          </div>
        </div>
      </div>

      {/* What is BGG? Section */}
      <div className="bg-white/70 backdrop-blur-md border border-white/50 rounded-3xl p-8 md:p-10 shadow-[0_8px_32px_0_rgba(31,38,135,0.04)]">
        <h2 className="text-2xl font-extrabold text-slate-900 mb-2 tracking-tight text-center">What is BGG?</h2>
        <p className="text-base text-slate-500 leading-relaxed max-w-[800px] mx-auto mt-2 text-center">
          Blue-Green-Grey combines natural green spaces with grey infrastructure to solve urban flooding.
        </p>

        {/* Separated BGG Definition Pills */}
        <div className="flex justify-center gap-5 my-8 flex-wrap">
          <div className="flex items-center px-5 py-3 rounded-full text-sm font-medium border border-blue-200 bg-white hover:-translate-y-0.5 hover:shadow-md transition-all duration-200">
            <span className="w-2.5 h-2.5 rounded-full mr-3 bg-blue-500 shadow-[0_0_0_3px_rgba(59,130,246,0.2)]"></span>
            <strong className="text-blue-600">Blue</strong>
            <span className="mx-2.5 text-slate-300">—</span>
            <span className="text-slate-600">Water bodies and wetlands</span>
          </div>

          <div className="flex items-center px-5 py-3 rounded-full text-sm font-medium border border-emerald-200 bg-white hover:-translate-y-0.5 hover:shadow-md transition-all duration-200">
            <span className="w-2.5 h-2.5 rounded-full mr-3 bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.2)]"></span>
            <strong className="text-emerald-600">Green</strong>
            <span className="mx-2.5 text-slate-300">—</span>
            <span className="text-slate-600">Vegetation and permeable surfaces</span>
          </div>

          <div className="flex items-center px-5 py-3 rounded-full text-sm font-medium border border-slate-200 bg-white hover:-translate-y-0.5 hover:shadow-md transition-all duration-200">
            <span className="w-2.5 h-2.5 rounded-full mr-3 bg-slate-500 shadow-[0_0_0_3px_rgba(100,116,139,0.2)]"></span>
            <strong className="text-slate-600">Grey</strong>
            <span className="mx-2.5 text-slate-300">—</span>
            <span className="text-slate-600">Engineered stormwater systems working together</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
          {interventions.map((item, idx) => (
            <div key={idx} className="bg-white/60 border border-slate-200 rounded-[20px] p-6 flex flex-col items-center text-center gap-3 hover:bg-white hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/5 hover:border-indigo-500 transition-all duration-300">
              <div className="text-3xl w-12 h-12 flex items-center justify-center bg-slate-50 rounded-xl border border-slate-100 shrink-0">{item.icon}</div>
              <h4 className="text-base font-bold text-slate-900 m-0">{item.name}</h4>
              <p className="text-[13px] text-slate-500 leading-relaxed m-0">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Shocking News / Global Case Studies Section */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col items-center text-center mb-6">
          <h2 className="text-2xl font-extrabold text-slate-900 mb-2 tracking-tight">How cities around the world solved flooding</h2>
          <p className="text-base text-slate-500 leading-relaxed max-w-[800px] mx-auto mt-2">
            Click any case study to expand.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-7">
          {shockingNews.map((news) => (
            <div key={news.id} className="bg-white border border-slate-200 rounded-[20px] p-7 flex flex-col relative hover:border-amber-400 hover:shadow-xl hover:shadow-amber-500/5 hover:-translate-y-0.5 transition-all duration-300 text-left">
              <div className="absolute top-7 right-7 text-[9px] font-extrabold text-amber-800 bg-amber-100 px-2 py-1 rounded-md tracking-wider uppercase">GLOBAL CASE</div>
              <h3 className="text-lg font-bold text-slate-900 m-0 mb-3.5 pr-12 leading-snug">{news.title}</h3>
              <p className="text-[13.5px] leading-relaxed text-slate-600 mb-6 flex-1">{news.description}</p>
              
              {/* 2x2 Metrics Grid in News Card */}
              <div className="grid grid-cols-2 gap-3 mb-5 p-3 bg-slate-50 border border-slate-100 rounded-xl">
                {news.metrics.map((m, mIdx) => (
                  <div key={mIdx} className="flex flex-col gap-0.5 text-left">
                    <span className="text-base font-black text-indigo-600">{m.value}</span>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider leading-none">{m.label}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-3 border-t border-dashed border-slate-200 pt-4 text-left">
                <span className="text-[11px] font-bold text-indigo-500">{news.highlightText}</span>
                <button 
                  className="flex items-center justify-center py-2.5 px-4 bg-slate-50 border border-slate-200 text-slate-800 hover:bg-indigo-600 hover:border-indigo-600 hover:text-white rounded-lg text-xs font-semibold cursor-pointer transition-all duration-200"
                  onClick={() => onNavigateToCase(news.targetCaseTitle)}
                >
                  Read More
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginLeft: '6px' }}>
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Call to Action */}
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
  );
};

export default BggIntroduction;
