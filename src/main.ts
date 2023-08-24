import deepCopy from "deepcopy";
import deepEqual from "fast-deep-equal";

// TODO: opposed roll example
// TODO: test importing from npm

/**
* This interface is a shortcut for {@link RollResult}[]. 

  Conceptually, a {@link Die} has an arbitrary number of sides ({@link RollResult}), each having an assigned value and probability. It is expected that probabilities of all sides add up to 1.

  A {@link Die} can be an actual physical die (d6, d12, etc.) or a "virtual" die created by combining multiple dice according to a certain rule: "sum of 4d6", "highest 2 of 3d8", etc.
* @see {@link pool}
* @see {@link pair}
*/
export interface Die<T> extends Array<RollResult<T>> {}

/**
 * A rule for aggregating a {@link pool} of dice into a single {@link Die}.
 * @callback AccumulatorCallback
 * @param accumulator accumulator variable, where the aggregated value is stored
 * @param dieValue next die value
 */
export type AccumulatorCallback<T, U> = (accumulator: T, dieValue: U) => T;

/**
 * Combines a pool of dice into a single die using an arbitrary aggregation rule.
 * @callback combine
 * @param initial initial value of the accumulator variable
 * @param dice array of dice to combine into a pool
 * @returns pool rolls aggregated as a single die
 */
export function pool<T, U>(
    accumulatorCallback: AccumulatorCallback<T, U>,
    initial: T,
    dice: RollResult<U>[][]
) {
    return dice.reduce(
        (accumulatedOutcomes: Die<T>, die) => {
            const newOutcomes: Die<T> = [];

            die.flatMap((dieResult) =>
                accumulatedOutcomes.map(
                    (outcome) =>
                        new RollResult<T>(
                            accumulatorCallback(
                                deepCopy(outcome.value),
                                dieResult.value
                            ),
                            outcome.probability * dieResult.probability
                        )
                )
            ).forEach((rollResult) => {
                injectRollRecord(newOutcomes, rollResult);
            }, []);

            return newOutcomes;
        },
        [new RollResult(initial, 1)]
    );
}

function injectRollRecord<T>(die: Die<T>, rollResult: RollResult<T>) {
    const record =
        // if it exists, pick it
        die.find((existingRecord) =>
            deepEqual(existingRecord.value, rollResult.value)
        ) ?? // if it doesn't exist, create it
        (() => {
            const record = new RollResult(rollResult.value, 0);
            die.push(record);
            return record;
        })();

    record.probability += rollResult.probability;
}

/**
* Apply an arbitrary mapping function to the {@link Die} side values.

  This function combines all sides of a {@link Die} which mapped to the same value into a single side with combined probability. Do NOT use `Array.map()` on a {@link Die} instead of this function.

  Comparison between side values to determine if they are identical is performed using `deepEqual`.
 * @see <a href="https://github.com/KosRud/dice-calc/blob/master/src/examples/pickHighest.ts">pickHighest.ts</a> example
* @param mapping mapping function
* @param die
* @returns
*/
export function interpret<T, U>(mapping: (value: T) => U, die: Die<T>) {
    return die
        .map(
            (rollResult) =>
                new RollResult<U>(
                    mapping(rollResult.value),
                    rollResult.probability
                )
        )
        .reduce(
            (
                collapsedRollResults: RollResult<U>[],
                rollResult: RollResult<U>
            ) => {
                const record =
                    // if it exists, pick it
                    collapsedRollResults.find((existingRecord) =>
                        deepEqual(existingRecord.value, rollResult.value)
                    ) ?? // if it doesn't exist, create it
                    (() => {
                        const record = new RollResult(rollResult.value, 0);
                        collapsedRollResults.push(record);
                        return record;
                    })();

                record.probability += rollResult.probability;

                return collapsedRollResults;
            },
            []
        );
}

/**
 * Combines two dice using an arbitrary rule.
 * @see <a href="https://github.com/KosRud/dice-calc/blob/master/src/examples/opposed.ts">opposed.ts</a> example
 * @param combine function which determines how the {@link Die} values should be combined
 * @param first first die
 * @param second second die
 * @returns
 */
export function pair<T>(
    combine: (first: T, second: T) => T,
    first: Die<T>,
    second: Die<T>
) {
    const result: Die<T> = [];

    for (const rollA of first) {
        for (const rollB of second) {
            const value = combine(rollA.value, rollB.value);
            injectRollRecord(
                result,
                new RollResult(value, rollA.probability * rollB.probability)
            );
        }
    }

    return result;
}

/**
 * Produce an array of identical dice like 2d6, 5d8, etc.
 * @param numDice number of dice
 * @param dieSize number of sides each die has
 * @returns
 */
export function d(dieSize: number, numDice: number): Die<number>[];
/**
 * Produce a single die like d6, d8, d20, etc.
 * @param dieSize number of sides
 * @returns
 */
export function d(dieSize: number): Die<number>;
export function d(dieSize: number, numDice?: number) {
    if (numDice == undefined) {
        return Array(dieSize)
            .fill(0)
            .map((_, i) => new RollResult(i + 1, 1 / dieSize));
    }
    return Array(numDice)
        .fill(0)
        .map(() =>
            Array(dieSize)
                .fill(0)
                .map((_, i) => new RollResult(i + 1, 1 / dieSize))
        );
}

/**
 * A single side of a {@link Die} with an assigned value and probability.
 */
export class RollResult<T> {
    constructor(
        public value: T,
        public probability: number
    ) {}
}
