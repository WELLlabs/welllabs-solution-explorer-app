import borewellDelineationGeo from "@/data/borewell_road_delineation.json";
import { isPointInOrOnGeometry } from "@/utils/geoUtils";

/**
 * Surveyed catchment polygons drawn only after a hotspot inside one is clicked.
 * Add another GeoJSON feature here when the citywide delineation is ready.
 */
export const DELINEATED_CATCHMENTS = (borewellDelineationGeo?.features || []).map((feature, index) => ({
  id: feature.properties?.id || `catchment_${index}`,
  name: feature.properties?.name || feature.properties?.shortName || `Catchment ${index + 1}`,
  zone: feature.properties?.zone || "",
  description: feature.properties?.description || "",
  feature,
}));

export const findCatchmentForPoint = (lat, lng) => {
  if (lat == null || lng == null || Number.isNaN(lat) || Number.isNaN(lng)) return null;
  return (
    DELINEATED_CATCHMENTS.find((catchment) =>
      isPointInOrOnGeometry(lat, lng, catchment.feature?.geometry)
    ) || null
  );
};
