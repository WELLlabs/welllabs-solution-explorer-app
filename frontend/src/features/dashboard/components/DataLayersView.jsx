import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import api from "@/shared/config/api";
import NewProjectsView, {
  normaliseProject,
  preprocessProject,
} from "./NewProjectsView";
import Interventions from "@/features/casestudies/components/Interventions";

import { TourProvider } from "@/shared/tour/TourGuide";
import { MAP_TOUR_STEPS } from "@/shared/tour/MapPage";

// Fallback local datasets
import localProjects from "@/data/projects.json";
import localWells from "@/data/wells.json";
import fallbackSites from "@/data/fallbackSites.json";
import v1WellsCsv from "@/data/v1_wells_with_wards.csv?raw";
import v1ProjectsCsv from "@/data/v1_projects_with_wards.csv?raw";
import { getProjectImage } from "@/data/projectImages";
import floodPointsGeo from "@/data/flood_points.json";
import gbaCorporationsGeo from "@/data/gba_corporations.json";

// Modularized components and helpers
import {
  SITE_TYPOLOGY_OPTIONS,
  INTERVENTION_TYPOLOGY_OPTIONS,
  NEW_PROJECTS_DATA,
  FLOOD_SPOTS_DATA,
  WATERSHEDS_POLYGONS,
} from "../utils/constants";
import { parseCSV, pointInPolygon, getCorporationForPoint } from "../utils/geoUtils";
import {
  normalizeProject,
  normalizeWell,
  getProjectCategoryInfo,
  getProjectColor,
  getWellColor,
} from "../utils/projectHelpers";

import LayerControlSidebar from "./map/LayerControlSidebar";
import MapBoundarySearch from "./map/MapBoundarySearch";
import ItemDetailsPane from "./map/ItemDetailsPane";
import FundingDeckPanel from "./map/FundingDeckPanel";
import FunderModal from "./map/FunderModal";
import useBoundaryLayers from "../hooks/useBoundaryLayers";

// Re-export for external consumers / backwards compatibility
export { SITE_TYPOLOGY_OPTIONS, INTERVENTION_TYPOLOGY_OPTIONS } from "../utils/constants";
export { getCorporationForPoint } from "../utils/geoUtils";

