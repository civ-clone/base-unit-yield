import { RuleRegistry } from '@civ-clone/core-rule/RuleRegistry';
import { TransportRegistry } from '@civ-clone/core-unit-transport/TransportRegistry';
import { UnitImprovementRegistry } from '@civ-clone/core-unit-improvement/UnitImprovementRegistry';
import { Yield as UnitYield } from '@civ-clone/core-unit/Rules/Yield';
import { BaseYield } from '@civ-clone/core-unit/Rules/Yield';
import Unit from '@civ-clone/core-unit/Unit';
import UnitImprovement from '@civ-clone/core-unit-improvement/UnitImprovement';
import Yield from '@civ-clone/core-yield/Yield';
/** A unit type's attack, defence, movement and visibility. Left out, a stat is 1. */
export type UnitStats = [typeof Unit, number?, number?, number?, number?];
/** A unit improvement that adds `modifier` times the unit's base value of each of the yields to it (a veteran's). */
export type ImprovementModifier = [
  typeof UnitImprovement,
  number,
  ...(typeof Yield)[]
];
export interface UnitYieldDependencies {
  ruleRegistry?: RuleRegistry;
  transportRegistry?: TransportRegistry;
  unitImprovementRegistry?: UnitImprovementRegistry;
}
export interface UnitYieldOptions {
  stats: UnitStats[];
  improvements: ImprovementModifier[];
  capacity: [typeof Unit, number][];
}
/**
 * A ruleset's unit yield rules, as civ1-unit's are: each type's base stats (core-unit's `unitYield`, with no ids), each
 * improvement's modifier (`<prefix>:unit/yield/improvement/<Improvement>/<Yield>`), and each transport's capacity and
 * cargo weight (`<prefix>:unit/yield/capacity/<Unit>`, `<prefix>:unit/yield/cargo-weight/<Unit>`).
 */
export declare const unitYieldRules: (
  prefix: string,
  {
    ruleRegistry,
    transportRegistry,
    unitImprovementRegistry,
  }: UnitYieldDependencies,
  { stats, improvements, capacity }: UnitYieldOptions
) => (UnitYield | BaseYield)[];
export default unitYieldRules;
