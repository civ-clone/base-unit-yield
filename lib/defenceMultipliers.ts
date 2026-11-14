import {
  CityImprovementRegistry,
  instance as cityImprovementRegistryInstance,
} from '@civ-clone/core-city-improvement/CityImprovementRegistry';
import {
  CityRegistry,
  instance as cityRegistryInstance,
} from '@civ-clone/core-city/CityRegistry';
import {
  UnitImprovementRegistry,
  instance as unitImprovementRegistryInstance,
} from '@civ-clone/core-unit-improvement/UnitImprovementRegistry';
import { Attack, Defence } from '@civ-clone/core-unit/Yields';
import Air from '@civ-clone/base-unit-type-air/Air';
import CityImprovement from '@civ-clone/core-city-improvement/CityImprovement';
import Effect from '@civ-clone/core-rule/Effect';
import IgnoresFortifications from '@civ-clone/base-unit-trait-ignores-fortifications/IgnoresFortifications';
import Naval from '@civ-clone/base-unit-type-naval/Naval';
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
  // The square's own multipliers, each named: its terrain's, and anything else on it that helps (a river).
  terrain: (tile: Tile) => [string, number][];
  // The city improvement that multiplies a defence in its city, unless the attacker `IgnoresFortifications`.
  CityWalls: typeof CityImprovement;
  walls: number;
  // The unit improvement that multiplies a defence outside walls.
  Fortified: typeof UnitImprovement;
  fortified: number;
}

/**
 * A defender's bonuses against `attacker` (or against any attacker, `null`), as the multipliers that apply in order,
 * each named after what gives it: the square's, then the first of the city's walls or being fortified (they don't
 * stack). An aircraft gets none. A ship gets none, except in a walled city, where it defends as a land unit does.
 */
export const defenceMultipliers =
  (
    {
      cityImprovementRegistry = cityImprovementRegistryInstance,
      cityRegistry = cityRegistryInstance,
      unitImprovementRegistry = unitImprovementRegistryInstance,
    }: DefenceDependencies,
    { terrain, CityWalls, walls, Fortified, fortified }: DefenceOptions
  ) =>
  (defender: Unit, attacker: Unit | null): [string, number][] => {
    if (defender instanceof Air) {
      return [];
    }

    const tile = defender.tile(),
      city = cityRegistry.getByTile(tile),
      cityWalls =
        city !== null &&
        !(attacker !== null && attacker.hasTrait(IgnoresFortifications)) &&
        cityImprovementRegistry
          .getByCity(city)
          .some(
            (cityImprovement: CityImprovement): boolean =>
              cityImprovement instanceof CityWalls
          );

    if (defender instanceof Naval && !cityWalls) {
      return [];
    }

    const multipliers: [string, number][] = [...terrain(tile)];

    if (cityWalls) {
      multipliers.push([CityWalls.name, walls]);
    } else if (
      unitImprovementRegistry
        .getByUnit(defender)
        .some(
          (unitImprovement: UnitImprovement): boolean =>
            unitImprovement instanceof Fortified
        )
    ) {
      multipliers.push([Fortified.name, fortified]);
    }

    return multipliers;
  };

/** A `Strength` rule that adds each of `multipliers`' bonuses to the defence, under its own name, one after another. */
export const defenceStrength = (
  multipliers: (defender: Unit, attacker: Unit | null) => [string, number][],
  id?: string
): Strength =>
  new Strength(
    ...([
      ...(id === undefined ? [] : [id]),
      new Effect(
        (
          attacker: Unit,
          defender: Unit,
          attack: Attack,
          defence: Defence
        ): void => {
          let current = defence.value();

          multipliers(defender, attacker).forEach(
            ([name, multiplier]): void => {
              defence.add(current * (multiplier - 1), name);

              current *= multiplier;
            }
          );
        }
      ),
    ] as [Effect])
  );

export default defenceMultipliers;
