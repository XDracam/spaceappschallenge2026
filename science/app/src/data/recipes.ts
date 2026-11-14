// Placeholder content from the design-canvas mockup (Nov 14, 2026). Hand-authored, in line with D-005.
// Descriptions are assistant-written from general knowledge and still need a fact check.

import type { Recipe } from '../model/types';

/** Hand-authored combinations. The key is the sorted field ids joined by '+'. Anything else is textbook or a long shot. */
export const RECIPES: Recipe[] = [
  {
    ids: ["a5", "b1"],
    title: "Methane as a life detector",
    pitch: "Seasonal methane swings could be geology or biology. Pair the timing of the swings with gases that only living systems should move together with.",
    method: "Orbiter gas sounding plus surface sampling",
    needs: "IR and mass spectrometer (Procurement), relay window (Planning)",
    time: "~8 months",
    odds: "Medium",
  },
  {
    ids: ["g9", "m3"],
    title: "Mineable ice: depth versus yield",
    pitch: "Where is buried ice shallow and clean enough that extracting it pays for itself on the first crewed landing?",
    method: "Radar survey plus extraction test rig",
    needs: "Ground-penetrating radar, drill (Procurement)",
    time: "~5 months",
    odds: "Good",
  },
  {
    ids: ["b2", "g4"],
    title: "Clays as organic time capsules",
    pitch: "Clays trap organics in standing water. Which of the four candidate sites kept them longest?",
    method: "Compare orbital spectra, then in-situ analysis",
    needs: "Lander instrument slot (Planning, Procurement)",
    time: "~6 months",
    odds: "Medium",
  },
  {
    ids: ["g9", "i5"],
    title: "Radar signatures of pure ice",
    pitch: "Teach the radar to tell clean ice from ice-rich soil before it is flown.",
    method: "Calibrate on analogue sites",
    needs: "Ground-penetrating radar (Procurement)",
    time: "~3 months",
    odds: "Good",
  },
  {
    ids: ["r12", "r2"],
    title: "Where to shelter in a solar storm",
    pitch: "Map how much terrain blocks storm particles around the candidate landing sites.",
    method: "Particle transport modelling on terrain maps",
    needs: "Compute time, terrain maps (Planning)",
    time: "~6 weeks",
    odds: "Good",
  },
  {
    ids: ["g16", "r12", "r2"],
    title: "Lava-tube storm shelter",
    pitch: "Natural tubes may cut storm dose by a large factor. Find candidate tubes before the landing site is chosen. Three-way combinations are rare.",
    method: "Orbital imaging, radar survey and dose modelling",
    needs: "Radar, stereo imaging (Procurement), landing options (Planning)",
    time: "~7 months",
    odds: "Medium",
  },
  {
    ids: ["i18", "o12"],
    title: "Self-guided science on approach",
    pitch: "Let the spacecraft choose its own observation targets during the last days of approach, when light delay rules out ground control.",
    method: "Onboard image analysis on the navigation camera",
    needs: "Camera and processor budget (Procurement), approach timeline (Planning)",
    time: "~9 months",
    odds: "Long shot",
  },
  {
    ids: ["b16", "i3"],
    title: "Measure the false-alarm rate",
    pitch: "Before claiming a life signal, learn how often non-biological chemistry fakes one on this instrument.",
    method: "Lab runs on abiotic mixtures",
    needs: "Mass spectrometer test unit (Procurement)",
    time: "~4 months",
    odds: "Good",
  },
  {
    ids: ["a3", "m4"],
    title: "Propellant yield through the seasons",
    pitch: "Carbon dioxide frost comes and goes. How much does the fuel plant output change between seasons?",
    method: "Atmosphere model driving a plant simulation",
    needs: "Compute time, plant design (Procurement)",
    time: "~2 months",
    odds: "Good",
  },
  {
    ids: ["a2", "m6"],
    title: "Dust load forecast for hardware",
    pitch: "Predict how much dust seals and panels see through a storm season, so mitigation can be sized.",
    method: "Storm model with deposition estimates",
    needs: "Compute time (none from other stations)",
    time: "~8 weeks",
    odds: "Good",
  },
  {
    ids: ["a19", "a5"],
    title: "Was the single-pass methane burst real?",
    pitch: "One rover pass logged a methane spike that never repeated. Was it a real release or an instrument effect?",
    method: "Re-process archive passes near the site",
    needs: "Archive access only",
    time: "~3 weeks",
    odds: "Medium",
  },
  {
    ids: ["b19", "b2"],
    title: "Is the delta organic signal real?",
    pitch: "A weak organic-like signal in a delta drill sample is neither confirmed nor ruled out. Could organics have survived there, and could contamination explain it?",
    method: "Preservation modelling plus archive re-check",
    needs: "Archive access, 1 lab slot",
    time: "~5 weeks",
    odds: "Long shot",
  },
];

export function recipeKey(ids: readonly string[]): string {
  return [...ids].sort().join('+');
}

const BY_KEY = new Map(RECIPES.map((r) => [recipeKey(r.ids), r]));

export function findRecipe(ids: readonly string[]): Recipe | undefined {
  return BY_KEY.get(recipeKey(ids));
}
