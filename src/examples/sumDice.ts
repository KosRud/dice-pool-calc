import * as stats from "stats";
import { d, pool } from "main.js";

// 3d4 + 2d6 + 1d8

const sumDice = (accumulator: number, dieValue: number) =>
    accumulator + dieValue;

const dice = d(3, 4).concat(d(2, 6), d(1, 8));

const sumPool = pool(sumDice, 0, dice);

const frequencies = stats.frequencies(sumPool);
const average = stats.average(sumPool);
const median = stats.median(sumPool);

console.log({ frequencies, average, median });
