import TableLogic from '../tablelogic.js';

const tl = new TableLogic();

console.log('By default, emit table numeric values ordered');
console.log(tl.getTable('A=p v q, B=p ^ q, A v ¬B'));

console.log('Changing order');
tl.orderedTruthValue = false;
console.log(tl.getTable('A=p v q, B=p ^ q, A v ¬B'));