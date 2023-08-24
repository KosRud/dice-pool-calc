import { Die } from "main.js";
import deepCopy from "deepcopy";

/**
 * @ignore
 */
export function normalize<T>(die: Die<T>) {
  const total = die.reduce((total, result) => total + result.probability, 0);
  return die.map((roll) => {
    const copy = deepCopy(roll);
    copy.probability /= total;
    return copy;
  });
}

export function frequencies<T>(die: Die<T>) {
  return new Map(
    normalize(die).map((rollResult) => [
      rollResult.value,
      rollResult.probability,
    ])
  );
}

export function average(die: Die<number>) {
  return normalize(die).reduce(
    (sum: number, rollResult) =>
      sum + rollResult.value * rollResult.probability,
    0
  );
}

export function median(die: Die<number>) {
  const sorted = deepCopy(die).sort(
    (rollA, rollB) => rollA.value - rollB.value
  );
  const middleIndex = Math.floor(sorted.length / 2);

  if (sorted.length % 2) {
    return sorted[middleIndex].value;
  } else {
    return (sorted[middleIndex].value + sorted[middleIndex - 1].value) / 2;
  }
}
