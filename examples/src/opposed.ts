import * as stats from "dice-pool-calc/stats";
import { d, interpret, pair } from "dice-pool-calc";

/*
  Each player rolls d20+mod
  the attacker must exceed the defender's roll to land a hit
*/

const attackerMod = 3;
const defenderMod = 5;

const d20 = d(20);
const attackerRoll = interpret((value) => value + attackerMod, d20);
const defenderRoll = interpret((value) => value + defenderMod, d20);

const combineOpposed = (att: number, def: number) => (att > def ? 1 : 0);

const opposed = pair(combineOpposed, attackerRoll, defenderRoll);

const frequencies = stats.frequencies(opposed);
const average = stats.average(opposed);

console.log({ frequencies, average });
