import { useEffect } from "react";
import L from "leaflet";
import gbaCorporationsGeo from "@/data/gba_corporations.json";
import floodPointsGeo from "@/data/flood_points.json";
import { getCorporationForPoint, isPointInGeometry } from "../utils/geoUtils";

export const useBoundaryLayers = ({
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
}) => {
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const getFloodHazardStyle = (floodMean) => {
      if (floodMean === null || floodMean === undefined || isNaN(floodMean)) {
        return {
          color: "#94a3b8",
          fillColor: "#cbd5e1",
          fillOpacity: 0.35,
          level: "Unrated",
          range: "N/A",
          badgeColor: "#475569",
          badgeBg: "#f1f5f9",
        };
      }
      // 1. Red: 0.543 - 0.667 (Very High)
      if (floodMean >= 0.543) {
        return {
          color: "#b91c1c",
          fillColor: "#ef4444",
          fillOpacity: 0.65,
          level: "Very High Hazard",
          range: "0.543 – 0.667",
          badgeColor: "#991b1b",
          badgeBg: "#fee2e2",
        };
      }
      // 2. Orange: 0.497 - 0.543 (High)
      if (floodMean >= 0.497) {
        return {
          color: "#c2410c",
          fillColor: "#f97316",
          fillOpacity: 0.58,
          level: "High Hazard",
          range: "0.497 – 0.543",
          badgeColor: "#c2410c",
          badgeBg: "#ffedd5",
        };
      }
      // 3. Light Yellow: 0.456 - 0.497 (Moderate)
      if (floodMean >= 0.456) {
        return {
          color: "#ca8a04",
          fillColor: "#fde047",
          fillOpacity: 0.55,
          level: "Moderate Hazard",
          range: "0.456 – 0.497",
          badgeColor: "#854d0e",
          badgeBg: "#fef9c3",
        };
      }
      // 4. Light Green: 0.416 - 0.456 (Low)
      if (floodMean >= 0.416) {
        return {
          color: "#4d7c0f",
          fillColor: "#84cc16",
          fillOpacity: 0.5,
          level: "Low Hazard",
          range: "0.416 – 0.456",
          badgeColor: "#3f6212",
          badgeBg: "#ecfccb",
        };
      }
      // 5. Green: 0.000 - 0.416 (Very Low)
      return {
        color: "#14532d",
        fillColor: "#16a34a",
        fillOpacity: 0.45,
        level: "Very Low Hazard",
        range: "0.000 – 0.416",
        badgeColor: "#14532d",
        badgeBg: "#dcfce7",
      };
    };

    const addGeoJsonLayer = (
      data,
      layerRef,
      color,
      layerType = "assembly",
      weight = 2,
      fillOpacity = 0.05,
    ) => {
      if (layerRef.current) return;

      const targetPane =
        layerType === "gba_corporations"
          ? "corporationsPane"
          : layerType === "flood_hazard" ||
            layerType === "valleys" ||
            layerType === "greenspaces"
          ? "catchmentsPane"
          : "baseBoundariesPane";

      const layer = L.geoJSON(data, {
        pane: targetPane,
        smoothFactor: 0,
        style: (feature) => {
          if (layerType === "flood_hazard") {
            const hazard = getFloodHazardStyle(feature?.properties?._Floodmean);
            return {
              color: hazard.color,
              weight: 1.0,
              opacity: 0.9,
              fillColor: hazard.fillColor,
              fillOpacity: hazard.fillOpacity,
            };
          }
          return {
            color: color,
            weight: weight,
            opacity: 0.65,
            fillColor: color,
            fillOpacity: fillOpacity,
          };
        },
        onEachFeature: (feature, leafletLayer) => {
          const props = feature.properties || {};
          let popupContent = "";

          if (layerType === "flood_hazard") {
            const floodMean = props._Floodmean;
            const hazard = getFloodHazardStyle(floodMean);

            const corpsList =
              props.corporations && props.corporations.length > 0
                ? props.corporations.join(", ")
                : props.corporations_str || props.corporation || "BBMP";

            const wardsList =
              props.wards && props.wards.length > 0
                ? props.wards.join(", ")
                : props.wards_str || props.wardName || "N/A";

            popupContent = `
              <div class="font-sans min-w-[220px] max-w-[280px] bg-white text-slate-800 text-left">
                <div style="background-color: ${hazard.fillColor};" class="px-3.5 py-2.5 pr-8 border-b border-black/10">
                  <h4 class="m-0 text-sm font-black text-black tracking-tight leading-tight">Flood Hazard Index</h4>
                </div>
                <div class="p-3 flex flex-col gap-2 text-xs leading-normal">
                  <div class="flex flex-col gap-0.5">
                    <span class="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Corporation Name:</span>
                    <span class="font-bold text-slate-900 text-[11.5px]">${corpsList}</span>
                  </div>
                  <div class="flex flex-col gap-0.5">
                    <span class="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Ward Name:</span>
                    <span class="font-semibold text-slate-800 text-[11.5px]">${wardsList}</span>
                  </div>
                  <div class="flex items-center justify-between pt-1.5 border-t border-slate-100">
                    <span class="font-semibold text-slate-600">Flood Index:</span>
                    <strong class="font-bold text-slate-900 text-xs">${typeof floodMean === "number" ? floodMean.toFixed(3) : "—"}</strong>
                  </div>
                  <div class="flex items-center justify-between pt-1 border-t border-slate-100">
                    <span class="font-semibold text-slate-600">Hazard Class:</span>
                    <span style="background-color: ${hazard.fillColor}25; color: ${hazard.color}; border: 1px solid ${hazard.color}50;" class="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md">
                      ${hazard.level}
                    </span>
                  </div>
                </div>
              </div>
            `;

            leafletLayer.bindPopup(popupContent, {
              className: "flood-hazard-popup-container",
              closeButton: true,
            });

            leafletLayer.on("popupopen", (e) => {
              const popupEl = e.popup.getElement();
              if (popupEl) {
                const wrapper = popupEl.querySelector(
                  ".leaflet-popup-content-wrapper",
                );
                const content = popupEl.querySelector(".leaflet-popup-content");
                const tip = popupEl.querySelector(".leaflet-popup-tip");
                const closeBtn = popupEl.querySelector(
                  ".leaflet-popup-close-button",
                );

                if (wrapper) {
                  wrapper.className +=
                    " !p-0 !rounded-xl !overflow-hidden !shadow-2xl !bg-white";
                  wrapper.style.border = "1px solid rgba(0,0,0,0.1)";
                }
                if (content) {
                  content.className += " !m-0 !leading-relaxed";
                }
                if (tip) {
                  tip.className += " !bg-white";
                }
                if (closeBtn) {
                  closeBtn.className +=
                    " !text-black !top-2 !right-2.5 !font-black !text-base !p-0 !w-5 !h-5 !flex !items-center !justify-center hover:!opacity-70";
                }
              }
            });
          } else if (layerType === "gba_wards") {
            const wardName = props.wardName || "Unknown Ward";
            const wardNameKn = props.wardNameKn || "";
            const wardId = props.wardId || "N/A";
            const ac = props.ac || "N/A";
            const corp = props.corporation || "N/A";
            popupContent = `
              <div style="display: flex; flex-direction: column; text-align: left; padding: 4px; font-family: system-ui, -apple-system, sans-serif;">
                <span style="font-size: 8.5px; font-weight: 800; letter-spacing: 0.5px; padding: 3px 6px; border-radius: 4px; align-self: flex-start; margin-bottom: 6px; text-transform: uppercase; background-color: ${color}20; color: ${color};">GBA WARD BOUNDARY</span>
                <h4 style="margin: 0 0 4px 0; font-size: 13.5px; font-weight: 700; color: #0f172a;">${wardName}</h4>
                <p style="margin: 4px 0 0 0; font-size: 11px; color: #64748b;">🏢 Corporation: <strong>${corp}</strong></p>
                <p style="margin: 2px 0 0 0; font-size: 11px; color: #64748b;">🗳️ Assembly: <strong>${ac}</strong></p>
                <p style="margin: 2px 0 0 0; font-size: 11px; color: #64748b;">🔑 Ward ID: <strong>${wardId}</strong></p>
              </div>
            `;
            leafletLayer.bindPopup(popupContent);
          } else if (layerType === "gba_corporations") {
            const name = props.name || "Unknown Corporation";
            const id = props.id || "N/A";
            popupContent = `
              <div style="display: flex; flex-direction: column; text-align: left; padding: 4px; font-family: system-ui, -apple-system, sans-serif;">
                <span style="font-size: 8.5px; font-weight: 800; letter-spacing: 0.5px; padding: 3px 6px; border-radius: 4px; align-self: flex-start; margin-bottom: 6px; text-transform: uppercase; background-color: ${color}20; color: ${color};">GBA CORPORATION</span>
                <h4 style="margin: 0 0 4px 0; font-size: 13.5px; font-weight: 700; color: #0f172a;">${name} Zone</h4>
                <p style="margin: 4px 0 0 0; font-size: 11px; color: #64748b;">🔑 Zone ID: <strong>${id}</strong></p>
              </div>
            `;
            leafletLayer.bindPopup(popupContent);
          } else if (layerType === "valleys") {
            const name = props.name || "Unknown Valley";
            const area = props.area ? (props.area / 1000000).toFixed(2) : "N/A";
            popupContent = `
              <div style="display: flex; flex-direction: column; text-align: left; padding: 4px; font-family: system-ui, -apple-system, sans-serif;">
                <span style="font-size: 8.5px; font-weight: 800; letter-spacing: 0.5px; padding: 3px 6px; border-radius: 4px; align-self: flex-start; margin-bottom: 6px; text-transform: uppercase; background-color: ${color}20; color: ${color};">VALLEY WATERSHED</span>
                <h4 style="margin: 0 0 4px 0; font-size: 13.5px; font-weight: 700; color: #0f172a;">${name}</h4>
                <p style="margin: 4px 0 0 0; font-size: 11px; color: #64748b;">📐 Catchment Area: <strong>${area} km²</strong></p>
              </div>
            `;
            leafletLayer.bindPopup(popupContent);
          } else if (layerType === "greenspaces") {
            const name = props.name || "Unnamed Greenspace";
            const nameKn = props.nameKn || "";
            popupContent = `
              <div style="display: flex; flex-direction: column; text-align: left; padding: 4px; font-family: system-ui, -apple-system, sans-serif;">
                <span style="font-size: 8.5px; font-weight: 800; letter-spacing: 0.5px; padding: 3px 6px; border-radius: 4px; align-self: flex-start; margin-bottom: 6px; text-transform: uppercase; background-color: ${color}20; color: ${color};">GREENSPACE / RESERVOIR</span>
                <h4 style="margin: 0 0 4px 0; font-size: 13.5px; font-weight: 700; color: #0f172a;">${name} ${nameKn ? `(${nameKn})` : ""}</h4>
              </div>
            `;
            leafletLayer.bindPopup(popupContent);
          } else {
            const acName =
              props.AC_NAME ||
              props.ac_name ||
              props.Name ||
              "Unknown Assembly";
            const acNameKn = props.AC_NAME_KN || "";
            const acCode = props.AC_CODE || props.ac_code || "N/A";
            const district = props.KGISDistri || props.district || "N/A";
            popupContent = `
              <div style="display: flex; flex-direction: column; text-align: left; padding: 4px; font-family: system-ui, -apple-system, sans-serif;">
                <span style="font-size: 8.5px; font-weight: 800; letter-spacing: 0.5px; padding: 3px 6px; border-radius: 4px; align-self: flex-start; margin-bottom: 6px; text-transform: uppercase; background-color: ${color}20; color: ${color};">ASSEMBLY BOUNDARY</span>
                <h4 style="margin: 0 0 4px 0; font-size: 13.5px; font-weight: 700; color: #0f172a;">${acName}</h4>
                <p style="margin: 4px 0 0 0; font-size: 11px; color: #64748b;">🔑 AC Code: <strong>${acCode}</strong></p>
                <p style="margin: 2px 0 0 0; font-size: 11px; color: #64748b;">📍 District Code: <strong>${district}</strong></p>
              </div>
            `;
            leafletLayer.bindPopup(popupContent);
          }

          leafletLayer.on("click", () => {
            const props = feature.properties || {};
            let regionName =
              props.AC_NAME ||
              props.ac_name ||
              props.Name ||
              props.wardName ||
              props.name ||
              "Unknown Region";

            // 1. Spatial matching using geometry
            const matchingWells = (wellsRef.current || []).filter((w) =>
              isPointInGeometry(w.lat, w.lng, feature.geometry),
            );
            const matchingProjects = (projectsRef.current || []).filter((p) =>
              isPointInGeometry(p.lat, p.lng, feature.geometry),
            );

            // 2. Attribute-based matching as fallback/addition
            let attrMatchingWells = [];
            let attrMatchingProjects = [];

            if (layerType === "gba_wards") {
              const wName = (props.wardName || "").toLowerCase().trim();
              const wId = String(props.wardId || "").trim();
              attrMatchingWells = (wellsRef.current || []).filter(
                (w) =>
                  (w.wardName && w.wardName.toLowerCase().trim() === wName) ||
                  (w.wardId && String(w.wardId).trim() === wId),
              );
              attrMatchingProjects = (projectsRef.current || []).filter(
                (p) =>
                  (p.wardName && p.wardName.toLowerCase().trim() === wName) ||
                  (p.wardId && String(p.wardId).trim() === wId),
              );
            } else if (layerType === "gba_corporations") {
              const corpName = (props.name || "").toLowerCase().trim();
              attrMatchingWells = (wellsRef.current || []).filter(
                (w) =>
                  w.corporation &&
                  w.corporation.toLowerCase().trim().includes(corpName),
              );
              attrMatchingProjects = (projectsRef.current || []).filter(
                (p) =>
                  p.corporation &&
                  p.corporation.toLowerCase().trim().includes(corpName),
              );
            } else if (layerType === "assembly") {
              const acName = (
                props.AC_NAME ||
                props.ac_name ||
                props.Name ||
                ""
              )
                .toLowerCase()
                .trim();
              attrMatchingWells = (wellsRef.current || []).filter(
                (w) => w.ac && w.ac.toLowerCase().trim() === acName,
              );
              attrMatchingProjects = (projectsRef.current || []).filter(
                (p) => p.ac && p.ac.toLowerCase().trim() === acName,
              );
            }

            // Union matching lists (deduplicating by identifier)
            const getUniqueAssets = (spatialList, attrList) => {
              const map = new Map();
              spatialList.forEach((item) =>
                map.set(
                  item._id || item._mb_row_id || item.wellName || item.projName,
                  item,
                ),
              );
              attrList.forEach((item) =>
                map.set(
                  item._id || item._mb_row_id || item.wellName || item.projName,
                  item,
                ),
              );
              return Array.from(map.values());
            };

            const finalWells = getUniqueAssets(
              matchingWells,
              attrMatchingWells,
            );
            const finalProjects = getUniqueAssets(
              matchingProjects,
              attrMatchingProjects,
            );

            console.log(
              `%c🗺️ [REGION LAYER CLICK] - Type: ${layerType.toUpperCase()}`,
              "color: #0284c7; font-weight: bold; font-size: 14px;",
            );
            console.log("Region Name:", regionName);
            const filteredProps = { ...props };
            delete filteredProps.wardNameKn;
            delete filteredProps.acKn;
            console.log("Region Properties:", filteredProps);
            console.log(
              `Assets present in this region (Total: ${finalWells.length + finalProjects.length}):`,
            );
            console.log(`- Wells (${finalWells.length}):`, finalWells);
            console.log(`- Projects (${finalProjects.length}):`, finalProjects);

            if (layerType === "gba_corporations") {
              const corpName = props.name || "Corporation";
              setSelectedItem({
                isCorporation: true,
                name: `${corpName} Corporation`,
                zoneName: corpName,
                color: color,
                projectsCount: corpProjectCounts[corpName] || finalProjects.length || 0,
                floodCount: corpFloodCounts[corpName] || 0,
                regionId: props.id || "",
              });
            }
          });

          leafletLayer.on("mouseover", () => {
            if (layerType === "flood_hazard") {
              leafletLayer.setStyle({
                fillOpacity: 0.85,
                weight: 1.0,
              });
            } else {
              leafletLayer.setStyle({
                fillOpacity: fillOpacity + 0.08,
                weight: weight + 1,
              });
            }
          });

          leafletLayer.on("mouseout", () => {
            if (layerType === "flood_hazard") {
              const hazard = getFloodHazardStyle(
                feature?.properties?._Floodmean,
              );
              leafletLayer.setStyle({
                fillOpacity: hazard.fillOpacity,
                weight: 1.0,
              });
            } else {
              leafletLayer.setStyle({
                fillOpacity: fillOpacity,
                weight: weight,
              });
            }
          });
        },
      }).addTo(map);

      layerRef.current = layer;

      // Fit map boundaries automatically
      try {
        const bounds = layer.getBounds();
        if (bounds.isValid()) {
          map.flyToBounds(bounds, {
            padding: [40, 40],
            animate: true,
            duration: 1.2,
          });
        }
      } catch (e) {
        console.warn("Could not zoom to layer bounds:", e);
      }
    };

    // Layer 1: assemblyConst2 (General Assembly Boundaries)
    if (showAssemblyConst2) {
      if (!assemblyConst2LayerRef.current) {
        setLoadingAssemblyConst2(true);
        import("@/data/assembly_const2/assembly_const2.json")
          .then((mod) => {
            addGeoJsonLayer(
              mod.default,
              assemblyConst2LayerRef,
              "#a855f7",
              "assembly",
              1.8,
              0.06,
            ); // Violet
            setLoadingAssemblyConst2(false);
          })
          .catch((err) => {
            console.error("Failed to load Assembly Boundaries layer:", err);
            setLoadingAssemblyConst2(false);
          });
      }
    } else {
      if (assemblyConst2LayerRef.current) {
        map.removeLayer(assemblyConst2LayerRef.current);
        assemblyConst2LayerRef.current = null;
      }
    }

    // Layer 2: bengaluruAssembly (Bengaluru Assemblies Map)
    if (showBengaluruAssembly) {
      if (!bengaluruAssemblyLayerRef.current) {
        setLoadingBengaluruAssembly(true);
        import("@/data/assembly_const2/bengaluru_assembly_const.json")
          .then((mod) => {
            addGeoJsonLayer(
              mod.default,
              bengaluruAssemblyLayerRef,
              "#3b82f6",
              "assembly",
              1.8,
              0.06,
            ); // Blue
            setLoadingBengaluruAssembly(false);
          })
          .catch((err) => {
            console.error(
              "Failed to load Bengaluru Assembly Boundaries layer:",
              err,
            );
            setLoadingBengaluruAssembly(false);
          });
      }
    } else {
      if (bengaluruAssemblyLayerRef.current) {
        map.removeLayer(bengaluruAssemblyLayerRef.current);
        bengaluruAssemblyLayerRef.current = null;
      }
    }

    // Layer 3: karnatakaAssembly (Karnataka Assemblies Map)
    if (showKarnatakaAssembly) {
      if (!karnatakaAssemblyLayerRef.current) {
        setLoadingKarnatakaAssembly(true);
        import("@/data/assembly_const2/karnataka_assembly_const.json")
          .then((mod) => {
            addGeoJsonLayer(
              mod.default,
              karnatakaAssemblyLayerRef,
              "#10b981",
              "assembly",
              1.2,
              0.03,
            ); // Green
            setLoadingKarnatakaAssembly(false);
          })
          .catch((err) => {
            console.error(
              "Failed to load Karnataka Assembly Boundaries layer:",
              err,
            );
            setLoadingKarnatakaAssembly(false);
          });
      }
    } else {
      if (karnatakaAssemblyLayerRef.current) {
        map.removeLayer(karnatakaAssemblyLayerRef.current);
        karnatakaAssemblyLayerRef.current = null;
      }
    }

    // Layer 4: GBA Wards Boundary
    if (showGbaWards) {
      if (!gbaWardsLayerRef.current) {
        setLoadingGbaWards(true);
        import("@/data/gba_wards.json")
          .then((mod) => {
            addGeoJsonLayer(
              mod.default,
              gbaWardsLayerRef,
              "#f43f5e",
              "gba_wards",
              1.8,
              0.06,
            ); // Rose
            setLoadingGbaWards(false);
          })
          .catch((err) => {
            console.error("Failed to load GBA Wards Boundaries layer:", err);
            setLoadingGbaWards(false);
          });
      }
    } else {
      if (gbaWardsLayerRef.current) {
        map.removeLayer(gbaWardsLayerRef.current);
        gbaWardsLayerRef.current = null;
      }
    }

    // Layer 5: GBA Corporations Boundary
    if (showGbaCorporations) {
      if (!gbaCorporationsLayerRef.current) {
        addGeoJsonLayer(
          gbaCorporationsGeo,
          gbaCorporationsLayerRef,
          "#db2777",
          "gba_corporations",
          2.2,
          0.22,
        ); // Deep Rose/Pink
      }
    } else {
      if (gbaCorporationsLayerRef.current) {
        map.removeLayer(gbaCorporationsLayerRef.current);
        gbaCorporationsLayerRef.current = null;
      }
    }

    // Layer 6: Valleys Boundary
    if (showValleys) {
      if (!valleysLayerRef.current) {
        setLoadingValleys(true);
        import("@/data/valleys.json")
          .then((mod) => {
            addGeoJsonLayer(
              mod.default,
              valleysLayerRef,
              "#06b6d4",
              "valleys",
              1.8,
              0.06,
            ); // Cyan
            setLoadingValleys(false);
          })
          .catch((err) => {
            console.error("Failed to load Valleys layer:", err);
            setLoadingValleys(false);
          });
      }
    } else {
      if (valleysLayerRef.current) {
        map.removeLayer(valleysLayerRef.current);
        valleysLayerRef.current = null;
      }
    }

    // Layer 7: Greenspaces Boundary
    if (showGreenspaces) {
      if (!greenspacesLayerRef.current) {
        setLoadingGreenspaces(true);
        import("@/data/greenspaces.json")
          .then((mod) => {
            addGeoJsonLayer(
              mod.default,
              greenspacesLayerRef,
              "#15803d",
              "greenspaces",
              1.5,
              0.22,
            ); // Forest Green
            setLoadingGreenspaces(false);
          })
          .catch((err) => {
            console.error("Failed to load Greenspaces layer:", err);
            setLoadingGreenspaces(false);
          });
      }
    } else {
      if (greenspacesLayerRef.current) {
        map.removeLayer(greenspacesLayerRef.current);
        greenspacesLayerRef.current = null;
      }
    }

    // Layer 8: Flood Hazard Map (JasinS)
    if (showNewFloodRisk) {
      if (!floodHazardLayerRef.current) {
        setLoadingFloodHazard(true);
        import("@/data/flood_hazard_jasin.json")
          .then((mod) => {
            addGeoJsonLayer(
              mod.default,
              floodHazardLayerRef,
              "#ef4444",
              "flood_hazard",
              1.5,
              0.48,
            );
            setLoadingFloodHazard(false);
          })
          .catch((err) => {
            console.error("Failed to load Flood Hazard Map layer:", err);
            setLoadingFloodHazard(false);
          });
      }
    } else {
      if (floodHazardLayerRef.current) {
        map.removeLayer(floodHazardLayerRef.current);
        floodHazardLayerRef.current = null;
      }
    }

    // Corporation boundaries for Browse by corporations or Browse by flood hotspots
    if (browseByCorporations || browseByHotspots) {
      if (corpBrowseLayerRef.current) {
        map.removeLayer(corpBrowseLayerRef.current);
        corpBrowseLayerRef.current = null;
      }

      const activeRegions = new Set();
      if (browseByCorporations) {
        Object.entries(selectedCorpRegions).forEach(([r, active]) => {
          if (active) activeRegions.add(r);
        });
      }
      if (browseByHotspots) {
        Object.entries(selectedHotspotRegions).forEach(([r, active]) => {
          if (active) activeRegions.add(r);
        });
      }

      const filteredFeatures = (gbaCorporationsGeo.features || []).filter((f) =>
        activeRegions.has(f.properties?.name)
      );

      if (filteredFeatures.length > 0) {
        const corpColors = {
          East: "#2563eb",
          West: "#059669",
          North: "#7c3aed",
          South: "#ea580c",
          Central: "#db2777",
        };

        const corpLayer = L.geoJSON(
          { type: "FeatureCollection", features: filteredFeatures },
          {
            pane: "corporationsPane",
            style: (feature) => {
              const name = feature?.properties?.name || "";
              const c = corpColors[name] || "#2563eb";
              return {
                color: c,
                weight: 2.2,
                opacity: 0.9,
                fillColor: c,
                fillOpacity: 0.28,
              };
            },
            onEachFeature: (feature, layer) => {
              const name = feature.properties?.name || "Corporation";
              const c = corpColors[name] || "#2563eb";
              const pCount = corpProjectCounts[name] || 0;
              const fCount = corpFloodCounts[name] || 0;
              layer.bindPopup(`
                <div style="font-family: system-ui, -apple-system, sans-serif; text-align: left; padding: 6px; min-width: 200px;">
                  <div style="display: flex; align-items: center; justify-content: space-between; gap: 6px; margin-bottom: 5px;">
                    <span style="font-size: 8.5px; font-weight: 800; letter-spacing: 0.5px; padding: 2px 6px; border-radius: 4px; background: ${c}18; color: ${c}; text-transform: uppercase;">
                      GBA CORPORATION
                    </span>
                    <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: ${c}; border: 1.5px solid #fff; box-shadow: 0 1px 3px rgba(0,0,0,0.3);"></span>
                  </div>
                  <h4 style="margin: 0; font-size: 14px; font-weight: 800; color: #0f172a;">
                    ${name} Zone
                  </h4>
                  <p style="margin: 4px 0 8px 0; font-size: 11px; color: #64748b;">
                    Greater Bengaluru Authority Region
                  </p>
                  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 6px 8px; margin-bottom: 6px;">
                    <div>
                      <span style="font-size: 9px; color: #64748b; font-weight: 600; text-transform: uppercase; display: block;">Projects</span>
                      <strong style="font-size: 13.5px; color: #2563eb;">${pCount}</strong>
                    </div>
                    <div>
                      <span style="font-size: 9px; color: #64748b; font-weight: 600; text-transform: uppercase; display: block;">Flood Spots</span>
                      <strong style="font-size: 13.5px; color: #ea580c;">${fCount}</strong>
                    </div>
                  </div>
                  <span style="font-size: 9.5px; color: #94a3b8; display: block; font-weight: 600;">Click on map markers to view specific project details</span>
                </div>
              `);

              layer.on({
                click: () => {
                  setSelectedItem({
                    isCorporation: true,
                    name: `${name} Corporation`,
                    zoneName: name,
                    color: c,
                    projectsCount: pCount,
                    floodCount: fCount,
                    regionId: feature.properties?.id || "",
                  });
                },
                mouseover: (e) => {
                  const l = e.target;
                  l.setStyle({
                    weight: 3.5,
                    fillOpacity: 0.38,
                  });
                },
                mouseout: (e) => {
                  corpLayer.resetStyle(e.target);
                },
              });
            },
          }
        );
        corpLayer.addTo(map);
        corpBrowseLayerRef.current = corpLayer;
      }
    } else {
      if (corpBrowseLayerRef.current) {
        map.removeLayer(corpBrowseLayerRef.current);
        corpBrowseLayerRef.current = null;
      }
    }

    // Layer 9: Flooding Hotspots (Points + Delineated Catchment Boundary)
    if (showFloodingHotspots || browseByHotspots) {
      if (floodingHotspotsLayerRef.current) {
        map.removeLayer(floodingHotspotsLayerRef.current);
        floodingHotspotsLayerRef.current = null;
      }

      setLoadingFloodingHotspots(true);
      import("@/data/borewell_road_delineation.json")
        .then((delineationMod) => {
          const geojsonData = floodPointsGeo;
          const delineationData = delineationMod.default;
          const pointsGroup = L.layerGroup();

          // 1. Render Delineated Catchment Boundary Polygon
          if (delineationData) {
            const boundaryLayer = L.geoJSON(delineationData, {
              pane: "catchmentsPane",
              style: {
                color: "#c2410c",
                weight: 3.0,
                opacity: 0.95,
                dashArray: "6, 4",
                fillColor: "#f97316",
                fillOpacity: 0.24,
              },
              onEachFeature: (feat, layer) => {
                const props = feat.properties || {};
                layer.bindPopup(`
                  <div style="font-family: system-ui, -apple-system, sans-serif; text-align: left; min-width: 230px; max-width: 290px; padding: 4px;">
                    <span style="font-size: 8.5px; font-weight: 800; letter-spacing: 0.5px; padding: 3px 6px; border-radius: 4px; background: #fef3c7; color: #92400e; text-transform: uppercase;">
                      DELINEATED CATCHMENT BOUNDARY
                    </span>
                    <h4 style="margin: 4px 0 2px 0; font-size: 13.5px; font-weight: 750; color: #0f172a;">
                      ${props.name || "Borewell Road Catchment Boundary"}
                    </h4>
                    <p style="margin: 2px 0 0 0; font-size: 11px; color: #64748b;">
                      🏢 Zone: <strong>${props.zone || "Mahadevapura / Whitefield"}</strong>
                    </p>
                    <p style="margin: 2px 0 0 0; font-size: 11px; color: #64748b;">
                      📐 Type: <strong>${props.type || "Delineated Flood Micro-Basin"}</strong>
                    </p>
                    <p style="margin: 6px 0 0 0; font-size: 10.5px; color: #475569; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 6px 8px; line-height: 1.4;">
                      ${props.description || "Hydrologically delineated micro-catchment boundary for the Borewell Road flooding hotspot."}
                    </p>
                  </div>
                `);
              },
            });
            boundaryLayer.addTo(pointsGroup);
          }

          // 2. Render Flood Hotspot Points
          const featuresToRender = (geojsonData.features || []).filter((feat) => {
            const props = feat.properties || {};
            const lat = props.lat;
            const lng = props.lng;
            if (!lat || !lng || isNaN(lat) || isNaN(lng)) return false;

            // If top layer is enabled, show all hotspots (do not care about region)
            if (showFloodingHotspots) return true;

            // Otherwise, filter by selectedHotspotRegions
            if (browseByHotspots) {
              const corp = getCorporationForPoint(lat, lng, props.zone || "");
              return !!selectedHotspotRegions[corp];
            }

            return false;
          });

          // Clear previous references
          hotspotMarkersMapRef.current = {};
          primaryHotspotMarkerRef.current = null;

          featuresToRender.forEach((feat) => {
            const props = feat.properties || {};
            const lat = props.lat;
            const lng = props.lng;
            if (!lat || !lng || isNaN(lat) || isNaN(lng)) return;

            const isHigh =
              props.vulnerabilityLevel === "High" ||
              props.vulnerabilityCode === "H";
            const color = isHigh ? "#ef4444" : "#f59e0b";
            const fillColor = isHigh ? "#dc2626" : "#ea580c";
            const badgeBg = isHigh ? "#fee2e2" : "#fef3c7";
            const badgeColor = isHigh ? "#991b1b" : "#92400e";

            const marker = L.circleMarker([lat, lng], {
              pane: "hotspotsPane",
              radius: isHigh ? 9 : 7.5,
              fillColor: fillColor,
              color: "#ffffff",
              weight: 2.5,
              opacity: 1.0,
              fillOpacity: 0.95,
            });

            marker.on("click", () => {
              setSelectedItem({
                isHotspot: true,
                id: props.id || props.location,
                name: props.location || "Unnamed Hotspot",
                location: props.location,
                zone: props.zone || "N/A",
                vulnerabilityLevel:
                  props.vulnerabilityLevel ||
                  (isHigh ? "High" : "Moderate"),
                vulnerabilityCode: props.vulnerabilityCode || (isHigh ? "H" : "M"),
                vulnerabilityMeasure: props.vulnerabilityMeasure || "",
                remarks: props.remarks || "",
                reducedLevel: props.reducedLevel || "",
                lat,
                lng,
                corp: getCorporationForPoint(lat, lng, props.zone || ""),
              });
              map.setView([lat, lng], 14);
            });

            marker.on("mouseover", () => {
              marker.setStyle({
                radius: isHigh ? 11 : 9.5,
                weight: 3.5,
              });
            });
            marker.on("mouseout", () => {
              marker.setStyle({
                radius: isHigh ? 9 : 7.5,
                weight: 2.5,
              });
            });

            marker.on("add", () => {
              const el = marker.getElement();
              if (el && isHigh && !document.querySelector('[data-tour="hotspot-map-target"]')) {
                el.setAttribute("data-tour", "hotspot-map-target");
              }
            });

            const popupHtml = `
              <div style="display: flex; flex-direction: column; text-align: left; padding: 4px; font-family: system-ui, -apple-system, sans-serif; min-width: 220px; max-width: 280px;">
                <span style="font-size: 8.5px; font-weight: 800; letter-spacing: 0.5px; padding: 3px 6px; border-radius: 4px; align-self: flex-start; margin-bottom: 6px; text-transform: uppercase; background-color: ${badgeBg}; color: ${badgeColor};">
                  ${isHigh ? "🚨 HIGH VULNERABILITY" : "⚠️ MODERATE VULNERABILITY"}
                </span>
                <h4 style="margin: 0 0 4px 0; font-size: 13.5px; font-weight: 750; color: #0f172a; line-height: 1.3;">
                  ${props.location || "Unnamed Hotspot"}
                </h4>
                <p style="margin: 2px 0 0 0; font-size: 11px; color: #64748b;">
                  🏢 Zone: <strong style="color: #334155;">${props.zone || "N/A"}</strong>
                </p>
                ${props.remarks
                ? `
                  <div style="margin: 6px 0 0 0; font-size: 11px; color: #475569; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 6px 8px;">
                    <strong>Remarks / Status:</strong><br/>
                    <span style="color: #64748b;">${props.remarks}</span>
                  </div>
                `
                : ""
              }
                ${props.vulnerabilityMeasure
                ? `
                  <p style="margin: 4px 0 0 0; font-size: 10.5px; color: #64748b;">
                    📏 Measure: <strong>${props.vulnerabilityMeasure}</strong>
                  </p>
                `
                : ""
              }
                ${props.reducedLevel
                ? `
                  <p style="margin: 2px 0 0 0; font-size: 10.5px; color: #64748b;">
                    📐 Reduced Level (RL): <strong>${props.reducedLevel} m</strong>
                  </p>
                `
                : ""
              }
                <p style="margin: 6px 0 0 0; font-size: 9.5px; color: #94a3b8; border-top: 1px dashed #e2e8f0; padding-top: 4px;">
                  📍 Lat: ${lat.toFixed(5)}°, Lng: ${lng.toFixed(5)}°
                </p>
              </div>
            `;

            marker.bindPopup(popupHtml);
            marker.addTo(pointsGroup);

            // Record hotspot markers & designate primary high vulnerability hotspot
            if (isHigh) {
              if (
                !primaryHotspotMarkerRef.current ||
                props.location === "Varthur" ||
                props.zone === "MAHADEVAPURA"
              ) {
                primaryHotspotMarkerRef.current = marker;
              }
            }
            if (props.id) {
              hotspotMarkersMapRef.current[props.id] = marker;
            }
            if (props.location) {
              hotspotMarkersMapRef.current[props.location] = marker;
            }
          });

          if (!primaryHotspotMarkerRef.current && Object.values(hotspotMarkersMapRef.current).length > 0) {
            primaryHotspotMarkerRef.current = Object.values(hotspotMarkersMapRef.current)[0];
          }

          pointsGroup.addTo(map);
          floodingHotspotsLayerRef.current = pointsGroup;
          setLoadingFloodingHotspots(false);
          if (mapRef.current) {
            mapRef.current.invalidateSize({ pan: false });
          }
        })
        .catch((err) => {
          console.error("Failed to load Flooding Hotspots layer:", err);
          setLoadingFloodingHotspots(false);
        });
    } else {
      if (floodingHotspotsLayerRef.current) {
        map.removeLayer(floodingHotspotsLayerRef.current);
        floodingHotspotsLayerRef.current = null;
      }
    }
  }, [
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
  ]);
};

export default useBoundaryLayers;
