// Facilities the techs need from Procurement (D-032, user direction 2026-11-15: higher tiers, from tier 2,
// need labs, equipment or rented machine time). Authored, placeholder content (D-005). Facility ids are in
// core/facilities.ts. A tech without an entry needs nothing; every tier-2 or higher tech has one.
export const TECH_NEEDS: Record<string, string[]> = {
  // propulsion
  'nozzle-extension': ['test-stand'],
  'regen-cooling': ['test-stand'],
  'ion-ppu': ['vacuum-chamber'],
  'densified-cryo': ['test-stand', 'cryo-plant'],
  'ion-grid': ['vacuum-chamber'],
  'ion-high-isp': ['vacuum-chamber', 'test-stand'],
  // power
  'light-panels': ['solar-simulator'],
  'concentrators': ['solar-simulator'],
  'thermoelectric': ['hot-cell'],
  'metamorphic': ['solar-simulator', 'clean-room'],
  'dynamic-isotope': ['hot-cell'],
  // instruments
  'computational-imaging': ['clean-room'],
  'wavefront-control': ['optical-bench'],
  'spec-resolution': ['optical-bench'],
  'subsurface-sounding': ['radar-range'],
  'lab-microscopy': ['clean-room'],
  'large-aperture': ['optical-bench', 'clean-room'],
  'cooled-focal-plane': ['optical-bench', 'clean-room'],
  // antenna
  'adaptive-coding': ['rf-chamber'],
  'optical-terminal': ['rf-chamber', 'ground-dish'],
  'phased-array': ['rf-chamber', 'ground-dish'],
  // protection
  'layered-shield': ['irradiation'],
  'dual-layer': ['arc-jet'],
  'magnetic-deflector': ['irradiation', 'vacuum-chamber'],
  'reusable-tps': ['arc-jet', 'test-stand'],
};
