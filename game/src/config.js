// Neon Harbor shared tuning: world size, road layout, palette and gameplay numbers.
// Every other module reads its constants from here so the city stays consistent.
export const WORLD_W = 2400;
export const WORLD_H = 1800;
export const ROAD_W = 128;
export const AVENUES_X = [280, 680, 1080, 1480, 1880];
export const STREETS_Y = [280, 680, 1080, 1480];
export const BEACH_X = 2060;
export const WATER_X = 2180;
export const STEP = 1 / 60;
export const VIEW_W = 1280;
export const VIEW_H = 720;
export const PLAYER_SPEED = 168;
export const PLAYER_RUN = 252;
export const PED_SPEED = 62;
export const SAVE_KEY = 'neon-harbor-save-v1';
export const COLORS = {
  sky: '#2b1a3e', road: '#33304a', roadEdge: '#ffd166', lane: '#f4f1de',
  sidewalk: '#5b5470', grass: '#2e6e5e', sand: '#e9c46a', water: '#1d6f8e',
  waterDeep: '#14506b', buildingRoof: '#4a3f66', wallLit: '#ffd166',
  player: '#ff5d8f', cop: '#3a86ff', ped: '#e0aaff', carBody: '#ef476f',
  night: '#1b1035', neonPink: '#ff5d8f', neonCyan: '#4cc9f0', neonGold: '#ffd166',
};
export const BUILDING_NAMES = [
  'Solano Bank', 'Hotel Miramar', 'Copperline HQ', 'Pier Market', 'Taco Luna',
  'Harbor Clinic', 'Vista Tower', 'Neon Arcade', 'Port Authority', 'Casa Azul',
  'Sunset Gym', 'Marina Suites', 'Old Customs', 'Palma Mall', 'Radio Solano',
  'Ferry Terminal', 'Coral Flats', 'Dockside Diner', 'Lotus Hotel', 'Bay Library',
  'Solano School', 'Fish Cannery', 'Azure Condos', 'Harbor Chapel', 'Night Bazaar',
  'Cargo Depot', 'Pearl Theatre', 'Surf Shop Sol', 'Customs Annex', 'Lighthouse Inn',
];
export const CAR_COLORS = ['#ef476f', '#ffd166', '#06d6a0', '#4cc9f0', '#f78c6b', '#c77dff', '#e0e1dd', '#ff9f1c'];
export const PED_COLORS = ['#e0aaff', '#ffd6a5', '#caffbf', '#9bf6ff', '#ffc6ff', '#fdffb6', '#a0c4ff'];
