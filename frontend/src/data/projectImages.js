/**
 * Frontend Project Images Registry
 * 
 * 1-to-1 exact mapping for all database SiteProjects to their respective images.
 * Only exact matching by site_id is used.
 */
export const PROJECT_IMAGES = {
  // 1. Kadugodi tree park
  'kadugodi_tree_park': '/images/projects/Kadugodi tree park.png',

  // 2. Kadugodi forest children park
  'kadugodi_forest_children_park': '/images/projects/Kadugodi forest children_s park.png',

  // 3. Inner circle park
  'inner_circle_park': '/images/projects/Inner circle park.jpg',

  // 4. Pattandur agrahare 1 (No image yet)
  'pattandur_agrahare_1': '',

  // 5. Sheelavanthakerer lake (matches exact DB site_id and standard spelling)
  'sheelavanthakerer_lake': '/images/projects/Sheelavanthakere-Lake.jpg',

  // 6. Nallurhalli park
  'nallurhalli_park': '/images/projects/Nallurhalli Park.jpg',

  // 7. Hoodi lake
  'hoodi_lake': '/images/projects/Hoodi Lake.jpeg',

  // 8. Seetharampalya lake
  'seetharampalya_lake': '/images/projects/Seetharampalya Lake.jpeg',

  // 9. KTPO office
  'ktpo_office': '/images/projects/KTPO Office.png',

  // 10. GBA storm water drain- Inlet 2 to Nallurhalli Lake (No image yet)
  'gba_storm_water_drain_inlet_2_to_nallurhalli_lake': '',

  // 11. Pattandur agrahare 2 (No image yet)
  'pattandur_agrahare_2': '',

  // 12. Nallurhalli main road (No image yet)
  'nallurhalli_main_road': '',

  // 13. Borewell road (No image yet)
  'borewell_road': '',
};

/**
 * Returns the exact image URL for a given site, or empty string if not present.
 */
export function getProjectImage(site) {
  if (!site) return '';

  const siteId = String(site.site_id || site.id || '').trim();

  // 1. Exact match by site_id
  if (siteId && PROJECT_IMAGES[siteId] !== undefined) {
    return PROJECT_IMAGES[siteId] || '';
  }

  // 2. Explicit image_url from database if provided
  if (site.image_url && site.image_url.trim()) {
    return site.image_url.trim();
  }

  return '';
}
