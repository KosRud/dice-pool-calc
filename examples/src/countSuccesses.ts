import * as stats from "dice-pool-calc/stats";
import { nd, pool } from "dice-pool-calc";

// Count rolls of 5 or higher in a pool of 12d6

const countSuccess = (accumulator: number, dieValue: number) => {
  if (dieValue >= 5) {
    accumulator++;
  }
  return accumulator;
};

const successPool = pool(countSuccess, 0, nd(12, 6));

const frequencies = stats.frequencies(successPool);
const average = stats.average(successPool);
const median = stats.median(successPool);

console.log({ frequencies, average, median });
