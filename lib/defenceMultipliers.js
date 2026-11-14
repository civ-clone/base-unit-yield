"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defenceStrength = exports.defenceMultipliers = void 0;
const CityImprovementRegistry_1 = require("@civ-clone/core-city-improvement/CityImprovementRegistry");
const CityRegistry_1 = require("@civ-clone/core-city/CityRegistry");
const UnitImprovementRegistry_1 = require("@civ-clone/core-unit-improvement/UnitImprovementRegistry");
const Air_1 = require("@civ-clone/base-unit-type-air/Air");
const Effect_1 = require("@civ-clone/core-rule/Effect");
const IgnoresFortifications_1 = require("@civ-clone/base-unit-trait-ignores-fortifications/IgnoresFortifications");
const Naval_1 = require("@civ-clone/base-unit-type-naval/Naval");
const Strength_1 = require("@civ-clone/core-unit/Rules/Strength");
/**
 * A defender's bonuses against `attacker` (or against any attacker, `null`), as the multipliers that apply in order,
 * each named after what gives it: the square's, then the first of the city's walls or being fortified (they don't
 * stack). An aircraft gets none. A ship gets none, except in a walled city, where it defends as a land unit does.
 */
const defenceMultipliers = ({ cityImprovementRegistry = CityImprovementRegistry_1.instance, cityRegistry = CityRegistry_1.instance, unitImprovementRegistry = UnitImprovementRegistry_1.instance, }, { terrain, CityWalls, walls, Fortified, fortified }) => (defender, attacker) => {
    if (defender instanceof Air_1.default) {
        return [];
    }
    const tile = defender.tile(), city = cityRegistry.getByTile(tile), cityWalls = city !== null &&
        !(attacker !== null && attacker.hasTrait(IgnoresFortifications_1.default)) &&
        cityImprovementRegistry
            .getByCity(city)
            .some((cityImprovement) => cityImprovement instanceof CityWalls);
    if (defender instanceof Naval_1.default && !cityWalls) {
        return [];
    }
    const multipliers = [...terrain(tile)];
    if (cityWalls) {
        multipliers.push([CityWalls.name, walls]);
    }
    else if (unitImprovementRegistry
        .getByUnit(defender)
        .some((unitImprovement) => unitImprovement instanceof Fortified)) {
        multipliers.push([Fortified.name, fortified]);
    }
    return multipliers;
};
exports.defenceMultipliers = defenceMultipliers;
/** A `Strength` rule that adds each of `multipliers`' bonuses to the defence, under its own name, one after another. */
const defenceStrength = (multipliers, id) => new Strength_1.default(...[
    ...(id === undefined ? [] : [id]),
    new Effect_1.default((attacker, defender, attack, defence) => {
        let current = defence.value();
        multipliers(defender, attacker).forEach(([name, multiplier]) => {
            defence.add(current * (multiplier - 1), name);
            current *= multiplier;
        });
    }),
]);
exports.defenceStrength = defenceStrength;
exports.default = exports.defenceMultipliers;
//# sourceMappingURL=defenceMultipliers.js.map