import * as stats from "dice-pool-calc/stats";
import { interpret, nd, pool } from "dice-pool-calc";

// highest 4 from 8d6

const saveHighest4 = (accumulator: number[], dieValue: number) => {
  const numDice = 4;

  accumulator.push(dieValue);
  accumulator.sort((a, b) => a - b);
  if (accumulator.length > numDice) {
    accumulator.splice(0, accumulator.length - numDice);
  }

  return accumulator;
};

// highest 4 as sorted array of numbers
const highest4 = pool(saveHighest4, [], nd(8, 6));

// sum of highest 4
const sumHighest4 = interpret(
  (dieValue: number[]) => dieValue.reduce((a, b) => a + b),
  highest4
);

const frequencies = stats.frequencies(sumHighest4);
const average = stats.average(sumHighest4);
const median = stats.median(sumHighest4);

console.log({ frequencies, average, median });
