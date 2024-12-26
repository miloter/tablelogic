import TableLogic from '../tablelogic.js';

const tl = new TableLogic();

// Exists the posibility of generated cumulative tables
console.log(tl.getTable('A=p v q, B=p ^ q, A v ¬B'));