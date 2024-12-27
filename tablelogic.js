import os from 'node:os';
import Scanner from '@miloter/scanner';

/**
 * Permite calcular tablas de verdad de proposiciones simples y compuestas.
 * @author miloter
 * @since 2024-12-23
 * @version 2024-12-26
 */
export default class TableLogic {
    static #PREFIX_ANON = '$p';
    static #BICOND = 0; // 'eqv'
    static #IMP = 1; // 'imp'
    static #DISYUN = 2; // 'or', ∨
    static #DISYUN_EXC = 3; // 'xor'
    static #CONJUN = 4; // 'and'
    static #NEG = 5; // 'not'
    static #TAUTOLOGIA = 6; // ⊤
    static #CONTRADICCION = 7; // ⊥
    static #ASIG = 9; // '='
    static #COMA = 10; // ','
    static #PAR_AB = 11; // '('
    static #PAR_CE = 12; // ')'
    static #COR_AB = 13; // '['
    static #COR_CE = 14; // ']'
    static #LLAVE_AB = 15; // '{'
    static #LLAVE_CE = 16; // '}'        
    
    #scan; // Escáner del texto de entrada
    #propsSimp; // Proposiciones simples: -> (number -> number)
    #propsComp; // Proposiciones compuestas: -> (number -> number)
    #exprSinOrden; // Expresiones sin orden: number -> (-> string)
    #tabla; // Tabla de verdad: number -> (-> object)
    #keys; // Lista de claves string[]
    #numericalTruthValue; // Si es true, se usan (0, 1), si no (F, V)
    #token; // Token en curso
    #rows; // Número de filas
    #fila; // Fila en curso
    #error; // Error de sintaxis {...}
    #pila; // Pila de evaluación: boolean[]
    #countAnon; // Número de expresiones anónimas
    #operando; // Operando actual: string
    #tableType; // Tipo de tabla: string
    #verdad; // Nombre del valor de verdadero
    #falso;  // Nombre del valor de falso    

    constructor() {
        /**
         * Un valor truthy hace que los valores de verdad se muestren
         * ordenados, un valor falsy los muestra en el orden predefinido.
         */
        this.orderedTruthValue = true;
        this.#scan = new Scanner('', true);
        this.#propsSimp = new Map();
        this.#propsComp = new Map();
        this.#exprSinOrden = new Map();
        this.#tabla = new Map();
        this.#keys = [];
        this.#error = null;
        this.#numericalTruthValue = true;
        this.#pila = [];
        this.#operando = '';
        this.#tableType = '';
        this.#rows = 0;
        this.#fila = -1;
        this.#countAnon = 0;
        this.#verdad = '1';
        this.#falso = '0';
        this.#loadTokens();
    }

