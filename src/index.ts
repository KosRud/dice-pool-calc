import { Map, Range, Seq, ValueObject } from "immutable";

/**
 * A type that can be compared by value using `Immutable.is()`
 */
export type ValueType = number | string | boolean | ValueObject;

/**
 * A rule for aggregating a pool of dice into a single {@link Die}.
 * @see {@link Die.pool}
 * @callback AccumulatorCallback
 * @param accumulator accumulator variable, where the aggregated value is stored
 * @param outcome next {@link Die} outcome
 */
export type AccumulatorCallback<T extends ValueType, U extends ValueType> = (
  accumulator: U,
  outcome: T
) => U;

/**
* A {@link Die} is a wrapper over an immutable <a href="https://immutable-js.com/docs/v4.3.4/Map/">Map</a>, where keys correspond to possible outcomes of rolling the die, and values determine the probability of the respective outcome.

  Conceptually, any combination of dice is aggregated into a new {@link Die} which contains all possible outcomes of the combination. 
*/
export class Die<T extends ValueType> {
  public outcomes: Map<T, number>;

  constructor();
  constructor(outcomes: Map<T, number>);
  constructor(outcomes?: Map<T, number>) {
    this.outcomes = outcomes ?? Map();
  }

  /**
   * Produce a single die: d6, d8, d20, etc. The number `numSides` can be any positive integer. Each side has an equal probability.
   * @param numSides number of sides
   * @returns
   */
  static d(numSides: number) {
    return new Die(
      Map(
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
    return Range(0, numDice).map(() => Die.d(numSides));
  }

  /**
   * Combines two dice using an arbitrary rule for interpreting the result.
   * @see <a href="https://github.com/KosRud/dice-calc/blob/master/src/examples/opposed.ts">opposed.ts</a> example
   * @param combine function which determines how the {@link Die} values should be combined
   * @param dieA first die
   * @param dieB second die
   * @returns new combined die
   */
  static pair<T extends ValueType, U extends ValueType, V extends ValueType>(
    combine: (first: T, second: U) => V,
    dieA: Die<T>,
    dieB: Die<U>
  ) {
    return new Die(
      Map<V, number>().withMutations((newOutcomes) => {
        for (const [outcomeA, probabilityA] of dieA.outcomes.entries()) {
          for (const [outcomeB, probabilityB] of dieB.outcomes.entries()) {
            const outcome = combine(outcomeA, outcomeB);
            newOutcomes.set(
              outcome,
              (newOutcomes.get(outcome) ?? 0) + probabilityA * probabilityB
            );
          }
        }
      })
    );
  }

  /**
   * Combines a pool of dice into a single {@link Die} using an arbitrary aggregation rule.
   * @callback combine
   * @param initial initial value of the accumulator variable
   * @param dice array of dice to combine into a pool
   * @returns pool all possible outcome combinations aggregated as a single {@link Die}
   */
  static pool<T extends ValueType, U extends ValueType>(
    accumulatorCallback: AccumulatorCallback<T, U>,
    initial: U,
    dice: Iterable<Die<T>>
  ) {
    return new Die(
      Seq(dice).reduce(
        // sequentially record all possible combinations
        // of the outcomes accumulated so far with the next die
        (accumulated: Map<U, number>, die) =>
          // create a new die to record next round of outcomes
          // produced by combining the new die with outcomes accumulated so far
          Map<U, number>().withMutations((newAccumulated: Map<U, number>) =>
            die.outcomes
              .entrySeq()
              .flatMap(
                // for each outcome of the next die
                (dieEntry: [outcome: T, probability: number]) =>
                  accumulated.entrySeq().map(
                    // for each outcome of the current accumulation die
                    (accumulatedentry: [outcome: U, probability: number]) => [
                      // combine the outcomes
                      accumulatorCallback(accumulatedentry[0], dieEntry[0]),
                      accumulatedentry[1] * dieEntry[1],
                    ]
                  )
              )
              .forEach((entry: [outcome: U, probability: number]) =>
                // and accumulate new outcomes in the new die
                newAccumulated.set(
                  entry[0],
                  (newAccumulated.get(entry[0]) ?? 0) + entry[1]
                )
              )
          ),
        // initial value of the accumulation die
        Map([[initial, 1]])
      )
    );
  }

  /**
  * Re-interprets the outcomes of a {@link Die} using an arbitrary mapping function.
      
    All outcomes which mapped to the same value are merged into a single outcome with combined probability. Comparison between outcomes is performed using <a href="https://www.npmjs.com/package/fast-deep-equal">fast-deep-equal</a>.
  * @param f mapping function
  * @returns new die with re-interpreted outcomes
  */
  interpret<U extends ValueType>(f: (outcome: T) => U) {
    return new Die(
      Map<U, number>().withMutations((accumulated) =>
        this.outcomes.forEach((probability, outcome) => {
          const interpretedOutcome = f(outcome);
          accumulated.set(
            interpretedOutcome,
            (accumulated.get(interpretedOutcome) ?? 0) + probability
          );
        })
      )
    );
  }

  /**
  * Re-interprets the outcomes of a {@link Die} using an arbitrary mapping function. Unlike {@link Die.interpret}, this function can map each outcome to a distribution of multiple possible new outcomes, represented by a {@link Die}. The probabilities of all outcomes in this new {@link Die} should add up to 1, the {@link Die.reroll} function takes care of the conditional probabilities.
   
    All outcomes which mapped to the same value are merged into a single outcome with combined probability. Comparison between outcomes is performed using <a href="https://www.npmjs.com/package/fast-deep-equal">fast-deep-equal</a>.
  * @param f mapping function
  * @returns new die with re-interpreted outcomes
  */
  reroll<U extends ValueType>(f: (outcome: T) => Die<U>) {
    return Map<U, number>().withMutations((accumulated) =>
      this.outcomes.flatMap((oldProbability, oldOutcome) => {
        return f(oldOutcome).outcomes.map((newProbability, newOutcome) => {
          accumulated.set(
            newOutcome,
            (accumulated.get(newOutcome) ?? 0) + newProbability * oldProbability
          );
        });
      })
    );
  }

  /**
   * Ensures that probabilities of all outcomes of the {@link Die} add up to 1 (divides all probabilities by their sum). This is done <a href="https://en.wikipedia.org/wiki/In-place_algorithm">in place</a> without creating a new die.
   */
  normalize() {
    const sumProbability = this.outcomes.reduce(
      (sumProbability, probability) => sumProbability + probability,
      0
    );

    return new Die(
      this.outcomes.map((probability) => probability / sumProbability)
    );
  }
}