const DataLayersView = () => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersLayerGroupRef = useRef(null);
  const projectMarkersRef = useRef({});
  const navigate = useNavigate();

  const [activeDetailView, setActiveDetailView] = useState(null); // { type: 'site' | 'intervention', id: string }

  const handleBackToMap = () => {
    setActiveDetailView(null);
    setTimeout(() => {
      if (mapRef.current) {
        mapRef.current.invalidateSize();
      }
    }, 100);
  };

  useEffect(() => {
    window.openSiteDetailInPlace = (siteId) => {
      setActiveDetailView({ type: "site", id: siteId });
    };
    window.openInterventionDetailInPlace = () => {
      setActiveDetailView({ type: "intervention", id: null });
    };
    return () => {
      delete window.openSiteDetailInPlace;
      delete window.openInterventionDetailInPlace;
    };
  }, []);

  // Datasets
  const [projects, setProjects] = useState([]);
  const [wells, setWells] = useState([]);
  const [loading, setLoading] = useState(true);

  // Live sites from /api/sites (the new SiteProject + Intervention data)
  const [sitesData, setSitesData] = useState([]);

  useEffect(() => {
    api.get('/sites')
      .then((res) => {
        const data = res.data;
        if (Array.isArray(data) && data.length > 0) {
          console.log(
            `%c🗺️ [SITES LAYER] Loaded ${data.length} sites`,
            "color:#3b82f6;font-weight:bold;font-size:13px;",
          );
          console.log("All fetched sites details (full list):", data);
          setSitesData(data);
        } else {
          console.warn("Sites API returned empty data, using local fallback dataset");
          setSitesData(fallbackSites);
        }
      })
      .catch((err) => {
        console.warn("Could not load sites layer data from API, using local fallback:", err);
        setSitesData(fallbackSites);
      });
  }, []);

  // Refs for access inside Leaflet event listeners
  const wellsRef = useRef([]);
  const projectsRef = useRef([]);

  useEffect(() => {
    wellsRef.current = wells;
  }, [wells]);

  useEffect(() => {
    projectsRef.current = projects;
  }, [projects]);

  const [dataSource, setDataSource] = useState("API"); // 'API' or 'Local Fallback'

  // Toggle checkboxes (all off by default as requested: "keep the check box off for every one by default")
  const [showWells, setShowWells] = useState(false);
  const [showProjects, setShowProjects] = useState(false);
  const [showWards, setShowWards] = useState(false);
  const [showAssemblyConst2, setShowAssemblyConst2] = useState(false);
  const [showBengaluruAssembly, setShowBengaluruAssembly] = useState(false);
  const [showKarnatakaAssembly, setShowKarnatakaAssembly] = useState(false);
  const [showGbaWards, setShowGbaWards] = useState(false);
  const [showGbaCorporations, setShowGbaCorporations] = useState(false);
  const [showValleys, setShowValleys] = useState(false);
  const [showGreenspaces, setShowGreenspaces] = useState(false);

  // New placeholder layers states
  const [showNewProjects, setShowNewProjects] = useState(false);
  const [showNewFloodRisk, setShowNewFloodRisk] = useState(false);
  const [showFloodingHotspots, setShowFloodingHotspots] = useState(false);

  // Accordion questions state for left sidebar
  const [openSections, setOpenSections] = useState({
    happening: true,
    risks: true,
    groundwater: true,
    projects: true,
  });

  // ── Flood Hotspot Right-Side Projects & Funding Deck State ─────────────────
  const [selectedFundPicks, setSelectedFundPicks] = useState(new Set());
  const [isRightDeckOpen, setIsRightDeckOpen] = useState(true);
  const [showFunderModal, setShowFunderModal] = useState(false);
  const [funderFormData, setFunderFormData] = useState({
    orgName: "",
    csrSector: "Water Security & Flood Mitigation",
    email: "",
    notes: "",
  });
  const [committedPicks, setCommittedPicks] = useState(new Set());
  const [commitSuccess, setCommitSuccess] = useState(false);

  // Lock background scrolling when funder popup is open
  useEffect(() => {
    if (showFunderModal) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [showFunderModal]);

  // Normalize all live site projects for the funding deck
  const cityProjectsList = useMemo(() => {
    if (!sitesData || sitesData.length === 0) return [];
    return sitesData.map((s) => preprocessProject(normaliseProject(s)));
  }, [sitesData]);

  // Active clicked project for the right-side funding & assets deck
  const activeProject = useMemo(() => {
    if (!selectedItem || !selectedItem.isSiteProject) return null;
    return (
      cityProjectsList.find(
        (p) => p.id === selectedItem.site_id || p.id === selectedItem._raw?.site_id
      ) || null
    );
  }, [selectedItem, cityProjectsList]);

  // Compute total funding summary based on funder selections
  const fundSummary = useMemo(() => {
    let totalCost = 0;
    let totalAssets = 0;
    const projectIds = new Set();

    cityProjectsList.forEach((p) => {
      p.assets.forEach((a, idx) => {
        const key = `${p.id}__${idx}`;
        if (selectedFundPicks.has(key)) {
          totalCost += a.cost || 0;
          totalAssets += 1;
          projectIds.add(p.id);
        }
      });
    });

    return {
      totalCost,
      totalAssets,
      projectsCount: projectIds.size,
    };
  }, [cityProjectsList, selectedFundPicks]);

  const toggleFundPick = (projId, assetIdx) => {
    const key = `${projId}__${assetIdx}`;
    setSelectedFundPicks((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleProjectAllAssets = (proj) => {
    if (!proj) return;
    const projKeys = (proj.assets || []).map((_, i) => `${proj.id}__${i}`);
    const allSelected = projKeys.every((k) => selectedFundPicks.has(k));
    setSelectedFundPicks((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        projKeys.forEach((k) => next.delete(k));
      } else {
        projKeys.forEach((k) => next.add(k));
      }
      return next;
    });
  };

  const selectAllAvailableAssets = (targetProj = activeProject) => {
    if (!targetProj) return;
    const projKeys = (targetProj.assets || []).map((_, i) => `${targetProj.id}__${i}`);
    setSelectedFundPicks((prev) => {
      const next = new Set(prev);
      projKeys.forEach((k) => next.add(k));
      return next;
    });
  };

  const clearAllSelections = (targetProj = activeProject) => {
    if (!targetProj) return;
    const projKeys = (targetProj.assets || []).map((_, i) => `${targetProj.id}__${i}`);
    setSelectedFundPicks((prev) => {
      const next = new Set(prev);
      projKeys.forEach((k) => next.delete(k));
      return next;
    });
  };

  const toggleSection = (sectionKey) => {
    setOpenSections((prev) => ({
      ...prev,
      [sectionKey]: !prev[sectionKey],
    }));
  };

  // Layer Boundary Search (Bengaluru Assembly, GBA Wards, GBA Corporations) states & methods
  const [searchLayerItems, setSearchLayerItems] = useState([]);
  const [selectedSearchCategory, setSelectedSearchCategory] = useState("all"); // 'all' | 'assembly' | 'ward' | 'corporation'
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);
  const [selectedBoundaryItem, setSelectedBoundaryItem] = useState(null);
  const selectedBoundaryLayerRef = useRef(null);
  const searchDropdownContainerRef = useRef(null);
  const [locationSearchQuery, setLocationSearchQuery] = useState("");
  const [searchError, setSearchError] = useState(null);

  // Load GeoJSON data for the 3 searchable layers on mount
  useEffect(() => {
    Promise.all([
      import("@/data/assembly_const2/bengaluru_assembly_const.json"),
      import("@/data/gba_wards.json"),
    ])
      .then(([assemblyMod, wardMod]) => {
        const items = [];

        // 1. Bengaluru Assemblies
        if (assemblyMod.default?.features) {
          assemblyMod.default.features.forEach((f, idx) => {
            const props = f.properties || {};
            const name =
              props.AC_NAME ||
              props.ac_name ||
              props.Name ||
              `Assembly ${idx + 1}`;
            const code = props.AC_CODE || props.ac_code || "";
            items.push({
              id: `assembly_${idx}_${name}`,
              name: String(name).trim(),
              category: "assembly",
              categoryLabel: "Bengaluru Assembly",
              categoryColor: "#2563eb",
              categoryBg: "#eff6ff",
              categoryBorder: "#bfdbfe",
              categoryIcon: "",
              subtitle: code ? `AC Code: ${code}` : "Assembly Constituency",
              feature: f,
            });
          });
        }

        // 2. GBA Wards
        if (wardMod.default?.features) {
          wardMod.default.features.forEach((f, idx) => {
            const props = f.properties || {};
            const name = props.wardName || props.Name || `Ward ${idx + 1}`;
            const corp = props.corporation || "";
            const ac = props.ac || "";
            const wardId = props.wardId || "";
            items.push({
              id: `ward_${idx}_${name}`,
              name: String(name).trim(),
              category: "ward",
              categoryLabel: "GBA Ward",
              categoryColor: "#e11d48",
              categoryBg: "#fff1f2",
              categoryBorder: "#fecdd3",
              categoryIcon: "",
              subtitle:
                [
                  corp ? `Corp: ${corp}` : "",
                  ac ? `AC: ${ac}` : "",
                  wardId ? `ID: ${wardId}` : "",
                ]
                  .filter(Boolean)
                  .join(" • ") || "GBA Ward Boundary",
              feature: f,
            });
          });
        }

        // 3. GBA Corporations
        if (gbaCorporationsGeo?.features) {
          gbaCorporationsGeo.features.forEach((f, idx) => {
            const props = f.properties || {};
            const name = props.name || `Corporation ${idx + 1}`;
            const id = props.id || "";
            items.push({
              id: `corp_${idx}_${name}`,
              name: String(name).includes("Corporation")
                ? String(name).trim()
                : `${String(name).trim()} Corporation`,
              category: "corporation",
              categoryLabel: "GBA Corporation",
              categoryColor: "#db2777",
              categoryBg: "#fdf2f8",
              categoryBorder: "#fbcfe8",
              categoryIcon: "",
              subtitle: id ? `Zone ID: ${id}` : "GBA City Corporation Zone",
              feature: f,
            });
          });
        }

        setSearchLayerItems(items);
      })
      .catch((err) =>
        console.error("Error loading searchable boundary layers:", err),
      );
  }, []);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        searchDropdownContainerRef.current &&
        !searchDropdownContainerRef.current.contains(e.target)
      ) {
        setIsSearchDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectBoundaryItem = (item) => {
    if (!mapRef.current || !item.feature) return;

    const map = mapRef.current;
    setSearchError(null);

    // Clear previous selected highlight
    if (selectedBoundaryLayerRef.current) {
      map.removeLayer(selectedBoundaryLayerRef.current);
      selectedBoundaryLayerRef.current = null;
    }

    setSelectedBoundaryItem(item);
    setLocationSearchQuery(item.name);
    setIsSearchDropdownOpen(false);

    const color = item.categoryColor;
    const fillColor = item.categoryBg;

    // Create persistent styled highlight
    const boundaryLayer = L.geoJSON(item.feature, {
      pane: "catchmentsPane",
      style: {
        color: color,
        weight: 3.5,
        opacity: 0.95,
        fillColor: color,
        fillOpacity: 0.18,
        dashArray: "4, 6",
      },
    }).addTo(map);

    boundaryLayer
      .bindPopup(
        `
      <div style="font-family: system-ui, -apple-system, sans-serif; padding: 4px; text-align: left; min-width: 170px;">
        <span style="font-size: 8.5px; font-weight: 800; letter-spacing: 0.5px; padding: 2px 6px; border-radius: 4px; text-transform: uppercase; background-color: ${fillColor}20; color: ${color}; display: inline-block; margin-bottom: 4px;">
          ${item.categoryLabel}
        </span>
        <h4 style="margin: 2px 0 3px 0; font-size: 13.5px; font-weight: 700; color: #0f172a;">${item.name}</h4>
        <p style="margin: 0; font-size: 11px; color: #64748b;">${item.subtitle}</p>
      </div>
    `,
      )
      .openPopup();

    selectedBoundaryLayerRef.current = boundaryLayer;

    try {
      const bounds = boundaryLayer.getBounds();
      if (bounds.isValid()) {
        mapRef.current.flyToBounds(bounds, {
          padding: [50, 50],
          animate: true,
          duration: 1.2,
        });
      }
    } catch (e) {
      console.warn("Could not fit bounds to boundary:", e);
    }
  };

  const handleClearSelectedBoundary = () => {
    if (selectedBoundaryLayerRef.current && mapRef.current) {
      mapRef.current.removeLayer(selectedBoundaryLayerRef.current);
      selectedBoundaryLayerRef.current = null;
    }
    setSelectedBoundaryItem(null);
    setLocationSearchQuery("");
  };

  const filteredSearchItems = searchLayerItems.filter((item) => {
    if (
      selectedSearchCategory !== "all" &&
      item.category !== selectedSearchCategory
    ) {
      return false;
    }
    if (!locationSearchQuery.trim()) {
      return true;
    }
    const q = locationSearchQuery.toLowerCase().trim();
    return (
      item.name.toLowerCase().includes(q) ||
      item.subtitle.toLowerCase().includes(q) ||
      item.categoryLabel.toLowerCase().includes(q)
    );
  });

  const handleLocationSearch = (e) => {
    if (e) e.preventDefault();
    const query = locationSearchQuery.trim();
    if (!query) return;

    if (filteredSearchItems.length > 0) {
      handleSelectBoundaryItem(filteredSearchItems[0]);
    } else {
      setSearchError(
        `No boundary matching "${query}" found in Assemblies, Wards, or Corporations.`,
      );
    }
  };

  // Watershed Explorer & Flood spots states & refs
  const [activeWatershedId, setActiveWatershedId] = useState(null);
  const [activeFloodSpotId, setActiveFloodSpotId] = useState(null);
  const activeWatershedLayerRef = useRef(null);
  const activeLinesLayerRef = useRef(null);

  const handleSelectFloodSpot = (spot) => {
    if (activeFloodSpotId === spot.id) {
      setActiveFloodSpotId(null);
      setActiveWatershedId(null);
    } else {
      setActiveFloodSpotId(spot.id);
      setActiveWatershedId(spot.watershedId);
      if (mapRef.current) {
        mapRef.current.flyTo([spot.lat, spot.lng], 13, {
          animate: true,
          duration: 1,
        });
      }
    }
  };

  // ── Existing Interventions Two Sub-Layers Filter States ─────────
  // Sub-layer 1: Explore by site typology
  // Sub-layer 2: Explore by intervention typology
  const [enableSiteTypologyFilter, setEnableSiteTypologyFilter] = useState(true);
  const [enableInterventionTypologyFilter, setEnableInterventionTypologyFilter] = useState(true);

  // Sub-layer 1 options: Explore by site typology (Park, Lake, Roads enabled; new typologies off by default)
  const [selectedSiteTypologies, setSelectedSiteTypologies] = useState({
    park: true,
    lake: true,
    road: true,
    stormwater_drain: false,
    foreshore: false,
    street_tree_avenue: false,
    residential_building: false,
    institutional_campus: false,
    sewage_treatment_plant: false,
    stream: false,
    floodplain: false,
    recharge_pit: false,
    reservoir: false,
    parking_lot: false,
  });

  // Sub-layer 2 options: Explore by intervention typology (Bioswale, Rain Garden, Detention Basin enabled; new off by default)
  const [selectedInterventionTypologies, setSelectedInterventionTypologies] = useState({
    bioswale: true,
    raingarden: true,
    detention: true,
    infiltration_trench: false,
    percolation: false,
    constructed_wetlands: false,
    rainwater_harvesting: false,
    retention_basin: false,
  });

  // ── Explore Potential Projects: Browse by corporations (Task 1) ──
  const [browseByCorporations, setBrowseByCorporations] = useState(false);
  const [selectedCorpRegions, setSelectedCorpRegions] = useState({
    East: true,
    West: true,
    North: true,
    South: true,
    Central: true,
  });

  // ── Explore Potential Projects: Browse by flood hotspot (Task 2) ──
  const [browseByHotspots, setBrowseByHotspots] = useState(false);
  const [selectedHotspotRegions, setSelectedHotspotRegions] = useState({
    East: true,
    West: true,
    North: true,
    South: true,
    Central: true,
  });
  const [hotspotSearchQuery, setHotspotSearchQuery] = useState("");

  const assemblyConst2LayerRef = useRef(null);
  const bengaluruAssemblyLayerRef = useRef(null);
  const karnatakaAssemblyLayerRef = useRef(null);
  const wardsLayerGroupRef = useRef(null);
  const gbaWardsLayerRef = useRef(null);
  const gbaCorporationsLayerRef = useRef(null);
  const corpBrowseLayerRef = useRef(null);
  const valleysLayerRef = useRef(null);
  const greenspacesLayerRef = useRef(null);
  const floodHazardLayerRef = useRef(null);
  const floodingHotspotsLayerRef = useRef(null);
  const primaryHotspotMarkerRef = useRef(null);
  const hotspotMarkersMapRef = useRef({});

  const [loadingAssemblyConst2, setLoadingAssemblyConst2] = useState(false);
  const [loadingBengaluruAssembly, setLoadingBengaluruAssembly] =
    useState(false);
  const [loadingKarnatakaAssembly, setLoadingKarnatakaAssembly] =
    useState(false);
  const [loadingGbaWards, setLoadingGbaWards] = useState(false);
  const [loadingGbaCorporations, setLoadingGbaCorporations] = useState(false);
  const [loadingValleys, setLoadingValleys] = useState(false);
  const [loadingGreenspaces, setLoadingGreenspaces] = useState(false);
  const [loadingFloodHazard, setLoadingFloodHazard] = useState(false);
  const [loadingFloodingHotspots, setLoadingFloodingHotspots] = useState(false);

  // Selected item (project, well, corporation, or flood hotspot) for full details panel
  const [selectedItem, setSelectedItem] = useState(null);

  // Corporation counts for City-Wide BGG projects (hoisted for corporation layer popups and click handlers)
  const corpProjectCounts = useMemo(() => {
    const counts = { East: 0, West: 0, North: 0, South: 0, Central: 0 };
    const sitesToCount = sitesData && sitesData.length > 0 ? sitesData : fallbackSites;
    sitesToCount.forEach((site) => {
      const corp = getCorporationForPoint(
        site.latitude,
        site.longitude,
        site.corporation || site.wardName || "",
      );
      if (counts[corp] !== undefined) {
        counts[corp]++;
      }
    });
    return counts;
  }, [sitesData]);

  // Corporation counts for Flood Points
  const corpFloodCounts = useMemo(() => {
    const counts = { East: 0, West: 0, North: 0, South: 0, Central: 0 };
    (floodPointsGeo.features || []).forEach((feat) => {
      const p = feat.properties || {};
      const corp = getCorporationForPoint(p.lat, p.lng, p.zone || "");
      if (counts[corp] !== undefined) {
        counts[corp]++;
      }
    });
    return counts;
  }, []);

  // Search filter
  const [searchText, setSearchText] = useState("");

  // Fetch both projects and wells data on mount
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      let loadedProjects = [];
      let loadedWells = [];
      let source = "API";

      try {
        console.log("📡 Fetching projects and wells from backend API...");
        const [projectsRes, wellsRes] = await Promise.all([
          api.get("/analytics/projects"),
          api.get("/analytics/wells"),
        ]);

        if (projectsRes.data && projectsRes.data.length > 0) {
          loadedProjects = projectsRes.data;
        }
        if (wellsRes.data && wellsRes.data.length > 0) {
          loadedWells = wellsRes.data;
        }

        if (loadedProjects.length === 0 && loadedWells.length === 0) {
          throw new Error("Backend returned empty datasets, falling back.");
        }
      } catch (err) {
        console.warn(
          "⚠️ Failed to load datasets from backend API, using local fallback CSVs:",
          err.message,
        );
        try {
          loadedProjects = parseCSV(v1ProjectsCsv);
          loadedWells = parseCSV(v1WellsCsv);
          source = "Local Fallback (CSV v1)";
        } catch (csvErr) {
          console.error("Failed to parse fallback CSVs:", csvErr);
          loadedProjects = localProjects;
          loadedWells = localWells;
          source = "Local Fallback (JSON)";
        }
      } finally {
        const parsedProjects = loadedProjects
          .map(normalizeProject)
          .filter(
            (p) =>
              p.lat !== null &&
              p.lng !== null &&
              !isNaN(p.lat) &&
              !isNaN(p.lng),
          );

        const parsedWells = loadedWells
          .map(normalizeWell)
          .filter(
            (w) =>
              w.lat !== null &&
              w.lng !== null &&
              !isNaN(w.lat) &&
              !isNaN(w.lng),
          );

        setProjects(parsedProjects);
        setWells(parsedWells);
        setDataSource(source);
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (mapRef.current) return;
    const container = mapContainerRef.current;
    if (container._leaflet_id) {
      container._leaflet_id = null;
    }

    const blrCenter = [12.9716, 77.5946];
    const map = L.map(container, {
      center: blrCenter,
      zoom: 11,
      zoomControl: false,
    });

    L.control.zoom({ position: "bottomright" }).addTo(map);

    L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
        maxZoom: 19,
      },
    ).addTo(map);

    // Create custom panes with strict z-index hierarchy
    // 1. Base administrative boundaries (Assembly constituencies, wards)
    map.createPane("baseBoundariesPane");
    map.getPane("baseBoundariesPane").style.zIndex = 390;
    map.getPane("baseBoundariesPane").style.pointerEvents = "none";

    // 2. Corporation boundaries (East, West, North, South, Central)
    map.createPane("corporationsPane");
    map.getPane("corporationsPane").style.zIndex = 410;
    map.getPane("corporationsPane").style.pointerEvents = "none";

    // 3. Catchments, Valleys, Flood Hazard, Greenspaces polygons
    map.createPane("catchmentsPane");
    map.getPane("catchmentsPane").style.zIndex = 430;
    map.getPane("catchmentsPane").style.pointerEvents = "none";

    // 4. Flood Hotspots markers (Point layer)
    map.createPane("hotspotsPane");
    map.getPane("hotspotsPane").style.zIndex = 470;
    map.getPane("hotspotsPane").style.pointerEvents = "none";

    // 5. Projects & Site markers (Points, Pins, Interventions, Wells)
    map.createPane("projectsPane");
    map.getPane("projectsPane").style.zIndex = 500;
    map.getPane("projectsPane").style.pointerEvents = "none";

    const markersLayerGroup = L.layerGroup().addTo(map);
    const wardsLayerGroup = L.layerGroup().addTo(map);

    mapRef.current = map;
    markersLayerGroupRef.current = markersLayerGroup;
    wardsLayerGroupRef.current = wardsLayerGroup;

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      assemblyConst2LayerRef.current = null;
      bengaluruAssemblyLayerRef.current = null;
      karnatakaAssemblyLayerRef.current = null;
      wardsLayerGroupRef.current = null;
      gbaWardsLayerRef.current = null;
      gbaCorporationsLayerRef.current = null;
      corpBrowseLayerRef.current = null;
      valleysLayerRef.current = null;
      greenspacesLayerRef.current = null;
      floodHazardLayerRef.current = null;
      floodingHotspotsLayerRef.current = null;
      primaryHotspotMarkerRef.current = null;
      hotspotMarkersMapRef.current = {};
    };
  }, []);

  // Ensure Leaflet map dynamically redraws on any container resize (grid layout, drawer open/close)
  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container) return;

    const ro = new ResizeObserver(() => {
      if (mapRef.current) {
        mapRef.current.invalidateSize({ pan: false });
      }
    });
    ro.observe(container);

    return () => {
      ro.disconnect();
    };
  }, []);

  // Invalidate map size whenever right funding deck or active project toggle
  useEffect(() => {
    const t1 = setTimeout(() => mapRef.current?.invalidateSize({ pan: false }), 60);
    const t2 = setTimeout(() => mapRef.current?.invalidateSize({ pan: false }), 200);
    const t3 = setTimeout(() => mapRef.current?.invalidateSize({ pan: false }), 450);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [showNewProjects, activeProject, isRightDeckOpen]);

  // Load and render boundaries layers dynamically via modular hook
  useBoundaryLayers({
    mapRef,
    assemblyConst2LayerRef,
    bengaluruAssemblyLayerRef,
    karnatakaAssemblyLayerRef,
    wardsLayerGroupRef,
    gbaWardsLayerRef,
    gbaCorporationsLayerRef,
    corpBrowseLayerRef,
    valleysLayerRef,
    greenspacesLayerRef,
    floodHazardLayerRef,
    floodingHotspotsLayerRef,
    primaryHotspotMarkerRef,
    hotspotMarkersMapRef,
    wellsRef,
    projectsRef,
    showAssemblyConst2,
    showBengaluruAssembly,
    showKarnatakaAssembly,
    showGbaWards,
    showGbaCorporations,
    showValleys,
    showGreenspaces,
    showNewFloodRisk,
    showFloodingHotspots,
    browseByCorporations,
    selectedCorpRegions,
    browseByHotspots,
    selectedHotspotRegions,
    corpProjectCounts,
    corpFloodCounts,
    setLoadingAssemblyConst2,
    setLoadingBengaluruAssembly,
    setLoadingKarnatakaAssembly,
    setLoadingGbaWards,
    setLoadingGbaCorporations,
    setLoadingValleys,
    setLoadingGreenspaces,
    setLoadingFloodHazard,
    setLoadingFloodingHotspots,
    setSelectedItem,
  });

  // Clear selected item if corresponding layer is unchecked
  useEffect(() => {
    if (!selectedItem) return;
    if (selectedItem.isSiteProject && !showNewProjects && !browseByCorporations) {
      setSelectedItem(null);
    } else if (
      selectedItem.projName !== undefined &&
      !selectedItem.isSiteProject &&
      !showProjects
    ) {
      setSelectedItem(null);
    } else if (selectedItem.wellName !== undefined && !showWells) {
      setSelectedItem(null);
    } else if (
      selectedItem.isCorporation &&
      !browseByCorporations &&
      !showGbaCorporations
    ) {
      setSelectedItem(null);
    } else if (
      selectedItem.isHotspot &&
      !showFloodingHotspots &&
      !browseByHotspots
    ) {
      setSelectedItem(null);
    }
  }, [
    showWells,
    showProjects,
    showNewProjects,
    browseByCorporations,
    showGbaCorporations,
    showFloodingHotspots,
    browseByHotspots,
  ]);

  // Aggregate loaded wells and projects to build a Wards summary water profile
  const getWardsSummary = () => {
    const wardMap = {};

    wells.forEach((w) => {
      const name = w.wardName;
      if (!name || name.toLowerCase().includes("unknown") || name.trim() === "")
        return;
      if (!wardMap[name]) {
        wardMap[name] = {
          wardName: name,
          wardNameKn: w.wardNameKn || "",
          wardId: w.wardId || "",
          corporation: w.corporation || "",
          wellsCount: 0,
          projectsCount: 0,
          lats: [],
          lngs: [],
        };
      }
      wardMap[name].wellsCount += 1;
      if (w.lat && w.lng) {
        wardMap[name].lats.push(w.lat);
        wardMap[name].lngs.push(w.lng);
      }
    });

    projects.forEach((p) => {
      const name = p.wardName;
      if (!name || name.toLowerCase().includes("unknown") || name.trim() === "")
        return;
      if (!wardMap[name]) {
        wardMap[name] = {
          wardName: name,
          wardNameKn: p.wardNameKn || "",
          wardId: p.wardId || "",
          corporation: p.corporation || "",
          wellsCount: 0,
          projectsCount: 0,
          lats: [],
          lngs: [],
        };
      }
      wardMap[name].projectsCount += 1;
      if (p.lat && p.lng) {
        wardMap[name].lats.push(p.lat);
        wardMap[name].lngs.push(p.lng);
      }
    });

    const summaries = [];
    Object.values(wardMap).forEach((w) => {
      if (w.lats.length === 0) return;
      const avgLat = w.lats.reduce((a, b) => a + b, 0) / w.lats.length;
      const avgLng = w.lngs.reduce((a, b) => a + b, 0) / w.lngs.length;
      summaries.push({
        wardName: w.wardName,
        wardNameKn: w.wardNameKn,
        wardId: w.wardId,
        corporation: w.corporation,
        wellsCount: w.wellsCount,
        projectsCount: w.projectsCount,
        lat: avgLat,
        lng: avgLng,
      });
    });

    return summaries.sort((a, b) => a.wardName.localeCompare(b.wardName));
  };

  // Render Ward Centroid Summaries on Map
  useEffect(() => {
    if (!mapRef.current || !wardsLayerGroupRef.current || loading) return;

    const map = mapRef.current;
    const wardsGroup = wardsLayerGroupRef.current;

    wardsGroup.clearLayers();

    if (!showWards) return;

    const wardsSummary = getWardsSummary();
    const boundsPoints = [];

    wardsSummary.forEach((w) => {
      const {
        lat,
        lng,
        wardName,
        wardNameKn,
        wardId,
        corporation,
        wellsCount,
        projectsCount,
      } = w;
      const totalCount = wellsCount + projectsCount;
      const radius = Math.min(22, Math.max(9, 7 + totalCount * 0.7));
      const color = "#d97706"; // Gold/Amber color

      const marker = L.circleMarker([lat, lng], {
        pane: "projectsPane",
        radius: radius,
        fillColor: color,
        color: "#ffffff",
        weight: 2,
        opacity: 0.9,
        fillOpacity: 0.8,
      });

      marker.bindPopup(`
        <div style="display: flex; flex-direction: column; text-align: left; padding: 4px; font-family: system-ui, -apple-system, sans-serif; width: 220px;">
          <span style="font-size: 8.5px; font-weight: 800; letter-spacing: 0.5px; padding: 3px 6px; border-radius: 4px; align-self: flex-start; margin-bottom: 6px; text-transform: uppercase; background-color: ${color}15; color: ${color};">WARD WATER PROFILE</span>
          <h4 style="margin: 4px 0 0 0; font-size: 13px; font-weight: 750; color: #0f172a;">${wardName}</h4>
          ${wardNameKn ? `<p style="margin: 2px 0 0 0; font-size: 11px; color: #64748b;">${wardNameKn}</p>` : ""}
          <p style="margin: 4px 0 0 0; font-size: 11px; color: #475569;">🔑 Ward ID: <strong>${wardId || "N/A"}</strong></p>
          <p style="margin: 2px 0 0 0; font-size: 11px; color: #475569;">🏢 Corp: <strong>${corporation || "N/A"}</strong></p>
          <div style="margin-top: 8px; border-top: 1px dashed #e2e8f0; padding-top: 6px; display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
            <div style="text-align: center;">
              <span style="font-size: 9px; font-weight: 700; color: #94a3b8; text-transform: uppercase;">Wells</span>
              <div style="font-size: 14px; font-weight: 800; color: #a855f7;">${wellsCount}</div>
            </div>
            <div style="text-align: center;">
              <span style="font-size: 9px; font-weight: 700; color: #94a3b8; text-transform: uppercase;">Projects</span>
              <div style="font-size: 14px; font-weight: 800; color: #3b82f6;">${projectsCount}</div>
            </div>
          </div>
          <span style="text-align: center; margin-top: 6px; border-top: 1px dashed #e2e8f0; padding-top: 4px; font-size: 9.5px; color: #94a3b8; display: block; font-weight: 600;">Total Ward Assets: <strong>${totalCount}</strong></span>
        </div>
      `);

      marker.on("click", () => {
        const matchingWells = (wellsRef.current || []).filter(
          (well) => well.wardName === wardName,
        );
        const matchingProjects = (projectsRef.current || []).filter(
          (p) => p.wardName === wardName,
        );

        console.log(
          `%c🟡 [WARD SUMMARY CLICK] - Ward: ${wardName}`,
          "color: #d97706; font-weight: bold; font-size: 14px;",
        );
        console.log("Ward Info:", {
          wardName,
          wardNameKn,
          wardId,
          corporation,
        });
        console.log(
          `Assets in this Ward (Total: ${matchingWells.length + matchingProjects.length}):`,
        );
        console.log(`- Wells (${matchingWells.length}):`, matchingWells);
        console.log(
          `- Projects (${matchingProjects.length}):`,
          matchingProjects,
        );
      });

      marker.addTo(wardsGroup);
      boundsPoints.push([lat, lng]);
    });
    if (boundsPoints.length > 0) {
      const bounds = L.latLngBounds(boundsPoints);
      map.flyToBounds(bounds, {
        padding: [50, 50],
        maxZoom: 13,
        animate: true,
        duration: 1.2,
      });
    }
  }, [showWards, wells, projects, loading]);

  // Color mappings - matching the layer checkboxes exactly for differentiation
  const getProjectColor = (status, tags) => {
    if (tags) {
      return getProjectCategoryInfo(tags).color;
    }
    return "#3b82f6"; // Premium blue color matching projects checkbox
  };

  const getWellColor = (wellType) => {
    return "#a855f7"; // Violet/purple color matching wells checkbox
  };

  // Filter Items - Merging Wells and Projects cleanly based on checked states
  const getFilteredItems = () => {
    let items = [];
    const search = searchText.toLowerCase();

    if (showWells) {
      const filteredWells = wells.filter((w) => {
        const matchesSearch =
          w.wellName.toLowerCase().includes(search) ||
          w.wardName.toLowerCase().includes(search) ||
          w.wellType.toLowerCase().includes(search);

        if (activeWatershedId) {
          const wsCoords = WATERSHEDS_POLYGONS[activeWatershedId].coords;
          return matchesSearch && pointInPolygon(w.lat, w.lng, wsCoords);
        }
        return matchesSearch;
      });
      items = [...items, ...filteredWells];
    }

    if (showProjects) {
      const filteredProjects = projects.filter((p) => {
        const matchesSearch =
          p.projName.toLowerCase().includes(search) ||
          p.wardName.toLowerCase().includes(search) ||
          p.tags.toLowerCase().includes(search);

        let matchesFilter = true;
        if (enableSiteTypologyFilter) {
          const siteId = p.siteTypeInfo?.id || "road";
          if (!selectedSiteTypologies[siteId]) matchesFilter = false;
        }
        if (enableInterventionTypologyFilter) {
          const intId = p.interventionTypologyInfo?.id || "detention";
          if (!selectedInterventionTypologies[intId]) matchesFilter = false;
        }

        if (activeWatershedId) {
          const hasMatchingId = p.watershedId === activeWatershedId;
          const wsCoords = WATERSHEDS_POLYGONS[activeWatershedId].coords;
          const isInsidePolygon = pointInPolygon(p.lat, p.lng, wsCoords);
          return (
            matchesSearch &&
            matchesFilter &&
            (hasMatchingId || isInsidePolygon)
          );
        }

        return matchesSearch && matchesFilter;
      });
      items = [...items, ...filteredProjects];
    }

    // Sort items alphabetically by name
    return items.sort((a, b) => {
      const nameA = a.projName !== undefined ? a.projName : a.wellName;
      const nameB = b.projName !== undefined ? b.projName : b.wellName;
      return nameA.localeCompare(nameB);
    });
  };

  const filteredItems = getFilteredItems();

  // Render Watershed Boundary and connection lines
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    if (activeWatershedLayerRef.current) {
      map.removeLayer(activeWatershedLayerRef.current);
      activeWatershedLayerRef.current = null;
    }
    if (activeLinesLayerRef.current) {
      map.removeLayer(activeLinesLayerRef.current);
      activeLinesLayerRef.current = null;
    }

    if (activeWatershedId) {
      const wsInfo = WATERSHEDS_POLYGONS[activeWatershedId];
      if (wsInfo && wsInfo.coords) {
        const polygon = L.polygon(wsInfo.coords, {
          pane: "catchmentsPane",
          color: wsInfo.color,
          weight: 2.5,
          fillColor: wsInfo.color,
          fillOpacity: 0.15,
          dashArray: "5, 5",
        }).addTo(map);

        activeWatershedLayerRef.current = polygon;
        map.fitBounds(polygon.getBounds(), { padding: [40, 40] });

        const linesGroup = L.layerGroup().addTo(map);
        const spot = FLOOD_SPOTS_DATA.find((s) => s.id === activeFloodSpotId);
        if (spot) {
          const matchingProjects = NEW_PROJECTS_DATA.filter(
            (p) => p.watershedId === activeWatershedId,
          );
          matchingProjects.forEach((proj) => {
            L.polyline(
              [
                [spot.lat, spot.lng],
                [proj.lat, proj.lng],
              ],
              {
                pane: "catchmentsPane",
                color: "#ef4444",
                weight: 1.5,
                opacity: 0.6,
                dashArray: "4, 4",
              },
            ).addTo(linesGroup);
          });
        }
        activeLinesLayerRef.current = linesGroup;
      }
    }
  }, [activeWatershedId, activeFloodSpotId]);

  // Render Markers on Map when toggles, search filters, or datasets change
  useEffect(() => {
    if (!mapRef.current || !markersLayerGroupRef.current || loading) return;

    const map = mapRef.current;
    const markersGroup = markersLayerGroupRef.current;

    // Clear existing layers
    markersGroup.clearLayers();

    if (!showWells && !showProjects && !showNewProjects && !browseByCorporations) return;

    const boundsPoints = [];

    filteredItems.forEach((item) => {
      const { lat, lng } = item;
      if (lat === null || lng === null || isNaN(lat) || isNaN(lng)) return;

      const isProj = item.projName !== undefined;
      const name = isProj ? item.projName : item.wellName;
      const type = isProj ? item.status : item.wellType;
      const badgeLabel = isProj ? "PROJECT" : "WELL";
      const color = isProj
        ? getProjectColor(item.status, item.tags)
        : getWellColor(item.wellType);

      let marker;
      if (isProj) {
        const pinIcon = L.divIcon({
          className: "custom-leaflet-pin-container",
          html: `
            <div class="pin-marker-wrapper animate-bounce-in">
              <svg class="pin-svg" viewBox="0 0 32 42" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16 0C7.16 0 0 7.16 0 16C0 26.6 14.8 41.1 15.4 41.7C15.7 42 16.3 42 16.6 41.7C17.2 41.1 32 26.6 32 16C32 7.16 24.8 0 16 0Z" fill="${color}"/>
                <circle cx="16" cy="16" r="10" fill="#ffffff" />
                <text x="16" y="16" fill="#0f172a" font-size="12px" font-family="system-ui, -apple-system, BlinkMacSystemFont, sans-serif" text-anchor="middle" dominant-baseline="central">${item.categoryInfo?.icon || "🌱"}</text>
              </svg>
            </div>
          `,
          iconSize: [32, 42],
          iconAnchor: [16, 42],
          popupAnchor: [0, -42],
        });
        marker = L.marker([lat, lng], { icon: pinIcon, pane: "projectsPane" });
      } else {
        marker = L.circleMarker([lat, lng], {
          pane: "projectsPane",
          radius: 7,
          fillColor: color,
          color: "#ffffff",
          weight: 1.5,
          opacity: 1,
          fillOpacity: 0.85,
        });
      }

      marker.bindPopup(`
        <div data-tour="project-popup" style="display: flex; flex-direction: column; text-align: left; padding: 4px; font-family: system-ui, -apple-system, sans-serif; min-width: 200px;">
          <span style="font-size: 8.5px; font-weight: 800; letter-spacing: 0.5px; padding: 3px 6px; border-radius: 4px; align-self: flex-start; margin-bottom: 6px; text-transform: uppercase; background-color: ${color}20; color: ${color};">${badgeLabel}: ${String(type || "UNSPECIFIED").toUpperCase()}</span>
          <h4 style="font-size: 13.5px; font-weight: 750; color: #0f172a; margin: 0 0 4px 0;">${name}</h4>
          <p style="font-size: 11px; color: #64748b; margin: 0 0 6px 0;">📍 ${item.wardName || "Unknown Ward"}</p>
          ${isProj
          ? `
            <div style="display: flex; flex-direction: column; gap: 3px; font-size: 10.5px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 6px 8px; margin-bottom: 8px;">
              <span style="color: #475569;">🌱 <strong>Intervention:</strong> <strong style="color: ${item.interventionTypologyInfo?.color || color};">${item.interventionTypologyInfo?.name || "Detention pond"}</strong></span>
              <span style="color: #475569;">📍 <strong>Site:</strong> <strong style="color: #0f172a;">${item.siteTypeInfo?.name || "Lake"}</strong></span>
            </div>
          `
          : ""
        }
          ${isProj
          ? `
            <button onclick="window.openInterventionDetailInPlace && window.openInterventionDetailInPlace()" style="display: block; width: 100%; border: none; background-color: ${color}; color: white !important; text-align: center; padding: 7px; border-radius: 6px; font-size: 11.5px; font-weight: 750; cursor: pointer; box-shadow: 0 2px 4px ${color}20;">
              View Details →
            </button>
          `
          : ""
        }
          <span style="font-size: 9.5px; color: #94a3b8; display: block; margin-top: 6px; font-weight: 600;">Click point for full telemetry</span>
        </div>
      `);

      marker.on("click", () => {
        setSelectedItem(item);
        map.setView([lat, lng], 14);

        console.log(
          `%c📍 [ASSET CLICK] - Type: ${badgeLabel}`,
          `color: ${color}; font-weight: bold; font-size: 14px;`,
        );
        console.log("Asset Details:", item);
      });

      marker.addTo(markersGroup);
      if (item.projName) {
        projectMarkersRef.current[item.projName] = marker;
      }
      boundsPoints.push([lat, lng]);
    });

    if (showNewProjects || browseByCorporations) {
      // ── Use live data from /api/sites ─────────────────────────────────────
      console.log(
        "🔄 Rendering City Wide BGG projects:",
        sitesData,
      );
      const liveProjects = sitesData.filter(
        (site) => site.latitude != null && site.longitude != null,
      );

      let visibleSites = liveProjects;

      // If showNewProjects is false, filter by active corporation regions
      if (!showNewProjects && browseByCorporations) {
        visibleSites = visibleSites.filter((site) => {
          const corp = getCorporationForPoint(
            site.latitude,
            site.longitude,
            site.corporation || site.wardName || ""
          );
          return !!selectedCorpRegions[corp];
        });
      }

      if (activeWatershedId) {
        const wsCoords = WATERSHEDS_POLYGONS[activeWatershedId]?.coords;
        if (wsCoords) {
          visibleSites = visibleSites.filter((site) =>
            pointInPolygon(site.latitude, site.longitude, wsCoords)
          );
        }
      }

      const SITE_COLOR = {
        lake: "#3b82f6",
        park: "#22c55e",
        stormdrain: "#94a3b8",
        campus: "#f59e0b",
      };
      const SITE_ICON = {
        lake: "🔵",
        park: "🟢",
        stormdrain: "⚫",
        campus: "🏢",
      };

      visibleSites.forEach((site) => {
        const lat = site.latitude;
        const lng = site.longitude;
        if (!lat || !lng || isNaN(lat) || isNaN(lng)) return;

        const color = SITE_COLOR[site.type] || "#3b82f6";
        const typeIcon = SITE_ICON[site.type] || "📍";
        const ivCount = (site.interventions || []).length;
        const ivList = (site.interventions || [])
          .map(
            (iv) =>
              `<li style="margin:2px 0">${iv.type.replace(/_/g, " ")}${iv.quantity ? ` ×${iv.quantity}` : ""}</li>`,
          )
          .join("");

        const marker = L.circleMarker([lat, lng], {
          pane: "projectsPane",
          radius: 9,
          fillColor: color,
          color: "#ffffff",
          weight: 2.5,
          opacity: 1,
          fillOpacity: 0.92,
        });

        const siteImg = getProjectImage(site);
        const imageHeader = siteImg
          ? `
          <div style="width:100%;height:105px;margin-bottom:8px;border-radius:8px;overflow:hidden;background:#f1f5f9;position:relative;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
            <img 
              src="${siteImg}" 
              alt="${site.name}" 
              style="width:100%;height:100%;object-fit:cover;display:block;" 
              onerror="this.parentElement.style.display='none';" 
            />
          </div>
        `
          : "";

        const viewMoreBtn = `<button onclick="window.openSiteDetailInPlace && window.openSiteDetailInPlace('${site.site_id}')" style="display:block;width:100%;margin-top:8px;border:none;background-color:${color};color:white!important;text-align:center;padding:6px 10px;border-radius:6px;font-size:11px;font-weight:750;cursor:pointer;box-shadow:0 2px 4px rgba(0,0,0,0.1);">View Details →</button>`;

        marker.bindPopup(`
          <div style="display:flex;flex-direction:column;text-align:left;padding:4px;font-family:system-ui,-apple-system,sans-serif;min-width:200px;max-width:240px">
            ${imageHeader}
            <span style="font-size:8.5px;font-weight:800;letter-spacing:0.5px;padding:3px 6px;border-radius:4px;align-self:flex-start;margin-bottom:6px;text-transform:uppercase;background-color:${color}20;color:${color}">${typeIcon} ${(site.type || "SITE").toUpperCase()}</span>
            <h4 style="font-size:13.5px;font-weight:750;color:#0f172a;margin:0 0 4px 0">${site.name}</h4>
            ${site.watershed ? `<p style="font-size:11px;color:#64748b;margin:0 0 4px 0">🌊 ${site.watershed}</p>` : ""}
            <p style="font-size:11px;color:#475569;margin:0 0 6px 0">🔧 <strong>${ivCount}</strong> intervention${ivCount !== 1 ? "s" : ""}</p>
            ${viewMoreBtn}
          </div>
        `);

        marker.on("click", () => {
          setIsRightDeckOpen(true);
          setSelectedItem({
            isSiteProject: true,
            site_id: site.site_id,
            name: site.name,
            type: site.type,
            lat,
            lng,
            watershed: site.watershed || "",
            site_level_impact: site.site_level_impact || "",
            subcatchment_level_impact: site.subcatchment_level_impact || "",
            interventions: site.interventions || [],
            linked_intervention_ids: site.linked_intervention_ids || [],
            image_url: siteImg,
            categoryInfo: {
              id: site.type,
              name: site.name,
              color: color,
              icon: typeIcon,
            },
            _raw: site,
          });
          map.setView([lat, lng], 14);

          // ── Console output when a project marker is clicked ─────────────
          console.group(
            `%c📍 [PROJECT MARKER CLICK] ${site.name}`,
            `color:${color};font-weight:bold;font-size:14px;`,
          );
          console.log("Site ID:     ", site.site_id);
          console.log("Type:        ", site.type);
          console.log("Watershed:   ", site.watershed || "—");
          console.log("Coordinates: ", `${lat}, ${lng}`);
          console.log("Interventions count:", ivCount);
          if (site.interventions?.length) {
            console.table(
              site.interventions.map((iv) => ({
                type: iv.type,
                quantity: iv.quantity ?? "—",
                length: iv.details?.length_m ?? "—",
                width: iv.details?.width_m ?? "—",
                depth: iv.details?.depth_m ?? "—",
                area: iv.details?.area ?? "—",
              })),
            );
          }
          if (site.site_level_impact)
            console.log("Site impact:         ", site.site_level_impact);
          if (site.subcatchment_level_impact)
            console.log(
              "Subcatchment impact: ",
              site.subcatchment_level_impact,
            );
          console.log("Full site object:", site);
          console.groupEnd();
        });

        marker.addTo(markersGroup);
        boundsPoints.push([lat, lng]);
      });
    }

    // Render Projects Layer
    // (Flood Hazard is rendered via GeoJSON layer with custom polygon styles and borders)

    // Zoom automatically to active bounds containing visible points
    if (boundsPoints.length > 0) {
      const bounds = L.latLngBounds(boundsPoints);
      map.flyToBounds(bounds, {
        padding: [50, 50],
        maxZoom: 13,
        animate: true,
        duration: 1.2,
      });
    }
  }, [
    showWells,
    showProjects,
    showNewProjects,
    browseByCorporations,
    selectedCorpRegions,
    wells,
    projects,
    searchText,
    enableSiteTypologyFilter,
    enableInterventionTypologyFilter,
    selectedSiteTypologies,
    selectedInterventionTypologies,
    sitesData,
    activeWatershedId,
  ]);

  const handleSelectItem = (item) => {
    setSelectedItem(item);

    const isProj = item.projName !== undefined;
    const badgeLabel = isProj ? "PROJECT" : "WELL";
    const color = isProj
      ? getProjectColor(item.status, item.tags)
      : getWellColor(item.wellType);
    console.log(
      `%c📍 [LIST ITEM SELECT] - Type: ${badgeLabel}`,
      `color: ${color}; font-weight: bold; font-size: 14px;`,
    );
    console.log("Asset Details:", item);

    if (mapRef.current) {
      mapRef.current.flyTo([item.lat, item.lng], 14, {
        animate: true,
        duration: 1,
      });

      markersLayerGroupRef.current.eachLayer((layer) => {
        const latLng = layer.getLatLng();
        if (latLng.lat === item.lat && latLng.lng === item.lng) {
          layer.openPopup();
        }
      });
    }
  };

  const isItemSelected = (item) => {
    if (!selectedItem) return false;

    // Check if same class (Project vs Well)
    const isProj = item.projName !== undefined;
    const isSelectedProj = selectedItem.projName !== undefined;
    if (isProj !== isSelectedProj) return false;

    if (item._id && selectedItem._id) {
      return item._id === selectedItem._id;
    }

    const itemId = item._mb_row_id || item._id;
    const selectedId = selectedItem._mb_row_id || selectedItem._id;
    return itemId && selectedId && itemId === selectedId;
  };

  // Dynamic count helper for the two sub-layers: Site Typology & Intervention Typology
  const getInterventionFilterCounts = () => {
    const siteTypologyCounts = {
      park: 0,
      lake: 0,
      road: 0,
      stormwater_drain: 0,
      foreshore: 0,
      street_tree_avenue: 0,
      residential_building: 0,
      institutional_campus: 0,
      sewage_treatment_plant: 0,
      stream: 0,
      floodplain: 0,
      recharge_pit: 0,
      reservoir: 0,
      parking_lot: 0,
    };
    const interventionTypologyCounts = {
      bioswale: 0,
      raingarden: 0,
      detention: 0,
      infiltration_trench: 0,
      percolation: 0,
      constructed_wetlands: 0,
      rainwater_harvesting: 0,
      retention_basin: 0,
    };

    projects.forEach((p) => {
      // 1. Site Typology
      const siteId = p.siteTypeInfo?.id || "road";
      if (siteTypologyCounts[siteId] !== undefined) {
        siteTypologyCounts[siteId]++;
      }

      // 2. Intervention Typology
      const intId = p.interventionTypologyInfo?.id || "detention";
      if (interventionTypologyCounts[intId] !== undefined) {
        interventionTypologyCounts[intId]++;
      }
    });

    return {
      siteTypology: siteTypologyCounts,
      interventionTypology: interventionTypologyCounts,
    };
  };
  const filterCounts = getInterventionFilterCounts();

  // Filtered hotspots list for the search in Browse by flood hotspot
  const filteredHotspotsList = useMemo(() => {
    if (!browseByHotspots) return [];
    const q = hotspotSearchQuery.trim().toLowerCase();
    const allFeatures = floodPointsGeo.features || [];

    return allFeatures
      .map((feat, idx) => {
        const p = feat.properties || {};
        const corp = getCorporationForPoint(p.lat, p.lng, p.zone || "");
        return {
          ...p,
          id: p.id || feat.id || `flood_pt_${p.slNo || idx}`,
          corp,
          lat: p.lat,
          lng: p.lng,
          location: p.location || "Unnamed Hotspot",
          zone: p.zone || "",
          vulnerabilityLevel:
            p.vulnerabilityLevel ||
            (p.vulnerabilityCode === "H" ? "High" : "Moderate"),
          vulnerabilityCode: p.vulnerabilityCode,
        };
      })
      .filter((h) => {
        // Must match active selected regions
        if (!selectedHotspotRegions[h.corp]) return false;
        // Search filter
        if (!q) return true;
        return (
          h.location.toLowerCase().includes(q) ||
          h.zone.toLowerCase().includes(q) ||
          h.corp.toLowerCase().includes(q) ||
          (h.remarks && h.remarks.toLowerCase().includes(q))
        );
      });
  }, [browseByHotspots, selectedHotspotRegions, hotspotSearchQuery]);

  const handleSelectHotspotFromList = useCallback((hotspot) => {
    if (!mapRef.current || !hotspot.lat || !hotspot.lng) return;
    mapRef.current.flyTo([hotspot.lat, hotspot.lng], 16, {
      animate: true,
      duration: 1.2,
    });

    const isHigh =
      hotspot.vulnerabilityCode === "H" ||
      hotspot.vulnerabilityLevel === "High";

    setSelectedItem({
      isHotspot: true,
      id: hotspot.id || hotspot.location,
      name: hotspot.location || "Unnamed Hotspot",
      location: hotspot.location,
      zone: hotspot.zone || "N/A",
      vulnerabilityLevel: hotspot.vulnerabilityLevel || (isHigh ? "High" : "Moderate"),
      vulnerabilityCode: hotspot.vulnerabilityCode || (isHigh ? "H" : "M"),
      vulnerabilityMeasure: hotspot.vulnerabilityMeasure || "",
      remarks: hotspot.remarks || "",
      reducedLevel: hotspot.reducedLevel || "",
      lat: hotspot.lat,
      lng: hotspot.lng,
      corp: hotspot.corp,
    });

    setTimeout(() => {
      const marker =
        hotspotMarkersMapRef.current[hotspot.id] ||
        hotspotMarkersMapRef.current[hotspot.location];
      if (marker) {
        marker.openPopup();
      }
    }, 400);
  }, []);

  const handleTourStepChange = useCallback((stepIndex, step) => {
    if (!step) return;

    // Immediately & smoothly invalidate map size on any step transition (Next or Back)
    if (mapRef.current) {
      mapRef.current.invalidateSize({ pan: false });
      setTimeout(() => mapRef.current?.invalidateSize({ pan: false }), 80);
      setTimeout(() => mapRef.current?.invalidateSize({ pan: false }), 250);
      setTimeout(() => mapRef.current?.invalidateSize({ pan: false }), 600);
    }

    if (step.id === "whats-happening") {
      setOpenSections((prev) => ({ ...prev, happening: true }));
    } else if (step.id === "project-telemetry") {
      setOpenSections((prev) => ({ ...prev, happening: true }));
      setShowProjects(true);

      setTimeout(() => {
        const marker =
          projectMarkersRef.current["Challakere lake rejuvenation"] ||
          Object.values(projectMarkersRef.current)[0];
        if (marker && mapRef.current) {
          mapRef.current.setView(marker.getLatLng(), 13, { animate: true });
          marker.openPopup();
          setTimeout(() => {
            const popupEl = document.querySelector(".leaflet-popup");
            if (popupEl) {
              popupEl.setAttribute("data-tour", "project-popup");
            }
          }, 150);
        }
      }, 350);
    } else if (step.id === "water-risks") {
      setOpenSections((prev) => ({ ...prev, risks: true }));
    } else if (step.id === "assess-placement") {
      setOpenSections((prev) => ({ ...prev, happening: true, risks: true, groundwater: true }));
      setShowProjects(true);
      setShowNewFloodRisk(true);
      setShowWells(true);
    } else if (step.id === "explore-potential-projects") {
      setOpenSections((prev) => ({ ...prev, projects: true }));
    } else if (step.id === "flood-hotspot-map") {
      setShowFloodingHotspots(true);
      const focusHotspot = () => {
        if (!mapRef.current) return;
        mapRef.current.invalidateSize({ pan: false });
        const marker = primaryHotspotMarkerRef.current;
        if (marker) {
          const latlng = marker.getLatLng();
          // Position map view slightly shifted (+0.018 lng) so marker is at center-left, leaving space for tour bubble on right
          mapRef.current.setView([latlng.lat, latlng.lng + 0.018], 13, { animate: true });
          marker.openPopup();
          setTimeout(() => {
            const popupEl = document.querySelector(".leaflet-popup");
            if (popupEl) {
              popupEl.setAttribute("data-tour", "hotspot-popup");
            }
          }, 120);
        } else {
          // If layer still loading, center on Varthur / Mahadevapura hotspot coordinates
          mapRef.current.setView([12.9569, 77.7359 + 0.018], 13, { animate: true });
        }
      };

      focusHotspot();
      setTimeout(focusHotspot, 200);
      setTimeout(focusHotspot, 500);
      setTimeout(focusHotspot, 900);
    } else if (step.id === "fund-projects") {
      setShowFloodingHotspots(true);
      setIsRightDeckOpen(true);
      if (mapRef.current) {
        mapRef.current.invalidateSize({ pan: false });
      }
    }
  }, []);

  const handleTourComplete = useCallback(() => {
    setShowNewFloodRisk(true);
    setShowWells(false);
    setShowProjects(false);
    setShowFloodingHotspots(false);
    setShowWards(false);
    setShowAssemblyConst2(false);
    setShowBengaluruAssembly(false);
    setShowKarnatakaAssembly(false);
    setShowGbaWards(false);
    setShowGbaCorporations(false);
    setShowValleys(false);
    setShowGreenspaces(false);
    setShowNewProjects(false);
  }, []);

  return (
    <TourProvider
      steps={MAP_TOUR_STEPS}
      tourKey="map-page-tour-v3"
      onStepChange={handleTourStepChange}
      onComplete={handleTourComplete}
    >
      <div className="max-w-[1650px] 2xl:max-w-[1850px] w-full mx-auto px-3 sm:px-4 lg:px-6 py-4 text-left relative">
        {activeDetailView && (
          <div className="w-full text-left animate-[fadeIn_0.2s_ease-out_forwards]">
            <button
              onClick={handleBackToMap}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer mb-4"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M19 12H5" />
                <path d="M12 19l-7-7 7-7" />
              </svg>
              <span>Back to Map</span>
            </button>
            {activeDetailView.type === "site" ? (
              <NewProjectsView initialProjectId={activeDetailView.id} />
            ) : (
              <Interventions />
            )}
          </div>
        )}

        <div
          className={
            activeDetailView
              ? "hidden"
              : "flex flex-col gap-6 w-full animate-[fadeIn_0.4s_ease-out_forwards]"
          }
        >
          <style
            dangerouslySetInnerHTML={{
              __html: `
          @keyframes bounceIn {
            0% { opacity: 0; transform: scale(0.3) translateY(-100%); }
            50% { opacity: 0.8; transform: scale(1.1) translateY(10%); }
            80% { transform: scale(0.95) translateY(-5%); }
            100% { opacity: 1; transform: scale(1) translateY(0); }
          }
          @keyframes pulseFast {
            0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
            70% { transform: scale(1.1); box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
            100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
          }
          @keyframes walkerPulse {
            0% { r: 5px; opacity: 1; }
            50% { r: 9px; opacity: 0.5; }
            100% { r: 5px; opacity: 1; }
          }
          @keyframes slideDown {
            from { opacity: 0; transform: translateY(-8px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(8px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .custom-scrollbar::-webkit-scrollbar {
            width: 5px;
            height: 5px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 10px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #94a3b8;
          }
        `,
            }}
          />

          {/* 
        <div>
          <p className="font-bold text-xl">Interactive Spatial Explorer</p>
        </div>

        <div className="h-[650px] bg-white border border-slate-200 rounded-[20px] p-6 shadow-sm overflow-y-auto">
          <Analytics />
        </div>
        */}

          <div
            className={`grid grid-cols-1 ${
              showNewProjects && activeProject && isRightDeckOpen
                ? "xl:grid-cols-[350px_1fr_320px] 2xl:grid-cols-[360px_1fr_340px]"
                : "xl:grid-cols-[380px_1fr]"
            } gap-3.5 items-start`}
          >
            {/* Left Sidebar Control Panel - Free Dynamic Height */}
            {/* Left Sidebar Control Panel */}
            <LayerControlSidebar
              openSections={openSections}
              toggleSection={toggleSection}
              showProjects={showProjects}
              setShowProjects={setShowProjects}
              enableSiteTypologyFilter={enableSiteTypologyFilter}
              setEnableSiteTypologyFilter={setEnableSiteTypologyFilter}
              selectedSiteTypologies={selectedSiteTypologies}
              setSelectedSiteTypologies={setSelectedSiteTypologies}
              enableInterventionTypologyFilter={enableInterventionTypologyFilter}
              setEnableInterventionTypologyFilter={setEnableInterventionTypologyFilter}
              selectedInterventionTypologies={selectedInterventionTypologies}
              setSelectedInterventionTypologies={setSelectedInterventionTypologies}
              showNewFloodRisk={showNewFloodRisk}
              setShowNewFloodRisk={setShowNewFloodRisk}
              showFloodingHotspots={showFloodingHotspots}
              setShowFloodingHotspots={setShowFloodingHotspots}
              showWells={showWells}
              setShowWells={setShowWells}
              browseByCorporations={browseByCorporations}
              setBrowseByCorporations={setBrowseByCorporations}
              selectedCorpRegions={selectedCorpRegions}
              setSelectedCorpRegions={setSelectedCorpRegions}
              browseByHotspots={browseByHotspots}
              setBrowseByHotspots={setBrowseByHotspots}
              selectedHotspotRegions={selectedHotspotRegions}
              setSelectedHotspotRegions={setSelectedHotspotRegions}
              hotspotSearchQuery={hotspotSearchQuery}
              setHotspotSearchQuery={setHotspotSearchQuery}
              showWards={showWards}
              setShowWards={setShowWards}
              showAssemblyConst2={showAssemblyConst2}
              setShowAssemblyConst2={setShowAssemblyConst2}
              showBengaluruAssembly={showBengaluruAssembly}
              setShowBengaluruAssembly={setShowBengaluruAssembly}
              showKarnatakaAssembly={showKarnatakaAssembly}
              setShowKarnatakaAssembly={setShowKarnatakaAssembly}
              showGbaWards={showGbaWards}
              setShowGbaWards={setShowGbaWards}
              showGbaCorporations={showGbaCorporations}
              setShowGbaCorporations={setShowGbaCorporations}
              showValleys={showValleys}
              setShowValleys={setShowValleys}
              showGreenspaces={showGreenspaces}
              setShowGreenspaces={setShowGreenspaces}
              projects={projects}
              wells={wells}
              sitesData={sitesData}
              filterCounts={filterCounts}
              corpProjectCounts={corpProjectCounts}
              corpFloodCounts={corpFloodCounts}
              filteredHotspotsList={filteredHotspotsList}
              handleSelectHotspotFromList={handleSelectHotspotFromList}
              loadingAssemblyConst2={loadingAssemblyConst2}
              loadingBengaluruAssembly={loadingBengaluruAssembly}
              loadingKarnatakaAssembly={loadingKarnatakaAssembly}
              loadingGbaWards={loadingGbaWards}
              loadingGbaCorporations={loadingGbaCorporations}
              loadingValleys={loadingValleys}
              loadingGreenspaces={loadingGreenspaces}
              loadingFloodHazard={loadingFloodHazard}
              loadingFloodingHotspots={loadingFloodingHotspots}
              searchText={searchText}
              setSearchText={setSearchText}
              filteredItems={filteredItems}
              handleSelectItem={handleSelectItem}
              isItemSelected={isItemSelected}
              showNewProjects={showNewProjects}
              setShowNewProjects={setShowNewProjects}
              setIsRightDeckOpen={setIsRightDeckOpen}
              loading={loading}
            />

            {/* Center / Right Section: Map & Details Pane */}
            <div className="flex flex-col gap-6 h-auto">
              {/* Main Leaflet Map Card with Ward / Locality Search Bar */}
              <div
                data-tour="map-view"
                className={`${selectedItem
                    ? "h-[520px] sm:h-[580px] xl:h-[620px]"
                    : "h-[calc(100vh-125px)] min-h-[660px]"
                  } shrink-0 bg-white border border-[#C8D7BC]/80 rounded-[20px] flex flex-col overflow-hidden shadow-sm transition-all duration-300`}
              >
                <div className="px-5 py-3 border-b border-slate-100 flex flex-wrap justify-between items-center bg-white gap-3 relative z-[1000]">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider m-0">
                      Bengaluru Map View
                    </h4>
                    {selectedBoundaryItem && (
                      <div
                        className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold shadow-2xs animate-[fadeIn_0.2s_ease-out]"
                        style={{
                          backgroundColor: selectedBoundaryItem.categoryBg,
                          color: selectedBoundaryItem.categoryColor,
                          border: `1px solid ${selectedBoundaryItem.categoryBorder}`,
                        }}
                      >
                        <span>{selectedBoundaryItem.name}</span>
                        <button
                          type="button"
                          onClick={handleClearSelectedBoundary}
                          title="Clear border highlight"
                          className="hover:opacity-75 font-black ml-0.5 cursor-pointer border-none bg-transparent"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Enhanced Layer Search & Dropdown Box */}
                  <MapBoundarySearch
                    searchDropdownContainerRef={searchDropdownContainerRef}
                    handleLocationSearch={handleLocationSearch}
                    selectedSearchCategory={selectedSearchCategory}
                    setSelectedSearchCategory={setSelectedSearchCategory}
                    locationSearchQuery={locationSearchQuery}
                    setLocationSearchQuery={setLocationSearchQuery}
                    isSearchDropdownOpen={isSearchDropdownOpen}
                    setIsSearchDropdownOpen={setIsSearchDropdownOpen}
                    filteredSearchItems={filteredSearchItems}
                    searchLayerItems={searchLayerItems}
                    handleSelectBoundaryItem={handleSelectBoundaryItem}
                  />
                </div>

                {searchError && (
                  <div className="px-5 py-1.5 bg-amber-50 text-amber-800 text-[11px] font-medium border-b border-amber-200 flex justify-between items-center">
                    <span>{searchError}</span>
                    <button
                      onClick={() => setSearchError(null)}
                      className="text-amber-600 hover:text-amber-900 font-bold cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                )}

                <div
                  className="leaflet-map-wrapper-inner"
                  style={{
                    position: "relative",
                    width: "100%",
                    height: "calc(100% - 54px)",
                  }}
                >
                  <div
                    ref={mapContainerRef}
                    className="leaflet-map-canvas"
                    style={{ width: "100%", height: "100%" }}
                  ></div>
                </div>
              </div>

              {/* Details Sidebar Pane — only displayed when a well, intervention, or point is actively selected */}
              <ItemDetailsPane
                selectedItem={selectedItem}
                setSelectedItem={setSelectedItem}
              />
            </div>

            {/* Right Side Section: Clicked Project Assets & Funding Deck */}
            <FundingDeckPanel
              showNewProjects={showNewProjects}
              activeProject={activeProject}
              isRightDeckOpen={isRightDeckOpen}
              setIsRightDeckOpen={setIsRightDeckOpen}
              selectAllAvailableAssets={selectAllAvailableAssets}
              clearAllSelections={clearAllSelections}
              selectedFundPicks={selectedFundPicks}
              committedPicks={committedPicks}
              toggleProjectAllAssets={toggleProjectAllAssets}
              toggleFundPick={toggleFundPick}
              setShowFunderModal={setShowFunderModal}
              setActiveDetailView={setActiveDetailView}
            />
          </div>

          {/* Funder Commitment & Term Sheet Modal */}
          <FunderModal
            showFunderModal={showFunderModal}
            setShowFunderModal={setShowFunderModal}
            fundSummary={fundSummary}
            selectedFundPicks={selectedFundPicks}
            cityProjectsList={cityProjectsList}
            funderFormData={funderFormData}
            setFunderFormData={setFunderFormData}
            committedPicks={committedPicks}
            setCommittedPicks={setCommittedPicks}
            commitSuccess={commitSuccess}
            setCommitSuccess={setCommitSuccess}
          />
        </div>
      </div>
    </TourProvider>
  );
};

export default DataLayersView;
