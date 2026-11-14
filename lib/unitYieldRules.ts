import { Capacity, CargoWeight } from '@civ-clone/core-unit-transport/Yields';
import {
  RuleRegistry,
  instance as ruleRegistryInstance,
} from '@civ-clone/core-rule/RuleRegistry';
import {
  TransportRegistry,
  instance as transportRegistryInstance,
} from '@civ-clone/core-unit-transport/TransportRegistry';
import {
  UnitImprovementRegistry,
  instance as unitImprovementRegistryInstance,
} from '@civ-clone/core-unit-improvement/UnitImprovementRegistry';
import {
  Yield as UnitYield,
  unitYield,
} from '@civ-clone/core-unit/Rules/Yield';
import { BaseYield } from '@civ-clone/core-unit/Rules/Yield';
import Criterion from '@civ-clone/core-rule/Criterion';
import Effect from '@civ-clone/core-rule/Effect';
import { ITransport } from '@civ-clone/core-unit-transport/Transport';
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
  // How many units each transport type holds; each also has its cargo counted (`CargoWeight`).
  capacity: [typeof Unit, number][];
}

/**
 * A ruleset's unit yield rules, as civ1-unit's are: each type's base stats (core-unit's `unitYield`, with no ids), each
 * improvement's modifier (`<prefix>:unit/yield/improvement/<Improvement>/<Yield>`), and each transport's capacity and
 * cargo weight (`<prefix>:unit/yield/capacity/<Unit>`, `<prefix>:unit/yield/cargo-weight/<Unit>`).
 */
export const unitYieldRules = (
  prefix: string,
  {
    ruleRegistry = ruleRegistryInstance,
    transportRegistry = transportRegistryInstance,
    unitImprovementRegistry = unitImprovementRegistryInstance,
  }: UnitYieldDependencies,
  { stats, improvements, capacity }: UnitYieldOptions
): (UnitYield | BaseYield)[] => [
  ...stats.flatMap(
    ([
      UnitType,
      attack = 1,
      defence = 1,
      movement = 1,
      visibility = 1,
    ]: UnitStats): (UnitYield | BaseYield)[] =>
      unitYield(UnitType, attack, defence, movement, visibility)
  ),

  ...improvements.flatMap(
    ([
      UnitImprovementType,
      modifier,
      ...YieldTypes
    ]: ImprovementModifier): UnitYield[] =>
      YieldTypes.map(
        (YieldType: typeof Yield): UnitYield =>
          new UnitYield(
            `${prefix}:unit/yield/improvement/${UnitImprovementType.name}/${YieldType.name}`,
            new Criterion(
              (unit: Unit, unitYield: Yield): boolean =>
                unitYield instanceof YieldType
            ),
            new Criterion((unit: Unit): boolean =>
              unitImprovementRegistry
                .getByUnit(unit)
                .some(
                  (unitImprovement: UnitImprovement): boolean =>
                    unitImprovement instanceof UnitImprovementType
                )
            ),
            new Effect((unit: Unit, unitYield: Yield): void => {
              const baseYield = new YieldType();

              ruleRegistry.process(
                BaseYield,
                <typeof Unit>unit.constructor,
                baseYield
              );

              unitYield.add(
                baseYield.value() * modifier,
                UnitImprovementType.name
              );
            })
          )
      )
  ),

  ...capacity.flatMap(([UnitType, holds]: [typeof Unit, number]) => [
    new UnitYield(
      `${prefix}:unit/yield/capacity/${UnitType.name}`,
      new Criterion(
        (unit: Unit, unitYield: Yield): unitYield is Capacity =>
          unitYield instanceof Capacity
      ),
      new Criterion((unit: Unit): boolean => unit instanceof UnitType),
      new Effect((unit: Unit, unitYield: Yield): void => unitYield.set(holds))
    ),
    new UnitYield(
      `${prefix}:unit/yield/cargo-weight/${UnitType.name}`,
      new Criterion(
        (unit: Unit, unitYield: Yield): unitYield is CargoWeight =>
          unitYield instanceof CargoWeight
      ),
      new Effect((unit: Unit | ITransport, unitYield: Yield): void =>
        unitYield.set(
          transportRegistry.getByTransport(unit as ITransport).length
        )
      )
    ),
  ]),
];

export default unitYieldRules;
