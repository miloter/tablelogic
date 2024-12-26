import TableLogic from '../tablelogic.js';

const tl = new TableLogic();

// To catch an error, just consult the 'getError()' method.
// When there is a syntax error, the evaluation returns an empty string: ''
let table = tl.getTable('(p -> q) & (p & q) -> q');
if (table) {
    console.log(table);
} else {
    console.error(tl.getError());
}
// There is a syntax error here, so it will be detected
table = tl.getTable('(p -> q) & (p & q) - q');
if (table) {
    console.log(table);
} else {
    console.error(tl.getError());
}
