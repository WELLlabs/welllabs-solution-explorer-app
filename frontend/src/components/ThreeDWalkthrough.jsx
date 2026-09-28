import React, { useState, useEffect } from "react";

const ThreeDWalkthrough = ({ project }) => {
  const [activeAsset, setActiveAsset] = useState(null);
  const [toggledAssets, setToggledAssets] = useState({});
  const [walkStep, setWalkStep] = useState(0);
  const [isWalking, setIsWalking] = useState(false);

  const projectConfig = {
    kadugodi_park: {
      assets: [
        {
          id: "bioretention",
          name: "Bioretention Basins",
          area: 100,
          infiltration: 13180,
          storage: 29590,
          color: "#3b82f6",
          icon: "🌧️",
          x: 80,
          y: 70,
          z: 20,
        },
        {
          id: "infiltration",
          name: "Infiltration Drains",
          area: 720,
          infiltration: 3234096,
          storage: 0,
          color: "#8b5cf6",
          icon: "💧",
          x: 180,
          y: 110,
          z: 10,
        },
        {
          id: "raingarden",
          name: "Rain Gardens",
          area: 320,
          infiltration: 641792,
          storage: 153632,
          color: "#10b981",
          icon: "🌱",
          x: 120,
          y: 150,
          z: 15,
        },
        {
          id: "swale",
          name: "Bioswales",
          area: 450,
          infiltration: 30015,
          storage: 2115,
          color: "#eab308",
          icon: "🌿",
          x: 230,
          y: 90,
          z: 8,
        },
      ],
      runoffNo: 66.4,
      runoffWith: 64.5,
      reductionPct: 3.0,
      infilNo: 20.3,
      infilWith: 22.1,
      infilIncreasePct: 8.9,
    },
    hoodi_lake: {
      assets: [
        {
          id: "detention",
          name: "Detention Silt Tanks",
          area: 100,
          infiltration: 1690,
          storage: 17280,
          color: "#3b82f6",
          icon: "📥",
          x: 70,
          y: 90,
          z: 30,
        },
        {
          id: "infiltration",
          name: "Infiltration Trench Field",
          area: 450,
          infiltration: 141255,
          storage: 0,
          color: "#8b5cf6",
          icon: "💧",
          x: 150,
          y: 160,
          z: 15,
        },
        {
          id: "raingarden",
          name: "Forebay Rain Gardens",
          area: 240,
          infiltration: 30264,
          storage: 33600,
          color: "#10b981",
          icon: "🌱",
          x: 220,
          y: 120,
          z: 15,
        },
        {
          id: "swale",
          name: "Catchment Bioswales",
          area: 400,
          infiltration: 9320,
          storage: 60,
          color: "#eab308",
          icon: "🌿",
          x: 260,
          y: 60,
          z: 10,
        },
      ],
      runoffNo: 51.94,
      runoffWith: 51.41,
      reductionPct: 1.0,
      infilNo: 7.88,
      infilWith: 8.41,
      infilIncreasePct: 6.73,
    },
    sheelavanthakere_lake: {
      assets: [
        {
          id: "bund_trench",
          name: "Bund Infiltration Trench",
          area: 300,
          infiltration: 1200000,
          storage: 45000,
          color: "#3b82f6",
          icon: "💧",
          x: 100,
          y: 130,
          z: 20,
        },
        {
          id: "park_raingarden",
          name: "Park Rain Gardens",
          area: 180,
          infiltration: 450000,
          storage: 50000,
          color: "#10b981",
          icon: "🌱",
          x: 160,
          y: 70,
          z: 15,
        },
        {
          id: "park_swale",
          name: "Park Bioswales",
          area: 120,
          infiltration: 150000,
          storage: 0,
          color: "#eab308",
          icon: "🌿",
          x: 220,
          y: 150,
          z: 10,
        },
      ],
      runoffNo: 60.5,
      runoffWith: 59.0,
      reductionPct: 2.5,
      infilNo: 18.5,
      infilWith: 19.8,
      infilIncreasePct: 7.2,
    },
  };

  const config = projectConfig[project.id];
  if (!config) return null;

  // Initialize toggles
  useEffect(() => {
    const initialToggles = {};
    config.assets.forEach((a) => {
      initialToggles[a.id] = true;
    });
    setToggledAssets(initialToggles);
    setActiveAsset(config.assets[0]);
  }, [project.id]);

  const walkingPathPoints = [
    { x: 40, y: 140 },
    { x: 90, y: 100 },
    { x: 140, y: 110 },
    { x: 180, y: 140 },
    { x: 220, y: 110 },
    { x: 270, y: 130 },
  ];

  // Walking path animation loop
  useEffect(() => {
    let timer;
    if (isWalking) {
      timer = setInterval(() => {
        setWalkStep((prev) => (prev + 1) % walkingPathPoints.length);
      }, 1500);
    }
    return () => clearInterval(timer);
  }, [isWalking]);

  const handleToggleAsset = (id) => {
    setToggledAssets((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const totalAssetsCount = config.assets.length;
  const activeAssetsCount = Object.values(toggledAssets).filter(Boolean).length;
  const activeFraction =
    totalAssetsCount > 0 ? activeAssetsCount / totalAssetsCount : 0;

  const liveInfiltration = config.assets.reduce((sum, a) => {
    return sum + (toggledAssets[a.id] ? a.infiltration : 0);
  }, 0);
  const liveStorage = config.assets.reduce((sum, a) => {
    return sum + (toggledAssets[a.id] ? a.storage : 0);
  }, 0);

  const liveRunoffReduction = (config.reductionPct * activeFraction).toFixed(2);
  const liveInfilIncrease = (config.infilIncreasePct * activeFraction).toFixed(
    2,
  );

  const fmtL = (liters) => {
    if (liters >= 1e6) return (liters / 1e6).toFixed(2) + "M L";
    if (liters >= 1e3) return (liters / 1e3).toFixed(1) + "k L";
    return liters + " L";
  };

  return (
    <div className="mt-3 flex flex-col gap-4">
      <div className="relative border border-slate-300 rounded-xl p-2 bg-[#f8fafc] shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]">
        <svg
          viewBox="0 0 320 220"
          className="w-full h-[200px] bg-gradient-to-b from-[#f1f5f9] to-[#cbd5e1] rounded-lg block"
        >
          <g stroke="#94a3b8" strokeWidth="0.5" opacity="0.3">
            {Array.from({ length: 12 }).map((_, i) => (
              <line key={i} x1={0} y1={i * 20} x2={320} y2={i * 20 + 80} />
            ))}
            {Array.from({ length: 12 }).map((_, i) => (
              <line key={i} x1={i * 30} y1={0} x2={i * 30 - 100} y2={220} />
            ))}
          </g>

          <path
            d="M 80 120 Q 140 90 200 110 Q 260 130 220 160 Q 120 170 80 120 Z"
            fill="#93c5fd"
            opacity="0.6"
            stroke="#3b82f6"
            strokeWidth="1.5"
          />

          <path
            d={`M ${walkingPathPoints.map((p) => `${p.x} ${p.y}`).join(" L ")}`}
            fill="none"
            stroke="#475569"
            strokeWidth="2"
            strokeDasharray="4 4"
            opacity="0.8"
          />

          <circle
            cx={walkingPathPoints[walkStep].x}
            cy={walkingPathPoints[walkStep].y}
            r="6"
            fill="#f59e0b"
            stroke="#ffffff"
            strokeWidth="1.5"
            className="walker-pulse"
          />

          {config.assets.map((a) => {
            const isEnabled = toggledAssets[a.id];
            const isActive = activeAsset && activeAsset.id === a.id;
            return (
              <g
                key={a.id}
                transform={`translate(${a.x}, ${a.y})`}
                onClick={() => setActiveAsset(a)}
                style={{ cursor: "pointer" }}
              >
                <path
                  d={`M -8 0 L -8 -${a.z} L 8 -${a.z} L 8 0 Z`}
                  fill={isEnabled ? a.color : "#94a3b8"}
                  opacity={isActive ? 0.95 : 0.75}
                  stroke="#ffffff"
                  strokeWidth="1"
                />
                <ellipse
                  cx="0"
                  cy={`-${a.z}`}
                  rx="8"
                  ry="4"
                  fill={isEnabled ? a.color : "#cbd5e1"}
                  opacity="0.9"
                  stroke="#ffffff"
                  strokeWidth="1"
                />
                <ellipse
                  cx="0"
                  cy="0"
                  rx="8"
                  ry="4"
                  fill={isEnabled ? a.color : "#94a3b8"}
                  opacity="0.4"
                />
                <text
                  x="0"
                  y={`-${a.z + 5}`}
                  textAnchor="middle"
                  fontSize="10"
                  fill="#1e293b"
                  fontWeight="bold"
                >
                  {a.icon}
                </text>
              </g>
            );
          })}
        </svg>

        <div className="flex gap-2 mt-2">
          <button
            className={`flex-1 py-1.5 px-3 text-[11px] font-bold rounded-lg cursor-pointer transition-all duration-200 ${isWalking ? "bg-transparent text-slate-700 border border-slate-300 hover:bg-slate-100/60" : "bg-blue-600 text-white border border-blue-700/20 hover:bg-blue-700 shadow-sm"}`}
            onClick={() => setIsWalking(!isWalking)}
          >
            {isWalking ? "⏸️ Pause Walk" : "🚶 Start 3D Tour"}
          </button>
          <button
            className="py-1.5 px-3 text-[11px] font-bold text-slate-700 bg-transparent border border-slate-300 hover:bg-slate-100/60 rounded-lg cursor-pointer transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => {
              setWalkStep(0);
              setIsWalking(false);
            }}
            disabled={!isWalking && walkStep === 0}
          >
            🔄 Reset
          </button>
        </div>
      </div>

      <div className="mt-4">
        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">
              Buffer Assets
            </span>
            <div className="flex flex-col gap-1.5">
              {config.assets.map((a) => (
                <label
                  key={a.id}
                  className="flex items-center gap-1.5 text-[11.5px] cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={!!toggledAssets[a.id]}
                    onChange={() => handleToggleAsset(a.id)}
                    style={{ accentColor: a.color }}
                  />
                  <span
                    className={`transition-all ${toggledAssets[a.id] ? "no-underline text-slate-700" : "line-through text-slate-400"}`}
                  >
                    {a.name}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="bg-[#f8fafc] border border-slate-200 rounded-lg p-2.5">
            {activeAsset ? (
              <>
                <strong
                  style={{ color: activeAsset.color }}
                  className="text-xs block"
                >
                  {activeAsset.icon} {activeAsset.name}
                </strong>
                <span className="text-[11px] text-slate-500 block my-1">
                  Size: <strong>{activeAsset.area} sqm</strong>
                </span>
                <div className="flex flex-col gap-0.5 text-[11px] border-t border-dashed border-slate-200 pt-1.5">
                  <div>
                    Infil: <strong>{fmtL(activeAsset.infiltration)}</strong>
                  </div>
                  <div>
                    Storage: <strong>{fmtL(activeAsset.storage)}</strong>
                  </div>
                </div>
              </>
            ) : (
              <span className="text-[11px] text-slate-400 italic block text-center mt-2.5">
                Select an asset to view details.
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 p-3 bg-[#0c2a2e] text-[#dfeae6] rounded-lg">
        <strong className="text-[11.5px] text-white block border-b border-[#244a4d] pb-1.5 mb-2">
          📊 Simulated Watershed Benefit Metrics
        </strong>
        <div className="grid grid-cols-2 gap-2 text-[11.5px]">
          <div>
            <span className="text-[#8fb3ad] block text-[9px] uppercase">
              Infiltration Gain
            </span>
            <strong className="text-[#5bc8b8] text-[14.5px]">
              {fmtL(liveInfiltration)}
            </strong>
          </div>
          <div>
            <span className="text-[#8fb3ad] block text-[9px] uppercase">
              Storage Buffer
            </span>
            <strong className="text-[#5bc8b8] text-[14.5px]">
              {fmtL(liveStorage)}
            </strong>
          </div>
          <div>
            <span className="text-[#8fb3ad] block text-[9px] uppercase">
              Runoff Reduction
            </span>
            <strong className="text-[#5bc8b8] text-[14.5px]">
              {liveRunoffReduction}%
            </strong>
          </div>
          <div>
            <span className="text-[#8fb3ad] block text-[9px] uppercase">
              Infil Increase
            </span>
            <strong className="text-[#5bc8b8] text-[14.5px]">
              {liveInfilIncrease}%
            </strong>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThreeDWalkthrough;
