"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.unitYieldRules = void 0;
const Yields_1 = require("@civ-clone/core-unit-transport/Yields");
const RuleRegistry_1 = require("@civ-clone/core-rule/RuleRegistry");
const TransportRegistry_1 = require("@civ-clone/core-unit-transport/TransportRegistry");
const UnitImprovementRegistry_1 = require("@civ-clone/core-unit-improvement/UnitImprovementRegistry");
const Yield_1 = require("@civ-clone/core-unit/Rules/Yield");
const Yield_2 = require("@civ-clone/core-unit/Rules/Yield");
const Criterion_1 = require("@civ-clone/core-rule/Criterion");
const Effect_1 = require("@civ-clone/core-rule/Effect");
/**
 * A ruleset's unit yield rules, as civ1-unit's are: each type's base stats (core-unit's `unitYield`, with no ids), each
 * improvement's modifier (`<prefix>:unit/yield/improvement/<Improvement>/<Yield>`), and each transport's capacity and
 * cargo weight (`<prefix>:unit/yield/capacity/<Unit>`, `<prefix>:unit/yield/cargo-weight/<Unit>`).
 */
const unitYieldRules = (prefix, { ruleRegistry = RuleRegistry_1.instance, transportRegistry = TransportRegistry_1.instance, unitImprovementRegistry = UnitImprovementRegistry_1.instance, }, { stats, improvements, capacity }) => [
    ...stats.flatMap(([UnitType, attack = 1, defence = 1, movement = 1, visibility = 1,]) => (0, Yield_1.unitYield)(UnitType, attack, defence, movement, visibility)),
    ...improvements.flatMap(([UnitImprovementType, modifier, ...YieldTypes]) => YieldTypes.map((YieldType) => new Yield_1.Yield(`${prefix}:unit/yield/improvement/${UnitImprovementType.name}/${YieldType.name}`, new Criterion_1.default((unit, unitYield) => unitYield instanceof YieldType), new Criterion_1.default((unit) => unitImprovementRegistry
        .getByUnit(unit)
        .some((unitImprovement) => unitImprovement instanceof UnitImprovementType)), new Effect_1.default((unit, unitYield) => {
        const baseYield = new YieldType();
        ruleRegistry.process(Yield_2.BaseYield, unit.constructor, baseYield);
        unitYield.add(baseYield.value() * modifier, UnitImprovementType.name);
    })))),
    ...capacity.flatMap(([UnitType, holds]) => [
        new Yield_1.Yield(`${prefix}:unit/yield/capacity/${UnitType.name}`, new Criterion_1.default((unit, unitYield) => unitYield instanceof Yields_1.Capacity), new Criterion_1.default((unit) => unit instanceof UnitType), new Effect_1.default((unit, unitYield) => unitYield.set(holds))),
        new Yield_1.Yield(`${prefix}:unit/yield/cargo-weight/${UnitType.name}`, new Criterion_1.default((unit, unitYield) => unitYield instanceof Yields_1.CargoWeight), new Effect_1.default((unit, unitYield) => unitYield.set(transportRegistry.getByTransport(unit).length))),
    ]),
];
exports.unitYieldRules = unitYieldRules;
exports.default = exports.unitYieldRules;
//# sourceMappingURL=unitYieldRules.js.map