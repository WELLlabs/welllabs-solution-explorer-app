import { useEffect, useState } from "react";
import api from "@/utils/api";
import floodPointsGeo from "@/data/flood_points.json";

const BUILT_IN_FEATURES = floodPointsGeo.features || [];

const toFeature = (h) => ({
  type: "Feature",
  geometry: { type: "Point", coordinates: [h.longitude, h.latitude] },
  properties: {
    id: `imported_${h.hotspotId}`,
    slNo: h.hotspotId,
    location: h.location,
    zone: h.zone || "",
    vulnerabilityLevel: h.vulnerabilityLevel || "",
    vulnerabilityCode: (h.vulnerabilityLevel || "").charAt(0),
    vulnerabilityMeasure: h.vulnerabilityMeasure || "",
    remarks: h.remarks || "",
    lat: h.latitude,
    lng: h.longitude,
  },
});

/** Built-in flood hotspots plus any imported by an admin. */
export const useFloodHotspots = () => {
  const [features, setFeatures] = useState(BUILT_IN_FEATURES);

  useEffect(() => {
    let cancelled = false;
    api
      .get("/flood-hotspots")
      .then(({ data }) => {
        if (!cancelled && Array.isArray(data) && data.length) {
          setFeatures([...BUILT_IN_FEATURES, ...data.map(toFeature)]);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return features;
};

export default useFloodHotspots;
