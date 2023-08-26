import { Die } from "index.js";
import assert from "assert";

export function average(die: Die<number>) {
  return die
    .normalize()
    .outcomes.reduce(
      (sum, probability, outcome) => sum + outcome * probability,
      0
    );
}

export function median(die: Die<number>) {
  const sorted = die.outcomes.sortBy((_, outcome) => outcome).keySeq();
  const middleIndex = Math.floor(sorted.count() / 2);

  if (sorted.count() % 2) {
    return sorted.get(middleIndex);
  } else {
    const a = sorted.get(middleIndex),
      b = sorted.get(middleIndex - 1);
    assert(a);
    assert(b);
    return (a + b) / 2;
  }
}
