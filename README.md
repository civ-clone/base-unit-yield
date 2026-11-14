# base-unit-yield

- `lib/unitYieldRules`: `unitYieldRules(prefix, deps, options)`, a ruleset's unit yield rules from its tables: each
  type's attack, defence, movement and visibility (core-unit's `unitYield`), each unit improvement's modifier
  (`<prefix>:unit/yield/improvement/<Improvement>/<Yield>`, a veteran's half), and each transport's capacity and cargo
  weight.
- `lib/defenceMultipliers`: `defenceMultipliers(deps, options)`, a defender's bonuses against an attacker as named
  multipliers (the square's, then walls or fortified), and `defenceStrength(multipliers)`, the `Strength` rule that
  adds them.

A library: no `main`, so it registers nothing on its own.
