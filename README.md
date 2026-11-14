# base-unit-yield

- `lib/unitYieldRules`: `unitYieldRules(prefix, deps, options)`, a ruleset's unit yield rules from its tables: each
  type's attack, defence, movement and visibility (core-unit's `unitYield`), each unit improvement's modifier
  (`<prefix>:unit/yield/improvement/<Improvement>/<Yield>`, a veteran's half), and each transport's capacity and cargo
  weight.
- `lib/defenceMultipliers`: `defenceMultipliers(deps, options)`, Civilization's defence model: a defender's bonuses
  against an attacker as named multipliers (the square's, then walls or fortified), with nothing for an aircraft and
  nothing for a ship outside walls. Another game's model (Civ2's) is its own function; `defenceStrength(multipliers)`,
  the `Strength` rule that adds any model's multipliers, serves both.

A library: no `main`, so it registers nothing on its own.
