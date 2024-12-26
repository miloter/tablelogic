# It allows you to calculate truth tables of simple and compound propositions.
Implementation of a proposition parser and evaluator.

## Note:
tablelogic is an ESM module so you will need to add to your package.json: "type": "module"

## Installation
```bash/powershell
npm install @miloter/tablelogic
```

## Usage
```js
import TableLogic from '@miloter/tablelogic';

const tl = new TableLogic();

// Output the biconditional table:
console.log(tl.getTable('p <-> q'));

// Output:
// -------------
// |p|q|p <-> q|
// -------------
// |0|0|   1   |
// |0|1|   0   |
// |1|0|   0   |
// |1|1|   1   |
// -------------
```

## Examples
### Generate multiples tables in one expression
```js
import TableLogic from '@miloter/tablelogic';

const tl = new TableLogic();

// Emit multiples logic tables:
// negation, disjunction, conjunction, conditional and biconditional
console.log(tl.getTable('¬p, p v q, p ^ q, p -> q, p <-> q'));

// Output:
// -----------------------------------
// |p|q|¬p|p ∨ q|p ∧ q|p -> q|p <-> q|
// -----------------------------------
// |0|0| 1|  0  |  0  |   1  |   1   |
// |0|1| 1|  1  |  0  |   1  |   0   |
// |1|0| 0|  1  |  0  |   0  |   0   |
// |1|1| 0|  1  |  1  |   1  |   1   |
// -----------------------------------
```

### Generate cumulative tables
```js
import TableLogic from '@miloter/tablelogic';

const tl = new TableLogic();

// Exists the posibility of generated cumulative tables
console.log(tl.getTable('A=p v q, B=p ^ q, A v ¬B'));

// Output:
// --------------------------------
// |p|q|A = p ∨ q|B = p ∧ q|A ∨ ¬B|
// --------------------------------
// |0|0|    0    |    0    |   1  |
// |0|1|    1    |    0    |   1  |
// |1|0|    1    |    0    |   1  |
// |1|1|    1    |    1    |   1  |
// --------------------------------
```