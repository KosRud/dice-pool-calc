import deepEqual from "fast-deep-equal";
import deepCopy from "deepcopy";

/**
 * A rule for aggregating a pool of dice into a single {@link Die}.
 * @callback AccumulatorCallback
 * @param accumulator accumulator variable, where the aggregated value is stored
 * @param dieValue next die value
 * @see {@link Die.pool}
 */
export type AccumulatorCallback<T, U> = (accumulator: U, outcome: T) => U;

export class Die<T> {
  private sides: Map<T, number>;

  constructor();
  constructor(sides: Map<T, number>);
  constructor(sides?: Map<T, number>) {
    this.sides = sides ?? new Map<T, number>();
  }

  static d(numSides: number) {
    return new Die(
      new Map(
        Array(numSides)
          .fill(0)
          .map((_, id) => [id + 1, 1 / numSides])
      )
    );
  }

  static nd(numDice: number, numSides: number) {
    return Array(numDice)
      .fill(0)
      .map(() => Die.d(numSides));
  }

  static pool<T, U>(
    accumulatorCallback: AccumulatorCallback<T, U>,
    initial: U,
    dice: Die<T>[]
  ) {
    return dice.reduce(
      (accumulated: Die<U>, die) => {
        const newAccumulated = new Die<U>();

        Array.from(die.sides.entries())
          .flatMap((entry) => {
            const [dieOutcome, dieProbability] = entry;
            return Array.from(accumulated.sides.entries()).map(
              (accumulatedEntry) => {
                const [accumulatedOutcome, accumulatedProbability] =
                  accumulatedEntry;
                return {
                  outcome: accumulatorCallback(
                    deepCopy(accumulatedOutcome),
                    dieOutcome
                  ),
                  probability: accumulatedProbability * dieProbability,
                };
              }
            );
          })
          .forEach((entry) =>
            newAccumulated.accumulate(entry.outcome, entry.probability)
          );

        return newAccumulated;
      },
      new Die<U>(new Map<U, number>([[initial, 1]]))
    );
  }

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

  private accumulate(outcome: T, probability: number) {
    this.sides.set(outcome, (this.sides.get(outcome) ?? 0) + probability);
  }

  normalize() {
    const entries = Array.from(this.sides.entries());
    const sumProbability = entries.reduce((sum, entry) => sum + entry[1], 0);
    for (const entry of this.sides.entries()) {
      this.set(entry[0], entry[1] / sumProbability);
    }
  }
}
