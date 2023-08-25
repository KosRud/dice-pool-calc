import deepCopy from "deepcopy";
import deepEqual from "fast-deep-equal";

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

  entries() {
    return this.sides.entries();
  }

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

        Array.from(die.entries())
          .flatMap((entry) => {
            const [dieOutcome, dieProbability] = entry;
            return Array.from(accumulated.entries()).map((accumulatedEntry) => {
              const [accumulatedOutcome, accumulatedProbability] =
                accumulatedEntry;
              return {
                outcome: accumulatorCallback(
                  deepCopy(accumulatedOutcome),
                  dieOutcome
                ),
                probability: accumulatedProbability * dieProbability,
              };
            });
          })
          .forEach((entry) =>
            newAccumulated.accumulate(entry.outcome, entry.probability)
          );

        return newAccumulated;
      },
      new Die<U>(new Map<U, number>([[initial, 1]]))
    );
  }

  interpret<U>(f: (outcome: T) => U) {
    return new Die<U>(
      new Map(
        Array.from(this.entries()).map((entry) => {
          const [outcome, probability] = entry;
          return [f(outcome), probability];
        })
      )
    );
  }

  reroll<U>(f: (outcome: T) => Die<U>) {
    return new Die<U>(
      new Map(
        Array.from(this.entries()).flatMap((entry) => {
          const [oldOutcome, oldProbability] = entry;
          return Array.from(f(oldOutcome).entries()).map((entry) => {
            const [newOutcome, newProbability] = entry;
            return [newOutcome, newProbability * oldProbability];
          });
        })
      )
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
    const entries = Array.from(this.entries());
    const sumProbability = entries.reduce((sum, entry) => sum + entry[1], 0);
    for (const entry of this.entries()) {
      this.set(entry[0], entry[1] / sumProbability);
    }
  }
}
