# dice-pool-calc

A typescript library for efficiently calculating dice probabilities with arbitrarily complex rules.

* easily handles hudreds of dice
* enumerates all possible values

## Links

* [GitHub](https://github.com/KosRud/dice-pool-calc)
* [NPM](https://www.npmjs.com/package/dice-pool-calc)

## Documentation

https://kosrud.github.io/dice-pool-calc/

## Examples

https://github.com/KosRud/dice-pool-calc-examples

#### Random example: count 5,6 in 12d6

```ts
import * as stats from "dice-pool-calc/stats";
import { Die } from "dice-pool-calc";

// Count rolls of 5 or higher in a pool of 12d6

const countSuccess = (accumulator: number, outcome: number) => {
  if (outcome >= 5) {
    accumulator++;
  }
  return accumulator;
};

const successPool = Die.pool(countSuccess, 0, Die.nd(12, 6));

const average = stats.average(successPool);
const median = stats.median(successPool);

console.log({ outcomes: successPool.outcomes.toJS(), average, median });
```

output:

```ts
{
  outcomes: {
    '0': 0.007707346629258935,
    '1': 0.0462440797755536,
    '2': 0.12717121938277243,
    '3': 0.21195203230462067,
    '4': 0.2384460363426983,
    '5': 0.19075682907415864,
    '6': 0.11127481695992587,
    '7': 0.04768920726853966,
    '8': 0.014902877271418646,
    '9': 0.0033117505047596998,
    '10': 0.000496762575713955,
    '11': 0.00004516023415581409,
    '12': 0.0000018816764231589197
  },
  average: 4,
  median: 6
}
```
