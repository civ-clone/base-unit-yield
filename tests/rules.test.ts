import * as fs from 'fs';
import * as path from 'path';
import { Attack, Defence, Movement } from '@civ-clone/core-unit/Yields';
import defenceMultipliers, { defenceStrength } from '../lib/defenceMultipliers';
import { Capacity } from '@civ-clone/core-unit-transport/Yields';
import Air from '@civ-clone/base-unit-type-air/Air';
import CityImprovement from '@civ-clone/core-city-improvement/CityImprovement';
import IgnoresFortifications from '@civ-clone/base-unit-trait-ignores-fortifications/IgnoresFortifications';
import Land from '@civ-clone/base-unit-type-land/Land';
import Naval from '@civ-clone/base-unit-type-naval/Naval';
import Rule from '@civ-clone/core-rule/Rule';
import RuleRegistry from '@civ-clone/core-rule/RuleRegistry';
import Unit from '@civ-clone/core-unit/Unit';
import UnitImprovement from '@civ-clone/core-unit-improvement/UnitImprovement';
import { Yield as UnitYield } from '@civ-clone/core-unit/Rules/Yield';
import { expect } from 'chai';
import unitYieldRules from '../lib/unitYieldRules';

// civ1-unit 0.1.40's own rules (835709d): id, rule type, priority and criteria count, in order. With civ1-unit's
//  prefix and tables, the assemblers give exactly these (R2b adopts them unchanged).
const fixture = (name: string): [string | null, string, number, number][] =>
  JSON.parse(
    fs.readFileSync(path.join(process.cwd(), 'tests/fixtures', name), 'utf8')
  );

const fingerprint = (rules: Rule<any, any>[]) =>
  rules.map((rule: Rule<any, any>) => [
    rule.id(),
    rule.constructor.name,
    rule.priority().value(),
    (
      (rule as unknown as { _criteria?: { _criteria: unknown[] } })._criteria
        ?._criteria ?? []
    ).length,
  ]);

// Stand-ins named as civ1's are, where an id carries the name.
class Veteran extends UnitImprovement {}
class Fortified extends UnitImprovement {}
class CityWalls extends CityImprovement {}
class Trireme extends Naval {}
class Sail extends Naval {}
class Frigate extends Naval {}
class Transport extends Naval {}
class Carrier extends Naval {}

describe('unitYieldRules', (): void => {
  const civ1Stats = Array.from(
    { length: 28 },
    (_, index) => [class extends Land {}, index] as [typeof Unit, number]
  );

  it("gives civ1-unit's Rules/Unit/yield rules, in order", (): void => {
    expect(
      fingerprint(
        unitYieldRules(
          'civ1-unit',
          {},
          {
            stats: civ1Stats,
            improvements: [[Veteran, 0.5, Attack, Defence]],
            capacity: [
              [Trireme, 2],
              [Sail, 3],
              [Frigate, 4],
              [Transport, 8],
              [Carrier, 8],
            ],
          }
        )
      )
    ).to.deep.equal(fixture('civ1-unit-yield.json'));
  });

  it("sets each stat, 1 when left out, adds a veteran's half, and a transport's capacity", (): void => {
    class Warrior extends Land {}

    const ruleRegistry = new RuleRegistry(),
      veterans = new Set<Unit>(),
      yieldOf = (unit: Unit, YieldType: typeof Attack | typeof Capacity) => {
        const value = new YieldType();

        ruleRegistry.process(UnitYield, unit, value);

        return value.value();
      };

    ruleRegistry.register(
      ...unitYieldRules(
        'game',
        {
          ruleRegistry,
          unitImprovementRegistry: {
            getByUnit: (unit: Unit) =>
              veterans.has(unit) ? [new Veteran()] : [],
          } as never,
        },
        {
          stats: [[Warrior, 4]],
          improvements: [[Veteran, 0.5, Attack]],
          capacity: [[Trireme, 3]],
        }
      )
    );

    const warrior = Object.create(Warrior.prototype),
      veteran = Object.create(Warrior.prototype),
      ship = Object.create(Trireme.prototype);

    veterans.add(veteran);

    expect(yieldOf(warrior, Attack)).to.equal(4);
    expect(yieldOf(warrior, Movement)).to.equal(1);
    expect(yieldOf(veteran, Attack)).to.equal(6);
    expect(yieldOf(ship, Capacity)).to.equal(3);
  });
});

describe('defenceMultipliers', (): void => {
  it("gives civ1-unit's Rules/Unit/strength rule", (): void => {
    expect(
      fingerprint([defenceStrength((): [string, number][] => [])])
    ).to.deep.equal(fixture('civ1-unit-strength.json'));
    expect(defenceStrength(() => [], 'game:unit/strength').id()).to.equal(
      'game:unit/strength'
    );
  });

  const scene = (walled: boolean, fortified: boolean) =>
      defenceMultipliers(
        {
          cityRegistry: {
            getByTile: () => ({}),
          } as never,
          cityImprovementRegistry: {
            getByCity: () => (walled ? [new CityWalls()] : []),
          } as never,
          unitImprovementRegistry: {
            getByUnit: () => (fortified ? [new Fortified()] : []),
          } as never,
        },
        {
          terrain: (): [string, number][] => [
            ['Hills', 2],
            ['River', 1.5],
          ],
          CityWalls,
          walls: 3,
          Fortified,
          fortified: 1.5,
        }
      ),
    unit = (Domain: typeof Unit, ignoresWalls = false) =>
      Object.assign(Object.create(Domain.prototype), {
        tile: () => ({}),
        hasTrait: (Trait: unknown): boolean =>
          ignoresWalls && Trait === IgnoresFortifications,
      });

  it('takes the square, then walls or fortification, never both', (): void => {
    expect(scene(true, true)(unit(Land), null)).to.deep.equal([
      ['Hills', 2],
      ['River', 1.5],
      ['CityWalls', 3],
    ]);
    expect(scene(true, true)(unit(Land), unit(Land, true))).to.deep.equal([
      ['Hills', 2],
      ['River', 1.5],
      ['Fortified', 1.5],
    ]);
    expect(scene(false, false)(unit(Land), null)).to.deep.equal([
      ['Hills', 2],
      ['River', 1.5],
    ]);
  });

  it('gives an aircraft nothing, and a ship nothing outside walls', (): void => {
    expect(scene(true, true)(unit(Air), null)).to.deep.equal([]);
    expect(scene(false, true)(unit(Naval), null)).to.deep.equal([]);
    expect(scene(true, false)(unit(Naval), null)).to.deep.equal([
      ['Hills', 2],
      ['River', 1.5],
      ['CityWalls', 3],
    ]);
  });

  it('adds each bonus to the defence in turn', (): void => {
    const defence = new Defence(2);

    defenceStrength(() => [
      ['Hills', 2],
      ['Fortified', 1.5],
    ]).process(null, null, new Attack(), defence);

    expect(defence.value()).to.equal(6);
  });
});
