import * as stats from "dice-pool-calc/stats";
import { nd, pool } from "dice-pool-calc";

// 3d4 + 2d6 + 1d8

const sumDice = (accumulator: number, dieValue: number) =>
  accumulator + dieValue;

const dice = nd(3, 4).concat(nd(2, 6), nd(1, 8));

const sumPool = pool(sumDice, 0, dice);

const frequencies = stats.frequencies(sumPool);
const average = stats.average(sumPool);
const median = stats.median(sumPool);

console.log({ frequencies, average, median });
