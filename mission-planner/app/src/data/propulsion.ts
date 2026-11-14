import type { Propulsion, PropulsionId } from '../model/types';

// Hand-crafted propulsion types. All numbers are balancing placeholders.
export const PROPULSION: Record<PropulsionId, Propulsion> = {
  solid: {
    id: 'solid', name: 'Solid', ispRange: [230, 290], thrustRangeKN: [100, 15_000],
    engineBaseMassT: 0.2, engineMassPerKN: 0.0008, tankDryFraction: 0.12, boilOffPerMonth: 0,
    canLaunchOrLand: true, engineCostPerKN: 0.004, engineBaseCost: 3, fuelCostPerT: 0.03, baseReliability: 0.99,
  },
  kerolox: {
    id: 'kerolox', name: 'Kerosene / oxygen', ispRange: [280, 360], thrustRangeKN: [20, 10_000],
    engineBaseMassT: 0.2, engineMassPerKN: 0.0012, tankDryFraction: 0.06, boilOffPerMonth: 0,
    canLaunchOrLand: true, engineCostPerKN: 0.01, engineBaseCost: 8, fuelCostPerT: 0.01, baseReliability: 0.98,
  },
  hydrolox: {
    id: 'hydrolox', name: 'Hydrogen / oxygen', ispRange: [380, 465], thrustRangeKN: [10, 3000],
    engineBaseMassT: 0.15, engineMassPerKN: 0.0025, tankDryFraction: 0.1, boilOffPerMonth: 0.02,
    canLaunchOrLand: true, engineCostPerKN: 0.025, engineBaseCost: 15, fuelCostPerT: 0.03, baseReliability: 0.97,
  },
  hypergolic: {
    id: 'hypergolic', name: 'Storable hypergolic', ispRange: [290, 340], thrustRangeKN: [0.4, 500],
    engineBaseMassT: 0.03, engineMassPerKN: 0.002, tankDryFraction: 0.07, boilOffPerMonth: 0,
    canLaunchOrLand: true, engineCostPerKN: 0.05, engineBaseCost: 2, fuelCostPerT: 0.05, baseReliability: 0.995,
  },
  ion: {
    id: 'ion', name: 'Ion (xenon)', ispRange: [1500, 5000], thrustRangeKN: [0.0001, 0.002],
    engineBaseMassT: 0.05, engineMassPerKN: 100, tankDryFraction: 0.1, boilOffPerMonth: 0,
    canLaunchOrLand: false, engineCostPerKN: 4000, engineBaseCost: 6, fuelCostPerT: 2, baseReliability: 0.97,
  },
};

export const PROPULSION_LIST: Propulsion[] = Object.values(PROPULSION);

/** 1.0 at the bottom of the Isp range, 1.5 at the top: better engines are heavier and costlier. */
export function ispFactor(p: Propulsion, isp: number): number {
  const [lo, hi] = p.ispRange;
  return 1 + 0.5 * Math.min(1, Math.max(0, (isp - lo) / (hi - lo)));
}

/** Electric power an ion engine needs while firing (kW), assuming 60 % efficiency. */
export function ionPowerKW(thrustKN: number, isp: number): number {
  const thrustN = thrustKN * 1000;
  return (thrustN * isp * 9.80665) / (2 * 0.6) / 1000;
}
