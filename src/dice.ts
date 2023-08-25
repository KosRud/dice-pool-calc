import assert from "assert";
import deepEqual from "fast-deep-equal";

export class Die<T> {
  constructor(private sides: Map<T, number>) {}

  get(outcome: T) {
    return this.sides.get(outcome);
  }

  set(outcome: T, probability: number) {
    for (const existingRecord of this.sides.keys()) {
      if (deepEqual(existingRecord, outcome)) {
        this.sides.set(existingRecord, probability);
        return;
      }
    }

    this.sides.set(outcome, probability);
  }

  accumulate(outcome: T, probability: number) {
    this.sides.set(outcome, (this.sides.get(outcome) ?? 0) + probability);
  }

  normalize() {
    const entries = Array.from(this.sides.entries());
    const sumProbability = entries.reduce((sum, entry) => sum + entry[1], 0);
    for (const outcome of this.sides.keys()) {
      const probability = this.get(outcome);
      assert(probability);
      this.set(outcome, probability / sumProbability);
    }
  }
}
