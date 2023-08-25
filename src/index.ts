import deepCopy from "deepcopy";
import deepEqual from "fast-deep-equal";

/**
 * A rule for aggregating a pool of dice into a single {@link Die}.
 * @see {@link Die.pool}
 * @callback AccumulatorCallback
 * @param accumulator accumulator variable, where the aggregated value is stored
 * @param outcome next {@link Die} outcome
 */
export type AccumulatorCallback<T, U> = (accumulator: U, outcome: T) => U;

export class Die<T> extends Map<T, number> {
  constructor();
  constructor(sides: Map<T, number>);
  constructor(sides?: Map<T, number>) {
    super(sides);
  }

  /**
   * Produce a single die: d6, d8, d20, etc. The number `numSides` can be any positive integer. Each side has an equal probability.
   * @param numSides number of sides
   * @returns
   */
  static d(numSides: number) {
    return new Die(
      new Map(
        Array(numSides)
          .fill(0)
          .map((_, id) => [id + 1, 1 / numSides])
      )
    );
  }

  /**
   * Produce an array of identical dice: 2d6, 5d8, etc. The numbers `numDice` and `numSides` can be any positive integers. Each side has an equal probability.
   * @param numDice number of dice
   * @param numSides number of sides each die has
   * @returns
   */
  static nd(numDice: number, numSides: number) {
    return Array(numDice)
      .fill(0)
      .map(() => Die.d(numSides));
  }

  /**
   * Combines two dice using an arbitrary rule for interpreting the result.
   * @see <a href="https://github.com/KosRud/dice-calc/blob/master/src/examples/opposed.ts">opposed.ts</a> example
   * @param combine function which determines how the {@link Die} values should be combined
   * @param dieA first die
   * @param dieB second die
   * @returns new combined die
   */
  static pair<T, U, V>(
    combine: (first: T, second: U) => V,
    dieA: Die<T>,
    dieB: Die<U>
  ) {
    const result = new Die<V>();

    for (const [outcomeA, probabilityA] of dieA.entries()) {
      for (const [outcomeB, probabilityB] of dieB.entries()) {
        const outcome = combine(outcomeA, outcomeB);
        result.accumulate(outcome, probabilityA * probabilityB);
      }
    }

    return result;
  }

  /**
   * Combines a pool of dice into a single {@link Die} using an arbitrary aggregation rule.
   * @callback combine
   * @param initial initial value of the accumulator variable
   * @param dice array of dice to combine into a pool
   * @returns pool all possible outcome combinations aggregated as a single {@link Die}
   */
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

  /**
  * Re-interprets the outcomes of a {@link Die} using an arbitrary mapping function.
      
    All outcomes which mapped to the same value are merged into a single outcome with combined probability. Comparison between outcomes is performed using <a href="https://www.npmjs.com/package/fast-deep-equal">fast-deep-equal</a>.
  * @param f mapping function
  * @returns new die with re-interpreted outcomes
  */
  interpret<U>(f: (outcome: T) => U) {
    const result = new Die<U>();

    Array.from(this.entries()).forEach((entry) => {
      const [outcome, probability] = entry;
      result.accumulate(f(outcome), probability);
    });

    return result;
  }

  /**
  * Re-interprets the outcomes of a {@link Die} using an arbitrary mapping function. Unlike {@link Die.interpret}, this function can map each outcome to a distribution of multiple possible new outcomes, represented by a {@link Die}. The probabilities of all outcomes in this new {@link Die} should add up to 1, the {@link Die.reroll} function takes care of the conditional probabilities.
   
    All outcomes which mapped to the same value are merged into a single outcome with combined probability. Comparison between outcomes is performed using <a href="https://www.npmjs.com/package/fast-deep-equal">fast-deep-equal</a>.
  * @param f mapping function
  * @returns new die with re-interpreted outcomes
  */
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

  /**
  * Sets the probability for the given outcome.
    
    Outcomes are compared using <a href="https://www.npmjs.com/package/fast-deep-equal">fast-deep-equal</a>. If the provided outcome is equal to one of the existing outcomes, its probability is updated instead of creating a new record.
  * @param outcome
  * @param probability
  * @returns
  */
  override set(outcome: T, probability: number) {
    for (const existingRecord of this.keys()) {
      if (deepEqual(existingRecord, outcome)) {
        super.set(existingRecord, probability);
        return this;
      }
    }

    this.set(outcome, probability);

    return this;
  }

  /**
  * Returns the probability of the given outcome, or `undefined` if the {@link Die} has no record for such outcome.

    Outcomes are compared using <a href="https://www.npmjs.com/package/fast-deep-equal">fast-deep-equal</a>.
  * @param outcome
  * @returns probability of the given outcome
  */
  override get(outcome: T) {
    for (const [existingOutcome, probability] of this.entries()) {
      if (deepEqual(existingOutcome, outcome)) {
        return probability;
      }
    }

    return undefined;
  }

  private accumulate(outcome: T, probability: number) {
    this.set(outcome, (this.get(outcome) ?? 0) + probability);
  }

  /**
   * Ensures that probabilities of all outcomes of the {@link Die} add up to 1 (divides all probabilities by their sum). This is done <a href="https://en.wikipedia.org/wiki/In-place_algorithm">in place</a> without creating a new die.
   */
  normalize() {
    const entries = Array.from(this.entries());
    const sumProbability = entries.reduce((sum, entry) => sum + entry[1], 0);
    for (const entry of this.entries()) {
      this.set(entry[0], entry[1] / sumProbability);
    }
  }
}
