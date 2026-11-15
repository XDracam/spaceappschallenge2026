import type { Branch, Maneuver, MissionPlan, Part, Rocket, Spacecraft, Stage } from './types';

export interface PartLocation {
  part: Part;
  /** Stage holding the part (engine or tank), if any. */
  stage?: Stage;
  /** Spacecraft holding the part (equipment or a spacecraft stage), if any. Undefined = rocket stage. */
  spacecraft?: Spacecraft;
  role: 'engine' | 'tank' | 'equipment';
}

export function allStages(rocket: Rocket): { stage: Stage; spacecraft?: Spacecraft }[] {
  return [
    ...rocket.stages.map((stage) => ({ stage })),
    ...rocket.spacecraft.flatMap((sc) => sc.stages.map((stage) => ({ stage, spacecraft: sc }))),
  ];
}

export function allParts(rocket: Rocket): PartLocation[] {
  const out: PartLocation[] = [];
  for (const { stage, spacecraft } of allStages(rocket)) {
    out.push({ part: stage.engine, stage, spacecraft, role: 'engine' });
    for (const t of stage.tanks) out.push({ part: t, stage, spacecraft, role: 'tank' });
  }
  for (const sc of rocket.spacecraft) for (const p of sc.equipment) out.push({ part: p, spacecraft: sc, role: 'equipment' });
  return out;
}

/** How every station names a part of the design: "Booster engine", "Upper stage tank", "Orbital camera". */
export function partPlaceName(loc: PartLocation): string {
  if (loc.role === 'equipment' || !loc.stage) return loc.part.name;
  const stage = loc.stage.name;
  if (loc.role === 'tank') return `${stage} tank`;
  return /engine$/i.test(stage) ? stage : `${stage} engine`;
}

export function findPart(rocket: Rocket, partId: string): PartLocation | undefined {
  return allParts(rocket).find((l) => l.part.id === partId);
}

export function findStage(rocket: Rocket, stageId: string): { stage: Stage; spacecraft?: Spacecraft } | undefined {
  return allStages(rocket).find((s) => s.stage.id === stageId);
}

export function findSpacecraft(rocket: Rocket, id: string): Spacecraft | undefined {
  return rocket.spacecraft.find((s) => s.id === id);
}

export function findManeuver(plan: MissionPlan, maneuverId: string): { branch: Branch; maneuver: Maneuver; index: number } | undefined {
  for (const branch of plan.branches) {
    const index = branch.maneuvers.findIndex((m) => m.id === maneuverId);
    if (index >= 0) return { branch, maneuver: branch.maneuvers[index], index };
  }
  return undefined;
}

export function findBranch(plan: MissionPlan, branchId: string): Branch | undefined {
  return plan.branches.find((b) => b.id === branchId);
}
