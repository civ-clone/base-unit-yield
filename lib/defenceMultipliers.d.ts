import { CityImprovementRegistry } from '@civ-clone/core-city-improvement/CityImprovementRegistry';
import { CityRegistry } from '@civ-clone/core-city/CityRegistry';
import { UnitImprovementRegistry } from '@civ-clone/core-unit-improvement/UnitImprovementRegistry';
import CityImprovement from '@civ-clone/core-city-improvement/CityImprovement';
import Strength from '@civ-clone/core-unit/Rules/Strength';
import Tile from '@civ-clone/core-world/Tile';
import Unit from '@civ-clone/core-unit/Unit';
import UnitImprovement from '@civ-clone/core-unit-improvement/UnitImprovement';
export interface DefenceDependencies {
  cityImprovementRegistry?: CityImprovementRegistry;
  cityRegistry?: CityRegistry;
  unitImprovementRegistry?: UnitImprovementRegistry;
}
export interface DefenceOptions {
  terrain: (tile: Tile) => [string, number][];
  CityWalls: typeof CityImprovement;
  walls: number;
  Fortified: typeof UnitImprovement;
  fortified: number;
}
/**
 * Civilization's defence model (civ1-unit's). A defender's bonuses against `attacker` (or against any attacker,
 * `null`), as the multipliers that apply in order, each named after what gives it: the square's, then the first of the
 * city's walls or being fortified (they don't stack). An aircraft gets none. A ship gets none, except in a walled city, where it defends as a land unit does.
 */
export declare const defenceMultipliers: (
  {
    cityImprovementRegistry,
    cityRegistry,
    unitImprovementRegistry,
  }: DefenceDependencies,
  { terrain, CityWalls, walls, Fortified, fortified }: DefenceOptions
) => (defender: Unit, attacker: Unit | null) => [string, number][];
/** A `Strength` rule that adds each of `multipliers`' bonuses to the defence, under its own name, one after another. */
export declare const defenceStrength: (
  multipliers: (defender: Unit, attacker: Unit | null) => [string, number][],
  id?: string
) => Strength;
export default defenceMultipliers;
