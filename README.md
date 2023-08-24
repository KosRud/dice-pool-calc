# dice-calc

A typescript library for efficiently calculating dice probabilities with arbitrarily complex rules.

* easily handles hudreds of dice
* enumerates all possible values

## Links

* [GitHub](https://github.com/KosRud/dice-pool-calc)
* [NPM](https://www.npmjs.com/package/dice-pool-calc)

## Documentation

https://kosrud.github.io/dice-calc/

## Examples

https://github.com/KosRud/dice-calc/tree/master/src/examples

#### Random example: count 5,6 in 12d6

```ts
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
```

output:

```ts
{
  frequencies: Map(13) {
    0 => 0.00770734662925894,
    1 => 0.04624407977555363,
    2 => 0.1271712193827725,
    3 => 0.2119520323046208,
    4 => 0.23844603634269845,
    5 => 0.19075682907415878,
    6 => 0.11127481695992594,
    7 => 0.047689207268539695,
    8 => 0.014902877271418657,
    9 => 0.003311750504759702,
    10 => 0.0004967625757139553,
    11 => 0.00004516023415581412,
    12 => 0.000001881676423158921
  },
  average: 4,
  median: 6
}
```