    #loadTokens() {        
        this.#scan.addKeyword(TableLogic.#BICOND, 'eqv');
        this.#scan.addOperator(TableLogic.#BICOND, '≡');
        this.#scan.addOperator(TableLogic.#BICOND, '<->');
        this.#scan.addOperator(TableLogic.#BICOND, '<=>');
        this.#scan.addOperator(TableLogic.#BICOND, '↔');
        this.#scan.addOperator(TableLogic.#BICOND, '⇔');
        this.#scan.addKeyword(TableLogic.#IMP, 'imp');
        this.#scan.addOperator(TableLogic.#IMP, '⟶');
        this.#scan.addOperator(TableLogic.#IMP, '->');
        this.#scan.addOperator(TableLogic.#IMP, '=>');
        this.#scan.addOperator(TableLogic.#IMP, '⟹');
        this.#scan.addOperator(TableLogic.#IMP, '⊃');
        this.#scan.addOperator(TableLogic.#IMP, '→');
        this.#scan.addOperator(TableLogic.#IMP, '⇒');
        this.#scan.addKeyword(TableLogic.#DISYUN, 'or');
        this.#scan.addOperator(TableLogic.#DISYUN, '∨');
        this.#scan.addOperator(TableLogic.#DISYUN, '+');
        this.#scan.addOperator(TableLogic.#DISYUN, '|');
        this.#scan.addOperator(TableLogic.#DISYUN, '||');
        this.#scan.addKeyword(TableLogic.#DISYUN_EXC, 'xor');
        this.#scan.addOperator(TableLogic.#DISYUN_EXC, '⊕');
        this.#scan.addOperator(TableLogic.#DISYUN_EXC, '⊻');
        this.#scan.addKeyword(TableLogic.#CONJUN, 'and');
        this.#scan.addOperator(TableLogic.#CONJUN, '•');
        this.#scan.addOperator(TableLogic.#CONJUN, '∧');
        this.#scan.addOperator(TableLogic.#CONJUN, '&');
        this.#scan.addOperator(TableLogic.#CONJUN, '&&');
        this.#scan.addOperator(TableLogic.#CONJUN, '⋀');
        this.#scan.addOperator(TableLogic.#CONJUN, '^');
        this.#scan.addKeyword(TableLogic.#NEG, 'not');
        this.#scan.addOperator(TableLogic.#NEG, "!");
        this.#scan.addOperator(TableLogic.#NEG, '˜');
        this.#scan.addOperator(TableLogic.#NEG, '∼');
        this.#scan.addOperator(TableLogic.#NEG, '~');
        this.#scan.addOperator(TableLogic.#NEG, '∽');
        this.#scan.addOperator(TableLogic.#NEG, '¬');
        this.#scan.addOperator(TableLogic.#NEG, '⌝');
        this.#scan.addOperator(TableLogic.#NEG, '┐');
        this.#scan.addOperator(TableLogic.#TAUTOLOGIA, '⊤');
        this.#scan.addOperator(TableLogic.#CONTRADICCION, '⊥');
        this.#scan.addOperator(TableLogic.#ASIG, '=');
        this.#scan.addOperator(TableLogic.#COMA, ',');
        this.#scan.addOperator(TableLogic.#PAR_AB, '(');
        this.#scan.addOperator(TableLogic.#PAR_CE, ')');
        this.#scan.addOperator(TableLogic.#COR_AB, '[');
        this.#scan.addOperator(TableLogic.#COR_CE, ']');
        this.#scan.addOperator(TableLogic.#LLAVE_AB, '{');
        this.#scan.addOperator(TableLogic.#LLAVE_CE, '}');
    }

    #setError(message) {        
        this.#error = {
            message,
            lin: this.#scan.getLin(),
            col: this.#scan.getCol(),
            index: this.#scan.getTokenIndex(),
            length: this.#scan.tokenLength()
        }
    }
    
    /**
     * Devuelve un objeto con información sobre el último error:
     * {
     *      message,    // {string} Mensaje textual del error
     *      lin,        // {number} Línea del error (la primera es la 1)
     *      col,        // {number] Columna del error (la primera es la 1),
     *      index,      // {number} Índice de comienzo del error en la cadena de entrada (el primer índice es 0)
     *      length,     // {number} Longitud del token que provocó el error
     * }    
     * @returns {object}
     */
    getError() {
        return this.#error;
    }            

    /**
     * Devuelve true si se están utilizando valores de verdad numéricos (0, 1).
     * @returns { boolean}
     */
    isNumericalTruthValue() {
        return this.#numericalTruthValue;
    }

    /**
     * Establece si se están utilizando valores de verdad numéricos.
     * Si es true se usan 0 y 1.
     * @param {boolean} value 
     */
    setNumericalTruthValue(value) {
        if (value) {
            this.#verdad = '1';
            this.#falso = '0';
        } else {
            const locale = Intl.DateTimeFormat().resolvedOptions().locale;
            this.#falso = 'F'; // Falso | False
            if (locale.substring(0, 2) === 'es') {
                this.#verdad = 'V'; // Verdadero
            } else {
                this.#verdad = 'T'; // True
            }
        }
        this.#numericalTruthValue = value;
    }
    
	#tableToString() {
        // Cabecera:
        // ------------------------------
        // |p|q|r|...|z|p and q or not r|
        // -------...-------------------|
        // |0|1|0|...|1|    1           |
        // |0|0|0|...|1|    1           |
        // ------------------------------

        // Construye los títulos de cabecera
        const eol = os.EOL;
        const s = [];
        for (let i = 0; i < this.#tabla.size; i++) {
            s.push('|');
            s.push(this.#tabla.get(i).get('name'));
        }
        
        // Longitud de la cabecera en caracteres + 1 caracter '|' de cierre
        const len = s.reduce((prev, curr) => prev += curr.length, 0) + 1; 
        /* Se agregan líneas con guiones en la parte superior e
        inferior de la cabecera */
        const t = s.join(''); // Salva la cabecera
        s.splice(0, s.length);
        s.push('-'.repeat(len));
        s.push(eol);
        s.push(t); // La cabecera, por ejemplo: |p|q| p -> q|
        s.push('|');
        s.push(eol);
        s.push('-'.repeat(len));
        s.push(eol);
        
        // Contruye las filas de verdad
        for (let i = 0; i < this.#rows; i++) {
            for (let j = 0; j < this.#tabla.size; j++) {
                const p = this.#tabla.get(j);
                const nameLen = p.get('name').length;
                s.push('|');
                s.push(' '.repeat(Math.floor(nameLen / 2)));
                if (this.orderedTruthValue) {
                    s.push(p.get('tv').get(i) !== 0 ? this.#verdad : this.#falso);
                } else {
                    s.push(p.get('tv').get(this.#rows - 1 - i) !== 0 ? this.#verdad : this.#falso);
                }
                s.push(' '.repeat(nameLen - 1 - Math.floor(nameLen / 2)));
            }
            s.push('|');
            s.push(eol);
        }
        
        // Cierre final de la tabla
        s.push('-'.repeat(len) + eol);
        
        return s.join('');
    }
    
    /**
     * Devuelve la representación textual de la tabla lógica para una expresión.
     * En caso de error devuelve la cadena vacía.
     * @param {string} expr Expresión lógica.
     * @returns {string}
     */
    getTable(expr) {
        this.#tableType = '';
        this.#generar(expr); // Genera la tabla básica
        if (this.#error !== null) {
            return '';
        }
        
        this.#tableType = 'expr';
        this.#genTableExp(expr); // Genera la tabla de expresiones
        this.#tableType = 'true';
        this.#genTableTrue(); // Genera la tabla de verdad de la tabla de expresiones
        
        // Traspasamos los datos a una estructura más adecuada
        this.#tabla.clear();
        for (let i = 0; i < (this.#propsSimp.size + this.#exprSinOrden.size); i++) {
            const temp = new Map();
            if (i < this.#propsSimp.size) {
                temp.set('name', this.#keys[i]);
                temp.set('tv', this.#propsSimp.get(this.#keys[i]));
                this.#tabla.set(i, temp);
            } else {
                const e = this.#exprSinOrden.get(i - this.#propsSimp.size);
                let name;
                if (e.get('name').indexOf(TableLogic.#PREFIX_ANON) === 0) {
                    name = e.get('value');
                } else {
                    name = e.get('name') + ' = ' + e.get('value');
                }
                const tv = this.#propsComp.get(e.get('name'));
                temp.set('name', name);
                temp.set("tv", tv);
                this.#tabla.set(i, temp);
            }
        }

        return this.#tableToString();
    }
        
    #generar(expr) {
        this.#error = null;
        this.#propsSimp.clear();
        this.#propsComp.clear();
        this.#scan.setText(expr);
        this.#token = this.#scan.nextToken();
        
        this.#listaProposiciones();
        if (this.#token !== Scanner.eof && this.#error === null) {
            this.#setError('Se esperaba el final de la entrada');
        }
        
        if (this.#error !== null) {
            return;
        }
        
        // Construimos la tabla
        this.#genTv();
    }
    
    #genTableExp(expr) {
        this.#exprSinOrden.clear();
        this.#scan.setText(expr);
        this.#token = this.#scan.nextToken();
        this.#countAnon = 0;
        this.#listaProposiciones();
    }
    
    #genTableTrue() {
        for (let i = 0; i < this.#exprSinOrden.size; i++) {
            for (this.#fila = 0; this.#fila < this.#rows; this.#fila++) {
                this.#scan.setText(this.#exprSinOrden.get(i).get('value'));
                this.#token = this.#scan.nextToken();
                this.#expresion();
                this.#propsComp.get(this.#exprSinOrden.get(i).get('name')).set(
                    this.#fila, this.#pila.pop() ? 1 : 0);
            }
        }
    }
        
    /**
     * Devuelve el número de filas de verdad contendidas en la tabla básica.
     * @returns {number}
     */
    getRows() {
        return this.#rows;
    }

    #genTv() {
        // Obtemos la lista de claves ordenadas
        this.#keys.splice(0, this.#keys.length);
        for (const k of this.#propsSimp.keys()) {
            this.#keys.push(k);
        }
        this.#keys.sort();
        
        // Obtenemos el número de filas
        this.#rows = Math.pow(2.0, this.#propsSimp.size);
        
        // Creamos espacio para las filas
        for (const k of this.#propsSimp.keys()) {                    
            const temp = new Map();
            for (let i = 1; i <= this.#rows; i++) {
                temp.set(i, 0);
            }            
            this.#propsSimp.set(k, temp);
        }
        
        // Generamos las filas de verdad
        this.#pila.splice(0, this.#pila.length);
        
        // Apunta a la siguiente fila a generar
        const fila = [0];
        this.#contador(1, fila);
    }

    #contador(n, fila) {
        for (let i = 0; i <= 1; i++) {
            this.#pila.push(i !== 0);
            if (n < this.#propsSimp.size) {
                this.#contador(n + 1, fila);
            } else { // Genera una nueva fila de verdad
                /* El enumerador recorre la pila por el primer elemento
                introducido, por lo que los almacenamos en la fila desde
                el principo hasta el final */
                let j = 0;
                for (let k = 0; k < this.#pila.length; k++) {
                    // Asignamos el valor de verdad
                    const key = this.#keys[j];
                    let v = this.#pila[k] ? 1 : 0;

                    /* Las constantes en proposiciones simples
                    se evaluan como ellas mismas */
                    if (this.#numericalTruthValue) {
                        if (key === '0' || key === '1') {
                            v = key === '1' ? 1 : 0;
                        } else if (key === '⊤') {
                            v = 1;
                        } else if (key === '⊥') {
                            v = 0;
                        }
                    } else if (key === 'F' || key === 'f' || key === '⊥') {
                        v = 0;
                    } else if (key === 'V' || key === 'v' || key === '⊤') {
                        v = 1;
                    }
                    this.#propsSimp.get(key).set(fila[0], v);
                    j++; // A la columna siguiente
                }
                fila[0]++; // apunta a la siguiente fila
            }
            this.#pila.pop();
        }
    }

    #listaProposiciones() {
        // listaProposiciones = proposicion {", " proposicion}
        this.#proposicion();
        while (this.#token === TableLogic.#COMA && this.#error === null) {
            this.#token = this.#scan.nextToken();
            this.#proposicion();
        }
    }

    #proposicion() {
        // proposicion = [id "="] expresion
        if (this.#tableType === 'expr') {
            this.#proposicionExpr();
            return;
        }

        let id = undefined;
        this.#scan.push();
        if (this.#token === Scanner.ident) {
            id = this.#scan.getLexeme();
            this.#token = this.#scan.nextToken();
            if (this.#token === TableLogic.#ASIG) {
                // Comprueba que la proposición compuesta no se haya definido
                if (this.#propsComp.has(id)) {
                    this.#token = this.#scan.pop();
                    this.#setError(`'${id}' ya ha sido definida`);
                    // Tampoco puede tener el mismo nombre que una proposición simple
                } else if (this.#propsSimp.has(id)) {
                    this.#token = this.#scan.pop();
                    this.#setError(`'${id}' ya existe como proposición simple`);
                } else { // La agregamos a la tabla después de leer
                    // la expresión para evitar llamadas recursivas
                    this.#token = this.#scan.nextToken(); // Consume "="
                    // No se necesita el último estado guardado
                    this.#scan.removeTopStack();
                }
            } else {
                this.#token = this.#scan.pop();
                id = undefined; // No es una proposición compuesta
            }
        } else {
            // No se necesita el último estado guardado
            this.#scan.removeTopStack();
        }

        if (this.#error === null) {
            this.#expresion();
        }

        // Comprobamos si se debe añadir una proposición compuesta
        if (this.#error === null && id !== undefined) {
            this.#propsComp.set(id, null);
        }
    }

    #proposicionExpr() {
        // proposicionExpr = [id "="] expresion
        let id = undefined;
        let temp1, temp2;

        this.#scan.push();
        if (this.#token === Scanner.ident) {
            id = this.#scan.getLexeme();
            this.#token = this.#scan.nextToken();
            if (this.#token === TableLogic.#ASIG) {
                this.#token = this.#scan.nextToken(); // Consume "="
                this.#scan.removeTopStack(); // Ignora el estado de la cima
            } else {
                this.#token = this.#scan.pop();
                id = undefined; // No es una proposición compuesta
            }
        } else {
            this.#scan.removeTopStack();
        }

        this.#expresion();

        if (id === undefined) { // Expresión anónima
            /* Si la expresión es el nombre de una proposición simple o
            compuesta ignora su aparición */
            if (!(this.#propsSimp.has(this.#operando)
                    || this.#propsComp.has(this.#operando))) {
                id = TableLogic.#PREFIX_ANON + this.#countAnon;
                temp1 = new Map();
                for (let i = 1; i <= this.#rows; i++) {
                    temp1.set(i, 0);
                }
                this.#propsComp.set(id, temp1);
                this.#countAnon++;
            }
        } else { // Actualiza el número de filas
            temp1 = new Map();
            for (let i = 1; i <= this.#rows; i++) {
                temp1.set(i, 0);
            }
            this.#propsComp.set(id, temp1);
        }

        // Asigna la expresión
        if (id !== undefined) {
            temp2 = new Map();
            temp2.set('name', id);
            temp2.set('value', this.#operando);
            this.#exprSinOrden.set(this.#exprSinOrden.size, temp2);
        }
    }

    #expresion() {
        // expresion = bicondicional
        this.#bicondicional();
    }

    #bicondicional() {
        // bicondicional -> condicional restobicondicional
        this.#condicional();
        this.#restoBicondicional();
    }

    #restoBicondicional() {
        // restoBicondicional = {"eqv" condicional}
        let opIz = undefined;

        while (this.#token === TableLogic.#BICOND && this.#error === null) {
            if (this.#tableType === 'expr') {
                opIz = this.#operando;
            }

            this.#token = this.#scan.nextToken();
            this.#condicional();

            if (this.#tableType === 'true') {
                const q = this.#pila.pop();
                const p = this.#pila.pop();
                // p eqv q: p imp q and q imp p
                // p imp q: not(p and not q)
                this.#pila.push((!(p && !q)) & (!(q && !p)));
            }

            if (this.#tableType === 'expr') {
                this.#operando = opIz + ' <-> ' + this.#operando;
            }
        }
    }

    #condicional() {
        // condicional = disyuncion restoCondicional
        this.#disyuncion();
        this.#restoCondicional();
    }

    #restoCondicional() {
        // restoCondicional = {"imp" disyuncion}
        let opIz = undefined;

        while (this.#token === TableLogic.#IMP && this.#error === null) {
            if (this.#tableType === 'expr') {
                opIz = this.#operando;
            }

            this.#token = this.#scan.nextToken();
            this.#disyuncion();

            if (this.#tableType === 'true') {
                const q = this.#pila.pop();
                const p = this.#pila.pop();
                // p imp q: not(p and not q)
                this.#pila.push(!(p && !q));
            }

            if (this.#tableType === 'expr') {
                this.#operando = opIz + ' -> ' + this.#operando;
            }
        }
    }

    #disyuncion() {
        // disyuncion = disyunExc restoDisyuncion
        this.#disyunExc();
        this.#restoDisyuncion();
    }

    #restoDisyuncion() {
        // restoDisyuncion = {or disyunExc}
        /* Se agrega el caso especial de la letra 'v' minúscula que en
         * este contexto se usa como el operador de disyunción */
        let opIz = undefined;

        while ((this.#token === TableLogic.#DISYUN ||
            this.#scan.getLexeme() === 'v') && this.#error === null) {
            if (this.#tableType === 'expr') {
                opIz = this.#operando;
            }

            this.#token = this.#scan.nextToken();
            this.#disyunExc();

            if (this.#tableType === 'true') {
                const q = this.#pila.pop();
                const p = this.#pila.pop();
                this.#pila.push(p || q);
            }

            if (this.#tableType === 'expr') {
                this.#operando = opIz + ' ∨ ' + this.#operando;
            }
        }
    }

    #disyunExc() {
        // disyunExc = conjuncion restoDisyunExc
        this.#conjuncion();
        this.#restoDisyunExc();
    }

    #restoDisyunExc() {
        // restoDisyunExc = {"xor" conjuncion}
        let opIz = undefined;

        while (this.#token === TableLogic.#DISYUN_EXC && this.#error === null) {
            if (this.#tableType === 'expr') {
                opIz = this.#operando;
            }

            this.#token = this.#scan.nextToken();
            this.#conjuncion();

            if (this.#tableType === 'true') {
                const q = this.#pila.pop();
                const p = this.#pila.pop();
                this.#pila.push(p ^ q);
            }

            if (this.#tableType === 'expr') {
                this.#operando = opIz + ' ⊻ ' + this.#operando;
            }
        }
    }

    #conjuncion() {
        // conjuncion = negacion restoConjuncion
        this.#negacion();
        this.#restoConjuncion();
    }

    #restoConjuncion() {
        // restoConjuncion = {"and" negacion}
        let opIz = undefined;

        while (this.#token === TableLogic.#CONJUN && this.#error === null) {
            this.#token = this.#scan.nextToken();

            if (this.#tableType === 'expr') {
                opIz = this.#operando;
            }

            this.#negacion();

            if (this.#tableType === 'true') {
                const q = this.#pila.pop();
                const p = this.#pila.pop();
                this.#pila.push(p && q);
            }

            if (this.#tableType === 'expr') {
                this.#operando = opIz + " ∧ " + this.#operando;
            }
        }
    }

    #negacion() {
        // negacion = {"not"} prop
        if (this.#token === TableLogic.#NEG) {
            this.#token = this.#scan.nextToken();
            this.#negacion();

            if (this.#tableType === 'true') {
                const p = this.#pila.pop();
                this.#pila.push(!p);
            }

            if (this.#tableType === 'expr') {
                this.#operando = '¬' + this.#operando;
            }
        } else {
            this.#prop();
        }
    }

    #prop() {
        /* prop = id | "0" | "1" | "F" | "V" | "(" expresion ")" |
                    "[" expresion "]" | "{" expresion "}" */
        let openSym, closeSym;
        if (this.#tableType === 'expr') {
            if (this.#token === Scanner.ident
                    || this.#token === Scanner.number
                    || this.#token === TableLogic.#TAUTOLOGIA
                    || this.#token === TableLogic.#CONTRADICCION) {
                this.#operando = this.#scan.getLexeme();
                this.#token = this.#scan.nextToken();
            } else { // '(', '[', '{'
                openSym = this.#scan.getLexeme();
                this.#token = this.#scan.nextToken();
                this.#expresion();
                closeSym = this.#scan.getLexeme();
                this.#token = this.#scan.nextToken();
                this.#operando = openSym + this.#operando + closeSym;
            }
            return;
        }

        if (this.#tableType === 'true') {
            if (this.#token === Scanner.ident
                    || this.#token === Scanner.number
                    || this.#token === TableLogic.#TAUTOLOGIA
                    || this.#token === TableLogic.#CONTRADICCION) {
                // Puede ser una proposición simple o cumpuesta
                let tv;
                if (this.#propsSimp.has(this.#scan.getLexeme())) {
                    tv = this.#propsSimp.get(this.#scan.getLexeme());
                } else { // Compuesta
                    tv = this.#propsComp.get(this.#scan.getLexeme());
                }
                this.#pila.push(tv.get(this.#fila) === 1);
                this.#token = this.#scan.nextToken();
            } else { // "(", "[", "{"                
                this.#token = this.#scan.nextToken();
                this.#expresion();
                this.#token = this.#scan.nextToken();
            }
            return;
        }

        if (this.#token === Scanner.ident
                || (this.#numericalTruthValue
                && (this.#scan.getLexeme() === '0'
                || this.#scan.getLexeme() === '1'))
                || this.#token === TableLogic.#TAUTOLOGIA
                || this.#token === TableLogic.#CONTRADICCION) {
            /* Comprueba si debe meter la proposición en la tabla. Esto solo
            ocurre en las nuevas definiciones de proposiciones simples. */
            if (!this.#propsComp.has(this.#scan.getLexeme())) {
                if (!this.#propsSimp.has(this.#scan.getLexeme())) {
                    this.#propsSimp.set(this.#scan.getLexeme(), null);
                }
            }
            this.#token = this.#scan.nextToken();
        } else if (this.#token === TableLogic.#PAR_AB ||
            this.#token === TableLogic.#COR_AB ||
            this.#token === TableLogic.#LLAVE_AB) {
            openSym = this.#scan.getLexeme();
            this.#token = this.#scan.nextToken();
            this.#expresion();

            if (this.#error !== null) {
                return;
            }

            closeSym = this.#closeSym(openSym);
            if (closeSym === this.#scan.getLexeme()) {
                this.#token = this.#scan.nextToken();
            } else {
                // Error, se esperaba ")", "]", o "}"
                this.#setError(`Se esperaba el símbolo '${closeSym}'`);
            }
        } else {
            this.#setError('Se esperaba identificador, "(", "[", o "{"');
        }
    }

    #closeSym(openSym) {
        if (openSym === '(') {
            return ')';
        } else if (openSym === '[') {
            return ']';
        } else if (openSym === '{') {
            return '}';
        } else {
            return '';
        }
    }
}
