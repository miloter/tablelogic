import TableLogic from '../tablelogic.js';

const tl = new TableLogic();

// Emit multiples logic tables:
// negation, disjunction, conjunction, conditional and biconditional
console.log(tl.getTable('¬p, p v q, p ^ q, p -> q, p <-> q'));
