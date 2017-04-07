(function () {
'use strict';

/**
 * slice() reference.
 */

var slice = Array.prototype.slice;

/**
 * Expose `co`.
 */

var index = co['default'] = co.co = co;

/**
 * Wrap the given generator `fn` into a
 * function that returns a promise.
 * This is a separate function so that
 * every `co()` call doesn't create a new,
 * unnecessary closure.
 *
 * @param {GeneratorFunction} fn
 * @return {Function}
 * @api public
 */

co.wrap = function (fn) {
  createPromise.__generatorFunction__ = fn;
  return createPromise;
  function createPromise() {
    return co.call(this, fn.apply(this, arguments));
  }
};

/**
 * Execute the generator function or a generator
 * and return a promise.
 *
 * @param {Function} fn
 * @return {Promise}
 * @api public
 */

function co(gen) {
  var ctx = this;
  var args = slice.call(arguments, 1);

  // we wrap everything in a promise to avoid promise chaining,
  // which leads to memory leak errors.
  // see https://github.com/tj/co/issues/180
  return new Promise(function(resolve, reject) {
    if (typeof gen === 'function') gen = gen.apply(ctx, args);
    if (!gen || typeof gen.next !== 'function') return resolve(gen);

    onFulfilled();

    /**
     * @param {Mixed} res
     * @return {Promise}
     * @api private
     */

    function onFulfilled(res) {
      var ret;
      try {
        ret = gen.next(res);
      } catch (e) {
        return reject(e);
      }
      next(ret);
    }

    /**
     * @param {Error} err
     * @return {Promise}
     * @api private
     */

    function onRejected(err) {
      var ret;
      try {
        ret = gen.throw(err);
      } catch (e) {
        return reject(e);
      }
      next(ret);
    }

    /**
     * Get the next value in the generator,
     * return a promise.
     *
     * @param {Object} ret
     * @return {Promise}
     * @api private
     */

    function next(ret) {
      if (ret.done) return resolve(ret.value);
      var value = toPromise.call(ctx, ret.value);
      if (value && isPromise(value)) return value.then(onFulfilled, onRejected);
      return onRejected(new TypeError('You may only yield a function, promise, generator, array, or object, '
        + 'but the following object was passed: "' + String(ret.value) + '"'));
    }
  });
}

/**
 * Convert a `yield`ed value into a promise.
 *
 * @param {Mixed} obj
 * @return {Promise}
 * @api private
 */

function toPromise(obj) {
  if (!obj) return obj;
  if (isPromise(obj)) return obj;
  if (isGeneratorFunction(obj) || isGenerator(obj)) return co.call(this, obj);
  if ('function' == typeof obj) return thunkToPromise.call(this, obj);
  if (Array.isArray(obj)) return arrayToPromise.call(this, obj);
  if (isObject(obj)) return objectToPromise.call(this, obj);
  return obj;
}

/**
 * Convert a thunk to a promise.
 *
 * @param {Function}
 * @return {Promise}
 * @api private
 */

function thunkToPromise(fn) {
  var ctx = this;
  return new Promise(function (resolve, reject) {
    fn.call(ctx, function (err, res) {
      if (err) return reject(err);
      if (arguments.length > 2) res = slice.call(arguments, 1);
      resolve(res);
    });
  });
}

/**
 * Convert an array of "yieldables" to a promise.
 * Uses `Promise.all()` internally.
 *
 * @param {Array} obj
 * @return {Promise}
 * @api private
 */

function arrayToPromise(obj) {
  return Promise.all(obj.map(toPromise, this));
}

/**
 * Convert an object of "yieldables" to a promise.
 * Uses `Promise.all()` internally.
 *
 * @param {Object} obj
 * @return {Promise}
 * @api private
 */

function objectToPromise(obj){
  var results = new obj.constructor();
  var keys = Object.keys(obj);
  var promises = [];
  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    var promise = toPromise.call(this, obj[key]);
    if (promise && isPromise(promise)) defer(promise, key);
    else results[key] = obj[key];
  }
  return Promise.all(promises).then(function () {
    return results;
  });

  function defer(promise, key) {
    // predefine the key in the result
    results[key] = undefined;
    promises.push(promise.then(function (res) {
      results[key] = res;
    }));
  }
}

/**
 * Check if `obj` is a promise.
 *
 * @param {Object} obj
 * @return {Boolean}
 * @api private
 */

function isPromise(obj) {
  return 'function' == typeof obj.then;
}

/**
 * Check if `obj` is a generator.
 *
 * @param {Mixed} obj
 * @return {Boolean}
 * @api private
 */

function isGenerator(obj) {
  return 'function' == typeof obj.next && 'function' == typeof obj.throw;
}

/**
 * Check if `obj` is a generator function.
 *
 * @param {Mixed} obj
 * @return {Boolean}
 * @api private
 */
function isGeneratorFunction(obj) {
  var constructor = obj.constructor;
  if (!constructor) return false;
  if ('GeneratorFunction' === constructor.name || 'GeneratorFunction' === constructor.displayName) return true;
  return isGenerator(constructor.prototype);
}

/**
 * Check for plain object.
 *
 * @param {Mixed} val
 * @return {Boolean}
 * @api private
 */

function isObject(val) {
  return Object == val.constructor;
}

function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

var keys = createCommonjsModule(function (module, exports) {
exports = module.exports = typeof Object.keys === 'function'
  ? Object.keys : shim;

exports.shim = shim;
function shim (obj) {
  var keys = [];
  for (var key in obj) keys.push(key);
  return keys;
}
});

var is_arguments = createCommonjsModule(function (module, exports) {
var supportsArgumentsClass = (function(){
  return Object.prototype.toString.call(arguments)
})() == '[object Arguments]';

exports = module.exports = supportsArgumentsClass ? supported : unsupported;

exports.supported = supported;
function supported(object) {
  return Object.prototype.toString.call(object) == '[object Arguments]';
}

exports.unsupported = unsupported;
function unsupported(object){
  return object &&
    typeof object == 'object' &&
    typeof object.length == 'number' &&
    Object.prototype.hasOwnProperty.call(object, 'callee') &&
    !Object.prototype.propertyIsEnumerable.call(object, 'callee') ||
    false;
}
});

var index$1 = createCommonjsModule(function (module) {
var pSlice = Array.prototype.slice;
var objectKeys = keys;
var isArguments = is_arguments;

var deepEqual = module.exports = function (actual, expected, opts) {
  if (!opts) opts = {};
  // 7.1. All identical values are equivalent, as determined by ===.
  if (actual === expected) {
    return true;

  } else if (actual instanceof Date && expected instanceof Date) {
    return actual.getTime() === expected.getTime();

  // 7.3. Other pairs that do not both pass typeof value == 'object',
  // equivalence is determined by ==.
  } else if (!actual || !expected || typeof actual != 'object' && typeof expected != 'object') {
    return opts.strict ? actual === expected : actual == expected;

  // 7.4. For all other Object pairs, including Array objects, equivalence is
  // determined by having the same number of owned properties (as verified
  // with Object.prototype.hasOwnProperty.call), the same set of keys
  // (although not necessarily the same order), equivalent values for every
  // corresponding key, and an identical 'prototype' property. Note: this
  // accounts for both named and indexed properties on Arrays.
  } else {
    return objEquiv(actual, expected, opts);
  }
};

function isUndefinedOrNull(value) {
  return value === null || value === undefined;
}

function isBuffer (x) {
  if (!x || typeof x !== 'object' || typeof x.length !== 'number') return false;
  if (typeof x.copy !== 'function' || typeof x.slice !== 'function') {
    return false;
  }
  if (x.length > 0 && typeof x[0] !== 'number') return false;
  return true;
}

function objEquiv(a, b, opts) {
  var i, key;
  if (isUndefinedOrNull(a) || isUndefinedOrNull(b))
    return false;
  // an identical 'prototype' property.
  if (a.prototype !== b.prototype) return false;
  //~~~I've managed to break Object.keys through screwy arguments passing.
  //   Converting to array solves the problem.
  if (isArguments(a)) {
    if (!isArguments(b)) {
      return false;
    }
    a = pSlice.call(a);
    b = pSlice.call(b);
    return deepEqual(a, b, opts);
  }
  if (isBuffer(a)) {
    if (!isBuffer(b)) {
      return false;
    }
    if (a.length !== b.length) return false;
    for (i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  }
  try {
    var ka = objectKeys(a),
        kb = objectKeys(b);
  } catch (e) {//happens when one is a string literal and the other isn't
    return false;
  }
  // having the same number of owned properties (keys incorporates
  // hasOwnProperty)
  if (ka.length != kb.length)
    return false;
  //the same set of keys (although not necessarily the same order),
  ka.sort();
  kb.sort();
  //~~~cheap key test
  for (i = ka.length - 1; i >= 0; i--) {
    if (ka[i] != kb[i])
      return false;
  }
  //equivalent values for every corresponding key, and
  //~~~possibly expensive deep test
  for (i = ka.length - 1; i >= 0; i--) {
    key = ka[i];
    if (!deepEqual(a[key], b[key], opts)) return false;
  }
  return typeof a === typeof b;
}
});

const assertions = {
  ok(val, message = 'should be truthy') {
    const assertionResult = {
      pass: Boolean(val),
      expected: 'truthy',
      actual: val,
      operator: 'ok',
      message
    };
    this.test.addAssertion(assertionResult);
    return assertionResult;
  },
  deepEqual(actual, expected, message = 'should be equivalent') {
    const assertionResult = {
      pass: index$1(actual, expected),
      actual,
      expected,
      message,
      operator: 'deepEqual'
    };
    this.test.addAssertion(assertionResult);
    return assertionResult;
  },
  equal(actual, expected, message = 'should be equal') {
    const assertionResult = {
      pass: actual === expected,
      actual,
      expected,
      message,
      operator: 'equal'
    };
    this.test.addAssertion(assertionResult);
    return assertionResult;
  },
  notOk(val, message = 'should not be truthy') {
    const assertionResult = {
      pass: !Boolean(val),
      expected: 'falsy',
      actual: val,
      operator: 'notOk',
      message
    };
    this.test.addAssertion(assertionResult);
    return assertionResult;
  },
  notDeepEqual(actual, expected, message = 'should not be equivalent') {
    const assertionResult = {
      pass: !index$1(actual, expected),
      actual,
      expected,
      message,
      operator: 'notDeepEqual'
    };
    this.test.addAssertion(assertionResult);
    return assertionResult;
  },
  notEqual(actual, expected, message = 'should not be equal') {
    const assertionResult = {
      pass: actual !== expected,
      actual,
      expected,
      message,
      operator: 'notEqual'
    };
    this.test.addAssertion(assertionResult);
    return assertionResult;
  },
  throws(func, expected, message) {
    let caught, pass, actual;
    if (typeof expected === 'string') {
      [expected, message] = [message, expected];
    }
    try {
      func();
    } catch (error) {
      caught = {error};
    }
    pass = caught !== undefined;
    actual = caught && caught.error;
    if (expected instanceof RegExp) {
      pass = expected.test(actual) || expected.test(actual && actual.message);
      expected = String(expected);
    } else if (typeof expected === 'function' && caught) {
      pass = actual instanceof expected;
      actual = actual.constructor;
    }
    const assertionResult = {
      pass,
      expected,
      actual,
      operator: 'throws',
      message: message || 'should throw'
    };
    this.test.addAssertion(assertionResult);
    return assertionResult;
  },
  doesNotThrow(func, expected, message) {
    let caught;
    if (typeof expected === 'string') {
      [expected, message] = [message, expected];
    }
    try {
      func();
    } catch (error) {
      caught = {error};
    }
    const assertionResult = {
      pass: caught === undefined,
      expected: 'no thrown error',
      actual: caught && caught.error,
      operator: 'doesNotThrow',
      message: message || 'should not throw'
    };
    this.test.addAssertion(assertionResult);
    return assertionResult;
  },
  fail(reason = 'fail called') {
    const assertionResult = {
      pass: false,
      actual: 'fail called',
      expected: 'fail not called',
      message: reason,
      operator: 'fail'
    };
    this.test.addAssertion(assertionResult);
    return assertionResult;
  }
};

function assertion (test) {
  return Object.create(assertions, {test: {value: test}});
}

const Test = {
  run: function () {
    const assert = assertion(this);
    const now = Date.now();
    return index(this.coroutine(assert))
      .then(() => {
        return {assertions: this.assertions, executionTime: Date.now() - now};
      });
  },
  addAssertion(){
    const newAssertions = [...arguments].map(a => Object.assign({description: this.description}, a));
    this.assertions.push(...newAssertions);
    return this;
  }
};

function test ({description, coroutine, only = false}) {
  return Object.create(Test, {
    description: {value: description},
    coroutine: {value: coroutine},
    assertions: {value: []},
    only: {value: only},
    length: {
      get(){
        return this.assertions.length
      }
    }
  });
}

function tapOut ({pass, message, index}) {
  const status = pass === true ? 'ok' : 'not ok';
  console.log([status, index, message].join(' '));
}

function canExit () {
  return typeof process !== 'undefined' && typeof process.exit === 'function';
}

function tap () {
  return function * () {
    let index = 1;
    let lastId = 0;
    let success = 0;
    let failure = 0;

    const starTime = Date.now();
    console.log('TAP version 13');
    try {
      while (true) {
        const assertion = yield;
        if (assertion.pass === true) {
          success++;
        } else {
          failure++;
        }
        assertion.index = index;
        if (assertion.id !== lastId) {
          console.log(`# ${assertion.description} - ${assertion.executionTime}ms`);
          lastId = assertion.id;
        }
        tapOut(assertion);
        if (assertion.pass !== true) {
          console.log(`  ---
  operator: ${assertion.operator}
  expected: ${JSON.stringify(assertion.expected)}
  actual: ${JSON.stringify(assertion.actual)}
  ...`);
        }
        index++;
      }
    } catch (e) {
      console.log('Bail out! unhandled exception');
      console.log(e);
      if (canExit()) {
        process.exit(1);
      }
    }
    finally {
      const execution = Date.now() - starTime;
      if (index > 1) {
        console.log(`
1..${index - 1}
# duration ${execution}ms
# success ${success}
# failure ${failure}`);
      }
      if (failure && canExit()) {
        process.exit(1);
      }
    }
  };
}

const Plan = {
  test(description, coroutine, opts = {}){
    const testItems = (!coroutine && description.tests) ? [...description] : [{description, coroutine}];
    this.tests.push(...testItems.map(t=>test(Object.assign(t, opts))));
    return this;
  },

  only(description, coroutine){
    return this.test(description, coroutine, {only: true});
  },

  run(sink = tap()){
    const sinkIterator = sink();
    sinkIterator.next();
    const hasOnly = this.tests.some(t=>t.only);
    const runnable = hasOnly ? this.tests.filter(t=>t.only) : this.tests;
    return index(function * () {
      let id = 1;
      try {
        const results = runnable.map(t=>t.run());
        for (let r of results) {
          const {assertions, executionTime} = yield r;
          for (let assert of assertions) {
            sinkIterator.next(Object.assign(assert, {id, executionTime}));
          }
          id++;
        }
      }
      catch (e) {
        sinkIterator.throw(e);
      } finally {
        sinkIterator.return();
      }
    }.bind(this))
  },

  * [Symbol.iterator](){
    for (let t of this.tests) {
      yield t;
    }
  }
};

function plan$1 () {
  return Object.create(Plan, {
    tests: {value: []},
    length: {
      get(){
        return this.tests.length
      }
    }
  });
}

const findContainer = (element, selector) => element.matches(selector) === true ? element : findContainer(element.parentElement, selector);

function keyGrid (grid, {cellSelector, rowSelector}) {

  const doesSkipKeyboard = el => el.getAttribute('data-keyboard-skip') === 'true';

  const createGrid = (grid) => {
    const instance = {};
    Object.defineProperty(instance, 'rows', {
      get(){
        return grid.rows !== void 0 ? grid.rows : [...grid.querySelectorAll(rowSelector)]
      }
    });

    Object.defineProperty(instance, 'element', {value: grid});
    return instance;
  };

  const gridWrapped = createGrid(grid);

  const rowProto = {
    moveUp(){
      const rowIndex = this.rowIndex;
      const newRowIndex = Math.max(rowIndex - 1, 0);
      const newRow = gridWrapped.rows[newRowIndex];
      if (doesSkipKeyboard(newRow) === false) {
        return newRow;
      } else if (newRowIndex === 0) {
        return this.element;
      } else {
        return createRow(newRow).moveUp();
      }
    },
    moveDown(){
      const rowIndex = this.rowIndex;
      const newRowIndex = Math.min(rowIndex + 1, gridWrapped.rows.length - 1);
      const newRow = gridWrapped.rows[newRowIndex];
      if (doesSkipKeyboard(newRow) === false) {
        return newRow;
      } else if (newRowIndex === gridWrapped.rows.length - 1) {
        return this.element;
      } else {
        return createRow(newRow).moveDown();
      }
    }
  };

  function createRow (rowElement) {
    return Object.create(rowProto, {
      cells: {
        get(){
          return rowElement.cells !== void 0 ? [...rowElement.cells] : [...rowElement.querySelectorAll(cellSelector)];
        }
      },
      rowIndex: {
        get(){
          return rowElement.rowIndex !== void 0 ? rowElement.rowIndex : [...grid.querySelectorAll(rowSelector)].indexOf(rowElement);
        }
      },
      element: {value: rowElement}
    });
  }

  const cellProto = {
    moveRight(){
      const row = createRow(findContainer(this.element, rowSelector));
      const rowCells = row.cells;
      const cellIndex = this.cellIndex;
      const newIndex = Math.min(rowCells.length - 1, cellIndex + 1);
      const newCell = rowCells[newIndex];
      if (doesSkipKeyboard(newCell) === false) {
        return newCell;
      } else if (newIndex === rowCells.length - 1) {
        return this.element;
      } else {
        return createCell(newCell).moveRight();
      }
    },
    moveLeft(){
      const row = createRow(findContainer(this.element, rowSelector));
      const rowCells = row.cells;
      const cellIndex = this.cellIndex;
      const newIndex = Math.max(0, cellIndex - 1);
      const newCell = rowCells[newIndex];
      if (doesSkipKeyboard(newCell) === false) {
        return newCell;
      } else if (newIndex === 0) {
        return this.element;
      } else {
        return createCell(newCell).moveLeft();
      }
    }
  };

  const virtualCellProto = {
    moveRight(){
      if (this.currentIndex === this.virtualCells.length - 1) {
        const newCell = createCell(this.cellElement).moveRight();
        return newCell === this.cellElement ? this.element : newCell;
      } else {
        return this.virtualCells[this.currentIndex + 1];
      }
    },
    moveLeft(){
      if (this.currentIndex === 0) {
        const newCell = createCell(this.cellElement).moveLeft();
        return newCell === this.cellElement ? this.element : newCell;
      } else {
        return this.virtualCells[this.currentIndex - 1];
      }
    }
  };

  function createCell (cellElement) {
    const row = findContainer(cellElement, rowSelector);
    return Object.create(cellProto, {
      cellIndex: {
        get(){
          return cellElement.cellIndex !== void 0 ? cellElement.cellIndex : [...row.querySelectorAll(cellSelector)].indexOf(cellElement);
        }
      },
      element: {value: cellElement}
    });
  }

  function createCompositeCell (cellElement, element) {
    const selector = cellElement.getAttribute('data-keyboard-selector');
    const virtualCells = [...cellElement.querySelectorAll(selector)];
    const currentIndex = virtualCells.indexOf(element);
    return Object.create(virtualCellProto, {
      virtualCells: {value: virtualCells},
      currentIndex: {value: currentIndex},
      cellElement: {value: cellElement},
      element: {value: element}
    });
  }

  const moveRight = (target) => {
    const cellElement = findContainer(target, cellSelector);
    const cell = cellElement === target ? createCell(cellElement) : createCompositeCell(cellElement, target);
    return cell.moveRight();
  };

  const moveLeft = target => {
    const cellElement = findContainer(target, cellSelector);
    const cell = cellElement === target ? createCell(cellElement) : createCompositeCell(cellElement, target);
    return cell.moveLeft();
  };

  const moveUp = target => {
    const cell = createCell(findContainer(target, cellSelector));
    const row = createRow(findContainer(cell.element, rowSelector));
    const cellIndex = cell.cellIndex;
    const newRow = createRow(row.moveUp());
    const newCell = newRow.cells[Math.min(newRow.cells.length - 1, cellIndex)];
    return newCell.hasAttribute('data-keyboard-skip') === false ? newCell : createCell(newCell).moveLeft();
  };

  const moveDown = target => {
    const cell = createCell(findContainer(target, cellSelector));
    const row = createRow(findContainer(cell.element, rowSelector));
    const cellIndex = cell.cellIndex;
    const newRow = createRow(row.moveDown());
    const newCell = newRow.cells[Math.min(newRow.cells.length - 1, cellIndex)];
    return newCell.hasAttribute('data-keyboard-skip') === false ? newCell : createCell(newCell).moveLeft();
  };

  return {
    moveDown,
    moveLeft,
    moveUp,
    moveRight
  };
}

var moveRight = plan$1()
  .test('move to the next cell on the right', function * (t) {
    const table = document.createElement('TABLE');
    table.innerHTML = `<tr>
<td id="1">foo</td>
<td id="2">bar</td>
<td id="3">woot</td>
</tr>`;
    const kg = keyGrid(table, {cellSelector: 'td', rowSelector: 'tr'});

    const moved = kg.moveRight(table.querySelector('[id="1"]'));
    t.equal(moved.id, '2');
  })
  .test('table (data cell): dont move if already at the end of the row', function * (t) {
    const table = document.createElement('TABLE');
    table.innerHTML = `<tr>
<td id="1">foo</td>
<td id="2">bar</td>
<td id="3">woot</td>
</tr>`;
    const kg = keyGrid(table, {cellSelector: 'td', rowSelector: 'tr'});
    const moved = kg.moveRight(table.querySelector('[id="3"]'));
    t.equal(moved.id, '3');
  })
  .test('skip a cell with the data-keaboard-skip flag set to true', function * (t) {
    const table = document.createElement('TABLE');
    table.innerHTML = `<tr>
<td id="1">foo</td>
<td data-keyboard-skip="true" id="2">bar</td>
<td id="3">woot</td>
</tr>`;
    const kg = keyGrid(table, {cellSelector: 'td', rowSelector: 'tr'});
    const moved = kg.moveRight(table.querySelector('[id="1"]'));
    t.equal(moved.id, '3');
  })
  .test('do not move if last cell has to be skipped', function * (t) {
    const table = document.createElement('TABLE');
    table.innerHTML = `<tr>
<td id="1">foo</td>
<td id="2">bar</td>
<td data-keyboard-skip="true" id="3">woot</td>
</tr>`;
    const kg = keyGrid(table, {cellSelector: 'td', rowSelector: 'tr'});
    const moved = kg.moveRight(table.querySelector('[id="2"]'));
    t.equal(moved.id, '2');
  })
  .test('move inside a sub virtual cell if specified', function * (t) {
    const table = document.createElement('TABLE');
    table.innerHTML = `<tr>
<td id="1">foo</td>
<td data-keyboard-selector="button" id="2"><button id="button-bar">bar</button><button id="button-bim">bim</button></td>
<td id="3">woot</td>
</tr>`;
    const kg = keyGrid(table, {cellSelector: 'td', rowSelector: 'tr'});
    const moved = kg.moveRight(table.querySelector('button#button-bar'));
    t.equal(moved.id, 'button-bim');
  })
  .test('move out of virtual cell if last item is reached', function * (t) {
    const table = document.createElement('TABLE');
    table.innerHTML = `<tr>
<td id="1">foo</td>
<td data-keyboard-selector="button" id="2"><button id="button-bar">bar</button><button id="button-bim">bim</button></td>
<td id="3">woot</td>
</tr>`;
    const kg = keyGrid(table, {cellSelector: 'td', rowSelector: 'tr'});
    const moved = kg.moveRight(table.querySelector('button#button-bim'));
    t.equal(moved.id, '3');
  });

var moveLeft = plan$1()
  .test('move to the previous cell on the left', function * (t) {
    const table = document.createElement('TABLE');
    table.innerHTML = `<tr>
<td id="1">foo</td>
<td id="2">bar</td>
<td id="3">woot</td>
</tr>`;
    const kg = keyGrid(table, {cellSelector: 'td', rowSelector: 'tr'});

    const moved = kg.moveLeft(table.querySelector('[id="2"]'));
    t.equal(moved.id, '1');
  })
  .test('table (data cell): dont move if already at the beginning of the row', function * (t) {
    const table = document.createElement('TABLE');
    table.innerHTML = `<tr>
<td id="1">foo</td>
<td id="2">bar</td>
<td id="3">woot</td>
</tr>`;
    const kg = keyGrid(table, {cellSelector: 'td', rowSelector: 'tr'});
    const moved = kg.moveLeft(table.querySelector('[id="1"]'));
    t.equal(moved.id, '1');
  })
  .test('skip a cell with the data-keaboard-skip flag set to true', function * (t) {
    const table = document.createElement('TABLE');
    table.innerHTML = `<tr>
<td id="1">foo</td>
<td data-keyboard-skip="true" id="2">bar</td>
<td id="3">woot</td>
</tr>`;
    const kg = keyGrid(table, {cellSelector: 'td', rowSelector: 'tr'});
    const moved = kg.moveLeft(table.querySelector('[id="3"]'));
    t.equal(moved.id, '1');
  })
  .test('do not move if last cell has to be skipped', function * (t) {
    const table = document.createElement('TABLE');
    table.innerHTML = `<tr>
<td data-keyboard-skip="true" id="1">foo</td>
<td id="2">bar</td>
<td id="3">woot</td>
</tr>`;
    const kg = keyGrid(table, {cellSelector: 'td', rowSelector: 'tr'});
    const moved = kg.moveLeft(table.querySelector('[id="2"]'));
    t.equal(moved.id, '2');
  })
  .test('move inside a sub virtual cell if specified', function * (t) {
    const table = document.createElement('TABLE');
    table.innerHTML = `<tr>
<td id="1">foo</td>
<td data-keyboard-selector="button" id="2"><button id="button-bar">bar</button><button id="button-bim">bim</button></td>
<td id="3">woot</td>
</tr>`;
    const kg = keyGrid(table, {cellSelector: 'td', rowSelector: 'tr'});
    const moved = kg.moveLeft(table.querySelector('button#button-bim'));
    t.equal(moved.id, 'button-bar');
  })
  .test('move out of virtual cell if first item is reached', function * (t) {
    const table = document.createElement('TABLE');
    table.innerHTML = `<tr>
<td id="1">foo</td>
<td data-keyboard-selector="button" id="2"><button id="button-bar">bar</button><button id="button-bim">bim</button></td>
<td id="3">woot</td>
</tr>`;
    const kg = keyGrid(table, {cellSelector: 'td', rowSelector: 'tr'});
    const moved = kg.moveLeft(table.querySelector('button#button-bar'));
    t.equal(moved.id, '1');
  });

var moveUp = plan$1()
  .test('move up from one row to the other', function * (t) {
    const table = document.createElement('TABLE');
    table.innerHTML = `<tr id="r1">
<td id="1">foo</td>
<td id="2">bar</td>
<td id="3">woot</td>
</tr>
<tr id="r2">
<td id="11">foo</td>
<td id="12">bar</td>
<td id="13">woot</td>
</tr>`;
    const kg = keyGrid(table, {cellSelector: 'td', rowSelector: 'tr'});

    const moved = kg.moveUp(table.querySelector('[id="12"]'));
    t.equal(moved.id, '2');
  })
  .test('move up keeping the same cell as the first row has the skip flag', function * (t) {
    const table = document.createElement('TABLE');
    table.innerHTML = `<tr data-keyboard-skip="true" id="r1">
<td id="1">foo</td>
<td id="2">bar</td>
<td id="3">woot</td>
</tr>
<tr id="r2">
<td id="11">foo</td>
<td id="12">bar</td>
<td id="13">woot</td>
</tr>`;
    const kg = keyGrid(table, {cellSelector: 'td', rowSelector: 'tr'});

    const moved = kg.moveUp(table.querySelector('[id="12"]'));
    t.equal(moved.id, '12');
  })
  .test('move up skipping a row', function * (t) {
    const table = document.createElement('TABLE');
    table.innerHTML = `<tr id="r1">
<td id="1">foo</td>
<td id="2">bar</td>
<td id="3">woot</td>
</tr>
<tr data-keyboard-skip="true" id="r2">
<td id="11">foo</td>
<td id="12">bar</td>
<td id="13">woot</td>
</tr>
<tr id="r3">
<td id="21">foo</td>
<td id="22">bar</td>
<td id="23">woot</td>
</tr>`;
    const kg = keyGrid(table, {cellSelector: 'td', rowSelector: 'tr'});

    const moved = kg.moveUp(table.querySelector('[id="22"]'));
    t.equal(moved.id, '2');
  })
  .test('move up getting the last cell of the previous row as there are less cells on that row', function * (t) {
    const table = document.createElement('TABLE');
    table.innerHTML = `<tr id="r1">
<td id="1">foo</td>
<td id="2">bar</td>
</tr>
<tr id="r2">
<td id="11">foo</td>
<td id="12">bar</td>
<td id="13">woot</td>
</tr>`;
    const kg = keyGrid(table, {cellSelector: 'td', rowSelector: 'tr'});

    const moved = kg.moveUp(table.querySelector('[id="13"]'));
    t.equal(moved.id, '2');
  });

var moveDown = plan$1()
  .test('move down from one row to the other', function * (t) {
    const table = document.createElement('TABLE');
    table.innerHTML = `<tr id="r1">
<td id="1">foo</td>
<td id="2">bar</td>
<td id="3">woot</td>
</tr>
<tr id="r2">
<td id="11">foo</td>
<td id="12">bar</td>
<td id="13">woot</td>
</tr>`;
    const kg = keyGrid(table, {cellSelector: 'td', rowSelector: 'tr'});

    const moved = kg.moveDown(table.querySelector('[id="2"]'));
    t.equal(moved.id, '12');
  })
  .test('move down keeping the same cell as the last row has the skip flag', function * (t) {
    const table = document.createElement('TABLE');
    table.innerHTML = `<tr id="r1">
<td id="1">foo</td>
<td id="2">bar</td>
<td id="3">woot</td>
</tr>
<tr id="r2" data-keyboard-skip="true">
<td id="11">foo</td>
<td id="12">bar</td>
<td id="13">woot</td>
</tr>`;
    const kg = keyGrid(table, {cellSelector: 'td', rowSelector: 'tr'});

    const moved = kg.moveDown(table.querySelector('[id="2"]'));
    t.equal(moved.id, '2');
  })
  .test('move down skipping a row', function * (t) {
    const table = document.createElement('TABLE');
    table.innerHTML = `<tr id="r1">
<td id="1">foo</td>
<td id="2">bar</td>
<td id="3">woot</td>
</tr>
<tr data-keyboard-skip="true" id="r2">
<td id="11">foo</td>
<td id="12">bar</td>
<td id="13">woot</td>
</tr>
<tr id="r3">
<td id="21">foo</td>
<td id="22">bar</td>
<td id="23">woot</td>
</tr>`;
    const kg = keyGrid(table, {cellSelector: 'td', rowSelector: 'tr'});

    const moved = kg.moveDown(table.querySelector('[id="2"]'));
    t.equal(moved.id, '22');
  })
  .test('move down getting the last cell of the next row as there are less cells on that row', function * (t) {
    const table = document.createElement('TABLE');
    table.innerHTML = `<tr id="r1">
<td id="1">foo</td>
<td id="2">bar</td>
<td id="3">bar</td>
</tr>
<tr id="r2">
<td id="11">foo</td>
<td id="12">bar</td>
</tr>`;
    const kg = keyGrid(table, {cellSelector: 'td', rowSelector: 'tr'});

    const moved = kg.moveDown(table.querySelector('[id="3"]'));
    t.equal(moved.id, '12');
  });

plan$1()
  .test(moveRight)
  .test(moveLeft)
  .test(moveUp)
  .test(moveDown)
  .run();

}());
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdC5qcyIsInNvdXJjZXMiOlsiLi4vLi4vbm9kZV9tb2R1bGVzL3pvcmEvZGlzdC96b3JhLmVzLmpzIiwiLi4vLi4vbGliL2tleW1hcC5qcyIsIi4uL21vdmVSaWdodC5qcyIsIi4uL21vdmVMZWZ0LmpzIiwiLi4vbW92ZVVwLmpzIiwiLi4vbW92ZURvd24uanMiLCIuLi9pbmRleC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIHNsaWNlKCkgcmVmZXJlbmNlLlxuICovXG5cbnZhciBzbGljZSA9IEFycmF5LnByb3RvdHlwZS5zbGljZTtcblxuLyoqXG4gKiBFeHBvc2UgYGNvYC5cbiAqL1xuXG52YXIgaW5kZXggPSBjb1snZGVmYXVsdCddID0gY28uY28gPSBjbztcblxuLyoqXG4gKiBXcmFwIHRoZSBnaXZlbiBnZW5lcmF0b3IgYGZuYCBpbnRvIGFcbiAqIGZ1bmN0aW9uIHRoYXQgcmV0dXJucyBhIHByb21pc2UuXG4gKiBUaGlzIGlzIGEgc2VwYXJhdGUgZnVuY3Rpb24gc28gdGhhdFxuICogZXZlcnkgYGNvKClgIGNhbGwgZG9lc24ndCBjcmVhdGUgYSBuZXcsXG4gKiB1bm5lY2Vzc2FyeSBjbG9zdXJlLlxuICpcbiAqIEBwYXJhbSB7R2VuZXJhdG9yRnVuY3Rpb259IGZuXG4gKiBAcmV0dXJuIHtGdW5jdGlvbn1cbiAqIEBhcGkgcHVibGljXG4gKi9cblxuY28ud3JhcCA9IGZ1bmN0aW9uIChmbikge1xuICBjcmVhdGVQcm9taXNlLl9fZ2VuZXJhdG9yRnVuY3Rpb25fXyA9IGZuO1xuICByZXR1cm4gY3JlYXRlUHJvbWlzZTtcbiAgZnVuY3Rpb24gY3JlYXRlUHJvbWlzZSgpIHtcbiAgICByZXR1cm4gY28uY2FsbCh0aGlzLCBmbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpKTtcbiAgfVxufTtcblxuLyoqXG4gKiBFeGVjdXRlIHRoZSBnZW5lcmF0b3IgZnVuY3Rpb24gb3IgYSBnZW5lcmF0b3JcbiAqIGFuZCByZXR1cm4gYSBwcm9taXNlLlxuICpcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuXG4gKiBAcmV0dXJuIHtQcm9taXNlfVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5mdW5jdGlvbiBjbyhnZW4pIHtcbiAgdmFyIGN0eCA9IHRoaXM7XG4gIHZhciBhcmdzID0gc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpO1xuXG4gIC8vIHdlIHdyYXAgZXZlcnl0aGluZyBpbiBhIHByb21pc2UgdG8gYXZvaWQgcHJvbWlzZSBjaGFpbmluZyxcbiAgLy8gd2hpY2ggbGVhZHMgdG8gbWVtb3J5IGxlYWsgZXJyb3JzLlxuICAvLyBzZWUgaHR0cHM6Ly9naXRodWIuY29tL3RqL2NvL2lzc3Vlcy8xODBcbiAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xuICAgIGlmICh0eXBlb2YgZ2VuID09PSAnZnVuY3Rpb24nKSBnZW4gPSBnZW4uYXBwbHkoY3R4LCBhcmdzKTtcbiAgICBpZiAoIWdlbiB8fCB0eXBlb2YgZ2VuLm5leHQgIT09ICdmdW5jdGlvbicpIHJldHVybiByZXNvbHZlKGdlbik7XG5cbiAgICBvbkZ1bGZpbGxlZCgpO1xuXG4gICAgLyoqXG4gICAgICogQHBhcmFtIHtNaXhlZH0gcmVzXG4gICAgICogQHJldHVybiB7UHJvbWlzZX1cbiAgICAgKiBAYXBpIHByaXZhdGVcbiAgICAgKi9cblxuICAgIGZ1bmN0aW9uIG9uRnVsZmlsbGVkKHJlcykge1xuICAgICAgdmFyIHJldDtcbiAgICAgIHRyeSB7XG4gICAgICAgIHJldCA9IGdlbi5uZXh0KHJlcyk7XG4gICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIHJldHVybiByZWplY3QoZSk7XG4gICAgICB9XG4gICAgICBuZXh0KHJldCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQHBhcmFtIHtFcnJvcn0gZXJyXG4gICAgICogQHJldHVybiB7UHJvbWlzZX1cbiAgICAgKiBAYXBpIHByaXZhdGVcbiAgICAgKi9cblxuICAgIGZ1bmN0aW9uIG9uUmVqZWN0ZWQoZXJyKSB7XG4gICAgICB2YXIgcmV0O1xuICAgICAgdHJ5IHtcbiAgICAgICAgcmV0ID0gZ2VuLnRocm93KGVycik7XG4gICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIHJldHVybiByZWplY3QoZSk7XG4gICAgICB9XG4gICAgICBuZXh0KHJldCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogR2V0IHRoZSBuZXh0IHZhbHVlIGluIHRoZSBnZW5lcmF0b3IsXG4gICAgICogcmV0dXJuIGEgcHJvbWlzZS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSByZXRcbiAgICAgKiBAcmV0dXJuIHtQcm9taXNlfVxuICAgICAqIEBhcGkgcHJpdmF0ZVxuICAgICAqL1xuXG4gICAgZnVuY3Rpb24gbmV4dChyZXQpIHtcbiAgICAgIGlmIChyZXQuZG9uZSkgcmV0dXJuIHJlc29sdmUocmV0LnZhbHVlKTtcbiAgICAgIHZhciB2YWx1ZSA9IHRvUHJvbWlzZS5jYWxsKGN0eCwgcmV0LnZhbHVlKTtcbiAgICAgIGlmICh2YWx1ZSAmJiBpc1Byb21pc2UodmFsdWUpKSByZXR1cm4gdmFsdWUudGhlbihvbkZ1bGZpbGxlZCwgb25SZWplY3RlZCk7XG4gICAgICByZXR1cm4gb25SZWplY3RlZChuZXcgVHlwZUVycm9yKCdZb3UgbWF5IG9ubHkgeWllbGQgYSBmdW5jdGlvbiwgcHJvbWlzZSwgZ2VuZXJhdG9yLCBhcnJheSwgb3Igb2JqZWN0LCAnXG4gICAgICAgICsgJ2J1dCB0aGUgZm9sbG93aW5nIG9iamVjdCB3YXMgcGFzc2VkOiBcIicgKyBTdHJpbmcocmV0LnZhbHVlKSArICdcIicpKTtcbiAgICB9XG4gIH0pO1xufVxuXG4vKipcbiAqIENvbnZlcnQgYSBgeWllbGRgZWQgdmFsdWUgaW50byBhIHByb21pc2UuXG4gKlxuICogQHBhcmFtIHtNaXhlZH0gb2JqXG4gKiBAcmV0dXJuIHtQcm9taXNlfVxuICogQGFwaSBwcml2YXRlXG4gKi9cblxuZnVuY3Rpb24gdG9Qcm9taXNlKG9iaikge1xuICBpZiAoIW9iaikgcmV0dXJuIG9iajtcbiAgaWYgKGlzUHJvbWlzZShvYmopKSByZXR1cm4gb2JqO1xuICBpZiAoaXNHZW5lcmF0b3JGdW5jdGlvbihvYmopIHx8IGlzR2VuZXJhdG9yKG9iaikpIHJldHVybiBjby5jYWxsKHRoaXMsIG9iaik7XG4gIGlmICgnZnVuY3Rpb24nID09IHR5cGVvZiBvYmopIHJldHVybiB0aHVua1RvUHJvbWlzZS5jYWxsKHRoaXMsIG9iaik7XG4gIGlmIChBcnJheS5pc0FycmF5KG9iaikpIHJldHVybiBhcnJheVRvUHJvbWlzZS5jYWxsKHRoaXMsIG9iaik7XG4gIGlmIChpc09iamVjdChvYmopKSByZXR1cm4gb2JqZWN0VG9Qcm9taXNlLmNhbGwodGhpcywgb2JqKTtcbiAgcmV0dXJuIG9iajtcbn1cblxuLyoqXG4gKiBDb252ZXJ0IGEgdGh1bmsgdG8gYSBwcm9taXNlLlxuICpcbiAqIEBwYXJhbSB7RnVuY3Rpb259XG4gKiBAcmV0dXJuIHtQcm9taXNlfVxuICogQGFwaSBwcml2YXRlXG4gKi9cblxuZnVuY3Rpb24gdGh1bmtUb1Byb21pc2UoZm4pIHtcbiAgdmFyIGN0eCA9IHRoaXM7XG4gIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgZm4uY2FsbChjdHgsIGZ1bmN0aW9uIChlcnIsIHJlcykge1xuICAgICAgaWYgKGVycikgcmV0dXJuIHJlamVjdChlcnIpO1xuICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPiAyKSByZXMgPSBzbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XG4gICAgICByZXNvbHZlKHJlcyk7XG4gICAgfSk7XG4gIH0pO1xufVxuXG4vKipcbiAqIENvbnZlcnQgYW4gYXJyYXkgb2YgXCJ5aWVsZGFibGVzXCIgdG8gYSBwcm9taXNlLlxuICogVXNlcyBgUHJvbWlzZS5hbGwoKWAgaW50ZXJuYWxseS5cbiAqXG4gKiBAcGFyYW0ge0FycmF5fSBvYmpcbiAqIEByZXR1cm4ge1Byb21pc2V9XG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5mdW5jdGlvbiBhcnJheVRvUHJvbWlzZShvYmopIHtcbiAgcmV0dXJuIFByb21pc2UuYWxsKG9iai5tYXAodG9Qcm9taXNlLCB0aGlzKSk7XG59XG5cbi8qKlxuICogQ29udmVydCBhbiBvYmplY3Qgb2YgXCJ5aWVsZGFibGVzXCIgdG8gYSBwcm9taXNlLlxuICogVXNlcyBgUHJvbWlzZS5hbGwoKWAgaW50ZXJuYWxseS5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqXG4gKiBAcmV0dXJuIHtQcm9taXNlfVxuICogQGFwaSBwcml2YXRlXG4gKi9cblxuZnVuY3Rpb24gb2JqZWN0VG9Qcm9taXNlKG9iail7XG4gIHZhciByZXN1bHRzID0gbmV3IG9iai5jb25zdHJ1Y3RvcigpO1xuICB2YXIga2V5cyA9IE9iamVjdC5rZXlzKG9iaik7XG4gIHZhciBwcm9taXNlcyA9IFtdO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGtleXMubGVuZ3RoOyBpKyspIHtcbiAgICB2YXIga2V5ID0ga2V5c1tpXTtcbiAgICB2YXIgcHJvbWlzZSA9IHRvUHJvbWlzZS5jYWxsKHRoaXMsIG9ialtrZXldKTtcbiAgICBpZiAocHJvbWlzZSAmJiBpc1Byb21pc2UocHJvbWlzZSkpIGRlZmVyKHByb21pc2UsIGtleSk7XG4gICAgZWxzZSByZXN1bHRzW2tleV0gPSBvYmpba2V5XTtcbiAgfVxuICByZXR1cm4gUHJvbWlzZS5hbGwocHJvbWlzZXMpLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiByZXN1bHRzO1xuICB9KTtcblxuICBmdW5jdGlvbiBkZWZlcihwcm9taXNlLCBrZXkpIHtcbiAgICAvLyBwcmVkZWZpbmUgdGhlIGtleSBpbiB0aGUgcmVzdWx0XG4gICAgcmVzdWx0c1trZXldID0gdW5kZWZpbmVkO1xuICAgIHByb21pc2VzLnB1c2gocHJvbWlzZS50aGVuKGZ1bmN0aW9uIChyZXMpIHtcbiAgICAgIHJlc3VsdHNba2V5XSA9IHJlcztcbiAgICB9KSk7XG4gIH1cbn1cblxuLyoqXG4gKiBDaGVjayBpZiBgb2JqYCBpcyBhIHByb21pc2UuXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IG9ialxuICogQHJldHVybiB7Qm9vbGVhbn1cbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIGlzUHJvbWlzZShvYmopIHtcbiAgcmV0dXJuICdmdW5jdGlvbicgPT0gdHlwZW9mIG9iai50aGVuO1xufVxuXG4vKipcbiAqIENoZWNrIGlmIGBvYmpgIGlzIGEgZ2VuZXJhdG9yLlxuICpcbiAqIEBwYXJhbSB7TWl4ZWR9IG9ialxuICogQHJldHVybiB7Qm9vbGVhbn1cbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIGlzR2VuZXJhdG9yKG9iaikge1xuICByZXR1cm4gJ2Z1bmN0aW9uJyA9PSB0eXBlb2Ygb2JqLm5leHQgJiYgJ2Z1bmN0aW9uJyA9PSB0eXBlb2Ygb2JqLnRocm93O1xufVxuXG4vKipcbiAqIENoZWNrIGlmIGBvYmpgIGlzIGEgZ2VuZXJhdG9yIGZ1bmN0aW9uLlxuICpcbiAqIEBwYXJhbSB7TWl4ZWR9IG9ialxuICogQHJldHVybiB7Qm9vbGVhbn1cbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5mdW5jdGlvbiBpc0dlbmVyYXRvckZ1bmN0aW9uKG9iaikge1xuICB2YXIgY29uc3RydWN0b3IgPSBvYmouY29uc3RydWN0b3I7XG4gIGlmICghY29uc3RydWN0b3IpIHJldHVybiBmYWxzZTtcbiAgaWYgKCdHZW5lcmF0b3JGdW5jdGlvbicgPT09IGNvbnN0cnVjdG9yLm5hbWUgfHwgJ0dlbmVyYXRvckZ1bmN0aW9uJyA9PT0gY29uc3RydWN0b3IuZGlzcGxheU5hbWUpIHJldHVybiB0cnVlO1xuICByZXR1cm4gaXNHZW5lcmF0b3IoY29uc3RydWN0b3IucHJvdG90eXBlKTtcbn1cblxuLyoqXG4gKiBDaGVjayBmb3IgcGxhaW4gb2JqZWN0LlxuICpcbiAqIEBwYXJhbSB7TWl4ZWR9IHZhbFxuICogQHJldHVybiB7Qm9vbGVhbn1cbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIGlzT2JqZWN0KHZhbCkge1xuICByZXR1cm4gT2JqZWN0ID09IHZhbC5jb25zdHJ1Y3Rvcjtcbn1cblxuZnVuY3Rpb24gY3JlYXRlQ29tbW9uanNNb2R1bGUoZm4sIG1vZHVsZSkge1xuXHRyZXR1cm4gbW9kdWxlID0geyBleHBvcnRzOiB7fSB9LCBmbihtb2R1bGUsIG1vZHVsZS5leHBvcnRzKSwgbW9kdWxlLmV4cG9ydHM7XG59XG5cbnZhciBrZXlzID0gY3JlYXRlQ29tbW9uanNNb2R1bGUoZnVuY3Rpb24gKG1vZHVsZSwgZXhwb3J0cykge1xuZXhwb3J0cyA9IG1vZHVsZS5leHBvcnRzID0gdHlwZW9mIE9iamVjdC5rZXlzID09PSAnZnVuY3Rpb24nXG4gID8gT2JqZWN0LmtleXMgOiBzaGltO1xuXG5leHBvcnRzLnNoaW0gPSBzaGltO1xuZnVuY3Rpb24gc2hpbSAob2JqKSB7XG4gIHZhciBrZXlzID0gW107XG4gIGZvciAodmFyIGtleSBpbiBvYmopIGtleXMucHVzaChrZXkpO1xuICByZXR1cm4ga2V5cztcbn1cbn0pO1xuXG52YXIgaXNfYXJndW1lbnRzID0gY3JlYXRlQ29tbW9uanNNb2R1bGUoZnVuY3Rpb24gKG1vZHVsZSwgZXhwb3J0cykge1xudmFyIHN1cHBvcnRzQXJndW1lbnRzQ2xhc3MgPSAoZnVuY3Rpb24oKXtcbiAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChhcmd1bWVudHMpXG59KSgpID09ICdbb2JqZWN0IEFyZ3VtZW50c10nO1xuXG5leHBvcnRzID0gbW9kdWxlLmV4cG9ydHMgPSBzdXBwb3J0c0FyZ3VtZW50c0NsYXNzID8gc3VwcG9ydGVkIDogdW5zdXBwb3J0ZWQ7XG5cbmV4cG9ydHMuc3VwcG9ydGVkID0gc3VwcG9ydGVkO1xuZnVuY3Rpb24gc3VwcG9ydGVkKG9iamVjdCkge1xuICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG9iamVjdCkgPT0gJ1tvYmplY3QgQXJndW1lbnRzXSc7XG59XG5cbmV4cG9ydHMudW5zdXBwb3J0ZWQgPSB1bnN1cHBvcnRlZDtcbmZ1bmN0aW9uIHVuc3VwcG9ydGVkKG9iamVjdCl7XG4gIHJldHVybiBvYmplY3QgJiZcbiAgICB0eXBlb2Ygb2JqZWN0ID09ICdvYmplY3QnICYmXG4gICAgdHlwZW9mIG9iamVjdC5sZW5ndGggPT0gJ251bWJlcicgJiZcbiAgICBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqZWN0LCAnY2FsbGVlJykgJiZcbiAgICAhT2JqZWN0LnByb3RvdHlwZS5wcm9wZXJ0eUlzRW51bWVyYWJsZS5jYWxsKG9iamVjdCwgJ2NhbGxlZScpIHx8XG4gICAgZmFsc2U7XG59XG59KTtcblxudmFyIGluZGV4JDEgPSBjcmVhdGVDb21tb25qc01vZHVsZShmdW5jdGlvbiAobW9kdWxlKSB7XG52YXIgcFNsaWNlID0gQXJyYXkucHJvdG90eXBlLnNsaWNlO1xudmFyIG9iamVjdEtleXMgPSBrZXlzO1xudmFyIGlzQXJndW1lbnRzID0gaXNfYXJndW1lbnRzO1xuXG52YXIgZGVlcEVxdWFsID0gbW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoYWN0dWFsLCBleHBlY3RlZCwgb3B0cykge1xuICBpZiAoIW9wdHMpIG9wdHMgPSB7fTtcbiAgLy8gNy4xLiBBbGwgaWRlbnRpY2FsIHZhbHVlcyBhcmUgZXF1aXZhbGVudCwgYXMgZGV0ZXJtaW5lZCBieSA9PT0uXG4gIGlmIChhY3R1YWwgPT09IGV4cGVjdGVkKSB7XG4gICAgcmV0dXJuIHRydWU7XG5cbiAgfSBlbHNlIGlmIChhY3R1YWwgaW5zdGFuY2VvZiBEYXRlICYmIGV4cGVjdGVkIGluc3RhbmNlb2YgRGF0ZSkge1xuICAgIHJldHVybiBhY3R1YWwuZ2V0VGltZSgpID09PSBleHBlY3RlZC5nZXRUaW1lKCk7XG5cbiAgLy8gNy4zLiBPdGhlciBwYWlycyB0aGF0IGRvIG5vdCBib3RoIHBhc3MgdHlwZW9mIHZhbHVlID09ICdvYmplY3QnLFxuICAvLyBlcXVpdmFsZW5jZSBpcyBkZXRlcm1pbmVkIGJ5ID09LlxuICB9IGVsc2UgaWYgKCFhY3R1YWwgfHwgIWV4cGVjdGVkIHx8IHR5cGVvZiBhY3R1YWwgIT0gJ29iamVjdCcgJiYgdHlwZW9mIGV4cGVjdGVkICE9ICdvYmplY3QnKSB7XG4gICAgcmV0dXJuIG9wdHMuc3RyaWN0ID8gYWN0dWFsID09PSBleHBlY3RlZCA6IGFjdHVhbCA9PSBleHBlY3RlZDtcblxuICAvLyA3LjQuIEZvciBhbGwgb3RoZXIgT2JqZWN0IHBhaXJzLCBpbmNsdWRpbmcgQXJyYXkgb2JqZWN0cywgZXF1aXZhbGVuY2UgaXNcbiAgLy8gZGV0ZXJtaW5lZCBieSBoYXZpbmcgdGhlIHNhbWUgbnVtYmVyIG9mIG93bmVkIHByb3BlcnRpZXMgKGFzIHZlcmlmaWVkXG4gIC8vIHdpdGggT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKSwgdGhlIHNhbWUgc2V0IG9mIGtleXNcbiAgLy8gKGFsdGhvdWdoIG5vdCBuZWNlc3NhcmlseSB0aGUgc2FtZSBvcmRlciksIGVxdWl2YWxlbnQgdmFsdWVzIGZvciBldmVyeVxuICAvLyBjb3JyZXNwb25kaW5nIGtleSwgYW5kIGFuIGlkZW50aWNhbCAncHJvdG90eXBlJyBwcm9wZXJ0eS4gTm90ZTogdGhpc1xuICAvLyBhY2NvdW50cyBmb3IgYm90aCBuYW1lZCBhbmQgaW5kZXhlZCBwcm9wZXJ0aWVzIG9uIEFycmF5cy5cbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gb2JqRXF1aXYoYWN0dWFsLCBleHBlY3RlZCwgb3B0cyk7XG4gIH1cbn07XG5cbmZ1bmN0aW9uIGlzVW5kZWZpbmVkT3JOdWxsKHZhbHVlKSB7XG4gIHJldHVybiB2YWx1ZSA9PT0gbnVsbCB8fCB2YWx1ZSA9PT0gdW5kZWZpbmVkO1xufVxuXG5mdW5jdGlvbiBpc0J1ZmZlciAoeCkge1xuICBpZiAoIXggfHwgdHlwZW9mIHggIT09ICdvYmplY3QnIHx8IHR5cGVvZiB4Lmxlbmd0aCAhPT0gJ251bWJlcicpIHJldHVybiBmYWxzZTtcbiAgaWYgKHR5cGVvZiB4LmNvcHkgIT09ICdmdW5jdGlvbicgfHwgdHlwZW9mIHguc2xpY2UgIT09ICdmdW5jdGlvbicpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgaWYgKHgubGVuZ3RoID4gMCAmJiB0eXBlb2YgeFswXSAhPT0gJ251bWJlcicpIHJldHVybiBmYWxzZTtcbiAgcmV0dXJuIHRydWU7XG59XG5cbmZ1bmN0aW9uIG9iakVxdWl2KGEsIGIsIG9wdHMpIHtcbiAgdmFyIGksIGtleTtcbiAgaWYgKGlzVW5kZWZpbmVkT3JOdWxsKGEpIHx8IGlzVW5kZWZpbmVkT3JOdWxsKGIpKVxuICAgIHJldHVybiBmYWxzZTtcbiAgLy8gYW4gaWRlbnRpY2FsICdwcm90b3R5cGUnIHByb3BlcnR5LlxuICBpZiAoYS5wcm90b3R5cGUgIT09IGIucHJvdG90eXBlKSByZXR1cm4gZmFsc2U7XG4gIC8vfn5+SSd2ZSBtYW5hZ2VkIHRvIGJyZWFrIE9iamVjdC5rZXlzIHRocm91Z2ggc2NyZXd5IGFyZ3VtZW50cyBwYXNzaW5nLlxuICAvLyAgIENvbnZlcnRpbmcgdG8gYXJyYXkgc29sdmVzIHRoZSBwcm9ibGVtLlxuICBpZiAoaXNBcmd1bWVudHMoYSkpIHtcbiAgICBpZiAoIWlzQXJndW1lbnRzKGIpKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGEgPSBwU2xpY2UuY2FsbChhKTtcbiAgICBiID0gcFNsaWNlLmNhbGwoYik7XG4gICAgcmV0dXJuIGRlZXBFcXVhbChhLCBiLCBvcHRzKTtcbiAgfVxuICBpZiAoaXNCdWZmZXIoYSkpIHtcbiAgICBpZiAoIWlzQnVmZmVyKGIpKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGlmIChhLmxlbmd0aCAhPT0gYi5sZW5ndGgpIHJldHVybiBmYWxzZTtcbiAgICBmb3IgKGkgPSAwOyBpIDwgYS5sZW5ndGg7IGkrKykge1xuICAgICAgaWYgKGFbaV0gIT09IGJbaV0pIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbiAgdHJ5IHtcbiAgICB2YXIga2EgPSBvYmplY3RLZXlzKGEpLFxuICAgICAgICBrYiA9IG9iamVjdEtleXMoYik7XG4gIH0gY2F0Y2ggKGUpIHsvL2hhcHBlbnMgd2hlbiBvbmUgaXMgYSBzdHJpbmcgbGl0ZXJhbCBhbmQgdGhlIG90aGVyIGlzbid0XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIC8vIGhhdmluZyB0aGUgc2FtZSBudW1iZXIgb2Ygb3duZWQgcHJvcGVydGllcyAoa2V5cyBpbmNvcnBvcmF0ZXNcbiAgLy8gaGFzT3duUHJvcGVydHkpXG4gIGlmIChrYS5sZW5ndGggIT0ga2IubGVuZ3RoKVxuICAgIHJldHVybiBmYWxzZTtcbiAgLy90aGUgc2FtZSBzZXQgb2Yga2V5cyAoYWx0aG91Z2ggbm90IG5lY2Vzc2FyaWx5IHRoZSBzYW1lIG9yZGVyKSxcbiAga2Euc29ydCgpO1xuICBrYi5zb3J0KCk7XG4gIC8vfn5+Y2hlYXAga2V5IHRlc3RcbiAgZm9yIChpID0ga2EubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICBpZiAoa2FbaV0gIT0ga2JbaV0pXG4gICAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgLy9lcXVpdmFsZW50IHZhbHVlcyBmb3IgZXZlcnkgY29ycmVzcG9uZGluZyBrZXksIGFuZFxuICAvL35+fnBvc3NpYmx5IGV4cGVuc2l2ZSBkZWVwIHRlc3RcbiAgZm9yIChpID0ga2EubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICBrZXkgPSBrYVtpXTtcbiAgICBpZiAoIWRlZXBFcXVhbChhW2tleV0sIGJba2V5XSwgb3B0cykpIHJldHVybiBmYWxzZTtcbiAgfVxuICByZXR1cm4gdHlwZW9mIGEgPT09IHR5cGVvZiBiO1xufVxufSk7XG5cbmNvbnN0IGFzc2VydGlvbnMgPSB7XG4gIG9rKHZhbCwgbWVzc2FnZSA9ICdzaG91bGQgYmUgdHJ1dGh5Jykge1xuICAgIGNvbnN0IGFzc2VydGlvblJlc3VsdCA9IHtcbiAgICAgIHBhc3M6IEJvb2xlYW4odmFsKSxcbiAgICAgIGV4cGVjdGVkOiAndHJ1dGh5JyxcbiAgICAgIGFjdHVhbDogdmFsLFxuICAgICAgb3BlcmF0b3I6ICdvaycsXG4gICAgICBtZXNzYWdlXG4gICAgfTtcbiAgICB0aGlzLnRlc3QuYWRkQXNzZXJ0aW9uKGFzc2VydGlvblJlc3VsdCk7XG4gICAgcmV0dXJuIGFzc2VydGlvblJlc3VsdDtcbiAgfSxcbiAgZGVlcEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UgPSAnc2hvdWxkIGJlIGVxdWl2YWxlbnQnKSB7XG4gICAgY29uc3QgYXNzZXJ0aW9uUmVzdWx0ID0ge1xuICAgICAgcGFzczogaW5kZXgkMShhY3R1YWwsIGV4cGVjdGVkKSxcbiAgICAgIGFjdHVhbCxcbiAgICAgIGV4cGVjdGVkLFxuICAgICAgbWVzc2FnZSxcbiAgICAgIG9wZXJhdG9yOiAnZGVlcEVxdWFsJ1xuICAgIH07XG4gICAgdGhpcy50ZXN0LmFkZEFzc2VydGlvbihhc3NlcnRpb25SZXN1bHQpO1xuICAgIHJldHVybiBhc3NlcnRpb25SZXN1bHQ7XG4gIH0sXG4gIGVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UgPSAnc2hvdWxkIGJlIGVxdWFsJykge1xuICAgIGNvbnN0IGFzc2VydGlvblJlc3VsdCA9IHtcbiAgICAgIHBhc3M6IGFjdHVhbCA9PT0gZXhwZWN0ZWQsXG4gICAgICBhY3R1YWwsXG4gICAgICBleHBlY3RlZCxcbiAgICAgIG1lc3NhZ2UsXG4gICAgICBvcGVyYXRvcjogJ2VxdWFsJ1xuICAgIH07XG4gICAgdGhpcy50ZXN0LmFkZEFzc2VydGlvbihhc3NlcnRpb25SZXN1bHQpO1xuICAgIHJldHVybiBhc3NlcnRpb25SZXN1bHQ7XG4gIH0sXG4gIG5vdE9rKHZhbCwgbWVzc2FnZSA9ICdzaG91bGQgbm90IGJlIHRydXRoeScpIHtcbiAgICBjb25zdCBhc3NlcnRpb25SZXN1bHQgPSB7XG4gICAgICBwYXNzOiAhQm9vbGVhbih2YWwpLFxuICAgICAgZXhwZWN0ZWQ6ICdmYWxzeScsXG4gICAgICBhY3R1YWw6IHZhbCxcbiAgICAgIG9wZXJhdG9yOiAnbm90T2snLFxuICAgICAgbWVzc2FnZVxuICAgIH07XG4gICAgdGhpcy50ZXN0LmFkZEFzc2VydGlvbihhc3NlcnRpb25SZXN1bHQpO1xuICAgIHJldHVybiBhc3NlcnRpb25SZXN1bHQ7XG4gIH0sXG4gIG5vdERlZXBFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlID0gJ3Nob3VsZCBub3QgYmUgZXF1aXZhbGVudCcpIHtcbiAgICBjb25zdCBhc3NlcnRpb25SZXN1bHQgPSB7XG4gICAgICBwYXNzOiAhaW5kZXgkMShhY3R1YWwsIGV4cGVjdGVkKSxcbiAgICAgIGFjdHVhbCxcbiAgICAgIGV4cGVjdGVkLFxuICAgICAgbWVzc2FnZSxcbiAgICAgIG9wZXJhdG9yOiAnbm90RGVlcEVxdWFsJ1xuICAgIH07XG4gICAgdGhpcy50ZXN0LmFkZEFzc2VydGlvbihhc3NlcnRpb25SZXN1bHQpO1xuICAgIHJldHVybiBhc3NlcnRpb25SZXN1bHQ7XG4gIH0sXG4gIG5vdEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UgPSAnc2hvdWxkIG5vdCBiZSBlcXVhbCcpIHtcbiAgICBjb25zdCBhc3NlcnRpb25SZXN1bHQgPSB7XG4gICAgICBwYXNzOiBhY3R1YWwgIT09IGV4cGVjdGVkLFxuICAgICAgYWN0dWFsLFxuICAgICAgZXhwZWN0ZWQsXG4gICAgICBtZXNzYWdlLFxuICAgICAgb3BlcmF0b3I6ICdub3RFcXVhbCdcbiAgICB9O1xuICAgIHRoaXMudGVzdC5hZGRBc3NlcnRpb24oYXNzZXJ0aW9uUmVzdWx0KTtcbiAgICByZXR1cm4gYXNzZXJ0aW9uUmVzdWx0O1xuICB9LFxuICB0aHJvd3MoZnVuYywgZXhwZWN0ZWQsIG1lc3NhZ2UpIHtcbiAgICBsZXQgY2F1Z2h0LCBwYXNzLCBhY3R1YWw7XG4gICAgaWYgKHR5cGVvZiBleHBlY3RlZCA9PT0gJ3N0cmluZycpIHtcbiAgICAgIFtleHBlY3RlZCwgbWVzc2FnZV0gPSBbbWVzc2FnZSwgZXhwZWN0ZWRdO1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgZnVuYygpO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjYXVnaHQgPSB7ZXJyb3J9O1xuICAgIH1cbiAgICBwYXNzID0gY2F1Z2h0ICE9PSB1bmRlZmluZWQ7XG4gICAgYWN0dWFsID0gY2F1Z2h0ICYmIGNhdWdodC5lcnJvcjtcbiAgICBpZiAoZXhwZWN0ZWQgaW5zdGFuY2VvZiBSZWdFeHApIHtcbiAgICAgIHBhc3MgPSBleHBlY3RlZC50ZXN0KGFjdHVhbCkgfHwgZXhwZWN0ZWQudGVzdChhY3R1YWwgJiYgYWN0dWFsLm1lc3NhZ2UpO1xuICAgICAgZXhwZWN0ZWQgPSBTdHJpbmcoZXhwZWN0ZWQpO1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIGV4cGVjdGVkID09PSAnZnVuY3Rpb24nICYmIGNhdWdodCkge1xuICAgICAgcGFzcyA9IGFjdHVhbCBpbnN0YW5jZW9mIGV4cGVjdGVkO1xuICAgICAgYWN0dWFsID0gYWN0dWFsLmNvbnN0cnVjdG9yO1xuICAgIH1cbiAgICBjb25zdCBhc3NlcnRpb25SZXN1bHQgPSB7XG4gICAgICBwYXNzLFxuICAgICAgZXhwZWN0ZWQsXG4gICAgICBhY3R1YWwsXG4gICAgICBvcGVyYXRvcjogJ3Rocm93cycsXG4gICAgICBtZXNzYWdlOiBtZXNzYWdlIHx8ICdzaG91bGQgdGhyb3cnXG4gICAgfTtcbiAgICB0aGlzLnRlc3QuYWRkQXNzZXJ0aW9uKGFzc2VydGlvblJlc3VsdCk7XG4gICAgcmV0dXJuIGFzc2VydGlvblJlc3VsdDtcbiAgfSxcbiAgZG9lc05vdFRocm93KGZ1bmMsIGV4cGVjdGVkLCBtZXNzYWdlKSB7XG4gICAgbGV0IGNhdWdodDtcbiAgICBpZiAodHlwZW9mIGV4cGVjdGVkID09PSAnc3RyaW5nJykge1xuICAgICAgW2V4cGVjdGVkLCBtZXNzYWdlXSA9IFttZXNzYWdlLCBleHBlY3RlZF07XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICBmdW5jKCk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNhdWdodCA9IHtlcnJvcn07XG4gICAgfVxuICAgIGNvbnN0IGFzc2VydGlvblJlc3VsdCA9IHtcbiAgICAgIHBhc3M6IGNhdWdodCA9PT0gdW5kZWZpbmVkLFxuICAgICAgZXhwZWN0ZWQ6ICdubyB0aHJvd24gZXJyb3InLFxuICAgICAgYWN0dWFsOiBjYXVnaHQgJiYgY2F1Z2h0LmVycm9yLFxuICAgICAgb3BlcmF0b3I6ICdkb2VzTm90VGhyb3cnLFxuICAgICAgbWVzc2FnZTogbWVzc2FnZSB8fCAnc2hvdWxkIG5vdCB0aHJvdydcbiAgICB9O1xuICAgIHRoaXMudGVzdC5hZGRBc3NlcnRpb24oYXNzZXJ0aW9uUmVzdWx0KTtcbiAgICByZXR1cm4gYXNzZXJ0aW9uUmVzdWx0O1xuICB9LFxuICBmYWlsKHJlYXNvbiA9ICdmYWlsIGNhbGxlZCcpIHtcbiAgICBjb25zdCBhc3NlcnRpb25SZXN1bHQgPSB7XG4gICAgICBwYXNzOiBmYWxzZSxcbiAgICAgIGFjdHVhbDogJ2ZhaWwgY2FsbGVkJyxcbiAgICAgIGV4cGVjdGVkOiAnZmFpbCBub3QgY2FsbGVkJyxcbiAgICAgIG1lc3NhZ2U6IHJlYXNvbixcbiAgICAgIG9wZXJhdG9yOiAnZmFpbCdcbiAgICB9O1xuICAgIHRoaXMudGVzdC5hZGRBc3NlcnRpb24oYXNzZXJ0aW9uUmVzdWx0KTtcbiAgICByZXR1cm4gYXNzZXJ0aW9uUmVzdWx0O1xuICB9XG59O1xuXG5mdW5jdGlvbiBhc3NlcnRpb24gKHRlc3QpIHtcbiAgcmV0dXJuIE9iamVjdC5jcmVhdGUoYXNzZXJ0aW9ucywge3Rlc3Q6IHt2YWx1ZTogdGVzdH19KTtcbn1cblxuY29uc3QgVGVzdCA9IHtcbiAgcnVuOiBmdW5jdGlvbiAoKSB7XG4gICAgY29uc3QgYXNzZXJ0ID0gYXNzZXJ0aW9uKHRoaXMpO1xuICAgIGNvbnN0IG5vdyA9IERhdGUubm93KCk7XG4gICAgcmV0dXJuIGluZGV4KHRoaXMuY29yb3V0aW5lKGFzc2VydCkpXG4gICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgIHJldHVybiB7YXNzZXJ0aW9uczogdGhpcy5hc3NlcnRpb25zLCBleGVjdXRpb25UaW1lOiBEYXRlLm5vdygpIC0gbm93fTtcbiAgICAgIH0pO1xuICB9LFxuICBhZGRBc3NlcnRpb24oKXtcbiAgICBjb25zdCBuZXdBc3NlcnRpb25zID0gWy4uLmFyZ3VtZW50c10ubWFwKGEgPT4gT2JqZWN0LmFzc2lnbih7ZGVzY3JpcHRpb246IHRoaXMuZGVzY3JpcHRpb259LCBhKSk7XG4gICAgdGhpcy5hc3NlcnRpb25zLnB1c2goLi4ubmV3QXNzZXJ0aW9ucyk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbn07XG5cbmZ1bmN0aW9uIHRlc3QgKHtkZXNjcmlwdGlvbiwgY29yb3V0aW5lLCBvbmx5ID0gZmFsc2V9KSB7XG4gIHJldHVybiBPYmplY3QuY3JlYXRlKFRlc3QsIHtcbiAgICBkZXNjcmlwdGlvbjoge3ZhbHVlOiBkZXNjcmlwdGlvbn0sXG4gICAgY29yb3V0aW5lOiB7dmFsdWU6IGNvcm91dGluZX0sXG4gICAgYXNzZXJ0aW9uczoge3ZhbHVlOiBbXX0sXG4gICAgb25seToge3ZhbHVlOiBvbmx5fSxcbiAgICBsZW5ndGg6IHtcbiAgICAgIGdldCgpe1xuICAgICAgICByZXR1cm4gdGhpcy5hc3NlcnRpb25zLmxlbmd0aFxuICAgICAgfVxuICAgIH1cbiAgfSk7XG59XG5cbmZ1bmN0aW9uIHRhcE91dCAoe3Bhc3MsIG1lc3NhZ2UsIGluZGV4fSkge1xuICBjb25zdCBzdGF0dXMgPSBwYXNzID09PSB0cnVlID8gJ29rJyA6ICdub3Qgb2snO1xuICBjb25zb2xlLmxvZyhbc3RhdHVzLCBpbmRleCwgbWVzc2FnZV0uam9pbignICcpKTtcbn1cblxuZnVuY3Rpb24gY2FuRXhpdCAoKSB7XG4gIHJldHVybiB0eXBlb2YgcHJvY2VzcyAhPT0gJ3VuZGVmaW5lZCcgJiYgdHlwZW9mIHByb2Nlc3MuZXhpdCA9PT0gJ2Z1bmN0aW9uJztcbn1cblxuZnVuY3Rpb24gdGFwICgpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uICogKCkge1xuICAgIGxldCBpbmRleCA9IDE7XG4gICAgbGV0IGxhc3RJZCA9IDA7XG4gICAgbGV0IHN1Y2Nlc3MgPSAwO1xuICAgIGxldCBmYWlsdXJlID0gMDtcblxuICAgIGNvbnN0IHN0YXJUaW1lID0gRGF0ZS5ub3coKTtcbiAgICBjb25zb2xlLmxvZygnVEFQIHZlcnNpb24gMTMnKTtcbiAgICB0cnkge1xuICAgICAgd2hpbGUgKHRydWUpIHtcbiAgICAgICAgY29uc3QgYXNzZXJ0aW9uID0geWllbGQ7XG4gICAgICAgIGlmIChhc3NlcnRpb24ucGFzcyA9PT0gdHJ1ZSkge1xuICAgICAgICAgIHN1Y2Nlc3MrKztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBmYWlsdXJlKys7XG4gICAgICAgIH1cbiAgICAgICAgYXNzZXJ0aW9uLmluZGV4ID0gaW5kZXg7XG4gICAgICAgIGlmIChhc3NlcnRpb24uaWQgIT09IGxhc3RJZCkge1xuICAgICAgICAgIGNvbnNvbGUubG9nKGAjICR7YXNzZXJ0aW9uLmRlc2NyaXB0aW9ufSAtICR7YXNzZXJ0aW9uLmV4ZWN1dGlvblRpbWV9bXNgKTtcbiAgICAgICAgICBsYXN0SWQgPSBhc3NlcnRpb24uaWQ7XG4gICAgICAgIH1cbiAgICAgICAgdGFwT3V0KGFzc2VydGlvbik7XG4gICAgICAgIGlmIChhc3NlcnRpb24ucGFzcyAhPT0gdHJ1ZSkge1xuICAgICAgICAgIGNvbnNvbGUubG9nKGAgIC0tLVxuICBvcGVyYXRvcjogJHthc3NlcnRpb24ub3BlcmF0b3J9XG4gIGV4cGVjdGVkOiAke0pTT04uc3RyaW5naWZ5KGFzc2VydGlvbi5leHBlY3RlZCl9XG4gIGFjdHVhbDogJHtKU09OLnN0cmluZ2lmeShhc3NlcnRpb24uYWN0dWFsKX1cbiAgLi4uYCk7XG4gICAgICAgIH1cbiAgICAgICAgaW5kZXgrKztcbiAgICAgIH1cbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBjb25zb2xlLmxvZygnQmFpbCBvdXQhIHVuaGFuZGxlZCBleGNlcHRpb24nKTtcbiAgICAgIGNvbnNvbGUubG9nKGUpO1xuICAgICAgaWYgKGNhbkV4aXQoKSkge1xuICAgICAgICBwcm9jZXNzLmV4aXQoMSk7XG4gICAgICB9XG4gICAgfVxuICAgIGZpbmFsbHkge1xuICAgICAgY29uc3QgZXhlY3V0aW9uID0gRGF0ZS5ub3coKSAtIHN0YXJUaW1lO1xuICAgICAgaWYgKGluZGV4ID4gMSkge1xuICAgICAgICBjb25zb2xlLmxvZyhgXG4xLi4ke2luZGV4IC0gMX1cbiMgZHVyYXRpb24gJHtleGVjdXRpb259bXNcbiMgc3VjY2VzcyAke3N1Y2Nlc3N9XG4jIGZhaWx1cmUgJHtmYWlsdXJlfWApO1xuICAgICAgfVxuICAgICAgaWYgKGZhaWx1cmUgJiYgY2FuRXhpdCgpKSB7XG4gICAgICAgIHByb2Nlc3MuZXhpdCgxKTtcbiAgICAgIH1cbiAgICB9XG4gIH07XG59XG5cbmNvbnN0IFBsYW4gPSB7XG4gIHRlc3QoZGVzY3JpcHRpb24sIGNvcm91dGluZSwgb3B0cyA9IHt9KXtcbiAgICBjb25zdCB0ZXN0SXRlbXMgPSAoIWNvcm91dGluZSAmJiBkZXNjcmlwdGlvbi50ZXN0cykgPyBbLi4uZGVzY3JpcHRpb25dIDogW3tkZXNjcmlwdGlvbiwgY29yb3V0aW5lfV07XG4gICAgdGhpcy50ZXN0cy5wdXNoKC4uLnRlc3RJdGVtcy5tYXAodD0+dGVzdChPYmplY3QuYXNzaWduKHQsIG9wdHMpKSkpO1xuICAgIHJldHVybiB0aGlzO1xuICB9LFxuXG4gIG9ubHkoZGVzY3JpcHRpb24sIGNvcm91dGluZSl7XG4gICAgcmV0dXJuIHRoaXMudGVzdChkZXNjcmlwdGlvbiwgY29yb3V0aW5lLCB7b25seTogdHJ1ZX0pO1xuICB9LFxuXG4gIHJ1bihzaW5rID0gdGFwKCkpe1xuICAgIGNvbnN0IHNpbmtJdGVyYXRvciA9IHNpbmsoKTtcbiAgICBzaW5rSXRlcmF0b3IubmV4dCgpO1xuICAgIGNvbnN0IGhhc09ubHkgPSB0aGlzLnRlc3RzLnNvbWUodD0+dC5vbmx5KTtcbiAgICBjb25zdCBydW5uYWJsZSA9IGhhc09ubHkgPyB0aGlzLnRlc3RzLmZpbHRlcih0PT50Lm9ubHkpIDogdGhpcy50ZXN0cztcbiAgICByZXR1cm4gaW5kZXgoZnVuY3Rpb24gKiAoKSB7XG4gICAgICBsZXQgaWQgPSAxO1xuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc3QgcmVzdWx0cyA9IHJ1bm5hYmxlLm1hcCh0PT50LnJ1bigpKTtcbiAgICAgICAgZm9yIChsZXQgciBvZiByZXN1bHRzKSB7XG4gICAgICAgICAgY29uc3Qge2Fzc2VydGlvbnMsIGV4ZWN1dGlvblRpbWV9ID0geWllbGQgcjtcbiAgICAgICAgICBmb3IgKGxldCBhc3NlcnQgb2YgYXNzZXJ0aW9ucykge1xuICAgICAgICAgICAgc2lua0l0ZXJhdG9yLm5leHQoT2JqZWN0LmFzc2lnbihhc3NlcnQsIHtpZCwgZXhlY3V0aW9uVGltZX0pKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWQrKztcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgY2F0Y2ggKGUpIHtcbiAgICAgICAgc2lua0l0ZXJhdG9yLnRocm93KGUpO1xuICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgc2lua0l0ZXJhdG9yLnJldHVybigpO1xuICAgICAgfVxuICAgIH0uYmluZCh0aGlzKSlcbiAgfSxcblxuICAqIFtTeW1ib2wuaXRlcmF0b3JdKCl7XG4gICAgZm9yIChsZXQgdCBvZiB0aGlzLnRlc3RzKSB7XG4gICAgICB5aWVsZCB0O1xuICAgIH1cbiAgfVxufTtcblxuZnVuY3Rpb24gcGxhbiAoKSB7XG4gIHJldHVybiBPYmplY3QuY3JlYXRlKFBsYW4sIHtcbiAgICB0ZXN0czoge3ZhbHVlOiBbXX0sXG4gICAgbGVuZ3RoOiB7XG4gICAgICBnZXQoKXtcbiAgICAgICAgcmV0dXJuIHRoaXMudGVzdHMubGVuZ3RoXG4gICAgICB9XG4gICAgfVxuICB9KTtcbn1cblxuZXhwb3J0IGRlZmF1bHQgcGxhbjtcbiIsImNvbnN0IGZpbmRDb250YWluZXIgPSAoZWxlbWVudCwgc2VsZWN0b3IpID0+IGVsZW1lbnQubWF0Y2hlcyhzZWxlY3RvcikgPT09IHRydWUgPyBlbGVtZW50IDogZmluZENvbnRhaW5lcihlbGVtZW50LnBhcmVudEVsZW1lbnQsIHNlbGVjdG9yKTtcblxuZXhwb3J0IGZ1bmN0aW9uIGtleUdyaWQgKGdyaWQsIHtjZWxsU2VsZWN0b3IsIHJvd1NlbGVjdG9yfSkge1xuXG4gIGNvbnN0IGRvZXNTa2lwS2V5Ym9hcmQgPSBlbCA9PiBlbC5nZXRBdHRyaWJ1dGUoJ2RhdGEta2V5Ym9hcmQtc2tpcCcpID09PSAndHJ1ZSc7XG5cbiAgY29uc3QgY3JlYXRlR3JpZCA9IChncmlkKSA9PiB7XG4gICAgY29uc3QgaW5zdGFuY2UgPSB7fTtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoaW5zdGFuY2UsICdyb3dzJywge1xuICAgICAgZ2V0KCl7XG4gICAgICAgIHJldHVybiBncmlkLnJvd3MgIT09IHZvaWQgMCA/IGdyaWQucm93cyA6IFsuLi5ncmlkLnF1ZXJ5U2VsZWN0b3JBbGwocm93U2VsZWN0b3IpXVxuICAgICAgfVxuICAgIH0pO1xuXG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGluc3RhbmNlLCAnZWxlbWVudCcsIHt2YWx1ZTogZ3JpZH0pO1xuICAgIHJldHVybiBpbnN0YW5jZTtcbiAgfTtcblxuICBjb25zdCBncmlkV3JhcHBlZCA9IGNyZWF0ZUdyaWQoZ3JpZCk7XG5cbiAgY29uc3Qgcm93UHJvdG8gPSB7XG4gICAgbW92ZVVwKCl7XG4gICAgICBjb25zdCByb3dJbmRleCA9IHRoaXMucm93SW5kZXg7XG4gICAgICBjb25zdCBuZXdSb3dJbmRleCA9IE1hdGgubWF4KHJvd0luZGV4IC0gMSwgMCk7XG4gICAgICBjb25zdCBuZXdSb3cgPSBncmlkV3JhcHBlZC5yb3dzW25ld1Jvd0luZGV4XTtcbiAgICAgIGlmIChkb2VzU2tpcEtleWJvYXJkKG5ld1JvdykgPT09IGZhbHNlKSB7XG4gICAgICAgIHJldHVybiBuZXdSb3c7XG4gICAgICB9IGVsc2UgaWYgKG5ld1Jvd0luZGV4ID09PSAwKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmVsZW1lbnQ7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gY3JlYXRlUm93KG5ld1JvdykubW92ZVVwKCk7XG4gICAgICB9XG4gICAgfSxcbiAgICBtb3ZlRG93bigpe1xuICAgICAgY29uc3Qgcm93SW5kZXggPSB0aGlzLnJvd0luZGV4O1xuICAgICAgY29uc3QgbmV3Um93SW5kZXggPSBNYXRoLm1pbihyb3dJbmRleCArIDEsIGdyaWRXcmFwcGVkLnJvd3MubGVuZ3RoIC0gMSk7XG4gICAgICBjb25zdCBuZXdSb3cgPSBncmlkV3JhcHBlZC5yb3dzW25ld1Jvd0luZGV4XTtcbiAgICAgIGlmIChkb2VzU2tpcEtleWJvYXJkKG5ld1JvdykgPT09IGZhbHNlKSB7XG4gICAgICAgIHJldHVybiBuZXdSb3c7XG4gICAgICB9IGVsc2UgaWYgKG5ld1Jvd0luZGV4ID09PSBncmlkV3JhcHBlZC5yb3dzLmxlbmd0aCAtIDEpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZWxlbWVudDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBjcmVhdGVSb3cobmV3Um93KS5tb3ZlRG93bigpO1xuICAgICAgfVxuICAgIH1cbiAgfTtcblxuICBmdW5jdGlvbiBjcmVhdGVSb3cgKHJvd0VsZW1lbnQpIHtcbiAgICByZXR1cm4gT2JqZWN0LmNyZWF0ZShyb3dQcm90bywge1xuICAgICAgY2VsbHM6IHtcbiAgICAgICAgZ2V0KCl7XG4gICAgICAgICAgcmV0dXJuIHJvd0VsZW1lbnQuY2VsbHMgIT09IHZvaWQgMCA/IFsuLi5yb3dFbGVtZW50LmNlbGxzXSA6IFsuLi5yb3dFbGVtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoY2VsbFNlbGVjdG9yKV07XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICByb3dJbmRleDoge1xuICAgICAgICBnZXQoKXtcbiAgICAgICAgICByZXR1cm4gcm93RWxlbWVudC5yb3dJbmRleCAhPT0gdm9pZCAwID8gcm93RWxlbWVudC5yb3dJbmRleCA6IFsuLi5ncmlkLnF1ZXJ5U2VsZWN0b3JBbGwocm93U2VsZWN0b3IpXS5pbmRleE9mKHJvd0VsZW1lbnQpO1xuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgZWxlbWVudDoge3ZhbHVlOiByb3dFbGVtZW50fVxuICAgIH0pO1xuICB9XG5cbiAgY29uc3QgY2VsbFByb3RvID0ge1xuICAgIG1vdmVSaWdodCgpe1xuICAgICAgY29uc3Qgcm93ID0gY3JlYXRlUm93KGZpbmRDb250YWluZXIodGhpcy5lbGVtZW50LCByb3dTZWxlY3RvcikpO1xuICAgICAgY29uc3Qgcm93Q2VsbHMgPSByb3cuY2VsbHM7XG4gICAgICBjb25zdCBjZWxsSW5kZXggPSB0aGlzLmNlbGxJbmRleDtcbiAgICAgIGNvbnN0IG5ld0luZGV4ID0gTWF0aC5taW4ocm93Q2VsbHMubGVuZ3RoIC0gMSwgY2VsbEluZGV4ICsgMSk7XG4gICAgICBjb25zdCBuZXdDZWxsID0gcm93Q2VsbHNbbmV3SW5kZXhdO1xuICAgICAgaWYgKGRvZXNTa2lwS2V5Ym9hcmQobmV3Q2VsbCkgPT09IGZhbHNlKSB7XG4gICAgICAgIHJldHVybiBuZXdDZWxsO1xuICAgICAgfSBlbHNlIGlmIChuZXdJbmRleCA9PT0gcm93Q2VsbHMubGVuZ3RoIC0gMSkge1xuICAgICAgICByZXR1cm4gdGhpcy5lbGVtZW50O1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGNyZWF0ZUNlbGwobmV3Q2VsbCkubW92ZVJpZ2h0KCk7XG4gICAgICB9XG4gICAgfSxcbiAgICBtb3ZlTGVmdCgpe1xuICAgICAgY29uc3Qgcm93ID0gY3JlYXRlUm93KGZpbmRDb250YWluZXIodGhpcy5lbGVtZW50LCByb3dTZWxlY3RvcikpO1xuICAgICAgY29uc3Qgcm93Q2VsbHMgPSByb3cuY2VsbHM7XG4gICAgICBjb25zdCBjZWxsSW5kZXggPSB0aGlzLmNlbGxJbmRleDtcbiAgICAgIGNvbnN0IG5ld0luZGV4ID0gTWF0aC5tYXgoMCwgY2VsbEluZGV4IC0gMSk7XG4gICAgICBjb25zdCBuZXdDZWxsID0gcm93Q2VsbHNbbmV3SW5kZXhdO1xuICAgICAgaWYgKGRvZXNTa2lwS2V5Ym9hcmQobmV3Q2VsbCkgPT09IGZhbHNlKSB7XG4gICAgICAgIHJldHVybiBuZXdDZWxsO1xuICAgICAgfSBlbHNlIGlmIChuZXdJbmRleCA9PT0gMCkge1xuICAgICAgICByZXR1cm4gdGhpcy5lbGVtZW50O1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGNyZWF0ZUNlbGwobmV3Q2VsbCkubW92ZUxlZnQoKTtcbiAgICAgIH1cbiAgICB9XG4gIH07XG5cbiAgY29uc3QgdmlydHVhbENlbGxQcm90byA9IHtcbiAgICBtb3ZlUmlnaHQoKXtcbiAgICAgIGlmICh0aGlzLmN1cnJlbnRJbmRleCA9PT0gdGhpcy52aXJ0dWFsQ2VsbHMubGVuZ3RoIC0gMSkge1xuICAgICAgICBjb25zdCBuZXdDZWxsID0gY3JlYXRlQ2VsbCh0aGlzLmNlbGxFbGVtZW50KS5tb3ZlUmlnaHQoKTtcbiAgICAgICAgcmV0dXJuIG5ld0NlbGwgPT09IHRoaXMuY2VsbEVsZW1lbnQgPyB0aGlzLmVsZW1lbnQgOiBuZXdDZWxsO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudmlydHVhbENlbGxzW3RoaXMuY3VycmVudEluZGV4ICsgMV07XG4gICAgICB9XG4gICAgfSxcbiAgICBtb3ZlTGVmdCgpe1xuICAgICAgaWYgKHRoaXMuY3VycmVudEluZGV4ID09PSAwKSB7XG4gICAgICAgIGNvbnN0IG5ld0NlbGwgPSBjcmVhdGVDZWxsKHRoaXMuY2VsbEVsZW1lbnQpLm1vdmVMZWZ0KCk7XG4gICAgICAgIHJldHVybiBuZXdDZWxsID09PSB0aGlzLmNlbGxFbGVtZW50ID8gdGhpcy5lbGVtZW50IDogbmV3Q2VsbDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiB0aGlzLnZpcnR1YWxDZWxsc1t0aGlzLmN1cnJlbnRJbmRleCAtIDFdO1xuICAgICAgfVxuICAgIH1cbiAgfTtcblxuICBmdW5jdGlvbiBjcmVhdGVDZWxsIChjZWxsRWxlbWVudCkge1xuICAgIGNvbnN0IHJvdyA9IGZpbmRDb250YWluZXIoY2VsbEVsZW1lbnQsIHJvd1NlbGVjdG9yKTtcbiAgICByZXR1cm4gT2JqZWN0LmNyZWF0ZShjZWxsUHJvdG8sIHtcbiAgICAgIGNlbGxJbmRleDoge1xuICAgICAgICBnZXQoKXtcbiAgICAgICAgICByZXR1cm4gY2VsbEVsZW1lbnQuY2VsbEluZGV4ICE9PSB2b2lkIDAgPyBjZWxsRWxlbWVudC5jZWxsSW5kZXggOiBbLi4ucm93LnF1ZXJ5U2VsZWN0b3JBbGwoY2VsbFNlbGVjdG9yKV0uaW5kZXhPZihjZWxsRWxlbWVudCk7XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICBlbGVtZW50OiB7dmFsdWU6IGNlbGxFbGVtZW50fVxuICAgIH0pO1xuICB9XG5cbiAgZnVuY3Rpb24gY3JlYXRlQ29tcG9zaXRlQ2VsbCAoY2VsbEVsZW1lbnQsIGVsZW1lbnQpIHtcbiAgICBjb25zdCBzZWxlY3RvciA9IGNlbGxFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1rZXlib2FyZC1zZWxlY3RvcicpO1xuICAgIGNvbnN0IHZpcnR1YWxDZWxscyA9IFsuLi5jZWxsRWxlbWVudC5xdWVyeVNlbGVjdG9yQWxsKHNlbGVjdG9yKV07XG4gICAgY29uc3QgY3VycmVudEluZGV4ID0gdmlydHVhbENlbGxzLmluZGV4T2YoZWxlbWVudCk7XG4gICAgcmV0dXJuIE9iamVjdC5jcmVhdGUodmlydHVhbENlbGxQcm90bywge1xuICAgICAgdmlydHVhbENlbGxzOiB7dmFsdWU6IHZpcnR1YWxDZWxsc30sXG4gICAgICBjdXJyZW50SW5kZXg6IHt2YWx1ZTogY3VycmVudEluZGV4fSxcbiAgICAgIGNlbGxFbGVtZW50OiB7dmFsdWU6IGNlbGxFbGVtZW50fSxcbiAgICAgIGVsZW1lbnQ6IHt2YWx1ZTogZWxlbWVudH1cbiAgICB9KTtcbiAgfVxuXG4gIGNvbnN0IG1vdmVSaWdodCA9ICh0YXJnZXQpID0+IHtcbiAgICBjb25zdCBjZWxsRWxlbWVudCA9IGZpbmRDb250YWluZXIodGFyZ2V0LCBjZWxsU2VsZWN0b3IpO1xuICAgIGNvbnN0IGNlbGwgPSBjZWxsRWxlbWVudCA9PT0gdGFyZ2V0ID8gY3JlYXRlQ2VsbChjZWxsRWxlbWVudCkgOiBjcmVhdGVDb21wb3NpdGVDZWxsKGNlbGxFbGVtZW50LCB0YXJnZXQpO1xuICAgIHJldHVybiBjZWxsLm1vdmVSaWdodCgpO1xuICB9O1xuXG4gIGNvbnN0IG1vdmVMZWZ0ID0gdGFyZ2V0ID0+IHtcbiAgICBjb25zdCBjZWxsRWxlbWVudCA9IGZpbmRDb250YWluZXIodGFyZ2V0LCBjZWxsU2VsZWN0b3IpO1xuICAgIGNvbnN0IGNlbGwgPSBjZWxsRWxlbWVudCA9PT0gdGFyZ2V0ID8gY3JlYXRlQ2VsbChjZWxsRWxlbWVudCkgOiBjcmVhdGVDb21wb3NpdGVDZWxsKGNlbGxFbGVtZW50LCB0YXJnZXQpO1xuICAgIHJldHVybiBjZWxsLm1vdmVMZWZ0KCk7XG4gIH07XG5cbiAgY29uc3QgbW92ZVVwID0gdGFyZ2V0ID0+IHtcbiAgICBjb25zdCBjZWxsID0gY3JlYXRlQ2VsbChmaW5kQ29udGFpbmVyKHRhcmdldCwgY2VsbFNlbGVjdG9yKSk7XG4gICAgY29uc3Qgcm93ID0gY3JlYXRlUm93KGZpbmRDb250YWluZXIoY2VsbC5lbGVtZW50LCByb3dTZWxlY3RvcikpO1xuICAgIGNvbnN0IGNlbGxJbmRleCA9IGNlbGwuY2VsbEluZGV4O1xuICAgIGNvbnN0IG5ld1JvdyA9IGNyZWF0ZVJvdyhyb3cubW92ZVVwKCkpO1xuICAgIGNvbnN0IG5ld0NlbGwgPSBuZXdSb3cuY2VsbHNbTWF0aC5taW4obmV3Um93LmNlbGxzLmxlbmd0aCAtIDEsIGNlbGxJbmRleCldO1xuICAgIHJldHVybiBuZXdDZWxsLmhhc0F0dHJpYnV0ZSgnZGF0YS1rZXlib2FyZC1za2lwJykgPT09IGZhbHNlID8gbmV3Q2VsbCA6IGNyZWF0ZUNlbGwobmV3Q2VsbCkubW92ZUxlZnQoKTtcbiAgfTtcblxuICBjb25zdCBtb3ZlRG93biA9IHRhcmdldCA9PiB7XG4gICAgY29uc3QgY2VsbCA9IGNyZWF0ZUNlbGwoZmluZENvbnRhaW5lcih0YXJnZXQsIGNlbGxTZWxlY3RvcikpO1xuICAgIGNvbnN0IHJvdyA9IGNyZWF0ZVJvdyhmaW5kQ29udGFpbmVyKGNlbGwuZWxlbWVudCwgcm93U2VsZWN0b3IpKTtcbiAgICBjb25zdCBjZWxsSW5kZXggPSBjZWxsLmNlbGxJbmRleDtcbiAgICBjb25zdCBuZXdSb3cgPSBjcmVhdGVSb3cocm93Lm1vdmVEb3duKCkpO1xuICAgIGNvbnN0IG5ld0NlbGwgPSBuZXdSb3cuY2VsbHNbTWF0aC5taW4obmV3Um93LmNlbGxzLmxlbmd0aCAtIDEsIGNlbGxJbmRleCldO1xuICAgIHJldHVybiBuZXdDZWxsLmhhc0F0dHJpYnV0ZSgnZGF0YS1rZXlib2FyZC1za2lwJykgPT09IGZhbHNlID8gbmV3Q2VsbCA6IGNyZWF0ZUNlbGwobmV3Q2VsbCkubW92ZUxlZnQoKTtcbiAgfTtcblxuICByZXR1cm4ge1xuICAgIG1vdmVEb3duLFxuICAgIG1vdmVMZWZ0LFxuICAgIG1vdmVVcCxcbiAgICBtb3ZlUmlnaHRcbiAgfTtcbn0iLCJpbXBvcnQgem9yYSBmcm9tICd6b3JhJztcbmltcG9ydCB7a2V5R3JpZH0gZnJvbSAnLi4vbGliL2tleW1hcCc7XG5cbmV4cG9ydCBkZWZhdWx0IHpvcmEoKVxuICAudGVzdCgnbW92ZSB0byB0aGUgbmV4dCBjZWxsIG9uIHRoZSByaWdodCcsIGZ1bmN0aW9uICogKHQpIHtcbiAgICBjb25zdCB0YWJsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ1RBQkxFJyk7XG4gICAgdGFibGUuaW5uZXJIVE1MID0gYDx0cj5cbjx0ZCBpZD1cIjFcIj5mb288L3RkPlxuPHRkIGlkPVwiMlwiPmJhcjwvdGQ+XG48dGQgaWQ9XCIzXCI+d29vdDwvdGQ+XG48L3RyPmA7XG4gICAgY29uc3Qga2cgPSBrZXlHcmlkKHRhYmxlLCB7Y2VsbFNlbGVjdG9yOiAndGQnLCByb3dTZWxlY3RvcjogJ3RyJ30pO1xuXG4gICAgY29uc3QgbW92ZWQgPSBrZy5tb3ZlUmlnaHQodGFibGUucXVlcnlTZWxlY3RvcignW2lkPVwiMVwiXScpKTtcbiAgICB0LmVxdWFsKG1vdmVkLmlkLCAnMicpO1xuICB9KVxuICAudGVzdCgndGFibGUgKGRhdGEgY2VsbCk6IGRvbnQgbW92ZSBpZiBhbHJlYWR5IGF0IHRoZSBlbmQgb2YgdGhlIHJvdycsIGZ1bmN0aW9uICogKHQpIHtcbiAgICBjb25zdCB0YWJsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ1RBQkxFJyk7XG4gICAgdGFibGUuaW5uZXJIVE1MID0gYDx0cj5cbjx0ZCBpZD1cIjFcIj5mb288L3RkPlxuPHRkIGlkPVwiMlwiPmJhcjwvdGQ+XG48dGQgaWQ9XCIzXCI+d29vdDwvdGQ+XG48L3RyPmA7XG4gICAgY29uc3Qga2cgPSBrZXlHcmlkKHRhYmxlLCB7Y2VsbFNlbGVjdG9yOiAndGQnLCByb3dTZWxlY3RvcjogJ3RyJ30pO1xuICAgIGNvbnN0IG1vdmVkID0ga2cubW92ZVJpZ2h0KHRhYmxlLnF1ZXJ5U2VsZWN0b3IoJ1tpZD1cIjNcIl0nKSk7XG4gICAgdC5lcXVhbChtb3ZlZC5pZCwgJzMnKTtcbiAgfSlcbiAgLnRlc3QoJ3NraXAgYSBjZWxsIHdpdGggdGhlIGRhdGEta2VhYm9hcmQtc2tpcCBmbGFnIHNldCB0byB0cnVlJywgZnVuY3Rpb24gKiAodCkge1xuICAgIGNvbnN0IHRhYmxlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnVEFCTEUnKTtcbiAgICB0YWJsZS5pbm5lckhUTUwgPSBgPHRyPlxuPHRkIGlkPVwiMVwiPmZvbzwvdGQ+XG48dGQgZGF0YS1rZXlib2FyZC1za2lwPVwidHJ1ZVwiIGlkPVwiMlwiPmJhcjwvdGQ+XG48dGQgaWQ9XCIzXCI+d29vdDwvdGQ+XG48L3RyPmA7XG4gICAgY29uc3Qga2cgPSBrZXlHcmlkKHRhYmxlLCB7Y2VsbFNlbGVjdG9yOiAndGQnLCByb3dTZWxlY3RvcjogJ3RyJ30pO1xuICAgIGNvbnN0IG1vdmVkID0ga2cubW92ZVJpZ2h0KHRhYmxlLnF1ZXJ5U2VsZWN0b3IoJ1tpZD1cIjFcIl0nKSk7XG4gICAgdC5lcXVhbChtb3ZlZC5pZCwgJzMnKTtcbiAgfSlcbiAgLnRlc3QoJ2RvIG5vdCBtb3ZlIGlmIGxhc3QgY2VsbCBoYXMgdG8gYmUgc2tpcHBlZCcsIGZ1bmN0aW9uICogKHQpIHtcbiAgICBjb25zdCB0YWJsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ1RBQkxFJyk7XG4gICAgdGFibGUuaW5uZXJIVE1MID0gYDx0cj5cbjx0ZCBpZD1cIjFcIj5mb288L3RkPlxuPHRkIGlkPVwiMlwiPmJhcjwvdGQ+XG48dGQgZGF0YS1rZXlib2FyZC1za2lwPVwidHJ1ZVwiIGlkPVwiM1wiPndvb3Q8L3RkPlxuPC90cj5gO1xuICAgIGNvbnN0IGtnID0ga2V5R3JpZCh0YWJsZSwge2NlbGxTZWxlY3RvcjogJ3RkJywgcm93U2VsZWN0b3I6ICd0cid9KTtcbiAgICBjb25zdCBtb3ZlZCA9IGtnLm1vdmVSaWdodCh0YWJsZS5xdWVyeVNlbGVjdG9yKCdbaWQ9XCIyXCJdJykpO1xuICAgIHQuZXF1YWwobW92ZWQuaWQsICcyJyk7XG4gIH0pXG4gIC50ZXN0KCdtb3ZlIGluc2lkZSBhIHN1YiB2aXJ0dWFsIGNlbGwgaWYgc3BlY2lmaWVkJywgZnVuY3Rpb24gKiAodCkge1xuICAgIGNvbnN0IHRhYmxlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnVEFCTEUnKTtcbiAgICB0YWJsZS5pbm5lckhUTUwgPSBgPHRyPlxuPHRkIGlkPVwiMVwiPmZvbzwvdGQ+XG48dGQgZGF0YS1rZXlib2FyZC1zZWxlY3Rvcj1cImJ1dHRvblwiIGlkPVwiMlwiPjxidXR0b24gaWQ9XCJidXR0b24tYmFyXCI+YmFyPC9idXR0b24+PGJ1dHRvbiBpZD1cImJ1dHRvbi1iaW1cIj5iaW08L2J1dHRvbj48L3RkPlxuPHRkIGlkPVwiM1wiPndvb3Q8L3RkPlxuPC90cj5gO1xuICAgIGNvbnN0IGtnID0ga2V5R3JpZCh0YWJsZSwge2NlbGxTZWxlY3RvcjogJ3RkJywgcm93U2VsZWN0b3I6ICd0cid9KTtcbiAgICBjb25zdCBtb3ZlZCA9IGtnLm1vdmVSaWdodCh0YWJsZS5xdWVyeVNlbGVjdG9yKCdidXR0b24jYnV0dG9uLWJhcicpKTtcbiAgICB0LmVxdWFsKG1vdmVkLmlkLCAnYnV0dG9uLWJpbScpO1xuICB9KVxuICAudGVzdCgnbW92ZSBvdXQgb2YgdmlydHVhbCBjZWxsIGlmIGxhc3QgaXRlbSBpcyByZWFjaGVkJywgZnVuY3Rpb24gKiAodCkge1xuICAgIGNvbnN0IHRhYmxlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnVEFCTEUnKTtcbiAgICB0YWJsZS5pbm5lckhUTUwgPSBgPHRyPlxuPHRkIGlkPVwiMVwiPmZvbzwvdGQ+XG48dGQgZGF0YS1rZXlib2FyZC1zZWxlY3Rvcj1cImJ1dHRvblwiIGlkPVwiMlwiPjxidXR0b24gaWQ9XCJidXR0b24tYmFyXCI+YmFyPC9idXR0b24+PGJ1dHRvbiBpZD1cImJ1dHRvbi1iaW1cIj5iaW08L2J1dHRvbj48L3RkPlxuPHRkIGlkPVwiM1wiPndvb3Q8L3RkPlxuPC90cj5gO1xuICAgIGNvbnN0IGtnID0ga2V5R3JpZCh0YWJsZSwge2NlbGxTZWxlY3RvcjogJ3RkJywgcm93U2VsZWN0b3I6ICd0cid9KTtcbiAgICBjb25zdCBtb3ZlZCA9IGtnLm1vdmVSaWdodCh0YWJsZS5xdWVyeVNlbGVjdG9yKCdidXR0b24jYnV0dG9uLWJpbScpKTtcbiAgICB0LmVxdWFsKG1vdmVkLmlkLCAnMycpO1xuICB9KSIsImltcG9ydCB6b3JhIGZyb20gJ3pvcmEnO1xuaW1wb3J0IHtrZXlHcmlkfSBmcm9tICcuLi9saWIva2V5bWFwJztcblxuZXhwb3J0IGRlZmF1bHQgem9yYSgpXG4gIC50ZXN0KCdtb3ZlIHRvIHRoZSBwcmV2aW91cyBjZWxsIG9uIHRoZSBsZWZ0JywgZnVuY3Rpb24gKiAodCkge1xuICAgIGNvbnN0IHRhYmxlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnVEFCTEUnKTtcbiAgICB0YWJsZS5pbm5lckhUTUwgPSBgPHRyPlxuPHRkIGlkPVwiMVwiPmZvbzwvdGQ+XG48dGQgaWQ9XCIyXCI+YmFyPC90ZD5cbjx0ZCBpZD1cIjNcIj53b290PC90ZD5cbjwvdHI+YDtcbiAgICBjb25zdCBrZyA9IGtleUdyaWQodGFibGUsIHtjZWxsU2VsZWN0b3I6ICd0ZCcsIHJvd1NlbGVjdG9yOiAndHInfSk7XG5cbiAgICBjb25zdCBtb3ZlZCA9IGtnLm1vdmVMZWZ0KHRhYmxlLnF1ZXJ5U2VsZWN0b3IoJ1tpZD1cIjJcIl0nKSk7XG4gICAgdC5lcXVhbChtb3ZlZC5pZCwgJzEnKTtcbiAgfSlcbiAgLnRlc3QoJ3RhYmxlIChkYXRhIGNlbGwpOiBkb250IG1vdmUgaWYgYWxyZWFkeSBhdCB0aGUgYmVnaW5uaW5nIG9mIHRoZSByb3cnLCBmdW5jdGlvbiAqICh0KSB7XG4gICAgY29uc3QgdGFibGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdUQUJMRScpO1xuICAgIHRhYmxlLmlubmVySFRNTCA9IGA8dHI+XG48dGQgaWQ9XCIxXCI+Zm9vPC90ZD5cbjx0ZCBpZD1cIjJcIj5iYXI8L3RkPlxuPHRkIGlkPVwiM1wiPndvb3Q8L3RkPlxuPC90cj5gO1xuICAgIGNvbnN0IGtnID0ga2V5R3JpZCh0YWJsZSwge2NlbGxTZWxlY3RvcjogJ3RkJywgcm93U2VsZWN0b3I6ICd0cid9KTtcbiAgICBjb25zdCBtb3ZlZCA9IGtnLm1vdmVMZWZ0KHRhYmxlLnF1ZXJ5U2VsZWN0b3IoJ1tpZD1cIjFcIl0nKSk7XG4gICAgdC5lcXVhbChtb3ZlZC5pZCwgJzEnKTtcbiAgfSlcbiAgLnRlc3QoJ3NraXAgYSBjZWxsIHdpdGggdGhlIGRhdGEta2VhYm9hcmQtc2tpcCBmbGFnIHNldCB0byB0cnVlJywgZnVuY3Rpb24gKiAodCkge1xuICAgIGNvbnN0IHRhYmxlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnVEFCTEUnKTtcbiAgICB0YWJsZS5pbm5lckhUTUwgPSBgPHRyPlxuPHRkIGlkPVwiMVwiPmZvbzwvdGQ+XG48dGQgZGF0YS1rZXlib2FyZC1za2lwPVwidHJ1ZVwiIGlkPVwiMlwiPmJhcjwvdGQ+XG48dGQgaWQ9XCIzXCI+d29vdDwvdGQ+XG48L3RyPmA7XG4gICAgY29uc3Qga2cgPSBrZXlHcmlkKHRhYmxlLCB7Y2VsbFNlbGVjdG9yOiAndGQnLCByb3dTZWxlY3RvcjogJ3RyJ30pO1xuICAgIGNvbnN0IG1vdmVkID0ga2cubW92ZUxlZnQodGFibGUucXVlcnlTZWxlY3RvcignW2lkPVwiM1wiXScpKTtcbiAgICB0LmVxdWFsKG1vdmVkLmlkLCAnMScpO1xuICB9KVxuICAudGVzdCgnZG8gbm90IG1vdmUgaWYgbGFzdCBjZWxsIGhhcyB0byBiZSBza2lwcGVkJywgZnVuY3Rpb24gKiAodCkge1xuICAgIGNvbnN0IHRhYmxlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnVEFCTEUnKTtcbiAgICB0YWJsZS5pbm5lckhUTUwgPSBgPHRyPlxuPHRkIGRhdGEta2V5Ym9hcmQtc2tpcD1cInRydWVcIiBpZD1cIjFcIj5mb288L3RkPlxuPHRkIGlkPVwiMlwiPmJhcjwvdGQ+XG48dGQgaWQ9XCIzXCI+d29vdDwvdGQ+XG48L3RyPmA7XG4gICAgY29uc3Qga2cgPSBrZXlHcmlkKHRhYmxlLCB7Y2VsbFNlbGVjdG9yOiAndGQnLCByb3dTZWxlY3RvcjogJ3RyJ30pO1xuICAgIGNvbnN0IG1vdmVkID0ga2cubW92ZUxlZnQodGFibGUucXVlcnlTZWxlY3RvcignW2lkPVwiMlwiXScpKTtcbiAgICB0LmVxdWFsKG1vdmVkLmlkLCAnMicpO1xuICB9KVxuICAudGVzdCgnbW92ZSBpbnNpZGUgYSBzdWIgdmlydHVhbCBjZWxsIGlmIHNwZWNpZmllZCcsIGZ1bmN0aW9uICogKHQpIHtcbiAgICBjb25zdCB0YWJsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ1RBQkxFJyk7XG4gICAgdGFibGUuaW5uZXJIVE1MID0gYDx0cj5cbjx0ZCBpZD1cIjFcIj5mb288L3RkPlxuPHRkIGRhdGEta2V5Ym9hcmQtc2VsZWN0b3I9XCJidXR0b25cIiBpZD1cIjJcIj48YnV0dG9uIGlkPVwiYnV0dG9uLWJhclwiPmJhcjwvYnV0dG9uPjxidXR0b24gaWQ9XCJidXR0b24tYmltXCI+YmltPC9idXR0b24+PC90ZD5cbjx0ZCBpZD1cIjNcIj53b290PC90ZD5cbjwvdHI+YDtcbiAgICBjb25zdCBrZyA9IGtleUdyaWQodGFibGUsIHtjZWxsU2VsZWN0b3I6ICd0ZCcsIHJvd1NlbGVjdG9yOiAndHInfSk7XG4gICAgY29uc3QgbW92ZWQgPSBrZy5tb3ZlTGVmdCh0YWJsZS5xdWVyeVNlbGVjdG9yKCdidXR0b24jYnV0dG9uLWJpbScpKTtcbiAgICB0LmVxdWFsKG1vdmVkLmlkLCAnYnV0dG9uLWJhcicpO1xuICB9KVxuICAudGVzdCgnbW92ZSBvdXQgb2YgdmlydHVhbCBjZWxsIGlmIGZpcnN0IGl0ZW0gaXMgcmVhY2hlZCcsIGZ1bmN0aW9uICogKHQpIHtcbiAgICBjb25zdCB0YWJsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ1RBQkxFJyk7XG4gICAgdGFibGUuaW5uZXJIVE1MID0gYDx0cj5cbjx0ZCBpZD1cIjFcIj5mb288L3RkPlxuPHRkIGRhdGEta2V5Ym9hcmQtc2VsZWN0b3I9XCJidXR0b25cIiBpZD1cIjJcIj48YnV0dG9uIGlkPVwiYnV0dG9uLWJhclwiPmJhcjwvYnV0dG9uPjxidXR0b24gaWQ9XCJidXR0b24tYmltXCI+YmltPC9idXR0b24+PC90ZD5cbjx0ZCBpZD1cIjNcIj53b290PC90ZD5cbjwvdHI+YDtcbiAgICBjb25zdCBrZyA9IGtleUdyaWQodGFibGUsIHtjZWxsU2VsZWN0b3I6ICd0ZCcsIHJvd1NlbGVjdG9yOiAndHInfSk7XG4gICAgY29uc3QgbW92ZWQgPSBrZy5tb3ZlTGVmdCh0YWJsZS5xdWVyeVNlbGVjdG9yKCdidXR0b24jYnV0dG9uLWJhcicpKTtcbiAgICB0LmVxdWFsKG1vdmVkLmlkLCAnMScpO1xuICB9KSIsImltcG9ydCB6b3JhIGZyb20gJ3pvcmEnO1xuaW1wb3J0IHtrZXlHcmlkfSBmcm9tICcuLi9saWIva2V5bWFwJztcblxuXG5leHBvcnQgZGVmYXVsdCB6b3JhKClcbiAgLnRlc3QoJ21vdmUgdXAgZnJvbSBvbmUgcm93IHRvIHRoZSBvdGhlcicsIGZ1bmN0aW9uICogKHQpIHtcbiAgICBjb25zdCB0YWJsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ1RBQkxFJyk7XG4gICAgdGFibGUuaW5uZXJIVE1MID0gYDx0ciBpZD1cInIxXCI+XG48dGQgaWQ9XCIxXCI+Zm9vPC90ZD5cbjx0ZCBpZD1cIjJcIj5iYXI8L3RkPlxuPHRkIGlkPVwiM1wiPndvb3Q8L3RkPlxuPC90cj5cbjx0ciBpZD1cInIyXCI+XG48dGQgaWQ9XCIxMVwiPmZvbzwvdGQ+XG48dGQgaWQ9XCIxMlwiPmJhcjwvdGQ+XG48dGQgaWQ9XCIxM1wiPndvb3Q8L3RkPlxuPC90cj5gO1xuICAgIGNvbnN0IGtnID0ga2V5R3JpZCh0YWJsZSwge2NlbGxTZWxlY3RvcjogJ3RkJywgcm93U2VsZWN0b3I6ICd0cid9KTtcblxuICAgIGNvbnN0IG1vdmVkID0ga2cubW92ZVVwKHRhYmxlLnF1ZXJ5U2VsZWN0b3IoJ1tpZD1cIjEyXCJdJykpO1xuICAgIHQuZXF1YWwobW92ZWQuaWQsICcyJyk7XG4gIH0pXG4gIC50ZXN0KCdtb3ZlIHVwIGtlZXBpbmcgdGhlIHNhbWUgY2VsbCBhcyB0aGUgZmlyc3Qgcm93IGhhcyB0aGUgc2tpcCBmbGFnJywgZnVuY3Rpb24gKiAodCkge1xuICAgIGNvbnN0IHRhYmxlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnVEFCTEUnKTtcbiAgICB0YWJsZS5pbm5lckhUTUwgPSBgPHRyIGRhdGEta2V5Ym9hcmQtc2tpcD1cInRydWVcIiBpZD1cInIxXCI+XG48dGQgaWQ9XCIxXCI+Zm9vPC90ZD5cbjx0ZCBpZD1cIjJcIj5iYXI8L3RkPlxuPHRkIGlkPVwiM1wiPndvb3Q8L3RkPlxuPC90cj5cbjx0ciBpZD1cInIyXCI+XG48dGQgaWQ9XCIxMVwiPmZvbzwvdGQ+XG48dGQgaWQ9XCIxMlwiPmJhcjwvdGQ+XG48dGQgaWQ9XCIxM1wiPndvb3Q8L3RkPlxuPC90cj5gO1xuICAgIGNvbnN0IGtnID0ga2V5R3JpZCh0YWJsZSwge2NlbGxTZWxlY3RvcjogJ3RkJywgcm93U2VsZWN0b3I6ICd0cid9KTtcblxuICAgIGNvbnN0IG1vdmVkID0ga2cubW92ZVVwKHRhYmxlLnF1ZXJ5U2VsZWN0b3IoJ1tpZD1cIjEyXCJdJykpO1xuICAgIHQuZXF1YWwobW92ZWQuaWQsICcxMicpO1xuICB9KVxuICAudGVzdCgnbW92ZSB1cCBza2lwcGluZyBhIHJvdycsIGZ1bmN0aW9uICogKHQpIHtcbiAgICBjb25zdCB0YWJsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ1RBQkxFJyk7XG4gICAgdGFibGUuaW5uZXJIVE1MID0gYDx0ciBpZD1cInIxXCI+XG48dGQgaWQ9XCIxXCI+Zm9vPC90ZD5cbjx0ZCBpZD1cIjJcIj5iYXI8L3RkPlxuPHRkIGlkPVwiM1wiPndvb3Q8L3RkPlxuPC90cj5cbjx0ciBkYXRhLWtleWJvYXJkLXNraXA9XCJ0cnVlXCIgaWQ9XCJyMlwiPlxuPHRkIGlkPVwiMTFcIj5mb288L3RkPlxuPHRkIGlkPVwiMTJcIj5iYXI8L3RkPlxuPHRkIGlkPVwiMTNcIj53b290PC90ZD5cbjwvdHI+XG48dHIgaWQ9XCJyM1wiPlxuPHRkIGlkPVwiMjFcIj5mb288L3RkPlxuPHRkIGlkPVwiMjJcIj5iYXI8L3RkPlxuPHRkIGlkPVwiMjNcIj53b290PC90ZD5cbjwvdHI+YDtcbiAgICBjb25zdCBrZyA9IGtleUdyaWQodGFibGUsIHtjZWxsU2VsZWN0b3I6ICd0ZCcsIHJvd1NlbGVjdG9yOiAndHInfSk7XG5cbiAgICBjb25zdCBtb3ZlZCA9IGtnLm1vdmVVcCh0YWJsZS5xdWVyeVNlbGVjdG9yKCdbaWQ9XCIyMlwiXScpKTtcbiAgICB0LmVxdWFsKG1vdmVkLmlkLCAnMicpO1xuICB9KVxuICAudGVzdCgnbW92ZSB1cCBnZXR0aW5nIHRoZSBsYXN0IGNlbGwgb2YgdGhlIHByZXZpb3VzIHJvdyBhcyB0aGVyZSBhcmUgbGVzcyBjZWxscyBvbiB0aGF0IHJvdycsIGZ1bmN0aW9uICogKHQpIHtcbiAgICBjb25zdCB0YWJsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ1RBQkxFJyk7XG4gICAgdGFibGUuaW5uZXJIVE1MID0gYDx0ciBpZD1cInIxXCI+XG48dGQgaWQ9XCIxXCI+Zm9vPC90ZD5cbjx0ZCBpZD1cIjJcIj5iYXI8L3RkPlxuPC90cj5cbjx0ciBpZD1cInIyXCI+XG48dGQgaWQ9XCIxMVwiPmZvbzwvdGQ+XG48dGQgaWQ9XCIxMlwiPmJhcjwvdGQ+XG48dGQgaWQ9XCIxM1wiPndvb3Q8L3RkPlxuPC90cj5gO1xuICAgIGNvbnN0IGtnID0ga2V5R3JpZCh0YWJsZSwge2NlbGxTZWxlY3RvcjogJ3RkJywgcm93U2VsZWN0b3I6ICd0cid9KTtcblxuICAgIGNvbnN0IG1vdmVkID0ga2cubW92ZVVwKHRhYmxlLnF1ZXJ5U2VsZWN0b3IoJ1tpZD1cIjEzXCJdJykpO1xuICAgIHQuZXF1YWwobW92ZWQuaWQsICcyJyk7XG4gIH0pIiwiaW1wb3J0IHpvcmEgZnJvbSAnem9yYSc7XG5pbXBvcnQge2tleUdyaWR9IGZyb20gJy4uL2xpYi9rZXltYXAnO1xuXG5cbmV4cG9ydCBkZWZhdWx0IHpvcmEoKVxuICAudGVzdCgnbW92ZSBkb3duIGZyb20gb25lIHJvdyB0byB0aGUgb3RoZXInLCBmdW5jdGlvbiAqICh0KSB7XG4gICAgY29uc3QgdGFibGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdUQUJMRScpO1xuICAgIHRhYmxlLmlubmVySFRNTCA9IGA8dHIgaWQ9XCJyMVwiPlxuPHRkIGlkPVwiMVwiPmZvbzwvdGQ+XG48dGQgaWQ9XCIyXCI+YmFyPC90ZD5cbjx0ZCBpZD1cIjNcIj53b290PC90ZD5cbjwvdHI+XG48dHIgaWQ9XCJyMlwiPlxuPHRkIGlkPVwiMTFcIj5mb288L3RkPlxuPHRkIGlkPVwiMTJcIj5iYXI8L3RkPlxuPHRkIGlkPVwiMTNcIj53b290PC90ZD5cbjwvdHI+YDtcbiAgICBjb25zdCBrZyA9IGtleUdyaWQodGFibGUsIHtjZWxsU2VsZWN0b3I6ICd0ZCcsIHJvd1NlbGVjdG9yOiAndHInfSk7XG5cbiAgICBjb25zdCBtb3ZlZCA9IGtnLm1vdmVEb3duKHRhYmxlLnF1ZXJ5U2VsZWN0b3IoJ1tpZD1cIjJcIl0nKSk7XG4gICAgdC5lcXVhbChtb3ZlZC5pZCwgJzEyJyk7XG4gIH0pXG4gIC50ZXN0KCdtb3ZlIGRvd24ga2VlcGluZyB0aGUgc2FtZSBjZWxsIGFzIHRoZSBsYXN0IHJvdyBoYXMgdGhlIHNraXAgZmxhZycsIGZ1bmN0aW9uICogKHQpIHtcbiAgICBjb25zdCB0YWJsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ1RBQkxFJyk7XG4gICAgdGFibGUuaW5uZXJIVE1MID0gYDx0ciBpZD1cInIxXCI+XG48dGQgaWQ9XCIxXCI+Zm9vPC90ZD5cbjx0ZCBpZD1cIjJcIj5iYXI8L3RkPlxuPHRkIGlkPVwiM1wiPndvb3Q8L3RkPlxuPC90cj5cbjx0ciBpZD1cInIyXCIgZGF0YS1rZXlib2FyZC1za2lwPVwidHJ1ZVwiPlxuPHRkIGlkPVwiMTFcIj5mb288L3RkPlxuPHRkIGlkPVwiMTJcIj5iYXI8L3RkPlxuPHRkIGlkPVwiMTNcIj53b290PC90ZD5cbjwvdHI+YDtcbiAgICBjb25zdCBrZyA9IGtleUdyaWQodGFibGUsIHtjZWxsU2VsZWN0b3I6ICd0ZCcsIHJvd1NlbGVjdG9yOiAndHInfSk7XG5cbiAgICBjb25zdCBtb3ZlZCA9IGtnLm1vdmVEb3duKHRhYmxlLnF1ZXJ5U2VsZWN0b3IoJ1tpZD1cIjJcIl0nKSk7XG4gICAgdC5lcXVhbChtb3ZlZC5pZCwgJzInKTtcbiAgfSlcbiAgLnRlc3QoJ21vdmUgZG93biBza2lwcGluZyBhIHJvdycsIGZ1bmN0aW9uICogKHQpIHtcbiAgICBjb25zdCB0YWJsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ1RBQkxFJyk7XG4gICAgdGFibGUuaW5uZXJIVE1MID0gYDx0ciBpZD1cInIxXCI+XG48dGQgaWQ9XCIxXCI+Zm9vPC90ZD5cbjx0ZCBpZD1cIjJcIj5iYXI8L3RkPlxuPHRkIGlkPVwiM1wiPndvb3Q8L3RkPlxuPC90cj5cbjx0ciBkYXRhLWtleWJvYXJkLXNraXA9XCJ0cnVlXCIgaWQ9XCJyMlwiPlxuPHRkIGlkPVwiMTFcIj5mb288L3RkPlxuPHRkIGlkPVwiMTJcIj5iYXI8L3RkPlxuPHRkIGlkPVwiMTNcIj53b290PC90ZD5cbjwvdHI+XG48dHIgaWQ9XCJyM1wiPlxuPHRkIGlkPVwiMjFcIj5mb288L3RkPlxuPHRkIGlkPVwiMjJcIj5iYXI8L3RkPlxuPHRkIGlkPVwiMjNcIj53b290PC90ZD5cbjwvdHI+YDtcbiAgICBjb25zdCBrZyA9IGtleUdyaWQodGFibGUsIHtjZWxsU2VsZWN0b3I6ICd0ZCcsIHJvd1NlbGVjdG9yOiAndHInfSk7XG5cbiAgICBjb25zdCBtb3ZlZCA9IGtnLm1vdmVEb3duKHRhYmxlLnF1ZXJ5U2VsZWN0b3IoJ1tpZD1cIjJcIl0nKSk7XG4gICAgdC5lcXVhbChtb3ZlZC5pZCwgJzIyJyk7XG4gIH0pXG4gIC50ZXN0KCdtb3ZlIGRvd24gZ2V0dGluZyB0aGUgbGFzdCBjZWxsIG9mIHRoZSBuZXh0IHJvdyBhcyB0aGVyZSBhcmUgbGVzcyBjZWxscyBvbiB0aGF0IHJvdycsIGZ1bmN0aW9uICogKHQpIHtcbiAgICBjb25zdCB0YWJsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ1RBQkxFJyk7XG4gICAgdGFibGUuaW5uZXJIVE1MID0gYDx0ciBpZD1cInIxXCI+XG48dGQgaWQ9XCIxXCI+Zm9vPC90ZD5cbjx0ZCBpZD1cIjJcIj5iYXI8L3RkPlxuPHRkIGlkPVwiM1wiPmJhcjwvdGQ+XG48L3RyPlxuPHRyIGlkPVwicjJcIj5cbjx0ZCBpZD1cIjExXCI+Zm9vPC90ZD5cbjx0ZCBpZD1cIjEyXCI+YmFyPC90ZD5cbjwvdHI+YDtcbiAgICBjb25zdCBrZyA9IGtleUdyaWQodGFibGUsIHtjZWxsU2VsZWN0b3I6ICd0ZCcsIHJvd1NlbGVjdG9yOiAndHInfSk7XG5cbiAgICBjb25zdCBtb3ZlZCA9IGtnLm1vdmVEb3duKHRhYmxlLnF1ZXJ5U2VsZWN0b3IoJ1tpZD1cIjNcIl0nKSk7XG4gICAgdC5lcXVhbChtb3ZlZC5pZCwgJzEyJyk7XG4gIH0pOyIsImltcG9ydCB6b3JhIGZyb20gJ3pvcmEnO1xuaW1wb3J0IG1vdmVSaWdodCBmcm9tICcuL21vdmVSaWdodCc7XG5pbXBvcnQgbW92ZUxlZnQgZnJvbSAnLi9tb3ZlTGVmdCc7XG5pbXBvcnQgbW92ZVVwIGZyb20gJy4vbW92ZVVwJztcbmltcG9ydCBtb3ZlRG93biBmcm9tICcuL21vdmVEb3duJztcblxuem9yYSgpXG4gIC50ZXN0KG1vdmVSaWdodClcbiAgLnRlc3QobW92ZUxlZnQpXG4gIC50ZXN0KG1vdmVVcClcbiAgLnRlc3QobW92ZURvd24pXG4gIC5ydW4oKTsiXSwibmFtZXMiOlsicGxhbiIsInpvcmEiXSwibWFwcGluZ3MiOiI7OztBQUFBOzs7O0FBSUEsSUFBSSxLQUFLLEdBQUcsS0FBSyxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUM7Ozs7OztBQU1sQyxJQUFJLEtBQUssR0FBRyxFQUFFLENBQUMsU0FBUyxDQUFDLEdBQUcsRUFBRSxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUM7Ozs7Ozs7Ozs7Ozs7O0FBY3ZDLEVBQUUsQ0FBQyxJQUFJLEdBQUcsVUFBVSxFQUFFLEVBQUU7RUFDdEIsYUFBYSxDQUFDLHFCQUFxQixHQUFHLEVBQUUsQ0FBQztFQUN6QyxPQUFPLGFBQWEsQ0FBQztFQUNyQixTQUFTLGFBQWEsR0FBRztJQUN2QixPQUFPLEVBQUUsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLFNBQVMsQ0FBQyxDQUFDLENBQUM7R0FDakQ7Q0FDRixDQUFDOzs7Ozs7Ozs7OztBQVdGLFNBQVMsRUFBRSxDQUFDLEdBQUcsRUFB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
