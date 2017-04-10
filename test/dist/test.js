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
const dataSelectorAttribute = 'data-keyboard-selector';
const dataSkipAttribute = 'data-keyboard-skip';
const valFunc = val => () => val;

function regularCell (element, {rowSelector, cellSelector}) {
  const row = findContainer(element, rowSelector);
  const cells = [...row.querySelectorAll(cellSelector)];
  const index = cells.indexOf(element);
  const returnEl = valFunc(element);
  return {
    selectFromAfter: returnEl,
    selectFromBefore: returnEl,
    next(){
      return cells[index + 1] !== void 0 ? cells[index + 1] : null;
    },
    previous(){
      return cells[index - 1] !== void 0 ? cells[index - 1] : null;
    }
  }
}

function skipCell (element, options) {
  const reg = regularCell(element, options);
  return {
    previous: reg.previous,
    next: reg.next
  }
}

function compositeCell (element, options) {
  const cellElement = findContainer(element, options.cellSelector);
  const selector = cellElement.getAttribute(dataSelectorAttribute);
  const subWidgets = [...cellElement.querySelectorAll(selector)];
  const widgetsLength = subWidgets.length;
  const isSubWidget = element !== cellElement;
  return {
    selectFromBefore(){
      return isSubWidget ? element : subWidgets[0];
    },
    selectFromAfter(){
      return isSubWidget ? element : subWidgets[widgetsLength - 1];
    },
    next(){
      const index = subWidgets.indexOf(element);
      if (isSubWidget && index + 1 < widgetsLength) {
        return subWidgets[index + 1];
      } else {
        return regularCell(cellElement, options).next();
      }
    },
    previous(){
      const index = subWidgets.indexOf(element);
      if (isSubWidget && index > 0) {
        return subWidgets[index - 1];
      } else {
        return regularCell(cellElement, options).previous();
      }
    }
  }
}

function createCell (el, options) {
  if (el === null) {
    return null;
  } else if (el.hasAttribute(dataSkipAttribute)) {
    return skipCell(el, options);
  } else if (el.hasAttribute(dataSelectorAttribute) || !el.matches(options.cellSelector)) {
    return compositeCell(el, options);
  } else {
    return regularCell(el, options);
  }
}

function regularRow (element, grid, {rowSelector = 'tr', cellSelector = 'th,td'}={}) {
  const rows = [...grid.querySelectorAll(rowSelector)];
  const cells = [...element.querySelectorAll(cellSelector)];
  const index = rows.indexOf(element);
  return {
    previous(){
      return rows[index - 1] !== void 0 ? rows[index - 1] : null;
    },
    next(){
      return rows[index + 1] !== void 0 ? rows[index + 1] : null;
    },
    item(index){
      return cells[index] !== void 0 ? cells[index] : null;
    }
  };
}

function skipRow (element, grid, options) {
  const regular = regularRow(element, grid, options);
  return {
    previous: regular.previous,
    next: regular.next
  };
}

function createRow (target, grid, {rowSelector, cellSelector}={}) {
  if (target === null) {
    return null;
  }
  const r = findContainer(target, rowSelector);
  return r.hasAttribute(dataSkipAttribute) ? skipRow(r, grid, {
      rowSelector,
      cellSelector
    }) : regularRow(target, grid, {rowSelector, cellSelector});
}

function keyGrid (grid, options) {
  const {rowSelector, cellSelector} = options;
  return {
    moveRight(target){
      const cell = createCell(target, options);
      let newCell = createCell(cell.next(), options);
      while (newCell !== null && newCell.selectFromBefore === void 0) {
        newCell = createCell(newCell.next(), options);
      }
      return newCell !== null ? newCell.selectFromBefore() : target;
    },
    moveLeft(target){
      const cell = createCell(target, options);
      let newCell = createCell(cell.previous(), options);
      while (newCell !== null && newCell.selectFromAfter === void 0) {
        newCell = createCell(newCell.previous(), options);
      }
      return newCell !== null ? newCell.selectFromAfter() : target;
    },
    moveUp(target){
      const rowElement = findContainer(target, rowSelector);
      const cells = [...rowElement.querySelectorAll(cellSelector)];
      const row = createRow(rowElement, grid, options);
      let newRow = createRow(row.previous(), grid, options);
      while (newRow !== null && newRow.item === void 0) {
        newRow = createRow(newRow.previous(), grid, options);
      }

      if (newRow === null) {
        return target;
      }

      let askedIndex = cells.indexOf(findContainer(target, cellSelector));
      let newCell = createCell(newRow.item(askedIndex), options);
      while (newCell === null || newCell.selectFromBefore === void 0 && askedIndex > 0) {
        askedIndex--;
        newCell = createCell(newRow.item(askedIndex), options);
      }
      return newCell.selectFromBefore();
    },
    moveDown(target){
      const rowElement = findContainer(target, rowSelector);
      const cells = [...rowElement.querySelectorAll(cellSelector)];
      const row = createRow(rowElement, grid, options);
      let newRow = createRow(row.next(), grid, options);
      while (newRow !== null && newRow.item === void 0) {
        newRow = createRow(newRow.next(), grid, options);
      }

      if (newRow === null) {
        return target;
      }

      let askedIndex = cells.indexOf(findContainer(target, cellSelector));
      let newCell = createCell(newRow.item(askedIndex), options);
      while (newCell === null || newCell.selectFromBefore === void 0 && askedIndex > 0) {
        askedIndex--;
        newCell = createCell(newRow.item(askedIndex), options);
      }
      return newCell.selectFromBefore();
    }
  }
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
  .test('table (data cell): do n0t move if already at the end of the row', function * (t) {
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
  .test('move to first sub widget when entering a cell', function * (t) {
    const table = document.createElement('TABLE');
    table.innerHTML = `<tr>
<td id="1">foo</td>
<td data-keyboard-selector="button" id="2"><button id="button-bar">bar</button><button id="button-bim">bim</button></td>
<td id="3">woot</td>
</tr>`;
    const kg = keyGrid(table, {cellSelector: 'td', rowSelector: 'tr'});
    const moved = kg.moveRight(table.querySelector('[id="1"]'));
    t.equal(moved.id, 'button-bar');
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
  .test('table (data cell): do not move if already at the beginning of the row', function * (t) {
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
  .test('skip a cell with the data-keyboard-skip flag set to true', function * (t) {
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
  .test('select last sub widget when entering a cell by the right', function * (t) {
    const table = document.createElement('TABLE');
    table.innerHTML = `<tr>
<td id="1">foo</td>
<td data-keyboard-selector="button" id="2"><button id="button-bar">bar</button><button id="button-bim">bim</button></td>
<td id="3">woot</td>
</tr>`;
    const kg = keyGrid(table, {cellSelector: 'td', rowSelector: 'tr'});
    const moved = kg.moveLeft(table.querySelector('[id="3"]'));
    t.equal(moved.id, 'button-bim');
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdC5qcyIsInNvdXJjZXMiOlsiLi4vLi4vbm9kZV9tb2R1bGVzL3pvcmEvZGlzdC96b3JhLmVzLmpzIiwiLi4vLi4vbGliL3V0aWwuanMiLCIuLi8uLi9saWIvY2VsbC5qcyIsIi4uLy4uL2xpYi9yb3cuanMiLCIuLi8uLi9saWIva2V5Z3JpZC5qcyIsIi4uL21vdmVSaWdodC5qcyIsIi4uL21vdmVMZWZ0LmpzIiwiLi4vbW92ZVVwLmpzIiwiLi4vbW92ZURvd24uanMiLCIuLi9pbmRleC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIHNsaWNlKCkgcmVmZXJlbmNlLlxuICovXG5cbnZhciBzbGljZSA9IEFycmF5LnByb3RvdHlwZS5zbGljZTtcblxuLyoqXG4gKiBFeHBvc2UgYGNvYC5cbiAqL1xuXG52YXIgaW5kZXggPSBjb1snZGVmYXVsdCddID0gY28uY28gPSBjbztcblxuLyoqXG4gKiBXcmFwIHRoZSBnaXZlbiBnZW5lcmF0b3IgYGZuYCBpbnRvIGFcbiAqIGZ1bmN0aW9uIHRoYXQgcmV0dXJucyBhIHByb21pc2UuXG4gKiBUaGlzIGlzIGEgc2VwYXJhdGUgZnVuY3Rpb24gc28gdGhhdFxuICogZXZlcnkgYGNvKClgIGNhbGwgZG9lc24ndCBjcmVhdGUgYSBuZXcsXG4gKiB1bm5lY2Vzc2FyeSBjbG9zdXJlLlxuICpcbiAqIEBwYXJhbSB7R2VuZXJhdG9yRnVuY3Rpb259IGZuXG4gKiBAcmV0dXJuIHtGdW5jdGlvbn1cbiAqIEBhcGkgcHVibGljXG4gKi9cblxuY28ud3JhcCA9IGZ1bmN0aW9uIChmbikge1xuICBjcmVhdGVQcm9taXNlLl9fZ2VuZXJhdG9yRnVuY3Rpb25fXyA9IGZuO1xuICByZXR1cm4gY3JlYXRlUHJvbWlzZTtcbiAgZnVuY3Rpb24gY3JlYXRlUHJvbWlzZSgpIHtcbiAgICByZXR1cm4gY28uY2FsbCh0aGlzLCBmbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpKTtcbiAgfVxufTtcblxuLyoqXG4gKiBFeGVjdXRlIHRoZSBnZW5lcmF0b3IgZnVuY3Rpb24gb3IgYSBnZW5lcmF0b3JcbiAqIGFuZCByZXR1cm4gYSBwcm9taXNlLlxuICpcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuXG4gKiBAcmV0dXJuIHtQcm9taXNlfVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5mdW5jdGlvbiBjbyhnZW4pIHtcbiAgdmFyIGN0eCA9IHRoaXM7XG4gIHZhciBhcmdzID0gc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpO1xuXG4gIC8vIHdlIHdyYXAgZXZlcnl0aGluZyBpbiBhIHByb21pc2UgdG8gYXZvaWQgcHJvbWlzZSBjaGFpbmluZyxcbiAgLy8gd2hpY2ggbGVhZHMgdG8gbWVtb3J5IGxlYWsgZXJyb3JzLlxuICAvLyBzZWUgaHR0cHM6Ly9naXRodWIuY29tL3RqL2NvL2lzc3Vlcy8xODBcbiAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xuICAgIGlmICh0eXBlb2YgZ2VuID09PSAnZnVuY3Rpb24nKSBnZW4gPSBnZW4uYXBwbHkoY3R4LCBhcmdzKTtcbiAgICBpZiAoIWdlbiB8fCB0eXBlb2YgZ2VuLm5leHQgIT09ICdmdW5jdGlvbicpIHJldHVybiByZXNvbHZlKGdlbik7XG5cbiAgICBvbkZ1bGZpbGxlZCgpO1xuXG4gICAgLyoqXG4gICAgICogQHBhcmFtIHtNaXhlZH0gcmVzXG4gICAgICogQHJldHVybiB7UHJvbWlzZX1cbiAgICAgKiBAYXBpIHByaXZhdGVcbiAgICAgKi9cblxuICAgIGZ1bmN0aW9uIG9uRnVsZmlsbGVkKHJlcykge1xuICAgICAgdmFyIHJldDtcbiAgICAgIHRyeSB7XG4gICAgICAgIHJldCA9IGdlbi5uZXh0KHJlcyk7XG4gICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIHJldHVybiByZWplY3QoZSk7XG4gICAgICB9XG4gICAgICBuZXh0KHJldCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQHBhcmFtIHtFcnJvcn0gZXJyXG4gICAgICogQHJldHVybiB7UHJvbWlzZX1cbiAgICAgKiBAYXBpIHByaXZhdGVcbiAgICAgKi9cblxuICAgIGZ1bmN0aW9uIG9uUmVqZWN0ZWQoZXJyKSB7XG4gICAgICB2YXIgcmV0O1xuICAgICAgdHJ5IHtcbiAgICAgICAgcmV0ID0gZ2VuLnRocm93KGVycik7XG4gICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIHJldHVybiByZWplY3QoZSk7XG4gICAgICB9XG4gICAgICBuZXh0KHJldCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogR2V0IHRoZSBuZXh0IHZhbHVlIGluIHRoZSBnZW5lcmF0b3IsXG4gICAgICogcmV0dXJuIGEgcHJvbWlzZS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSByZXRcbiAgICAgKiBAcmV0dXJuIHtQcm9taXNlfVxuICAgICAqIEBhcGkgcHJpdmF0ZVxuICAgICAqL1xuXG4gICAgZnVuY3Rpb24gbmV4dChyZXQpIHtcbiAgICAgIGlmIChyZXQuZG9uZSkgcmV0dXJuIHJlc29sdmUocmV0LnZhbHVlKTtcbiAgICAgIHZhciB2YWx1ZSA9IHRvUHJvbWlzZS5jYWxsKGN0eCwgcmV0LnZhbHVlKTtcbiAgICAgIGlmICh2YWx1ZSAmJiBpc1Byb21pc2UodmFsdWUpKSByZXR1cm4gdmFsdWUudGhlbihvbkZ1bGZpbGxlZCwgb25SZWplY3RlZCk7XG4gICAgICByZXR1cm4gb25SZWplY3RlZChuZXcgVHlwZUVycm9yKCdZb3UgbWF5IG9ubHkgeWllbGQgYSBmdW5jdGlvbiwgcHJvbWlzZSwgZ2VuZXJhdG9yLCBhcnJheSwgb3Igb2JqZWN0LCAnXG4gICAgICAgICsgJ2J1dCB0aGUgZm9sbG93aW5nIG9iamVjdCB3YXMgcGFzc2VkOiBcIicgKyBTdHJpbmcocmV0LnZhbHVlKSArICdcIicpKTtcbiAgICB9XG4gIH0pO1xufVxuXG4vKipcbiAqIENvbnZlcnQgYSBgeWllbGRgZWQgdmFsdWUgaW50byBhIHByb21pc2UuXG4gKlxuICogQHBhcmFtIHtNaXhlZH0gb2JqXG4gKiBAcmV0dXJuIHtQcm9taXNlfVxuICogQGFwaSBwcml2YXRlXG4gKi9cblxuZnVuY3Rpb24gdG9Qcm9taXNlKG9iaikge1xuICBpZiAoIW9iaikgcmV0dXJuIG9iajtcbiAgaWYgKGlzUHJvbWlzZShvYmopKSByZXR1cm4gb2JqO1xuICBpZiAoaXNHZW5lcmF0b3JGdW5jdGlvbihvYmopIHx8IGlzR2VuZXJhdG9yKG9iaikpIHJldHVybiBjby5jYWxsKHRoaXMsIG9iaik7XG4gIGlmICgnZnVuY3Rpb24nID09IHR5cGVvZiBvYmopIHJldHVybiB0aHVua1RvUHJvbWlzZS5jYWxsKHRoaXMsIG9iaik7XG4gIGlmIChBcnJheS5pc0FycmF5KG9iaikpIHJldHVybiBhcnJheVRvUHJvbWlzZS5jYWxsKHRoaXMsIG9iaik7XG4gIGlmIChpc09iamVjdChvYmopKSByZXR1cm4gb2JqZWN0VG9Qcm9taXNlLmNhbGwodGhpcywgb2JqKTtcbiAgcmV0dXJuIG9iajtcbn1cblxuLyoqXG4gKiBDb252ZXJ0IGEgdGh1bmsgdG8gYSBwcm9taXNlLlxuICpcbiAqIEBwYXJhbSB7RnVuY3Rpb259XG4gKiBAcmV0dXJuIHtQcm9taXNlfVxuICogQGFwaSBwcml2YXRlXG4gKi9cblxuZnVuY3Rpb24gdGh1bmtUb1Byb21pc2UoZm4pIHtcbiAgdmFyIGN0eCA9IHRoaXM7XG4gIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgZm4uY2FsbChjdHgsIGZ1bmN0aW9uIChlcnIsIHJlcykge1xuICAgICAgaWYgKGVycikgcmV0dXJuIHJlamVjdChlcnIpO1xuICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPiAyKSByZXMgPSBzbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XG4gICAgICByZXNvbHZlKHJlcyk7XG4gICAgfSk7XG4gIH0pO1xufVxuXG4vKipcbiAqIENvbnZlcnQgYW4gYXJyYXkgb2YgXCJ5aWVsZGFibGVzXCIgdG8gYSBwcm9taXNlLlxuICogVXNlcyBgUHJvbWlzZS5hbGwoKWAgaW50ZXJuYWxseS5cbiAqXG4gKiBAcGFyYW0ge0FycmF5fSBvYmpcbiAqIEByZXR1cm4ge1Byb21pc2V9XG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5mdW5jdGlvbiBhcnJheVRvUHJvbWlzZShvYmopIHtcbiAgcmV0dXJuIFByb21pc2UuYWxsKG9iai5tYXAodG9Qcm9taXNlLCB0aGlzKSk7XG59XG5cbi8qKlxuICogQ29udmVydCBhbiBvYmplY3Qgb2YgXCJ5aWVsZGFibGVzXCIgdG8gYSBwcm9taXNlLlxuICogVXNlcyBgUHJvbWlzZS5hbGwoKWAgaW50ZXJuYWxseS5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqXG4gKiBAcmV0dXJuIHtQcm9taXNlfVxuICogQGFwaSBwcml2YXRlXG4gKi9cblxuZnVuY3Rpb24gb2JqZWN0VG9Qcm9taXNlKG9iail7XG4gIHZhciByZXN1bHRzID0gbmV3IG9iai5jb25zdHJ1Y3RvcigpO1xuICB2YXIga2V5cyA9IE9iamVjdC5rZXlzKG9iaik7XG4gIHZhciBwcm9taXNlcyA9IFtdO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGtleXMubGVuZ3RoOyBpKyspIHtcbiAgICB2YXIga2V5ID0ga2V5c1tpXTtcbiAgICB2YXIgcHJvbWlzZSA9IHRvUHJvbWlzZS5jYWxsKHRoaXMsIG9ialtrZXldKTtcbiAgICBpZiAocHJvbWlzZSAmJiBpc1Byb21pc2UocHJvbWlzZSkpIGRlZmVyKHByb21pc2UsIGtleSk7XG4gICAgZWxzZSByZXN1bHRzW2tleV0gPSBvYmpba2V5XTtcbiAgfVxuICByZXR1cm4gUHJvbWlzZS5hbGwocHJvbWlzZXMpLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiByZXN1bHRzO1xuICB9KTtcblxuICBmdW5jdGlvbiBkZWZlcihwcm9taXNlLCBrZXkpIHtcbiAgICAvLyBwcmVkZWZpbmUgdGhlIGtleSBpbiB0aGUgcmVzdWx0XG4gICAgcmVzdWx0c1trZXldID0gdW5kZWZpbmVkO1xuICAgIHByb21pc2VzLnB1c2gocHJvbWlzZS50aGVuKGZ1bmN0aW9uIChyZXMpIHtcbiAgICAgIHJlc3VsdHNba2V5XSA9IHJlcztcbiAgICB9KSk7XG4gIH1cbn1cblxuLyoqXG4gKiBDaGVjayBpZiBgb2JqYCBpcyBhIHByb21pc2UuXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IG9ialxuICogQHJldHVybiB7Qm9vbGVhbn1cbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIGlzUHJvbWlzZShvYmopIHtcbiAgcmV0dXJuICdmdW5jdGlvbicgPT0gdHlwZW9mIG9iai50aGVuO1xufVxuXG4vKipcbiAqIENoZWNrIGlmIGBvYmpgIGlzIGEgZ2VuZXJhdG9yLlxuICpcbiAqIEBwYXJhbSB7TWl4ZWR9IG9ialxuICogQHJldHVybiB7Qm9vbGVhbn1cbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIGlzR2VuZXJhdG9yKG9iaikge1xuICByZXR1cm4gJ2Z1bmN0aW9uJyA9PSB0eXBlb2Ygb2JqLm5leHQgJiYgJ2Z1bmN0aW9uJyA9PSB0eXBlb2Ygb2JqLnRocm93O1xufVxuXG4vKipcbiAqIENoZWNrIGlmIGBvYmpgIGlzIGEgZ2VuZXJhdG9yIGZ1bmN0aW9uLlxuICpcbiAqIEBwYXJhbSB7TWl4ZWR9IG9ialxuICogQHJldHVybiB7Qm9vbGVhbn1cbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5mdW5jdGlvbiBpc0dlbmVyYXRvckZ1bmN0aW9uKG9iaikge1xuICB2YXIgY29uc3RydWN0b3IgPSBvYmouY29uc3RydWN0b3I7XG4gIGlmICghY29uc3RydWN0b3IpIHJldHVybiBmYWxzZTtcbiAgaWYgKCdHZW5lcmF0b3JGdW5jdGlvbicgPT09IGNvbnN0cnVjdG9yLm5hbWUgfHwgJ0dlbmVyYXRvckZ1bmN0aW9uJyA9PT0gY29uc3RydWN0b3IuZGlzcGxheU5hbWUpIHJldHVybiB0cnVlO1xuICByZXR1cm4gaXNHZW5lcmF0b3IoY29uc3RydWN0b3IucHJvdG90eXBlKTtcbn1cblxuLyoqXG4gKiBDaGVjayBmb3IgcGxhaW4gb2JqZWN0LlxuICpcbiAqIEBwYXJhbSB7TWl4ZWR9IHZhbFxuICogQHJldHVybiB7Qm9vbGVhbn1cbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIGlzT2JqZWN0KHZhbCkge1xuICByZXR1cm4gT2JqZWN0ID09IHZhbC5jb25zdHJ1Y3Rvcjtcbn1cblxuZnVuY3Rpb24gY3JlYXRlQ29tbW9uanNNb2R1bGUoZm4sIG1vZHVsZSkge1xuXHRyZXR1cm4gbW9kdWxlID0geyBleHBvcnRzOiB7fSB9LCBmbihtb2R1bGUsIG1vZHVsZS5leHBvcnRzKSwgbW9kdWxlLmV4cG9ydHM7XG59XG5cbnZhciBrZXlzID0gY3JlYXRlQ29tbW9uanNNb2R1bGUoZnVuY3Rpb24gKG1vZHVsZSwgZXhwb3J0cykge1xuZXhwb3J0cyA9IG1vZHVsZS5leHBvcnRzID0gdHlwZW9mIE9iamVjdC5rZXlzID09PSAnZnVuY3Rpb24nXG4gID8gT2JqZWN0LmtleXMgOiBzaGltO1xuXG5leHBvcnRzLnNoaW0gPSBzaGltO1xuZnVuY3Rpb24gc2hpbSAob2JqKSB7XG4gIHZhciBrZXlzID0gW107XG4gIGZvciAodmFyIGtleSBpbiBvYmopIGtleXMucHVzaChrZXkpO1xuICByZXR1cm4ga2V5cztcbn1cbn0pO1xuXG52YXIgaXNfYXJndW1lbnRzID0gY3JlYXRlQ29tbW9uanNNb2R1bGUoZnVuY3Rpb24gKG1vZHVsZSwgZXhwb3J0cykge1xudmFyIHN1cHBvcnRzQXJndW1lbnRzQ2xhc3MgPSAoZnVuY3Rpb24oKXtcbiAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChhcmd1bWVudHMpXG59KSgpID09ICdbb2JqZWN0IEFyZ3VtZW50c10nO1xuXG5leHBvcnRzID0gbW9kdWxlLmV4cG9ydHMgPSBzdXBwb3J0c0FyZ3VtZW50c0NsYXNzID8gc3VwcG9ydGVkIDogdW5zdXBwb3J0ZWQ7XG5cbmV4cG9ydHMuc3VwcG9ydGVkID0gc3VwcG9ydGVkO1xuZnVuY3Rpb24gc3VwcG9ydGVkKG9iamVjdCkge1xuICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG9iamVjdCkgPT0gJ1tvYmplY3QgQXJndW1lbnRzXSc7XG59XG5cbmV4cG9ydHMudW5zdXBwb3J0ZWQgPSB1bnN1cHBvcnRlZDtcbmZ1bmN0aW9uIHVuc3VwcG9ydGVkKG9iamVjdCl7XG4gIHJldHVybiBvYmplY3QgJiZcbiAgICB0eXBlb2Ygb2JqZWN0ID09ICdvYmplY3QnICYmXG4gICAgdHlwZW9mIG9iamVjdC5sZW5ndGggPT0gJ251bWJlcicgJiZcbiAgICBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqZWN0LCAnY2FsbGVlJykgJiZcbiAgICAhT2JqZWN0LnByb3RvdHlwZS5wcm9wZXJ0eUlzRW51bWVyYWJsZS5jYWxsKG9iamVjdCwgJ2NhbGxlZScpIHx8XG4gICAgZmFsc2U7XG59XG59KTtcblxudmFyIGluZGV4JDEgPSBjcmVhdGVDb21tb25qc01vZHVsZShmdW5jdGlvbiAobW9kdWxlKSB7XG52YXIgcFNsaWNlID0gQXJyYXkucHJvdG90eXBlLnNsaWNlO1xudmFyIG9iamVjdEtleXMgPSBrZXlzO1xudmFyIGlzQXJndW1lbnRzID0gaXNfYXJndW1lbnRzO1xuXG52YXIgZGVlcEVxdWFsID0gbW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoYWN0dWFsLCBleHBlY3RlZCwgb3B0cykge1xuICBpZiAoIW9wdHMpIG9wdHMgPSB7fTtcbiAgLy8gNy4xLiBBbGwgaWRlbnRpY2FsIHZhbHVlcyBhcmUgZXF1aXZhbGVudCwgYXMgZGV0ZXJtaW5lZCBieSA9PT0uXG4gIGlmIChhY3R1YWwgPT09IGV4cGVjdGVkKSB7XG4gICAgcmV0dXJuIHRydWU7XG5cbiAgfSBlbHNlIGlmIChhY3R1YWwgaW5zdGFuY2VvZiBEYXRlICYmIGV4cGVjdGVkIGluc3RhbmNlb2YgRGF0ZSkge1xuICAgIHJldHVybiBhY3R1YWwuZ2V0VGltZSgpID09PSBleHBlY3RlZC5nZXRUaW1lKCk7XG5cbiAgLy8gNy4zLiBPdGhlciBwYWlycyB0aGF0IGRvIG5vdCBib3RoIHBhc3MgdHlwZW9mIHZhbHVlID09ICdvYmplY3QnLFxuICAvLyBlcXVpdmFsZW5jZSBpcyBkZXRlcm1pbmVkIGJ5ID09LlxuICB9IGVsc2UgaWYgKCFhY3R1YWwgfHwgIWV4cGVjdGVkIHx8IHR5cGVvZiBhY3R1YWwgIT0gJ29iamVjdCcgJiYgdHlwZW9mIGV4cGVjdGVkICE9ICdvYmplY3QnKSB7XG4gICAgcmV0dXJuIG9wdHMuc3RyaWN0ID8gYWN0dWFsID09PSBleHBlY3RlZCA6IGFjdHVhbCA9PSBleHBlY3RlZDtcblxuICAvLyA3LjQuIEZvciBhbGwgb3RoZXIgT2JqZWN0IHBhaXJzLCBpbmNsdWRpbmcgQXJyYXkgb2JqZWN0cywgZXF1aXZhbGVuY2UgaXNcbiAgLy8gZGV0ZXJtaW5lZCBieSBoYXZpbmcgdGhlIHNhbWUgbnVtYmVyIG9mIG93bmVkIHByb3BlcnRpZXMgKGFzIHZlcmlmaWVkXG4gIC8vIHdpdGggT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKSwgdGhlIHNhbWUgc2V0IG9mIGtleXNcbiAgLy8gKGFsdGhvdWdoIG5vdCBuZWNlc3NhcmlseSB0aGUgc2FtZSBvcmRlciksIGVxdWl2YWxlbnQgdmFsdWVzIGZvciBldmVyeVxuICAvLyBjb3JyZXNwb25kaW5nIGtleSwgYW5kIGFuIGlkZW50aWNhbCAncHJvdG90eXBlJyBwcm9wZXJ0eS4gTm90ZTogdGhpc1xuICAvLyBhY2NvdW50cyBmb3IgYm90aCBuYW1lZCBhbmQgaW5kZXhlZCBwcm9wZXJ0aWVzIG9uIEFycmF5cy5cbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gb2JqRXF1aXYoYWN0dWFsLCBleHBlY3RlZCwgb3B0cyk7XG4gIH1cbn07XG5cbmZ1bmN0aW9uIGlzVW5kZWZpbmVkT3JOdWxsKHZhbHVlKSB7XG4gIHJldHVybiB2YWx1ZSA9PT0gbnVsbCB8fCB2YWx1ZSA9PT0gdW5kZWZpbmVkO1xufVxuXG5mdW5jdGlvbiBpc0J1ZmZlciAoeCkge1xuICBpZiAoIXggfHwgdHlwZW9mIHggIT09ICdvYmplY3QnIHx8IHR5cGVvZiB4Lmxlbmd0aCAhPT0gJ251bWJlcicpIHJldHVybiBmYWxzZTtcbiAgaWYgKHR5cGVvZiB4LmNvcHkgIT09ICdmdW5jdGlvbicgfHwgdHlwZW9mIHguc2xpY2UgIT09ICdmdW5jdGlvbicpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgaWYgKHgubGVuZ3RoID4gMCAmJiB0eXBlb2YgeFswXSAhPT0gJ251bWJlcicpIHJldHVybiBmYWxzZTtcbiAgcmV0dXJuIHRydWU7XG59XG5cbmZ1bmN0aW9uIG9iakVxdWl2KGEsIGIsIG9wdHMpIHtcbiAgdmFyIGksIGtleTtcbiAgaWYgKGlzVW5kZWZpbmVkT3JOdWxsKGEpIHx8IGlzVW5kZWZpbmVkT3JOdWxsKGIpKVxuICAgIHJldHVybiBmYWxzZTtcbiAgLy8gYW4gaWRlbnRpY2FsICdwcm90b3R5cGUnIHByb3BlcnR5LlxuICBpZiAoYS5wcm90b3R5cGUgIT09IGIucHJvdG90eXBlKSByZXR1cm4gZmFsc2U7XG4gIC8vfn5+SSd2ZSBtYW5hZ2VkIHRvIGJyZWFrIE9iamVjdC5rZXlzIHRocm91Z2ggc2NyZXd5IGFyZ3VtZW50cyBwYXNzaW5nLlxuICAvLyAgIENvbnZlcnRpbmcgdG8gYXJyYXkgc29sdmVzIHRoZSBwcm9ibGVtLlxuICBpZiAoaXNBcmd1bWVudHMoYSkpIHtcbiAgICBpZiAoIWlzQXJndW1lbnRzKGIpKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGEgPSBwU2xpY2UuY2FsbChhKTtcbiAgICBiID0gcFNsaWNlLmNhbGwoYik7XG4gICAgcmV0dXJuIGRlZXBFcXVhbChhLCBiLCBvcHRzKTtcbiAgfVxuICBpZiAoaXNCdWZmZXIoYSkpIHtcbiAgICBpZiAoIWlzQnVmZmVyKGIpKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGlmIChhLmxlbmd0aCAhPT0gYi5sZW5ndGgpIHJldHVybiBmYWxzZTtcbiAgICBmb3IgKGkgPSAwOyBpIDwgYS5sZW5ndGg7IGkrKykge1xuICAgICAgaWYgKGFbaV0gIT09IGJbaV0pIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbiAgdHJ5IHtcbiAgICB2YXIga2EgPSBvYmplY3RLZXlzKGEpLFxuICAgICAgICBrYiA9IG9iamVjdEtleXMoYik7XG4gIH0gY2F0Y2ggKGUpIHsvL2hhcHBlbnMgd2hlbiBvbmUgaXMgYSBzdHJpbmcgbGl0ZXJhbCBhbmQgdGhlIG90aGVyIGlzbid0XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIC8vIGhhdmluZyB0aGUgc2FtZSBudW1iZXIgb2Ygb3duZWQgcHJvcGVydGllcyAoa2V5cyBpbmNvcnBvcmF0ZXNcbiAgLy8gaGFzT3duUHJvcGVydHkpXG4gIGlmIChrYS5sZW5ndGggIT0ga2IubGVuZ3RoKVxuICAgIHJldHVybiBmYWxzZTtcbiAgLy90aGUgc2FtZSBzZXQgb2Yga2V5cyAoYWx0aG91Z2ggbm90IG5lY2Vzc2FyaWx5IHRoZSBzYW1lIG9yZGVyKSxcbiAga2Euc29ydCgpO1xuICBrYi5zb3J0KCk7XG4gIC8vfn5+Y2hlYXAga2V5IHRlc3RcbiAgZm9yIChpID0ga2EubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICBpZiAoa2FbaV0gIT0ga2JbaV0pXG4gICAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgLy9lcXVpdmFsZW50IHZhbHVlcyBmb3IgZXZlcnkgY29ycmVzcG9uZGluZyBrZXksIGFuZFxuICAvL35+fnBvc3NpYmx5IGV4cGVuc2l2ZSBkZWVwIHRlc3RcbiAgZm9yIChpID0ga2EubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICBrZXkgPSBrYVtpXTtcbiAgICBpZiAoIWRlZXBFcXVhbChhW2tleV0sIGJba2V5XSwgb3B0cykpIHJldHVybiBmYWxzZTtcbiAgfVxuICByZXR1cm4gdHlwZW9mIGEgPT09IHR5cGVvZiBiO1xufVxufSk7XG5cbmNvbnN0IGFzc2VydGlvbnMgPSB7XG4gIG9rKHZhbCwgbWVzc2FnZSA9ICdzaG91bGQgYmUgdHJ1dGh5Jykge1xuICAgIGNvbnN0IGFzc2VydGlvblJlc3VsdCA9IHtcbiAgICAgIHBhc3M6IEJvb2xlYW4odmFsKSxcbiAgICAgIGV4cGVjdGVkOiAndHJ1dGh5JyxcbiAgICAgIGFjdHVhbDogdmFsLFxuICAgICAgb3BlcmF0b3I6ICdvaycsXG4gICAgICBtZXNzYWdlXG4gICAgfTtcbiAgICB0aGlzLnRlc3QuYWRkQXNzZXJ0aW9uKGFzc2VydGlvblJlc3VsdCk7XG4gICAgcmV0dXJuIGFzc2VydGlvblJlc3VsdDtcbiAgfSxcbiAgZGVlcEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UgPSAnc2hvdWxkIGJlIGVxdWl2YWxlbnQnKSB7XG4gICAgY29uc3QgYXNzZXJ0aW9uUmVzdWx0ID0ge1xuICAgICAgcGFzczogaW5kZXgkMShhY3R1YWwsIGV4cGVjdGVkKSxcbiAgICAgIGFjdHVhbCxcbiAgICAgIGV4cGVjdGVkLFxuICAgICAgbWVzc2FnZSxcbiAgICAgIG9wZXJhdG9yOiAnZGVlcEVxdWFsJ1xuICAgIH07XG4gICAgdGhpcy50ZXN0LmFkZEFzc2VydGlvbihhc3NlcnRpb25SZXN1bHQpO1xuICAgIHJldHVybiBhc3NlcnRpb25SZXN1bHQ7XG4gIH0sXG4gIGVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UgPSAnc2hvdWxkIGJlIGVxdWFsJykge1xuICAgIGNvbnN0IGFzc2VydGlvblJlc3VsdCA9IHtcbiAgICAgIHBhc3M6IGFjdHVhbCA9PT0gZXhwZWN0ZWQsXG4gICAgICBhY3R1YWwsXG4gICAgICBleHBlY3RlZCxcbiAgICAgIG1lc3NhZ2UsXG4gICAgICBvcGVyYXRvcjogJ2VxdWFsJ1xuICAgIH07XG4gICAgdGhpcy50ZXN0LmFkZEFzc2VydGlvbihhc3NlcnRpb25SZXN1bHQpO1xuICAgIHJldHVybiBhc3NlcnRpb25SZXN1bHQ7XG4gIH0sXG4gIG5vdE9rKHZhbCwgbWVzc2FnZSA9ICdzaG91bGQgbm90IGJlIHRydXRoeScpIHtcbiAgICBjb25zdCBhc3NlcnRpb25SZXN1bHQgPSB7XG4gICAgICBwYXNzOiAhQm9vbGVhbih2YWwpLFxuICAgICAgZXhwZWN0ZWQ6ICdmYWxzeScsXG4gICAgICBhY3R1YWw6IHZhbCxcbiAgICAgIG9wZXJhdG9yOiAnbm90T2snLFxuICAgICAgbWVzc2FnZVxuICAgIH07XG4gICAgdGhpcy50ZXN0LmFkZEFzc2VydGlvbihhc3NlcnRpb25SZXN1bHQpO1xuICAgIHJldHVybiBhc3NlcnRpb25SZXN1bHQ7XG4gIH0sXG4gIG5vdERlZXBFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlID0gJ3Nob3VsZCBub3QgYmUgZXF1aXZhbGVudCcpIHtcbiAgICBjb25zdCBhc3NlcnRpb25SZXN1bHQgPSB7XG4gICAgICBwYXNzOiAhaW5kZXgkMShhY3R1YWwsIGV4cGVjdGVkKSxcbiAgICAgIGFjdHVhbCxcbiAgICAgIGV4cGVjdGVkLFxuICAgICAgbWVzc2FnZSxcbiAgICAgIG9wZXJhdG9yOiAnbm90RGVlcEVxdWFsJ1xuICAgIH07XG4gICAgdGhpcy50ZXN0LmFkZEFzc2VydGlvbihhc3NlcnRpb25SZXN1bHQpO1xuICAgIHJldHVybiBhc3NlcnRpb25SZXN1bHQ7XG4gIH0sXG4gIG5vdEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UgPSAnc2hvdWxkIG5vdCBiZSBlcXVhbCcpIHtcbiAgICBjb25zdCBhc3NlcnRpb25SZXN1bHQgPSB7XG4gICAgICBwYXNzOiBhY3R1YWwgIT09IGV4cGVjdGVkLFxuICAgICAgYWN0dWFsLFxuICAgICAgZXhwZWN0ZWQsXG4gICAgICBtZXNzYWdlLFxuICAgICAgb3BlcmF0b3I6ICdub3RFcXVhbCdcbiAgICB9O1xuICAgIHRoaXMudGVzdC5hZGRBc3NlcnRpb24oYXNzZXJ0aW9uUmVzdWx0KTtcbiAgICByZXR1cm4gYXNzZXJ0aW9uUmVzdWx0O1xuICB9LFxuICB0aHJvd3MoZnVuYywgZXhwZWN0ZWQsIG1lc3NhZ2UpIHtcbiAgICBsZXQgY2F1Z2h0LCBwYXNzLCBhY3R1YWw7XG4gICAgaWYgKHR5cGVvZiBleHBlY3RlZCA9PT0gJ3N0cmluZycpIHtcbiAgICAgIFtleHBlY3RlZCwgbWVzc2FnZV0gPSBbbWVzc2FnZSwgZXhwZWN0ZWRdO1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgZnVuYygpO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjYXVnaHQgPSB7ZXJyb3J9O1xuICAgIH1cbiAgICBwYXNzID0gY2F1Z2h0ICE9PSB1bmRlZmluZWQ7XG4gICAgYWN0dWFsID0gY2F1Z2h0ICYmIGNhdWdodC5lcnJvcjtcbiAgICBpZiAoZXhwZWN0ZWQgaW5zdGFuY2VvZiBSZWdFeHApIHtcbiAgICAgIHBhc3MgPSBleHBlY3RlZC50ZXN0KGFjdHVhbCkgfHwgZXhwZWN0ZWQudGVzdChhY3R1YWwgJiYgYWN0dWFsLm1lc3NhZ2UpO1xuICAgICAgZXhwZWN0ZWQgPSBTdHJpbmcoZXhwZWN0ZWQpO1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIGV4cGVjdGVkID09PSAnZnVuY3Rpb24nICYmIGNhdWdodCkge1xuICAgICAgcGFzcyA9IGFjdHVhbCBpbnN0YW5jZW9mIGV4cGVjdGVkO1xuICAgICAgYWN0dWFsID0gYWN0dWFsLmNvbnN0cnVjdG9yO1xuICAgIH1cbiAgICBjb25zdCBhc3NlcnRpb25SZXN1bHQgPSB7XG4gICAgICBwYXNzLFxuICAgICAgZXhwZWN0ZWQsXG4gICAgICBhY3R1YWwsXG4gICAgICBvcGVyYXRvcjogJ3Rocm93cycsXG4gICAgICBtZXNzYWdlOiBtZXNzYWdlIHx8ICdzaG91bGQgdGhyb3cnXG4gICAgfTtcbiAgICB0aGlzLnRlc3QuYWRkQXNzZXJ0aW9uKGFzc2VydGlvblJlc3VsdCk7XG4gICAgcmV0dXJuIGFzc2VydGlvblJlc3VsdDtcbiAgfSxcbiAgZG9lc05vdFRocm93KGZ1bmMsIGV4cGVjdGVkLCBtZXNzYWdlKSB7XG4gICAgbGV0IGNhdWdodDtcbiAgICBpZiAodHlwZW9mIGV4cGVjdGVkID09PSAnc3RyaW5nJykge1xuICAgICAgW2V4cGVjdGVkLCBtZXNzYWdlXSA9IFttZXNzYWdlLCBleHBlY3RlZF07XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICBmdW5jKCk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNhdWdodCA9IHtlcnJvcn07XG4gICAgfVxuICAgIGNvbnN0IGFzc2VydGlvblJlc3VsdCA9IHtcbiAgICAgIHBhc3M6IGNhdWdodCA9PT0gdW5kZWZpbmVkLFxuICAgICAgZXhwZWN0ZWQ6ICdubyB0aHJvd24gZXJyb3InLFxuICAgICAgYWN0dWFsOiBjYXVnaHQgJiYgY2F1Z2h0LmVycm9yLFxuICAgICAgb3BlcmF0b3I6ICdkb2VzTm90VGhyb3cnLFxuICAgICAgbWVzc2FnZTogbWVzc2FnZSB8fCAnc2hvdWxkIG5vdCB0aHJvdydcbiAgICB9O1xuICAgIHRoaXMudGVzdC5hZGRBc3NlcnRpb24oYXNzZXJ0aW9uUmVzdWx0KTtcbiAgICByZXR1cm4gYXNzZXJ0aW9uUmVzdWx0O1xuICB9LFxuICBmYWlsKHJlYXNvbiA9ICdmYWlsIGNhbGxlZCcpIHtcbiAgICBjb25zdCBhc3NlcnRpb25SZXN1bHQgPSB7XG4gICAgICBwYXNzOiBmYWxzZSxcbiAgICAgIGFjdHVhbDogJ2ZhaWwgY2FsbGVkJyxcbiAgICAgIGV4cGVjdGVkOiAnZmFpbCBub3QgY2FsbGVkJyxcbiAgICAgIG1lc3NhZ2U6IHJlYXNvbixcbiAgICAgIG9wZXJhdG9yOiAnZmFpbCdcbiAgICB9O1xuICAgIHRoaXMudGVzdC5hZGRBc3NlcnRpb24oYXNzZXJ0aW9uUmVzdWx0KTtcbiAgICByZXR1cm4gYXNzZXJ0aW9uUmVzdWx0O1xuICB9XG59O1xuXG5mdW5jdGlvbiBhc3NlcnRpb24gKHRlc3QpIHtcbiAgcmV0dXJuIE9iamVjdC5jcmVhdGUoYXNzZXJ0aW9ucywge3Rlc3Q6IHt2YWx1ZTogdGVzdH19KTtcbn1cblxuY29uc3QgVGVzdCA9IHtcbiAgcnVuOiBmdW5jdGlvbiAoKSB7XG4gICAgY29uc3QgYXNzZXJ0ID0gYXNzZXJ0aW9uKHRoaXMpO1xuICAgIGNvbnN0IG5vdyA9IERhdGUubm93KCk7XG4gICAgcmV0dXJuIGluZGV4KHRoaXMuY29yb3V0aW5lKGFzc2VydCkpXG4gICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgIHJldHVybiB7YXNzZXJ0aW9uczogdGhpcy5hc3NlcnRpb25zLCBleGVjdXRpb25UaW1lOiBEYXRlLm5vdygpIC0gbm93fTtcbiAgICAgIH0pO1xuICB9LFxuICBhZGRBc3NlcnRpb24oKXtcbiAgICBjb25zdCBuZXdBc3NlcnRpb25zID0gWy4uLmFyZ3VtZW50c10ubWFwKGEgPT4gT2JqZWN0LmFzc2lnbih7ZGVzY3JpcHRpb246IHRoaXMuZGVzY3JpcHRpb259LCBhKSk7XG4gICAgdGhpcy5hc3NlcnRpb25zLnB1c2goLi4ubmV3QXNzZXJ0aW9ucyk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbn07XG5cbmZ1bmN0aW9uIHRlc3QgKHtkZXNjcmlwdGlvbiwgY29yb3V0aW5lLCBvbmx5ID0gZmFsc2V9KSB7XG4gIHJldHVybiBPYmplY3QuY3JlYXRlKFRlc3QsIHtcbiAgICBkZXNjcmlwdGlvbjoge3ZhbHVlOiBkZXNjcmlwdGlvbn0sXG4gICAgY29yb3V0aW5lOiB7dmFsdWU6IGNvcm91dGluZX0sXG4gICAgYXNzZXJ0aW9uczoge3ZhbHVlOiBbXX0sXG4gICAgb25seToge3ZhbHVlOiBvbmx5fSxcbiAgICBsZW5ndGg6IHtcbiAgICAgIGdldCgpe1xuICAgICAgICByZXR1cm4gdGhpcy5hc3NlcnRpb25zLmxlbmd0aFxuICAgICAgfVxuICAgIH1cbiAgfSk7XG59XG5cbmZ1bmN0aW9uIHRhcE91dCAoe3Bhc3MsIG1lc3NhZ2UsIGluZGV4fSkge1xuICBjb25zdCBzdGF0dXMgPSBwYXNzID09PSB0cnVlID8gJ29rJyA6ICdub3Qgb2snO1xuICBjb25zb2xlLmxvZyhbc3RhdHVzLCBpbmRleCwgbWVzc2FnZV0uam9pbignICcpKTtcbn1cblxuZnVuY3Rpb24gY2FuRXhpdCAoKSB7XG4gIHJldHVybiB0eXBlb2YgcHJvY2VzcyAhPT0gJ3VuZGVmaW5lZCcgJiYgdHlwZW9mIHByb2Nlc3MuZXhpdCA9PT0gJ2Z1bmN0aW9uJztcbn1cblxuZnVuY3Rpb24gdGFwICgpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uICogKCkge1xuICAgIGxldCBpbmRleCA9IDE7XG4gICAgbGV0IGxhc3RJZCA9IDA7XG4gICAgbGV0IHN1Y2Nlc3MgPSAwO1xuICAgIGxldCBmYWlsdXJlID0gMDtcblxuICAgIGNvbnN0IHN0YXJUaW1lID0gRGF0ZS5ub3coKTtcbiAgICBjb25zb2xlLmxvZygnVEFQIHZlcnNpb24gMTMnKTtcbiAgICB0cnkge1xuICAgICAgd2hpbGUgKHRydWUpIHtcbiAgICAgICAgY29uc3QgYXNzZXJ0aW9uID0geWllbGQ7XG4gICAgICAgIGlmIChhc3NlcnRpb24ucGFzcyA9PT0gdHJ1ZSkge1xuICAgICAgICAgIHN1Y2Nlc3MrKztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBmYWlsdXJlKys7XG4gICAgICAgIH1cbiAgICAgICAgYXNzZXJ0aW9uLmluZGV4ID0gaW5kZXg7XG4gICAgICAgIGlmIChhc3NlcnRpb24uaWQgIT09IGxhc3RJZCkge1xuICAgICAgICAgIGNvbnNvbGUubG9nKGAjICR7YXNzZXJ0aW9uLmRlc2NyaXB0aW9ufSAtICR7YXNzZXJ0aW9uLmV4ZWN1dGlvblRpbWV9bXNgKTtcbiAgICAgICAgICBsYXN0SWQgPSBhc3NlcnRpb24uaWQ7XG4gICAgICAgIH1cbiAgICAgICAgdGFwT3V0KGFzc2VydGlvbik7XG4gICAgICAgIGlmIChhc3NlcnRpb24ucGFzcyAhPT0gdHJ1ZSkge1xuICAgICAgICAgIGNvbnNvbGUubG9nKGAgIC0tLVxuICBvcGVyYXRvcjogJHthc3NlcnRpb24ub3BlcmF0b3J9XG4gIGV4cGVjdGVkOiAke0pTT04uc3RyaW5naWZ5KGFzc2VydGlvbi5leHBlY3RlZCl9XG4gIGFjdHVhbDogJHtKU09OLnN0cmluZ2lmeShhc3NlcnRpb24uYWN0dWFsKX1cbiAgLi4uYCk7XG4gICAgICAgIH1cbiAgICAgICAgaW5kZXgrKztcbiAgICAgIH1cbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBjb25zb2xlLmxvZygnQmFpbCBvdXQhIHVuaGFuZGxlZCBleGNlcHRpb24nKTtcbiAgICAgIGNvbnNvbGUubG9nKGUpO1xuICAgICAgaWYgKGNhbkV4aXQoKSkge1xuICAgICAgICBwcm9jZXNzLmV4aXQoMSk7XG4gICAgICB9XG4gICAgfVxuICAgIGZpbmFsbHkge1xuICAgICAgY29uc3QgZXhlY3V0aW9uID0gRGF0ZS5ub3coKSAtIHN0YXJUaW1lO1xuICAgICAgaWYgKGluZGV4ID4gMSkge1xuICAgICAgICBjb25zb2xlLmxvZyhgXG4xLi4ke2luZGV4IC0gMX1cbiMgZHVyYXRpb24gJHtleGVjdXRpb259bXNcbiMgc3VjY2VzcyAke3N1Y2Nlc3N9XG4jIGZhaWx1cmUgJHtmYWlsdXJlfWApO1xuICAgICAgfVxuICAgICAgaWYgKGZhaWx1cmUgJiYgY2FuRXhpdCgpKSB7XG4gICAgICAgIHByb2Nlc3MuZXhpdCgxKTtcbiAgICAgIH1cbiAgICB9XG4gIH07XG59XG5cbmNvbnN0IFBsYW4gPSB7XG4gIHRlc3QoZGVzY3JpcHRpb24sIGNvcm91dGluZSwgb3B0cyA9IHt9KXtcbiAgICBjb25zdCB0ZXN0SXRlbXMgPSAoIWNvcm91dGluZSAmJiBkZXNjcmlwdGlvbi50ZXN0cykgPyBbLi4uZGVzY3JpcHRpb25dIDogW3tkZXNjcmlwdGlvbiwgY29yb3V0aW5lfV07XG4gICAgdGhpcy50ZXN0cy5wdXNoKC4uLnRlc3RJdGVtcy5tYXAodD0+dGVzdChPYmplY3QuYXNzaWduKHQsIG9wdHMpKSkpO1xuICAgIHJldHVybiB0aGlzO1xuICB9LFxuXG4gIG9ubHkoZGVzY3JpcHRpb24sIGNvcm91dGluZSl7XG4gICAgcmV0dXJuIHRoaXMudGVzdChkZXNjcmlwdGlvbiwgY29yb3V0aW5lLCB7b25seTogdHJ1ZX0pO1xuICB9LFxuXG4gIHJ1bihzaW5rID0gdGFwKCkpe1xuICAgIGNvbnN0IHNpbmtJdGVyYXRvciA9IHNpbmsoKTtcbiAgICBzaW5rSXRlcmF0b3IubmV4dCgpO1xuICAgIGNvbnN0IGhhc09ubHkgPSB0aGlzLnRlc3RzLnNvbWUodD0+dC5vbmx5KTtcbiAgICBjb25zdCBydW5uYWJsZSA9IGhhc09ubHkgPyB0aGlzLnRlc3RzLmZpbHRlcih0PT50Lm9ubHkpIDogdGhpcy50ZXN0cztcbiAgICByZXR1cm4gaW5kZXgoZnVuY3Rpb24gKiAoKSB7XG4gICAgICBsZXQgaWQgPSAxO1xuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc3QgcmVzdWx0cyA9IHJ1bm5hYmxlLm1hcCh0PT50LnJ1bigpKTtcbiAgICAgICAgZm9yIChsZXQgciBvZiByZXN1bHRzKSB7XG4gICAgICAgICAgY29uc3Qge2Fzc2VydGlvbnMsIGV4ZWN1dGlvblRpbWV9ID0geWllbGQgcjtcbiAgICAgICAgICBmb3IgKGxldCBhc3NlcnQgb2YgYXNzZXJ0aW9ucykge1xuICAgICAgICAgICAgc2lua0l0ZXJhdG9yLm5leHQoT2JqZWN0LmFzc2lnbihhc3NlcnQsIHtpZCwgZXhlY3V0aW9uVGltZX0pKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWQrKztcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgY2F0Y2ggKGUpIHtcbiAgICAgICAgc2lua0l0ZXJhdG9yLnRocm93KGUpO1xuICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgc2lua0l0ZXJhdG9yLnJldHVybigpO1xuICAgICAgfVxuICAgIH0uYmluZCh0aGlzKSlcbiAgfSxcblxuICAqIFtTeW1ib2wuaXRlcmF0b3JdKCl7XG4gICAgZm9yIChsZXQgdCBvZiB0aGlzLnRlc3RzKSB7XG4gICAgICB5aWVsZCB0O1xuICAgIH1cbiAgfVxufTtcblxuZnVuY3Rpb24gcGxhbiAoKSB7XG4gIHJldHVybiBPYmplY3QuY3JlYXRlKFBsYW4sIHtcbiAgICB0ZXN0czoge3ZhbHVlOiBbXX0sXG4gICAgbGVuZ3RoOiB7XG4gICAgICBnZXQoKXtcbiAgICAgICAgcmV0dXJuIHRoaXMudGVzdHMubGVuZ3RoXG4gICAgICB9XG4gICAgfVxuICB9KTtcbn1cblxuZXhwb3J0IGRlZmF1bHQgcGxhbjtcbiIsImV4cG9ydCBjb25zdCBmaW5kQ29udGFpbmVyID0gKGVsZW1lbnQsIHNlbGVjdG9yKSA9PiBlbGVtZW50Lm1hdGNoZXMoc2VsZWN0b3IpID09PSB0cnVlID8gZWxlbWVudCA6IGZpbmRDb250YWluZXIoZWxlbWVudC5wYXJlbnRFbGVtZW50LCBzZWxlY3Rvcik7XG5leHBvcnQgY29uc3QgZGF0YVNlbGVjdG9yQXR0cmlidXRlID0gJ2RhdGEta2V5Ym9hcmQtc2VsZWN0b3InO1xuZXhwb3J0IGNvbnN0IGRhdGFTa2lwQXR0cmlidXRlID0gJ2RhdGEta2V5Ym9hcmQtc2tpcCc7XG5leHBvcnQgY29uc3QgdmFsRnVuYyA9IHZhbCA9PiAoKSA9PiB2YWw7XG5leHBvcnQgY29uc3QgdmFsTnVsbCA9IHZhbEZ1bmMobnVsbCk7IiwiaW1wb3J0IHtcbiAgZmluZENvbnRhaW5lcixcbiAgZGF0YVNlbGVjdG9yQXR0cmlidXRlLFxuICBkYXRhU2tpcEF0dHJpYnV0ZSxcbiAgdmFsRnVuY1xufSBmcm9tICcuL3V0aWwnO1xuXG5leHBvcnQgZnVuY3Rpb24gcmVndWxhckNlbGwgKGVsZW1lbnQsIHtyb3dTZWxlY3RvciwgY2VsbFNlbGVjdG9yfSkge1xuICBjb25zdCByb3cgPSBmaW5kQ29udGFpbmVyKGVsZW1lbnQsIHJvd1NlbGVjdG9yKTtcbiAgY29uc3QgY2VsbHMgPSBbLi4ucm93LnF1ZXJ5U2VsZWN0b3JBbGwoY2VsbFNlbGVjdG9yKV07XG4gIGNvbnN0IGluZGV4ID0gY2VsbHMuaW5kZXhPZihlbGVtZW50KTtcbiAgY29uc3QgcmV0dXJuRWwgPSB2YWxGdW5jKGVsZW1lbnQpO1xuICByZXR1cm4ge1xuICAgIHNlbGVjdEZyb21BZnRlcjogcmV0dXJuRWwsXG4gICAgc2VsZWN0RnJvbUJlZm9yZTogcmV0dXJuRWwsXG4gICAgbmV4dCgpe1xuICAgICAgcmV0dXJuIGNlbGxzW2luZGV4ICsgMV0gIT09IHZvaWQgMCA/IGNlbGxzW2luZGV4ICsgMV0gOiBudWxsO1xuICAgIH0sXG4gICAgcHJldmlvdXMoKXtcbiAgICAgIHJldHVybiBjZWxsc1tpbmRleCAtIDFdICE9PSB2b2lkIDAgPyBjZWxsc1tpbmRleCAtIDFdIDogbnVsbDtcbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNraXBDZWxsIChlbGVtZW50LCBvcHRpb25zKSB7XG4gIGNvbnN0IHJlZyA9IHJlZ3VsYXJDZWxsKGVsZW1lbnQsIG9wdGlvbnMpO1xuICByZXR1cm4ge1xuICAgIHByZXZpb3VzOiByZWcucHJldmlvdXMsXG4gICAgbmV4dDogcmVnLm5leHRcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gY29tcG9zaXRlQ2VsbCAoZWxlbWVudCwgb3B0aW9ucykge1xuICBjb25zdCBjZWxsRWxlbWVudCA9IGZpbmRDb250YWluZXIoZWxlbWVudCwgb3B0aW9ucy5jZWxsU2VsZWN0b3IpO1xuICBjb25zdCBzZWxlY3RvciA9IGNlbGxFbGVtZW50LmdldEF0dHJpYnV0ZShkYXRhU2VsZWN0b3JBdHRyaWJ1dGUpO1xuICBjb25zdCBzdWJXaWRnZXRzID0gWy4uLmNlbGxFbGVtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoc2VsZWN0b3IpXTtcbiAgY29uc3Qgd2lkZ2V0c0xlbmd0aCA9IHN1YldpZGdldHMubGVuZ3RoO1xuICBjb25zdCBpc1N1YldpZGdldCA9IGVsZW1lbnQgIT09IGNlbGxFbGVtZW50O1xuICByZXR1cm4ge1xuICAgIHNlbGVjdEZyb21CZWZvcmUoKXtcbiAgICAgIHJldHVybiBpc1N1YldpZGdldCA/IGVsZW1lbnQgOiBzdWJXaWRnZXRzWzBdO1xuICAgIH0sXG4gICAgc2VsZWN0RnJvbUFmdGVyKCl7XG4gICAgICByZXR1cm4gaXNTdWJXaWRnZXQgPyBlbGVtZW50IDogc3ViV2lkZ2V0c1t3aWRnZXRzTGVuZ3RoIC0gMV07XG4gICAgfSxcbiAgICBuZXh0KCl7XG4gICAgICBjb25zdCBpbmRleCA9IHN1YldpZGdldHMuaW5kZXhPZihlbGVtZW50KTtcbiAgICAgIGlmIChpc1N1YldpZGdldCAmJiBpbmRleCArIDEgPCB3aWRnZXRzTGVuZ3RoKSB7XG4gICAgICAgIHJldHVybiBzdWJXaWRnZXRzW2luZGV4ICsgMV07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gcmVndWxhckNlbGwoY2VsbEVsZW1lbnQsIG9wdGlvbnMpLm5leHQoKTtcbiAgICAgIH1cbiAgICB9LFxuICAgIHByZXZpb3VzKCl7XG4gICAgICBjb25zdCBpbmRleCA9IHN1YldpZGdldHMuaW5kZXhPZihlbGVtZW50KTtcbiAgICAgIGlmIChpc1N1YldpZGdldCAmJiBpbmRleCA+IDApIHtcbiAgICAgICAgcmV0dXJuIHN1YldpZGdldHNbaW5kZXggLSAxXTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiByZWd1bGFyQ2VsbChjZWxsRWxlbWVudCwgb3B0aW9ucykucHJldmlvdXMoKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUNlbGwgKGVsLCBvcHRpb25zKSB7XG4gIGlmIChlbCA9PT0gbnVsbCkge1xuICAgIHJldHVybiBudWxsO1xuICB9IGVsc2UgaWYgKGVsLmhhc0F0dHJpYnV0ZShkYXRhU2tpcEF0dHJpYnV0ZSkpIHtcbiAgICByZXR1cm4gc2tpcENlbGwoZWwsIG9wdGlvbnMpO1xuICB9IGVsc2UgaWYgKGVsLmhhc0F0dHJpYnV0ZShkYXRhU2VsZWN0b3JBdHRyaWJ1dGUpIHx8ICFlbC5tYXRjaGVzKG9wdGlvbnMuY2VsbFNlbGVjdG9yKSkge1xuICAgIHJldHVybiBjb21wb3NpdGVDZWxsKGVsLCBvcHRpb25zKTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gcmVndWxhckNlbGwoZWwsIG9wdGlvbnMpO1xuICB9XG59IiwiaW1wb3J0IHtmaW5kQ29udGFpbmVyLCBkYXRhU2tpcEF0dHJpYnV0ZX0gZnJvbSAnLi91dGlsJztcblxuZXhwb3J0IGZ1bmN0aW9uIHJlZ3VsYXJSb3cgKGVsZW1lbnQsIGdyaWQsIHtyb3dTZWxlY3RvciA9ICd0cicsIGNlbGxTZWxlY3RvciA9ICd0aCx0ZCd9PXt9KSB7XG4gIGNvbnN0IHJvd3MgPSBbLi4uZ3JpZC5xdWVyeVNlbGVjdG9yQWxsKHJvd1NlbGVjdG9yKV07XG4gIGNvbnN0IGNlbGxzID0gWy4uLmVsZW1lbnQucXVlcnlTZWxlY3RvckFsbChjZWxsU2VsZWN0b3IpXTtcbiAgY29uc3QgaW5kZXggPSByb3dzLmluZGV4T2YoZWxlbWVudCk7XG4gIHJldHVybiB7XG4gICAgcHJldmlvdXMoKXtcbiAgICAgIHJldHVybiByb3dzW2luZGV4IC0gMV0gIT09IHZvaWQgMCA/IHJvd3NbaW5kZXggLSAxXSA6IG51bGw7XG4gICAgfSxcbiAgICBuZXh0KCl7XG4gICAgICByZXR1cm4gcm93c1tpbmRleCArIDFdICE9PSB2b2lkIDAgPyByb3dzW2luZGV4ICsgMV0gOiBudWxsO1xuICAgIH0sXG4gICAgaXRlbShpbmRleCl7XG4gICAgICByZXR1cm4gY2VsbHNbaW5kZXhdICE9PSB2b2lkIDAgPyBjZWxsc1tpbmRleF0gOiBudWxsO1xuICAgIH1cbiAgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNraXBSb3cgKGVsZW1lbnQsIGdyaWQsIG9wdGlvbnMpIHtcbiAgY29uc3QgcmVndWxhciA9IHJlZ3VsYXJSb3coZWxlbWVudCwgZ3JpZCwgb3B0aW9ucyk7XG4gIHJldHVybiB7XG4gICAgcHJldmlvdXM6IHJlZ3VsYXIucHJldmlvdXMsXG4gICAgbmV4dDogcmVndWxhci5uZXh0XG4gIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVSb3cgKHRhcmdldCwgZ3JpZCwge3Jvd1NlbGVjdG9yLCBjZWxsU2VsZWN0b3J9PXt9KSB7XG4gIGlmICh0YXJnZXQgPT09IG51bGwpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuICBjb25zdCByID0gZmluZENvbnRhaW5lcih0YXJnZXQsIHJvd1NlbGVjdG9yKTtcbiAgcmV0dXJuIHIuaGFzQXR0cmlidXRlKGRhdGFTa2lwQXR0cmlidXRlKSA/IHNraXBSb3cociwgZ3JpZCwge1xuICAgICAgcm93U2VsZWN0b3IsXG4gICAgICBjZWxsU2VsZWN0b3JcbiAgICB9KSA6IHJlZ3VsYXJSb3codGFyZ2V0LCBncmlkLCB7cm93U2VsZWN0b3IsIGNlbGxTZWxlY3Rvcn0pO1xufSIsImltcG9ydCB7Y3JlYXRlQ2VsbH0gZnJvbSAnLi9jZWxsJztcbmltcG9ydCB7Y3JlYXRlUm93fSBmcm9tICcuL3Jvdyc7XG5pbXBvcnQge2ZpbmRDb250YWluZXJ9IGZyb20gJy4vdXRpbCc7XG5cbmV4cG9ydCBmdW5jdGlvbiBrZXlHcmlkIChncmlkLCBvcHRpb25zKSB7XG4gIGNvbnN0IHtyb3dTZWxlY3RvciwgY2VsbFNlbGVjdG9yfSA9IG9wdGlvbnM7XG4gIHJldHVybiB7XG4gICAgbW92ZVJpZ2h0KHRhcmdldCl7XG4gICAgICBjb25zdCBjZWxsID0gY3JlYXRlQ2VsbCh0YXJnZXQsIG9wdGlvbnMpO1xuICAgICAgbGV0IG5ld0NlbGwgPSBjcmVhdGVDZWxsKGNlbGwubmV4dCgpLCBvcHRpb25zKTtcbiAgICAgIHdoaWxlIChuZXdDZWxsICE9PSBudWxsICYmIG5ld0NlbGwuc2VsZWN0RnJvbUJlZm9yZSA9PT0gdm9pZCAwKSB7XG4gICAgICAgIG5ld0NlbGwgPSBjcmVhdGVDZWxsKG5ld0NlbGwubmV4dCgpLCBvcHRpb25zKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBuZXdDZWxsICE9PSBudWxsID8gbmV3Q2VsbC5zZWxlY3RGcm9tQmVmb3JlKCkgOiB0YXJnZXQ7XG4gICAgfSxcbiAgICBtb3ZlTGVmdCh0YXJnZXQpe1xuICAgICAgY29uc3QgY2VsbCA9IGNyZWF0ZUNlbGwodGFyZ2V0LCBvcHRpb25zKTtcbiAgICAgIGxldCBuZXdDZWxsID0gY3JlYXRlQ2VsbChjZWxsLnByZXZpb3VzKCksIG9wdGlvbnMpO1xuICAgICAgd2hpbGUgKG5ld0NlbGwgIT09IG51bGwgJiYgbmV3Q2VsbC5zZWxlY3RGcm9tQWZ0ZXIgPT09IHZvaWQgMCkge1xuICAgICAgICBuZXdDZWxsID0gY3JlYXRlQ2VsbChuZXdDZWxsLnByZXZpb3VzKCksIG9wdGlvbnMpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIG5ld0NlbGwgIT09IG51bGwgPyBuZXdDZWxsLnNlbGVjdEZyb21BZnRlcigpIDogdGFyZ2V0O1xuICAgIH0sXG4gICAgbW92ZVVwKHRhcmdldCl7XG4gICAgICBjb25zdCByb3dFbGVtZW50ID0gZmluZENvbnRhaW5lcih0YXJnZXQsIHJvd1NlbGVjdG9yKTtcbiAgICAgIGNvbnN0IGNlbGxzID0gWy4uLnJvd0VsZW1lbnQucXVlcnlTZWxlY3RvckFsbChjZWxsU2VsZWN0b3IpXTtcbiAgICAgIGNvbnN0IHJvdyA9IGNyZWF0ZVJvdyhyb3dFbGVtZW50LCBncmlkLCBvcHRpb25zKTtcbiAgICAgIGxldCBuZXdSb3cgPSBjcmVhdGVSb3cocm93LnByZXZpb3VzKCksIGdyaWQsIG9wdGlvbnMpO1xuICAgICAgd2hpbGUgKG5ld1JvdyAhPT0gbnVsbCAmJiBuZXdSb3cuaXRlbSA9PT0gdm9pZCAwKSB7XG4gICAgICAgIG5ld1JvdyA9IGNyZWF0ZVJvdyhuZXdSb3cucHJldmlvdXMoKSwgZ3JpZCwgb3B0aW9ucyk7XG4gICAgICB9XG5cbiAgICAgIGlmIChuZXdSb3cgPT09IG51bGwpIHtcbiAgICAgICAgcmV0dXJuIHRhcmdldDtcbiAgICAgIH1cblxuICAgICAgbGV0IGFza2VkSW5kZXggPSBjZWxscy5pbmRleE9mKGZpbmRDb250YWluZXIodGFyZ2V0LCBjZWxsU2VsZWN0b3IpKTtcbiAgICAgIGxldCBuZXdDZWxsID0gY3JlYXRlQ2VsbChuZXdSb3cuaXRlbShhc2tlZEluZGV4KSwgb3B0aW9ucyk7XG4gICAgICB3aGlsZSAobmV3Q2VsbCA9PT0gbnVsbCB8fCBuZXdDZWxsLnNlbGVjdEZyb21CZWZvcmUgPT09IHZvaWQgMCAmJiBhc2tlZEluZGV4ID4gMCkge1xuICAgICAgICBhc2tlZEluZGV4LS07XG4gICAgICAgIG5ld0NlbGwgPSBjcmVhdGVDZWxsKG5ld1Jvdy5pdGVtKGFza2VkSW5kZXgpLCBvcHRpb25zKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBuZXdDZWxsLnNlbGVjdEZyb21CZWZvcmUoKTtcbiAgICB9LFxuICAgIG1vdmVEb3duKHRhcmdldCl7XG4gICAgICBjb25zdCByb3dFbGVtZW50ID0gZmluZENvbnRhaW5lcih0YXJnZXQsIHJvd1NlbGVjdG9yKTtcbiAgICAgIGNvbnN0IGNlbGxzID0gWy4uLnJvd0VsZW1lbnQucXVlcnlTZWxlY3RvckFsbChjZWxsU2VsZWN0b3IpXTtcbiAgICAgIGNvbnN0IHJvdyA9IGNyZWF0ZVJvdyhyb3dFbGVtZW50LCBncmlkLCBvcHRpb25zKTtcbiAgICAgIGxldCBuZXdSb3cgPSBjcmVhdGVSb3cocm93Lm5leHQoKSwgZ3JpZCwgb3B0aW9ucyk7XG4gICAgICB3aGlsZSAobmV3Um93ICE9PSBudWxsICYmIG5ld1Jvdy5pdGVtID09PSB2b2lkIDApIHtcbiAgICAgICAgbmV3Um93ID0gY3JlYXRlUm93KG5ld1Jvdy5uZXh0KCksIGdyaWQsIG9wdGlvbnMpO1xuICAgICAgfVxuXG4gICAgICBpZiAobmV3Um93ID09PSBudWxsKSB7XG4gICAgICAgIHJldHVybiB0YXJnZXQ7XG4gICAgICB9XG5cbiAgICAgIGxldCBhc2tlZEluZGV4ID0gY2VsbHMuaW5kZXhPZihmaW5kQ29udGFpbmVyKHRhcmdldCwgY2VsbFNlbGVjdG9yKSk7XG4gICAgICBsZXQgbmV3Q2VsbCA9IGNyZWF0ZUNlbGwobmV3Um93Lml0ZW0oYXNrZWRJbmRleCksIG9wdGlvbnMpO1xuICAgICAgd2hpbGUgKG5ld0NlbGwgPT09IG51bGwgfHwgbmV3Q2VsbC5zZWxlY3RGcm9tQmVmb3JlID09PSB2b2lkIDAgJiYgYXNrZWRJbmRleCA+IDApIHtcbiAgICAgICAgYXNrZWRJbmRleC0tO1xuICAgICAgICBuZXdDZWxsID0gY3JlYXRlQ2VsbChuZXdSb3cuaXRlbShhc2tlZEluZGV4KSwgb3B0aW9ucyk7XG4gICAgICB9XG4gICAgICByZXR1cm4gbmV3Q2VsbC5zZWxlY3RGcm9tQmVmb3JlKCk7XG4gICAgfVxuICB9XG59IiwiaW1wb3J0IHpvcmEgZnJvbSAnem9yYSc7XG5pbXBvcnQge2tleUdyaWR9IGZyb20gJy4uL2xpYi9rZXlncmlkJztcblxuZXhwb3J0IGRlZmF1bHQgem9yYSgpXG4gIC50ZXN0KCdtb3ZlIHRvIHRoZSBuZXh0IGNlbGwgb24gdGhlIHJpZ2h0JywgZnVuY3Rpb24gKiAodCkge1xuICAgIGNvbnN0IHRhYmxlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnVEFCTEUnKTtcbiAgICB0YWJsZS5pbm5lckhUTUwgPSBgPHRyPlxuPHRkIGlkPVwiMVwiPmZvbzwvdGQ+XG48dGQgaWQ9XCIyXCI+YmFyPC90ZD5cbjx0ZCBpZD1cIjNcIj53b290PC90ZD5cbjwvdHI+YDtcbiAgICBjb25zdCBrZyA9IGtleUdyaWQodGFibGUsIHtjZWxsU2VsZWN0b3I6ICd0ZCcsIHJvd1NlbGVjdG9yOiAndHInfSk7XG5cbiAgICBjb25zdCBtb3ZlZCA9IGtnLm1vdmVSaWdodCh0YWJsZS5xdWVyeVNlbGVjdG9yKCdbaWQ9XCIxXCJdJykpO1xuICAgIHQuZXF1YWwobW92ZWQuaWQsICcyJyk7XG4gIH0pXG4gIC50ZXN0KCd0YWJsZSAoZGF0YSBjZWxsKTogZG8gbjB0IG1vdmUgaWYgYWxyZWFkeSBhdCB0aGUgZW5kIG9mIHRoZSByb3cnLCBmdW5jdGlvbiAqICh0KSB7XG4gICAgY29uc3QgdGFibGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdUQUJMRScpO1xuICAgIHRhYmxlLmlubmVySFRNTCA9IGA8dHI+XG48dGQgaWQ9XCIxXCI+Zm9vPC90ZD5cbjx0ZCBpZD1cIjJcIj5iYXI8L3RkPlxuPHRkIGlkPVwiM1wiPndvb3Q8L3RkPlxuPC90cj5gO1xuICAgIGNvbnN0IGtnID0ga2V5R3JpZCh0YWJsZSwge2NlbGxTZWxlY3RvcjogJ3RkJywgcm93U2VsZWN0b3I6ICd0cid9KTtcbiAgICBjb25zdCBtb3ZlZCA9IGtnLm1vdmVSaWdodCh0YWJsZS5xdWVyeVNlbGVjdG9yKCdbaWQ9XCIzXCJdJykpO1xuICAgIHQuZXF1YWwobW92ZWQuaWQsICczJyk7XG4gIH0pXG4gIC50ZXN0KCdza2lwIGEgY2VsbCB3aXRoIHRoZSBkYXRhLWtlYWJvYXJkLXNraXAgZmxhZyBzZXQgdG8gdHJ1ZScsIGZ1bmN0aW9uICogKHQpIHtcbiAgICBjb25zdCB0YWJsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ1RBQkxFJyk7XG4gICAgdGFibGUuaW5uZXJIVE1MID0gYDx0cj5cbjx0ZCBpZD1cIjFcIj5mb288L3RkPlxuPHRkIGRhdGEta2V5Ym9hcmQtc2tpcD1cInRydWVcIiBpZD1cIjJcIj5iYXI8L3RkPlxuPHRkIGlkPVwiM1wiPndvb3Q8L3RkPlxuPC90cj5gO1xuICAgIGNvbnN0IGtnID0ga2V5R3JpZCh0YWJsZSwge2NlbGxTZWxlY3RvcjogJ3RkJywgcm93U2VsZWN0b3I6ICd0cid9KTtcbiAgICBjb25zdCBtb3ZlZCA9IGtnLm1vdmVSaWdodCh0YWJsZS5xdWVyeVNlbGVjdG9yKCdbaWQ9XCIxXCJdJykpO1xuICAgIHQuZXF1YWwobW92ZWQuaWQsICczJyk7XG4gIH0pXG4gIC50ZXN0KCdkbyBub3QgbW92ZSBpZiBsYXN0IGNlbGwgaGFzIHRvIGJlIHNraXBwZWQnLCBmdW5jdGlvbiAqICh0KSB7XG4gICAgY29uc3QgdGFibGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdUQUJMRScpO1xuICAgIHRhYmxlLmlubmVySFRNTCA9IGA8dHI+XG48dGQgaWQ9XCIxXCI+Zm9vPC90ZD5cbjx0ZCBpZD1cIjJcIj5iYXI8L3RkPlxuPHRkIGRhdGEta2V5Ym9hcmQtc2tpcD1cInRydWVcIiBpZD1cIjNcIj53b290PC90ZD5cbjwvdHI+YDtcbiAgICBjb25zdCBrZyA9IGtleUdyaWQodGFibGUsIHtjZWxsU2VsZWN0b3I6ICd0ZCcsIHJvd1NlbGVjdG9yOiAndHInfSk7XG4gICAgY29uc3QgbW92ZWQgPSBrZy5tb3ZlUmlnaHQodGFibGUucXVlcnlTZWxlY3RvcignW2lkPVwiMlwiXScpKTtcbiAgICB0LmVxdWFsKG1vdmVkLmlkLCAnMicpO1xuICB9KVxuICAudGVzdCgnbW92ZSBpbnNpZGUgYSBzdWIgdmlydHVhbCBjZWxsIGlmIHNwZWNpZmllZCcsIGZ1bmN0aW9uICogKHQpIHtcbiAgICBjb25zdCB0YWJsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ1RBQkxFJyk7XG4gICAgdGFibGUuaW5uZXJIVE1MID0gYDx0cj5cbjx0ZCBpZD1cIjFcIj5mb288L3RkPlxuPHRkIGRhdGEta2V5Ym9hcmQtc2VsZWN0b3I9XCJidXR0b25cIiBpZD1cIjJcIj48YnV0dG9uIGlkPVwiYnV0dG9uLWJhclwiPmJhcjwvYnV0dG9uPjxidXR0b24gaWQ9XCJidXR0b24tYmltXCI+YmltPC9idXR0b24+PC90ZD5cbjx0ZCBpZD1cIjNcIj53b290PC90ZD5cbjwvdHI+YDtcbiAgICBjb25zdCBrZyA9IGtleUdyaWQodGFibGUsIHtjZWxsU2VsZWN0b3I6ICd0ZCcsIHJvd1NlbGVjdG9yOiAndHInfSk7XG4gICAgY29uc3QgbW92ZWQgPSBrZy5tb3ZlUmlnaHQodGFibGUucXVlcnlTZWxlY3RvcignYnV0dG9uI2J1dHRvbi1iYXInKSk7XG4gICAgdC5lcXVhbChtb3ZlZC5pZCwgJ2J1dHRvbi1iaW0nKTtcbiAgfSlcbiAgLnRlc3QoJ21vdmUgdG8gZmlyc3Qgc3ViIHdpZGdldCB3aGVuIGVudGVyaW5nIGEgY2VsbCcsIGZ1bmN0aW9uICogKHQpIHtcbiAgICBjb25zdCB0YWJsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ1RBQkxFJyk7XG4gICAgdGFibGUuaW5uZXJIVE1MID0gYDx0cj5cbjx0ZCBpZD1cIjFcIj5mb288L3RkPlxuPHRkIGRhdGEta2V5Ym9hcmQtc2VsZWN0b3I9XCJidXR0b25cIiBpZD1cIjJcIj48YnV0dG9uIGlkPVwiYnV0dG9uLWJhclwiPmJhcjwvYnV0dG9uPjxidXR0b24gaWQ9XCJidXR0b24tYmltXCI+YmltPC9idXR0b24+PC90ZD5cbjx0ZCBpZD1cIjNcIj53b290PC90ZD5cbjwvdHI+YDtcbiAgICBjb25zdCBrZyA9IGtleUdyaWQodGFibGUsIHtjZWxsU2VsZWN0b3I6ICd0ZCcsIHJvd1NlbGVjdG9yOiAndHInfSk7XG4gICAgY29uc3QgbW92ZWQgPSBrZy5tb3ZlUmlnaHQodGFibGUucXVlcnlTZWxlY3RvcignW2lkPVwiMVwiXScpKTtcbiAgICB0LmVxdWFsKG1vdmVkLmlkLCAnYnV0dG9uLWJhcicpO1xuICB9KVxuICAudGVzdCgnbW92ZSBvdXQgb2YgdmlydHVhbCBjZWxsIGlmIGxhc3QgaXRlbSBpcyByZWFjaGVkJywgZnVuY3Rpb24gKiAodCkge1xuICAgIGNvbnN0IHRhYmxlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnVEFCTEUnKTtcbiAgICB0YWJsZS5pbm5lckhUTUwgPSBgPHRyPlxuPHRkIGlkPVwiMVwiPmZvbzwvdGQ+XG48dGQgZGF0YS1rZXlib2FyZC1zZWxlY3Rvcj1cImJ1dHRvblwiIGlkPVwiMlwiPjxidXR0b24gaWQ9XCJidXR0b24tYmFyXCI+YmFyPC9idXR0b24+PGJ1dHRvbiBpZD1cImJ1dHRvbi1iaW1cIj5iaW08L2J1dHRvbj48L3RkPlxuPHRkIGlkPVwiM1wiPndvb3Q8L3RkPlxuPC90cj5gO1xuICAgIGNvbnN0IGtnID0ga2V5R3JpZCh0YWJsZSwge2NlbGxTZWxlY3RvcjogJ3RkJywgcm93U2VsZWN0b3I6ICd0cid9KTtcbiAgICBjb25zdCBtb3ZlZCA9IGtnLm1vdmVSaWdodCh0YWJsZS5xdWVyeVNlbGVjdG9yKCdidXR0b24jYnV0dG9uLWJpbScpKTtcbiAgICB0LmVxdWFsKG1vdmVkLmlkLCAnMycpO1xuICB9KSIsImltcG9ydCB6b3JhIGZyb20gJ3pvcmEnO1xuaW1wb3J0IHtrZXlHcmlkfSBmcm9tICcuLi9saWIva2V5Z3JpZCc7XG5cbmV4cG9ydCBkZWZhdWx0IHpvcmEoKVxuICAudGVzdCgnbW92ZSB0byB0aGUgcHJldmlvdXMgY2VsbCBvbiB0aGUgbGVmdCcsIGZ1bmN0aW9uICogKHQpIHtcbiAgICBjb25zdCB0YWJsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ1RBQkxFJyk7XG4gICAgdGFibGUuaW5uZXJIVE1MID0gYDx0cj5cbjx0ZCBpZD1cIjFcIj5mb288L3RkPlxuPHRkIGlkPVwiMlwiPmJhcjwvdGQ+XG48dGQgaWQ9XCIzXCI+d29vdDwvdGQ+XG48L3RyPmA7XG4gICAgY29uc3Qga2cgPSBrZXlHcmlkKHRhYmxlLCB7Y2VsbFNlbGVjdG9yOiAndGQnLCByb3dTZWxlY3RvcjogJ3RyJ30pO1xuXG4gICAgY29uc3QgbW92ZWQgPSBrZy5tb3ZlTGVmdCh0YWJsZS5xdWVyeVNlbGVjdG9yKCdbaWQ9XCIyXCJdJykpO1xuICAgIHQuZXF1YWwobW92ZWQuaWQsICcxJyk7XG4gIH0pXG4gIC50ZXN0KCd0YWJsZSAoZGF0YSBjZWxsKTogZG8gbm90IG1vdmUgaWYgYWxyZWFkeSBhdCB0aGUgYmVnaW5uaW5nIG9mIHRoZSByb3cnLCBmdW5jdGlvbiAqICh0KSB7XG4gICAgY29uc3QgdGFibGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdUQUJMRScpO1xuICAgIHRhYmxlLmlubmVySFRNTCA9IGA8dHI+XG48dGQgaWQ9XCIxXCI+Zm9vPC90ZD5cbjx0ZCBpZD1cIjJcIj5iYXI8L3RkPlxuPHRkIGlkPVwiM1wiPndvb3Q8L3RkPlxuPC90cj5gO1xuICAgIGNvbnN0IGtnID0ga2V5R3JpZCh0YWJsZSwge2NlbGxTZWxlY3RvcjogJ3RkJywgcm93U2VsZWN0b3I6ICd0cid9KTtcbiAgICBjb25zdCBtb3ZlZCA9IGtnLm1vdmVMZWZ0KHRhYmxlLnF1ZXJ5U2VsZWN0b3IoJ1tpZD1cIjFcIl0nKSk7XG4gICAgdC5lcXVhbChtb3ZlZC5pZCwgJzEnKTtcbiAgfSlcbiAgLnRlc3QoJ3NraXAgYSBjZWxsIHdpdGggdGhlIGRhdGEta2V5Ym9hcmQtc2tpcCBmbGFnIHNldCB0byB0cnVlJywgZnVuY3Rpb24gKiAodCkge1xuICAgIGNvbnN0IHRhYmxlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnVEFCTEUnKTtcbiAgICB0YWJsZS5pbm5lckhUTUwgPSBgPHRyPlxuPHRkIGlkPVwiMVwiPmZvbzwvdGQ+XG48dGQgZGF0YS1rZXlib2FyZC1za2lwPVwidHJ1ZVwiIGlkPVwiMlwiPmJhcjwvdGQ+XG48dGQgaWQ9XCIzXCI+d29vdDwvdGQ+XG48L3RyPmA7XG4gICAgY29uc3Qga2cgPSBrZXlHcmlkKHRhYmxlLCB7Y2VsbFNlbGVjdG9yOiAndGQnLCByb3dTZWxlY3RvcjogJ3RyJ30pO1xuICAgIGNvbnN0IG1vdmVkID0ga2cubW92ZUxlZnQodGFibGUucXVlcnlTZWxlY3RvcignW2lkPVwiM1wiXScpKTtcbiAgICB0LmVxdWFsKG1vdmVkLmlkLCAnMScpO1xuICB9KVxuICAudGVzdCgnZG8gbm90IG1vdmUgaWYgbGFzdCBjZWxsIGhhcyB0byBiZSBza2lwcGVkJywgZnVuY3Rpb24gKiAodCkge1xuICAgIGNvbnN0IHRhYmxlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnVEFCTEUnKTtcbiAgICB0YWJsZS5pbm5lckhUTUwgPSBgPHRyPlxuPHRkIGRhdGEta2V5Ym9hcmQtc2tpcD1cInRydWVcIiBpZD1cIjFcIj5mb288L3RkPlxuPHRkIGlkPVwiMlwiPmJhcjwvdGQ+XG48dGQgaWQ9XCIzXCI+d29vdDwvdGQ+XG48L3RyPmA7XG4gICAgY29uc3Qga2cgPSBrZXlHcmlkKHRhYmxlLCB7Y2VsbFNlbGVjdG9yOiAndGQnLCByb3dTZWxlY3RvcjogJ3RyJ30pO1xuICAgIGNvbnN0IG1vdmVkID0ga2cubW92ZUxlZnQodGFibGUucXVlcnlTZWxlY3RvcignW2lkPVwiMlwiXScpKTtcbiAgICB0LmVxdWFsKG1vdmVkLmlkLCAnMicpO1xuICB9KVxuICAudGVzdCgnbW92ZSBpbnNpZGUgYSBzdWIgdmlydHVhbCBjZWxsIGlmIHNwZWNpZmllZCcsIGZ1bmN0aW9uICogKHQpIHtcbiAgICBjb25zdCB0YWJsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ1RBQkxFJyk7XG4gICAgdGFibGUuaW5uZXJIVE1MID0gYDx0cj5cbjx0ZCBpZD1cIjFcIj5mb288L3RkPlxuPHRkIGRhdGEta2V5Ym9hcmQtc2VsZWN0b3I9XCJidXR0b25cIiBpZD1cIjJcIj48YnV0dG9uIGlkPVwiYnV0dG9uLWJhclwiPmJhcjwvYnV0dG9uPjxidXR0b24gaWQ9XCJidXR0b24tYmltXCI+YmltPC9idXR0b24+PC90ZD5cbjx0ZCBpZD1cIjNcIj53b290PC90ZD5cbjwvdHI+YDtcbiAgICBjb25zdCBrZyA9IGtleUdyaWQodGFibGUsIHtjZWxsU2VsZWN0b3I6ICd0ZCcsIHJvd1NlbGVjdG9yOiAndHInfSk7XG4gICAgY29uc3QgbW92ZWQgPSBrZy5tb3ZlTGVmdCh0YWJsZS5xdWVyeVNlbGVjdG9yKCdidXR0b24jYnV0dG9uLWJpbScpKTtcbiAgICB0LmVxdWFsKG1vdmVkLmlkLCAnYnV0dG9uLWJhcicpO1xuICB9KVxuICAudGVzdCgnc2VsZWN0IGxhc3Qgc3ViIHdpZGdldCB3aGVuIGVudGVyaW5nIGEgY2VsbCBieSB0aGUgcmlnaHQnLCBmdW5jdGlvbiAqICh0KSB7XG4gICAgY29uc3QgdGFibGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdUQUJMRScpO1xuICAgIHRhYmxlLmlubmVySFRNTCA9IGA8dHI+XG48dGQgaWQ9XCIxXCI+Zm9vPC90ZD5cbjx0ZCBkYXRhLWtleWJvYXJkLXNlbGVjdG9yPVwiYnV0dG9uXCIgaWQ9XCIyXCI+PGJ1dHRvbiBpZD1cImJ1dHRvbi1iYXJcIj5iYXI8L2J1dHRvbj48YnV0dG9uIGlkPVwiYnV0dG9uLWJpbVwiPmJpbTwvYnV0dG9uPjwvdGQ+XG48dGQgaWQ9XCIzXCI+d29vdDwvdGQ+XG48L3RyPmA7XG4gICAgY29uc3Qga2cgPSBrZXlHcmlkKHRhYmxlLCB7Y2VsbFNlbGVjdG9yOiAndGQnLCByb3dTZWxlY3RvcjogJ3RyJ30pO1xuICAgIGNvbnN0IG1vdmVkID0ga2cubW92ZUxlZnQodGFibGUucXVlcnlTZWxlY3RvcignW2lkPVwiM1wiXScpKTtcbiAgICB0LmVxdWFsKG1vdmVkLmlkLCAnYnV0dG9uLWJpbScpO1xuICB9KVxuICAudGVzdCgnbW92ZSBvdXQgb2YgdmlydHVhbCBjZWxsIGlmIGZpcnN0IGl0ZW0gaXMgcmVhY2hlZCcsIGZ1bmN0aW9uICogKHQpIHtcbiAgICBjb25zdCB0YWJsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ1RBQkxFJyk7XG4gICAgdGFibGUuaW5uZXJIVE1MID0gYDx0cj5cbjx0ZCBpZD1cIjFcIj5mb288L3RkPlxuPHRkIGRhdGEta2V5Ym9hcmQtc2VsZWN0b3I9XCJidXR0b25cIiBpZD1cIjJcIj48YnV0dG9uIGlkPVwiYnV0dG9uLWJhclwiPmJhcjwvYnV0dG9uPjxidXR0b24gaWQ9XCJidXR0b24tYmltXCI+YmltPC9idXR0b24+PC90ZD5cbjx0ZCBpZD1cIjNcIj53b290PC90ZD5cbjwvdHI+YDtcbiAgICBjb25zdCBrZyA9IGtleUdyaWQodGFibGUsIHtjZWxsU2VsZWN0b3I6ICd0ZCcsIHJvd1NlbGVjdG9yOiAndHInfSk7XG4gICAgY29uc3QgbW92ZWQgPSBrZy5tb3ZlTGVmdCh0YWJsZS5xdWVyeVNlbGVjdG9yKCdidXR0b24jYnV0dG9uLWJhcicpKTtcbiAgICB0LmVxdWFsKG1vdmVkLmlkLCAnMScpO1xuICB9KSIsImltcG9ydCB6b3JhIGZyb20gJ3pvcmEnO1xuaW1wb3J0IHtrZXlHcmlkfSBmcm9tICcuLi9saWIva2V5Z3JpZCc7XG5cblxuZXhwb3J0IGRlZmF1bHQgem9yYSgpXG4gIC50ZXN0KCdtb3ZlIHVwIGZyb20gb25lIHJvdyB0byB0aGUgb3RoZXInLCBmdW5jdGlvbiAqICh0KSB7XG4gICAgY29uc3QgdGFibGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdUQUJMRScpO1xuICAgIHRhYmxlLmlubmVySFRNTCA9IGA8dHIgaWQ9XCJyMVwiPlxuPHRkIGlkPVwiMVwiPmZvbzwvdGQ+XG48dGQgaWQ9XCIyXCI+YmFyPC90ZD5cbjx0ZCBpZD1cIjNcIj53b290PC90ZD5cbjwvdHI+XG48dHIgaWQ9XCJyMlwiPlxuPHRkIGlkPVwiMTFcIj5mb288L3RkPlxuPHRkIGlkPVwiMTJcIj5iYXI8L3RkPlxuPHRkIGlkPVwiMTNcIj53b290PC90ZD5cbjwvdHI+YDtcbiAgICBjb25zdCBrZyA9IGtleUdyaWQodGFibGUsIHtjZWxsU2VsZWN0b3I6ICd0ZCcsIHJvd1NlbGVjdG9yOiAndHInfSk7XG5cbiAgICBjb25zdCBtb3ZlZCA9IGtnLm1vdmVVcCh0YWJsZS5xdWVyeVNlbGVjdG9yKCdbaWQ9XCIxMlwiXScpKTtcbiAgICB0LmVxdWFsKG1vdmVkLmlkLCAnMicpO1xuICB9KVxuICAudGVzdCgnbW92ZSB1cCBrZWVwaW5nIHRoZSBzYW1lIGNlbGwgYXMgdGhlIGZpcnN0IHJvdyBoYXMgdGhlIHNraXAgZmxhZycsIGZ1bmN0aW9uICogKHQpIHtcbiAgICBjb25zdCB0YWJsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ1RBQkxFJyk7XG4gICAgdGFibGUuaW5uZXJIVE1MID0gYDx0ciBkYXRhLWtleWJvYXJkLXNraXA9XCJ0cnVlXCIgaWQ9XCJyMVwiPlxuPHRkIGlkPVwiMVwiPmZvbzwvdGQ+XG48dGQgaWQ9XCIyXCI+YmFyPC90ZD5cbjx0ZCBpZD1cIjNcIj53b290PC90ZD5cbjwvdHI+XG48dHIgaWQ9XCJyMlwiPlxuPHRkIGlkPVwiMTFcIj5mb288L3RkPlxuPHRkIGlkPVwiMTJcIj5iYXI8L3RkPlxuPHRkIGlkPVwiMTNcIj53b290PC90ZD5cbjwvdHI+YDtcbiAgICBjb25zdCBrZyA9IGtleUdyaWQodGFibGUsIHtjZWxsU2VsZWN0b3I6ICd0ZCcsIHJvd1NlbGVjdG9yOiAndHInfSk7XG5cbiAgICBjb25zdCBtb3ZlZCA9IGtnLm1vdmVVcCh0YWJsZS5xdWVyeVNlbGVjdG9yKCdbaWQ9XCIxMlwiXScpKTtcbiAgICB0LmVxdWFsKG1vdmVkLmlkLCAnMTInKTtcbiAgfSlcbiAgLnRlc3QoJ21vdmUgdXAgc2tpcHBpbmcgYSByb3cnLCBmdW5jdGlvbiAqICh0KSB7XG4gICAgY29uc3QgdGFibGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdUQUJMRScpO1xuICAgIHRhYmxlLmlubmVySFRNTCA9IGA8dHIgaWQ9XCJyMVwiPlxuPHRkIGlkPVwiMVwiPmZvbzwvdGQ+XG48dGQgaWQ9XCIyXCI+YmFyPC90ZD5cbjx0ZCBpZD1cIjNcIj53b290PC90ZD5cbjwvdHI+XG48dHIgZGF0YS1rZXlib2FyZC1za2lwPVwidHJ1ZVwiIGlkPVwicjJcIj5cbjx0ZCBpZD1cIjExXCI+Zm9vPC90ZD5cbjx0ZCBpZD1cIjEyXCI+YmFyPC90ZD5cbjx0ZCBpZD1cIjEzXCI+d29vdDwvdGQ+XG48L3RyPlxuPHRyIGlkPVwicjNcIj5cbjx0ZCBpZD1cIjIxXCI+Zm9vPC90ZD5cbjx0ZCBpZD1cIjIyXCI+YmFyPC90ZD5cbjx0ZCBpZD1cIjIzXCI+d29vdDwvdGQ+XG48L3RyPmA7XG4gICAgY29uc3Qga2cgPSBrZXlHcmlkKHRhYmxlLCB7Y2VsbFNlbGVjdG9yOiAndGQnLCByb3dTZWxlY3RvcjogJ3RyJ30pO1xuXG4gICAgY29uc3QgbW92ZWQgPSBrZy5tb3ZlVXAodGFibGUucXVlcnlTZWxlY3RvcignW2lkPVwiMjJcIl0nKSk7XG4gICAgdC5lcXVhbChtb3ZlZC5pZCwgJzInKTtcbiAgfSlcbiAgLnRlc3QoJ21vdmUgdXAgZ2V0dGluZyB0aGUgbGFzdCBjZWxsIG9mIHRoZSBwcmV2aW91cyByb3cgYXMgdGhlcmUgYXJlIGxlc3MgY2VsbHMgb24gdGhhdCByb3cnLCBmdW5jdGlvbiAqICh0KSB7XG4gICAgY29uc3QgdGFibGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdUQUJMRScpO1xuICAgIHRhYmxlLmlubmVySFRNTCA9IGA8dHIgaWQ9XCJyMVwiPlxuPHRkIGlkPVwiMVwiPmZvbzwvdGQ+XG48dGQgaWQ9XCIyXCI+YmFyPC90ZD5cbjwvdHI+XG48dHIgaWQ9XCJyMlwiPlxuPHRkIGlkPVwiMTFcIj5mb288L3RkPlxuPHRkIGlkPVwiMTJcIj5iYXI8L3RkPlxuPHRkIGlkPVwiMTNcIj53b290PC90ZD5cbjwvdHI+YDtcbiAgICBjb25zdCBrZyA9IGtleUdyaWQodGFibGUsIHtjZWxsU2VsZWN0b3I6ICd0ZCcsIHJvd1NlbGVjdG9yOiAndHInfSk7XG5cbiAgICBjb25zdCBtb3ZlZCA9IGtnLm1vdmVVcCh0YWJsZS5xdWVyeVNlbGVjdG9yKCdbaWQ9XCIxM1wiXScpKTtcbiAgICB0LmVxdWFsKG1vdmVkLmlkLCAnMicpO1xuICB9KSIsImltcG9ydCB6b3JhIGZyb20gJ3pvcmEnO1xuaW1wb3J0IHtrZXlHcmlkfSBmcm9tICcuLi9saWIva2V5Z3JpZCc7XG5cblxuZXhwb3J0IGRlZmF1bHQgem9yYSgpXG4gIC50ZXN0KCdtb3ZlIGRvd24gZnJvbSBvbmUgcm93IHRvIHRoZSBvdGhlcicsIGZ1bmN0aW9uICogKHQpIHtcbiAgICBjb25zdCB0YWJsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ1RBQkxFJyk7XG4gICAgdGFibGUuaW5uZXJIVE1MID0gYDx0ciBpZD1cInIxXCI+XG48dGQgaWQ9XCIxXCI+Zm9vPC90ZD5cbjx0ZCBpZD1cIjJcIj5iYXI8L3RkPlxuPHRkIGlkPVwiM1wiPndvb3Q8L3RkPlxuPC90cj5cbjx0ciBpZD1cInIyXCI+XG48dGQgaWQ9XCIxMVwiPmZvbzwvdGQ+XG48dGQgaWQ9XCIxMlwiPmJhcjwvdGQ+XG48dGQgaWQ9XCIxM1wiPndvb3Q8L3RkPlxuPC90cj5gO1xuICAgIGNvbnN0IGtnID0ga2V5R3JpZCh0YWJsZSwge2NlbGxTZWxlY3RvcjogJ3RkJywgcm93U2VsZWN0b3I6ICd0cid9KTtcblxuICAgIGNvbnN0IG1vdmVkID0ga2cubW92ZURvd24odGFibGUucXVlcnlTZWxlY3RvcignW2lkPVwiMlwiXScpKTtcbiAgICB0LmVxdWFsKG1vdmVkLmlkLCAnMTInKTtcbiAgfSlcbiAgLnRlc3QoJ21vdmUgZG93biBrZWVwaW5nIHRoZSBzYW1lIGNlbGwgYXMgdGhlIGxhc3Qgcm93IGhhcyB0aGUgc2tpcCBmbGFnJywgZnVuY3Rpb24gKiAodCkge1xuICAgIGNvbnN0IHRhYmxlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnVEFCTEUnKTtcbiAgICB0YWJsZS5pbm5lckhUTUwgPSBgPHRyIGlkPVwicjFcIj5cbjx0ZCBpZD1cIjFcIj5mb288L3RkPlxuPHRkIGlkPVwiMlwiPmJhcjwvdGQ+XG48dGQgaWQ9XCIzXCI+d29vdDwvdGQ+XG48L3RyPlxuPHRyIGlkPVwicjJcIiBkYXRhLWtleWJvYXJkLXNraXA9XCJ0cnVlXCI+XG48dGQgaWQ9XCIxMVwiPmZvbzwvdGQ+XG48dGQgaWQ9XCIxMlwiPmJhcjwvdGQ+XG48dGQgaWQ9XCIxM1wiPndvb3Q8L3RkPlxuPC90cj5gO1xuICAgIGNvbnN0IGtnID0ga2V5R3JpZCh0YWJsZSwge2NlbGxTZWxlY3RvcjogJ3RkJywgcm93U2VsZWN0b3I6ICd0cid9KTtcblxuICAgIGNvbnN0IG1vdmVkID0ga2cubW92ZURvd24odGFibGUucXVlcnlTZWxlY3RvcignW2lkPVwiMlwiXScpKTtcbiAgICB0LmVxdWFsKG1vdmVkLmlkLCAnMicpO1xuICB9KVxuICAudGVzdCgnbW92ZSBkb3duIHNraXBwaW5nIGEgcm93JywgZnVuY3Rpb24gKiAodCkge1xuICAgIGNvbnN0IHRhYmxlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnVEFCTEUnKTtcbiAgICB0YWJsZS5pbm5lckhUTUwgPSBgPHRyIGlkPVwicjFcIj5cbjx0ZCBpZD1cIjFcIj5mb288L3RkPlxuPHRkIGlkPVwiMlwiPmJhcjwvdGQ+XG48dGQgaWQ9XCIzXCI+d29vdDwvdGQ+XG48L3RyPlxuPHRyIGRhdGEta2V5Ym9hcmQtc2tpcD1cInRydWVcIiBpZD1cInIyXCI+XG48dGQgaWQ9XCIxMVwiPmZvbzwvdGQ+XG48dGQgaWQ9XCIxMlwiPmJhcjwvdGQ+XG48dGQgaWQ9XCIxM1wiPndvb3Q8L3RkPlxuPC90cj5cbjx0ciBpZD1cInIzXCI+XG48dGQgaWQ9XCIyMVwiPmZvbzwvdGQ+XG48dGQgaWQ9XCIyMlwiPmJhcjwvdGQ+XG48dGQgaWQ9XCIyM1wiPndvb3Q8L3RkPlxuPC90cj5gO1xuICAgIGNvbnN0IGtnID0ga2V5R3JpZCh0YWJsZSwge2NlbGxTZWxlY3RvcjogJ3RkJywgcm93U2VsZWN0b3I6ICd0cid9KTtcblxuICAgIGNvbnN0IG1vdmVkID0ga2cubW92ZURvd24odGFibGUucXVlcnlTZWxlY3RvcignW2lkPVwiMlwiXScpKTtcbiAgICB0LmVxdWFsKG1vdmVkLmlkLCAnMjInKTtcbiAgfSlcbiAgLnRlc3QoJ21vdmUgZG93biBnZXR0aW5nIHRoZSBsYXN0IGNlbGwgb2YgdGhlIG5leHQgcm93IGFzIHRoZXJlIGFyZSBsZXNzIGNlbGxzIG9uIHRoYXQgcm93JywgZnVuY3Rpb24gKiAodCkge1xuICAgIGNvbnN0IHRhYmxlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnVEFCTEUnKTtcbiAgICB0YWJsZS5pbm5lckhUTUwgPSBgPHRyIGlkPVwicjFcIj5cbjx0ZCBpZD1cIjFcIj5mb288L3RkPlxuPHRkIGlkPVwiMlwiPmJhcjwvdGQ+XG48dGQgaWQ9XCIzXCI+YmFyPC90ZD5cbjwvdHI+XG48dHIgaWQ9XCJyMlwiPlxuPHRkIGlkPVwiMTFcIj5mb288L3RkPlxuPHRkIGlkPVwiMTJcIj5iYXI8L3RkPlxuPC90cj5gO1xuICAgIGNvbnN0IGtnID0ga2V5R3JpZCh0YWJsZSwge2NlbGxTZWxlY3RvcjogJ3RkJywgcm93U2VsZWN0b3I6ICd0cid9KTtcblxuICAgIGNvbnN0IG1vdmVkID0ga2cubW92ZURvd24odGFibGUucXVlcnlTZWxlY3RvcignW2lkPVwiM1wiXScpKTtcbiAgICB0LmVxdWFsKG1vdmVkLmlkLCAnMTInKTtcbiAgfSk7IiwiaW1wb3J0IHpvcmEgZnJvbSAnem9yYSc7XG5pbXBvcnQgbW92ZVJpZ2h0IGZyb20gJy4vbW92ZVJpZ2h0JztcbmltcG9ydCBtb3ZlTGVmdCBmcm9tICcuL21vdmVMZWZ0JztcbmltcG9ydCBtb3ZlVXAgZnJvbSAnLi9tb3ZlVXAnO1xuaW1wb3J0IG1vdmVEb3duIGZyb20gJy4vbW92ZURvd24nO1xuXG56b3JhKClcbiAgLnRlc3QobW92ZVJpZ2h0KVxuICAudGVzdChtb3ZlTGVmdClcbiAgLnRlc3QobW92ZVVwKVxuICAudGVzdChtb3ZlRG93bilcbiAgLnJ1bigpOyJdLCJuYW1lcyI6WyJwbGFuIiwiem9yYSJdLCJtYXBwaW5ncyI6Ijs7O0FBQUE7Ozs7QUFJQSxJQUFJLEtBQUssR0FBRyxLQUFLLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQzs7Ozs7O0FBTWxDLElBQUksS0FBSyxHQUFHLEVBQUUsQ0FBQyxTQUFTLENBQUMsR0FBRyxFQUFFLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7QUFjdkMsRUFBRSxDQUFDLElBQUksR0FBRyxVQUFVLEVBQUUsRUFBRTtFQUN0QixhQUFhLENBQUMscUJBQXFCLEdBQUcsRUFBRSxDQUFDO0VBQ3pDLE9BQU8sYUFBYSxDQUFDO0VBQ3JCLFNBQVMsYUFBYSxHQUFHO0lBQ3ZCLE9BQU8sRUFBRSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsU0FBUyxDQUFDLENBQUMsQ0FBQztHQUNqRDtDQUNGLENBQUM7Ozs7Ozs7Ozs7O0FBV0YsU0FBUyxFQUFFLENBQUMsR0FBRyxFQUFFO0VBQ2YsSUFBSSxHQUFHLEdBQUcsSUFBSSxDQUFDO0VBQ2YsSUFBSSxJQUFJLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQyxDQUFDLENBQUM7Ozs7O0VBS3BDLE9BQU8sSUFBSSxPQUFPLENBQUMsU0FBUyxPQUFPLEVBQUUsTUFBTSxFQUFFO0lBQzNDLElBQUksT0FBTyxHQUFHLEtBQUssVUFBVSxFQUFFLEdBQUcsR0FBRyxHQUFHLENBQUMsS0FBSyxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsQ0FBQztJQUMxRCxJQUFJLENBQUMsR0FBRyxJQUFJLE9BQU8sR0FBRyxDQUFDLElBQUksS0FBSyxVQUFVLEVBQUUsT0FBTyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUM7O0lBRWhFLFdBQVcsRUFBRSxDQUFDOzs7Ozs7OztJQVFkLFNBQVMsV0FBVyxDQUFDLEdBQUcsRUFBRTtNQUN4QixJQUFJLEdBQUcsQ0FBQztNQUNSLElBQUk7UUFDRixHQUFHLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztPQUNyQixDQUFDLE9BQU8sQ0FBQyxFQUFFO1FBQ1YsT0FBTyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7T0FDbEI7TUFDRCxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7S0FDWDs7Ozs7Ozs7SUFRRCxTQUFTLFVBQVUsQ0FBQyxHQUFHLEVBQUU7TUFDdkIsSUFBSSxHQUFHLENBQUM7TUFDUixJQUFJO1FBQ0YsR0FBRyxHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7T0FDdEIsQ0FBQyxPQUFPLENBQUMsRUFBRTtRQUNWLE9BQU8sTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO09BQ2xCO01BQ0QsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0tBQ1g7Ozs7Ozs7Ozs7O0lBV0QsU0FBUyxJQUFJLENBQUMsR0FBRyxFQUFFO01BQ2pCLElBQUksR0FBRyxDQUFDLElBQUksRUFBRSxPQUFPLE9BQU8sQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUM7TUFDeEMsSUFBSSxLQUFLLEdBQUcsU0FBUyxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDO01BQzNDLElBQUksS0FBSyxJQUFJLFNBQVMsQ0FBQyxLQUFLLENBQUMsRUFBRSxPQUFPLEtBQUssQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLFVBQVUsQ0FBQyxDQUFDO01BQzFFLE9BQU8sVUFBVSxDQUFDLElBQUksU0FBUyxDQUFDLHVFQUF1RTtVQUNuRyx3Q0FBd0MsR0FBRyxNQUFNLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUM7S0FDMUU7R0FDRixDQUFDLENBQUM7Q0FDSjs7Ozs7Ozs7OztBQVVELFNBQVMsU0FBUyxDQUFDLEdBQUcsRUFBRTtFQUN0QixJQUFJLENBQUMsR0FBRyxFQUFFLE9BQU8sR0FBRyxDQUFDO0VBQ3JCLElBQUksU0FBUyxDQUFDLEdBQUcsQ0FBQyxFQUFFLE9BQU8sR0FBRyxDQUFDO0VBQy9CLElBQUksbUJBQW1CLENBQUMsR0FBRyxDQUFDLElBQUksV0FBVyxDQUFDLEdBQUcsQ0FBQyxFQUFFLE9BQU8sRUFBRSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsR0FBRyxDQUFDLENBQUM7RUFDNUUsSUFBSSxVQUFVLElBQUksT0FBTyxHQUFHLEVBQUUsT0FBTyxjQUFjLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxHQUFHLENBQUMsQ0FBQztFQUNwRSxJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEVBQUUsT0FBTyxjQUFjLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxHQUFHLENBQUMsQ0FBQztFQUM5RCxJQUFJLFFBQVEsQ0FBQyxHQUFHLENBQUMsRUFBRSxPQUFPLGVBQWUsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLEdBQUcsQ0FBQyxDQUFDO0VBQzFELE9BQU8sR0FBRyxDQUFDO0NBQ1o7Ozs7Ozs7Ozs7QUFVRCxTQUFTLGNBQWMsQ0FBQyxFQUFFLEVBQUU7RUFDMUIsSUFBSSxHQUFHLEdBQUcsSUFBSSxDQUFDO0VBQ2YsT0FBTyxJQUFJLE9BQU8sQ0FBQyxVQUFVLE9BQU8sRUFBRSxNQUFNLEVBQUU7SUFDNUMsRUFBRSxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsVUFBVSxHQUFHLEVBQUUsR0FBRyxFQUFFO01BQy9CLElBQUksR0FBRyxFQUFFLE9BQU8sTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDO01BQzVCLElBQUksU0FBUyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsR0FBRyxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUMsQ0FBQyxDQUFDO01BQ3pELE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQztLQUNkLENBQUMsQ0FBQztHQUNKLENBQUMsQ0FBQztDQUNKOzs7Ozs7Ozs7OztBQVdELFNBQVMsY0FBYyxDQUFDLEdBQUcsRUFBRTtFQUMzQixPQUFPLE9BQU8sQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQztDQUM5Qzs7Ozs7Ozs7Ozs7QUFXRCxTQUFTLGVBQWUsQ0FBQyxHQUFHLENBQUM7RUFDM0IsSUFBSSxPQUFPLEdBQUcsSUFBSSxHQUFHLENBQUMsV0FBVyxFQUFFLENBQUM7RUFDcEMsSUFBSSxJQUFJLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztFQUM1QixJQUFJLFFBQVEsR0FBRyxFQUFFLENBQUM7RUFDbEIsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7SUFDcEMsSUFBSSxHQUFHLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ2xCLElBQUksT0FBTyxHQUFHLFNBQVMsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO0lBQzdDLElBQUksT0FBTyxJQUFJLFNBQVMsQ0FBQyxPQUFPLENBQUMsRUFBRSxLQUFLLENBQUMsT0FBTyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1NBQ2xELE9BQU8sQ0FBQyxHQUFHLENBQUMsR0FBRyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7R0FDOUI7RUFDRCxPQUFPLE9BQU8sQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUMsSUFBSSxDQUFDLFlBQVk7SUFDNUMsT0FBTyxPQUFPLENBQUM7R0FDaEIsQ0FBQyxDQUFDOztFQUVILFNBQVMsS0FBSyxDQUFDLE9BQU8sRUFBRSxHQUFHLEVBQUU7O0lBRTNCLE9BQU8sQ0FBQyxHQUFHLENBQUMsR0FBRyxTQUFTLENBQUM7SUFDekIsUUFBUSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLFVBQVUsR0FBRyxFQUFFO01BQ3hDLE9BQU8sQ0FBQyxHQUFHLENBQUMsR0FBRyxHQUFHLENBQUM7S0FDcEIsQ0FBQyxDQUFDLENBQUM7R0FDTDtDQUNGOzs7Ozs7Ozs7O0FBVUQsU0FBUyxTQUFTLENBQUMsR0FBRyxFQUFFO0VBQ3RCLE9BQU8sVUFBVSxJQUFJLE9BQU8sR0FBRyxDQUFDLElBQUksQ0FBQztDQUN0Qzs7Ozs7Ozs7OztBQVVELFNBQVMsV0FBVyxDQUFDLEdBQUcsRUFBRTtFQUN4QixPQUFPLFVBQVUsSUFBSSxPQUFPLEdBQUcsQ0FBQyxJQUFJLElBQUksVUFBVSxJQUFJLE9BQU8sR0FBRyxDQUFDLEtBQUssQ0FBQztDQUN4RTs7Ozs7Ozs7O0FBU0QsU0FBUyxtQkFBbUIsQ0FBQyxHQUFHLEVBQUU7RUFDaEMsSUFBSSxXQUFXLEdBQUcsR0FBRyxDQUFDLFdBQVcsQ0FBQztFQUNsQyxJQUFJLENBQUMsV0FBVyxFQUFFLE9BQU8sS0FBSyxDQUFDO0VBQy9CLElBQUksbUJBQW1CLEtBQUssV0FBVyxDQUFDLElBQUksSUFBSSxtQkFBbUIsS0FBSyxXQUFXLENBQUMsV0FBVyxFQUFFLE9BQU8sSUFBSSxDQUFDO0VBQzdHLE9BQU8sV0FBVyxDQUFDLFdBQVcsQ0FBQyxTQUFTLENBQUMsQ0FBQztDQUMzQzs7Ozs7Ozs7OztBQVVELFNBQVMsUUFBUSxDQUFDLEdBQUcsRUFBRTtFQUNyQixPQUFPLE1BQU0sSUFBSSxHQUFHLENBQUMsV0FBVyxDQUFDO0NBQ2xDOztBQUVELFNBQVMsb0JBQW9CLENBQUMsRUFBRSxFQUFFLE1BQU0sRUFBRTtDQUN6QyxPQUFPLE1BQU0sR0FBRyxFQUFFLE9BQU8sRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxPQUFPLENBQUMsRUFBRSxNQUFNLENBQUMsT0FBTyxDQUFDO0NBQzVFOztBQUVELElBQUksSUFBSSxHQUFHLG9CQUFvQixDQUFDLFVBQVUsTUFBTSxFQUFFLE9BQU8sRUFBRTtBQUMzRCxPQUFPLEdBQUcsTUFBTSxDQUFDLE9BQU8sR0FBRyxPQUFPLE1BQU0sQ0FBQyxJQUFJLEtBQUssVUFBVTtJQUN4RCxNQUFNLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQzs7QUFFdkIsT0FBTyxDQUFDLElBQUksR0FBRyxJQUFJLENBQUM7QUFDcEIsU0FBUyxJQUFJLEVBQUUsR0FBRyxFQUFFO0VBQ2xCLElBQUksSUFBSSxHQUFHLEVBQUUsQ0FBQztFQUNkLEtBQUssSUFBSSxHQUFHLElBQUksR0FBRyxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7RUFDcEMsT0FBTyxJQUFJLENBQUM7Q0FDYjtDQUNBLENBQUMsQ0FBQzs7QUFFSCxJQUFJLFlBQVksR0FBRyxvQkFBb0IsQ0FBQyxVQUFVLE1BQU0sRUFBRSxPQUFPLEVBQUU7QUFDbkUsSUFBSSxzQkFBc0IsR0FBRyxDQUFDLFVBQVU7RUFDdEMsT0FBTyxNQUFNLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDO0NBQ2pELEdBQUcsSUFBSSxvQkFBb0IsQ0FBQzs7QUFFN0IsT0FBTyxHQUFHLE1BQU0sQ0FBQyxPQUFPLEdBQUcsc0JBQXNCLEdBQUcsU0FBUyxHQUFHLFdBQVcsQ0FBQzs7QUFFNUUsT0FBTyxDQUFDLFNBQVMsR0FBRyxTQUFTLENBQUM7QUFDOUIsU0FBUyxTQUFTLENBQUMsTUFBTSxFQUFFO0VBQ3pCLE9BQU8sTUFBTSxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLG9CQUFvQixDQUFDO0NBQ3ZFOztBQUVELE9BQU8sQ0FBQyxXQUFXLEdBQUcsV0FBVyxDQUFDO0FBQ2xDLFNBQVMsV0FBVyxDQUFDLE1BQU0sQ0FBQztFQUMxQixPQUFPLE1BQU07SUFDWCxPQUFPLE1BQU0sSUFBSSxRQUFRO0lBQ3pCLE9BQU8sTUFBTSxDQUFDLE1BQU0sSUFBSSxRQUFRO0lBQ2hDLE1BQU0sQ0FBQyxTQUFTLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsUUFBUSxDQUFDO0lBQ3RELENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLFFBQVEsQ0FBQztJQUM3RCxLQUFLLENBQUM7Q0FDVDtDQUNBLENBQUMsQ0FBQzs7QUFFSCxJQUFJLE9BQU8sR0FBRyxvQkFBb0IsQ0FBQyxVQUFVLE1BQU0sRUFBRTtBQUNyRCxJQUFJLE1BQU0sR0FBRyxLQUFLLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQztBQUNuQyxJQUFJLFVBQVUsR0FBRyxJQUFJLENBQUM7QUFDdEIsSUFBSSxXQUFXLEdBQUcsWUFBWSxDQUFDOztBQUUvQixJQUFJLFNBQVMsR0FBRyxNQUFNLENBQUMsT0FBTyxHQUFHLFVBQVUsTUFBTSxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUU7RUFDakUsSUFBSSxDQUFDLElBQUksRUFBRSxJQUFJLEdBQUcsRUFBRSxDQUFDOztFQUVyQixJQUFJLE1BQU0sS0FBSyxRQUFRLEVBQUU7SUFDdkIsT0FBTyxJQUFJLENBQUM7O0dBRWIsTUFBTSxJQUFJLE1BQU0sWUFBWSxJQUFJLElBQUksUUFBUSxZQUFZLElBQUksRUFBRTtJQUM3RCxPQUFPLE1BQU0sQ0FBQyxPQUFPLEVBQUUsS0FBSyxRQUFRLENBQUMsT0FBTyxFQUFFLENBQUM7Ozs7R0FJaEQsTUFBTSxJQUFJLENBQUMsTUFBTSxJQUFJLENBQUMsUUFBUSxJQUFJLE9BQU8sTUFBTSxJQUFJLFFBQVEsSUFBSSxPQUFPLFFBQVEsSUFBSSxRQUFRLEVBQUU7SUFDM0YsT0FBTyxJQUFJLENBQUMsTUFBTSxHQUFHLE1BQU0sS0FBSyxRQUFRLEdBQUcsTUFBTSxJQUFJLFFBQVEsQ0FBQzs7Ozs7Ozs7R0FRL0QsTUFBTTtJQUNMLE9BQU8sUUFBUSxDQUFDLE1BQU0sRUFBRSxRQUFRLEVBQUUsSUFBSSxDQUFDLENBQUM7R0FDekM7Q0FDRixDQUFDOztBQUVGLFNBQVMsaUJBQWlCLENBQUMsS0FBSyxFQUFFO0VBQ2hDLE9BQU8sS0FBSyxLQUFLLElBQUksSUFBSSxLQUFLLEtBQUssU0FBUyxDQUFDO0NBQzlDOztBQUVELFNBQVMsUUFBUSxFQUFFLENBQUMsRUFBRTtFQUNwQixJQUFJLENBQUMsQ0FBQyxJQUFJLE9BQU8sQ0FBQyxLQUFLLFFBQVEsSUFBSSxPQUFPLENBQUMsQ0FBQyxNQUFNLEtBQUssUUFBUSxFQUFFLE9BQU8sS0FBSyxDQUFDO0VBQzlFLElBQUksT0FBTyxDQUFDLENBQUMsSUFBSSxLQUFLLFVBQVUsSUFBSSxPQUFPLENBQUMsQ0FBQyxLQUFLLEtBQUssVUFBVSxFQUFFO0lBQ2pFLE9BQU8sS0FBSyxDQUFDO0dBQ2Q7RUFDRCxJQUFJLENBQUMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxJQUFJLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLFFBQVEsRUFBRSxPQUFPLEtBQUssQ0FBQztFQUMzRCxPQUFPLElBQUksQ0FBQztDQUNiOztBQUVELFNBQVMsUUFBUSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFO0VBQzVCLElBQUksQ0FBQyxFQUFFLEdBQUcsQ0FBQztFQUNYLElBQUksaUJBQWlCLENBQUMsQ0FBQyxDQUFDLElBQUksaUJBQWlCLENBQUMsQ0FBQyxDQUFDO0lBQzlDLE9BQU8sS0FBSyxDQUFDOztFQUVmLElBQUksQ0FBQyxDQUFDLFNBQVMsS0FBSyxDQUFDLENBQUMsU0FBUyxFQUFFLE9BQU8sS0FBSyxDQUFDOzs7RUFHOUMsSUFBSSxXQUFXLENBQUMsQ0FBQyxDQUFDLEVBQUU7SUFDbEIsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsRUFBRTtNQUNuQixPQUFPLEtBQUssQ0FBQztLQUNkO0lBQ0QsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDbkIsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDbkIsT0FBTyxTQUFTLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQztHQUM5QjtFQUNELElBQUksUUFBUSxDQUFDLENBQUMsQ0FBQyxFQUFFO0lBQ2YsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsRUFBRTtNQUNoQixPQUFPLEtBQUssQ0FBQztLQUNkO0lBQ0QsSUFBSSxDQUFDLENBQUMsTUFBTSxLQUFLLENBQUMsQ0FBQyxNQUFNLEVBQUUsT0FBTyxLQUFLLENBQUM7SUFDeEMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFO01BQzdCLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxPQUFPLEtBQUssQ0FBQztLQUNqQztJQUNELE9BQU8sSUFBSSxDQUFDO0dBQ2I7RUFDRCxJQUFJO0lBQ0YsSUFBSSxFQUFFLEdBQUcsVUFBVSxDQUFDLENBQUMsQ0FBQztRQUNsQixFQUFFLEdBQUcsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDO0dBQ3hCLENBQUMsT0FBTyxDQUFDLEVBQUU7SUFDVixPQUFPLEtBQUssQ0FBQztHQUNkOzs7RUFHRCxJQUFJLEVBQUUsQ0FBQyxNQUFNLElBQUksRUFBRSxDQUFDLE1BQU07SUFDeEIsT0FBTyxLQUFLLENBQUM7O0VBRWYsRUFBRSxDQUFDLElBQUksRUFBRSxDQUFDO0VBQ1YsRUFBRSxDQUFDLElBQUksRUFBRSxDQUFDOztFQUVWLEtBQUssQ0FBQyxHQUFHLEVBQUUsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUU7SUFDbkMsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQztNQUNoQixPQUFPLEtBQUssQ0FBQztHQUNoQjs7O0VBR0QsS0FBSyxDQUFDLEdBQUcsRUFBRSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRTtJQUNuQyxHQUFHLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ1osSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxFQUFFLElBQUksQ0FBQyxFQUFFLE9BQU8sS0FBSyxDQUFDO0dBQ3BEO0VBQ0QsT0FBTyxPQUFPLENBQUMsS0FBSyxPQUFPLENBQUMsQ0FBQztDQUM5QjtDQUNBLENBQUMsQ0FBQzs7QUFFSCxNQUFNLFVBQVUsR0FBRztFQUNqQixFQUFFLENBQUMsR0FBRyxFQUFFLE9BQU8sR0FBRyxrQkFBa0IsRUFBRTtJQUNwQyxNQUFNLGVBQWUsR0FBRztNQUN0QixJQUFJLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQztNQUNsQixRQUFRLEVBQUUsUUFBUTtNQUNsQixNQUFNLEVBQUUsR0FBRztNQUNYLFFBQVEsRUFBRSxJQUFJO01BQ2QsT0FBTztLQUNSLENBQUM7SUFDRixJQUFJLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxlQUFlLENBQUMsQ0FBQztJQUN4QyxPQUFPLGVBQWUsQ0FBQztHQUN4QjtFQUNELFNBQVMsQ0FBQyxNQUFNLEVBQUUsUUFBUSxFQUFFLE9BQU8sR0FBRyxzQkFBc0IsRUFBRTtJQUM1RCxNQUFNLGVBQWUsR0FBRztNQUN0QixJQUFJLEVBQUUsT0FBTyxDQUFDLE1BQU0sRUFBRSxRQUFRLENBQUM7TUFDL0IsTUFBTTtNQUNOLFFBQVE7TUFDUixPQUFPO01BQ1AsUUFBUSxFQUFFLFdBQVc7S0FDdEIsQ0FBQztJQUNGLElBQUksQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLGVBQWUsQ0FBQyxDQUFDO0lBQ3hDLE9BQU8sZUFBZSxDQUFDO0dBQ3hCO0VBQ0QsS0FBSyxDQUFDLE1BQU0sRUFBRSxRQUFRLEVBQUUsT0FBTyxHQUFHLGlCQUFpQixFQUFFO0lBQ25ELE1BQU0sZUFBZSxHQUFHO01BQ3RCLElBQUksRUFBRSxNQUFNLEtBQUssUUFBUTtNQUN6QixNQUFNO01BQ04sUUFBUTtNQUNSLE9BQU87TUFDUCxRQUFRLEVBQUUsT0FBTztLQUNsQixDQUFDO0lBQ0YsSUFBSSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsZUFBZSxDQUFDLENBQUM7SUFDeEMsT0FBTyxlQUFlLENBQUM7R0FDeEI7RUFDRCxLQUFLLENBQUMsR0FBRyxFQUFFLE9BQU8sR0FBRyxzQkFBc0IsRUFBRTtJQUMzQyxNQUFNLGVBQWUsR0FBRztNQUN0QixJQUFJLEVBQUUsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDO01BQ25CLFFBQVEsRUFBRSxPQUFPO01BQ2pCLE1BQU0sRUFBRSxHQUFHO01BQ1gsUUFBUSxFQUFFLE9BQU87TUFDakIsT0FBTztLQUNSLENBQUM7SUFDRixJQUFJLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxlQUFlLENBQUMsQ0FBQztJQUN4QyxPQUFPLGVBQWUsQ0FBQztHQUN4QjtFQUNELFlBQVksQ0FBQyxNQUFNLEVBQUUsUUFBUSxFQUFFLE9BQU8sR0FBRywwQkFBMEIsRUFBRTtJQUNuRSxNQUFNLGVBQWUsR0FBRztNQUN0QixJQUFJLEVBQUUsQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFLFFBQVEsQ0FBQztNQUNoQyxNQUFNO01BQ04sUUFBUTtNQUNSLE9BQU87TUFDUCxRQUFRLEVBQUUsY0FBYztLQUN6QixDQUFDO0lBQ0YsSUFBSSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsZUFBZSxDQUFDLENBQUM7SUFDeEMsT0FBTyxlQUFlLENBQUM7R0FDeEI7RUFDRCxRQUFRLENBQUMsTUFBTSxFQUFFLFFBQVEsRUFBRSxPQUFPLEdBQUcscUJBQXFCLEVBQUU7SUFDMUQsTUFBTSxlQUFlLEdBQUc7TUFDdEIsSUFBSSxFQUFFLE1BQU0sS0FBSyxRQUFRO01BQ3pCLE1BQU07TUFDTixRQUFRO01BQ1IsT0FBTztNQUNQLFFBQVEsRUFBRSxVQUFVO0tBQ3JCLENBQUM7SUFDRixJQUFJLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxlQUFlLENBQUMsQ0FBQztJQUN4QyxPQUFPLGVBQWUsQ0FBQztHQUN4QjtFQUNELE1BQU0sQ0FBQyxJQUFJLEVBQUUsUUFBUSxFQUFFLE9BQU8sRUFBRTtJQUM5QixJQUFJLE1BQU0sRUFBRSxJQUFJLEVBQUUsTUFBTSxDQUFDO0lBQ3pCLElBQUksT0FBTyxRQUFRLEtBQUssUUFBUSxFQUFFO01BQ2hDLENBQUMsUUFBUSxFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsT0FBTyxFQUFFLFFBQVEsQ0FBQyxDQUFDO0tBQzNDO0lBQ0QsSUFBSTtNQUNGLElBQUksRUFBRSxDQUFDO0tBQ1IsQ0FBQyxPQUFPLEtBQUssRUFBRTtNQUNkLE1BQU0sR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDO0tBQ2xCO0lBQ0QsSUFBSSxHQUFHLE1BQU0sS0FBSyxTQUFTLENBQUM7SUFDNUIsTUFBTSxHQUFHLE1BQU0sSUFBSSxNQUFNLENBQUMsS0FBSyxDQUFDO0lBQ2hDLElBQUksUUFBUSxZQUFZLE1BQU0sRUFBRTtNQUM5QixJQUFJLEdBQUcsUUFBUSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxRQUFRLENBQUMsSUFBSSxDQUFDLE1BQU0sSUFBSSxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUM7TUFDeEUsUUFBUSxHQUFHLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQztLQUM3QixNQUFNLElBQUksT0FBTyxRQUFRLEtBQUssVUFBVSxJQUFJLE1BQU0sRUFBRTtNQUNuRCxJQUFJLEdBQUcsTUFBTSxZQUFZLFFBQVEsQ0FBQztNQUNsQyxNQUFNLEdBQUcsTUFBTSxDQUFDLFdBQVcsQ0FBQztLQUM3QjtJQUNELE1BQU0sZUFBZSxHQUFHO01BQ3RCLElBQUk7TUFDSixRQUFRO01BQ1IsTUFBTTtNQUNOLFFBQVEsRUFBRSxRQUFRO01BQ2xCLE9BQU8sRUFBRSxPQUFPLElBQUksY0FBYztLQUNuQyxDQUFDO0lBQ0YsSUFBSSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsZUFBZSxDQUFDLENBQUM7SUFDeEMsT0FBTyxlQUFlLENBQUM7R0FDeEI7RUFDRCxZQUFZLENBQUMsSUFBSSxFQUFFLFFBQVEsRUFBRSxPQUFPLEVBQUU7SUFDcEMsSUFBSSxNQUFNLENBQUM7SUFDWCxJQUFJLE9BQU8sUUFBUSxLQUFLLFFBQVEsRUFBRTtNQUNoQyxDQUFDLFFBQVEsRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLE9BQU8sRUFBRSxRQUFRLENBQUMsQ0FBQztLQUMzQztJQUNELElBQUk7TUFDRixJQUFJLEVBQUUsQ0FBQztLQUNSLENBQUMsT0FBTyxLQUFLLEVBQUU7TUFDZCxNQUFNLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQztLQUNsQjtJQUNELE1BQU0sZUFBZSxHQUFHO01BQ3RCLElBQUksRUFBRSxNQUFNLEtBQUssU0FBUztNQUMxQixRQUFRLEVBQUUsaUJBQWlCO01BQzNCLE1BQU0sRUFBRSxNQUFNLElBQUksTUFBTSxDQUFDLEtBQUs7TUFDOUIsUUFBUSxFQUFFLGNBQWM7TUFDeEIsT0FBTyxFQUFFLE9BQU8sSUFBSSxrQkFBa0I7S0FDdkMsQ0FBQztJQUNGLElBQUksQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLGVBQWUsQ0FBQyxDQUFDO0lBQ3hDLE9BQU8sZUFBZSxDQUFDO0dBQ3hCO0VBQ0QsSUFBSSxDQUFDLE1BQU0sR0FBRyxhQUFhLEVBQUU7SUFDM0IsTUFBTSxlQUFlLEdBQUc7TUFDdEIsSUFBSSxFQUFFLEtBQUs7TUFDWCxNQUFNLEVBQUUsYUFBYTtNQUNyQixRQUFRLEVBQUUsaUJBQWlCO01BQzNCLE9BQU8sRUFBRSxNQUFNO01BQ2YsUUFBUSxFQUFFLE1BQU07S0FDakIsQ0FBQztJQUNGLElBQUksQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLGVBQWUsQ0FBQyxDQUFDO0lBQ3hDLE9BQU8sZUFBZSxDQUFDO0dBQ3hCO0NBQ0YsQ0FBQzs7QUFFRixTQUFTLFNBQVMsRUFBRSxJQUFJLEVBQUU7RUFDeEIsT0FBTyxNQUFNLENBQUMsTUFBTSxDQUFDLFVBQVUsRUFBRSxDQUFDLElBQUksRUFBRSxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7Q0FDekQ7O0FBRUQsTUFBTSxJQUFJLEdBQUc7RUFDWCxHQUFHLEVBQUUsWUFBWTtJQUNmLE1BQU0sTUFBTSxHQUFHLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUMvQixNQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7SUFDdkIsT0FBTyxLQUFLLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQztPQUNqQyxJQUFJLENBQUMsTUFBTTtRQUNWLE9BQU8sQ0FBQyxVQUFVLEVBQUUsSUFBSSxDQUFDLFVBQVUsRUFBRSxhQUFhLEVBQUUsSUFBSSxDQUFDLEdBQUcsRUFBRSxHQUFHLEdBQUcsQ0FBQyxDQUFDO09BQ3ZFLENBQUMsQ0FBQztHQUNOO0VBQ0QsWUFBWSxFQUFFO0lBQ1osTUFBTSxhQUFhLEdBQUcsQ0FBQyxHQUFHLFNBQVMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDLFdBQVcsRUFBRSxJQUFJLENBQUMsV0FBVyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNqRyxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxHQUFHLGFBQWEsQ0FBQyxDQUFDO0lBQ3ZDLE9BQU8sSUFBSSxDQUFDO0dBQ2I7Q0FDRixDQUFDOztBQUVGLFNBQVMsSUFBSSxFQUFFLENBQUMsV0FBVyxFQUFFLFNBQVMsRUFBRSxJQUFJLEdBQUcsS0FBSyxDQUFDLEVBQUU7RUFDckQsT0FBTyxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRTtJQUN6QixXQUFXLEVBQUUsQ0FBQyxLQUFLLEVBQUUsV0FBVyxDQUFDO0lBQ2pDLFNBQVMsRUFBRSxDQUFDLEtBQUssRUFBRSxTQUFTLENBQUM7SUFDN0IsVUFBVSxFQUFFLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQztJQUN2QixJQUFJLEVBQUUsQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDO0lBQ25CLE1BQU0sRUFBRTtNQUNOLEdBQUcsRUFBRTtRQUNILE9BQU8sSUFBSSxDQUFDLFVBQVUsQ0FBQyxNQUFNO09BQzlCO0tBQ0Y7R0FDRixDQUFDLENBQUM7Q0FDSjs7QUFFRCxTQUFTLE1BQU0sRUFBRSxDQUFDLElBQUksRUFBRSxPQUFPLEVBQUUsS0FBSyxDQUFDLEVBQUU7RUFDdkMsTUFBTSxNQUFNLEdBQUcsSUFBSSxLQUFLLElBQUksR0FBRyxJQUFJLEdBQUcsUUFBUSxDQUFDO0VBQy9DLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxNQUFNLEVBQUUsS0FBSyxFQUFFLE9BQU8sQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO0NBQ2pEOztBQUVELFNBQVMsT0FBTyxJQUFJO0VBQ2xCLE9BQU8sT0FBTyxPQUFPLEtBQUssV0FBVyxJQUFJLE9BQU8sT0FBTyxDQUFDLElBQUksS0FBSyxVQUFVLENBQUM7Q0FDN0U7O0FBRUQsU0FBUyxHQUFHLElBQUk7RUFDZCxPQUFPLGNBQWM7SUFDbkIsSUFBSSxLQUFLLEdBQUcsQ0FBQyxDQUFDO0lBQ2QsSUFBSSxNQUFNLEdBQUcsQ0FBQyxDQUFDO0lBQ2YsSUFBSSxPQUFPLEdBQUcsQ0FBQyxDQUFDO0lBQ2hCLElBQUksT0FBTyxHQUFHLENBQUMsQ0FBQzs7SUFFaEIsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO0lBQzVCLE9BQU8sQ0FBQyxHQUFHLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztJQUM5QixJQUFJO01BQ0YsT0FBTyxJQUFJLEVBQUU7UUFDWCxNQUFNLFNBQVMsR0FBRyxLQUFLLENBQUM7UUFDeEIsSUFBSSxTQUFTLENBQUMsSUFBSSxLQUFLLElBQUksRUFBRTtVQUMzQixPQUFPLEVBQUUsQ0FBQztTQUNYLE1BQU07VUFDTCxPQUFPLEVBQUUsQ0FBQztTQUNYO1FBQ0QsU0FBUyxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUM7UUFDeEIsSUFBSSxTQUFTLENBQUMsRUFBRSxLQUFLLE1BQU0sRUFBRTtVQUMzQixPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxFQUFFLFNBQVMsQ0FBQyxXQUFXLENBQUMsR0FBRyxFQUFFLFNBQVMsQ0FBQyxhQUFhLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztVQUN6RSxNQUFNLEdBQUcsU0FBUyxDQUFDLEVBQUUsQ0FBQztTQUN2QjtRQUNELE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUNsQixJQUFJLFNBQVMsQ0FBQyxJQUFJLEtBQUssSUFBSSxFQUFFO1VBQzNCLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUNYLEVBQUUsU0FBUyxDQUFDLFFBQVEsQ0FBQztZQUNyQixFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1VBQ3ZDLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUM7S0FDeEMsQ0FBQyxDQUFDLENBQUM7U0FDQztRQUNELEtBQUssRUFBRSxDQUFDO09BQ1Q7S0FDRixDQUFDLE9BQU8sQ0FBQyxFQUFFO01BQ1YsT0FBTyxDQUFDLEdBQUcsQ0FBQywrQkFBK0IsQ0FBQyxDQUFDO01BQzdDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7TUFDZixJQUFJLE9BQU8sRUFBRSxFQUFFO1FBQ2IsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztPQUNqQjtLQUNGO1lBQ087TUFDTixNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsR0FBRyxFQUFFLEdBQUcsUUFBUSxDQUFDO01BQ3hDLElBQUksS0FBSyxHQUFHLENBQUMsRUFBRTtRQUNiLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQztHQUNsQixFQUFFLEtBQUssR0FBRyxDQUFDLENBQUM7V0FDSixFQUFFLFNBQVMsQ0FBQztVQUNiLEVBQUUsT0FBTyxDQUFDO1VBQ1YsRUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUM7T0FDaEI7TUFDRCxJQUFJLE9BQU8sSUFBSSxPQUFPLEVBQUUsRUFBRTtRQUN4QixPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO09BQ2pCO0tBQ0Y7R0FDRixDQUFDO0NBQ0g7O0FBRUQsTUFBTSxJQUFJLEdBQUc7RUFDWCxJQUFJLENBQUMsV0FBVyxFQUFFLFNBQVMsRUFBRSxJQUFJLEdBQUcsRUFBRSxDQUFDO0lBQ3JDLE1BQU0sU0FBUyxHQUFHLENBQUMsQ0FBQyxTQUFTLElBQUksV0FBVyxDQUFDLEtBQUssSUFBSSxDQUFDLEdBQUcsV0FBVyxDQUFDLEdBQUcsQ0FBQyxDQUFDLFdBQVcsRUFBRSxTQUFTLENBQUMsQ0FBQyxDQUFDO0lBQ3BHLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEdBQUcsU0FBUyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ25FLE9BQU8sSUFBSSxDQUFDO0dBQ2I7O0VBRUQsSUFBSSxDQUFDLFdBQVcsRUFBRSxTQUFTLENBQUM7SUFDMUIsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxTQUFTLEVBQUUsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQztHQUN4RDs7RUFFRCxHQUFHLENBQUMsSUFBSSxHQUFHLEdBQUcsRUFBRSxDQUFDO0lBQ2YsTUFBTSxZQUFZLEdBQUcsSUFBSSxFQUFFLENBQUM7SUFDNUIsWUFBWSxDQUFDLElBQUksRUFBRSxDQUFDO0lBQ3BCLE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDM0MsTUFBTSxRQUFRLEdBQUcsT0FBTyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQztJQUNyRSxPQUFPLEtBQUssQ0FBQyxjQUFjO01BQ3pCLElBQUksRUFBRSxHQUFHLENBQUMsQ0FBQztNQUNYLElBQUk7UUFDRixNQUFNLE9BQU8sR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQztRQUN6QyxLQUFLLElBQUksQ0FBQyxJQUFJLE9BQU8sRUFBRTtVQUNyQixNQUFNLENBQUMsVUFBVSxFQUFFLGFBQWEsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxDQUFDO1VBQzVDLEtBQUssSUFBSSxNQUFNLElBQUksVUFBVSxFQUFFO1lBQzdCLFlBQVksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUUsYUFBYSxDQUFDLENBQUMsQ0FBQyxDQUFDO1dBQy9EO1VBQ0QsRUFBRSxFQUFFLENBQUM7U0FDTjtPQUNGO01BQ0QsT0FBTyxDQUFDLEVBQUU7UUFDUixZQUFZLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO09BQ3ZCLFNBQVM7UUFDUixZQUFZLENBQUMsTUFBTSxFQUFFLENBQUM7T0FDdkI7S0FDRixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztHQUNkOztFQUVELEdBQUcsTUFBTSxDQUFDLFFBQVEsQ0FBQyxFQUFFO0lBQ25CLEtBQUssSUFBSSxDQUFDLElBQUksSUFBSSxDQUFDLEtBQUssRUFBRTtNQUN4QixNQUFNLENBQUMsQ0FBQztLQUNUO0dBQ0Y7Q0FDRixDQUFDOztBQUVGLFNBQVNBLE1BQUksSUFBSTtFQUNmLE9BQU8sTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUU7SUFDekIsS0FBSyxFQUFFLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQztJQUNsQixNQUFNLEVBQUU7TUFDTixHQUFHLEVBQUU7UUFDSCxPQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTTtPQUN6QjtLQUNGO0dBQ0YsQ0FBQyxDQUFDO0NBQ0osQUFFRCxBQUFvQjs7QUM5b0JiLE1BQU0sYUFBYSxHQUFHLENBQUMsT0FBTyxFQUFFLFFBQVEsS0FBSyxPQUFPLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxLQUFLLElBQUksR0FBRyxPQUFPLEdBQUcsYUFBYSxDQUFDLE9BQU8sQ0FBQyxhQUFhLEVBQUUsUUFBUSxDQUFDLENBQUM7QUFDbEosQUFBTyxNQUFNLHFCQUFxQixHQUFHLHdCQUF3QixDQUFDO0FBQzlELEFBQU8sTUFBTSxpQkFBaUIsR0FBRyxvQkFBb0IsQ0FBQztBQUN0RCxBQUFPLE1BQU0sT0FBTyxHQUFHLEdBQUcsSUFBSSxNQUFNLEdBQUcsQ0FBQyxBQUN4QyxBQUFPOztBQ0dBLFNBQVMsV0FBVyxFQUFFLE9BQU8sRUFBRSxDQUFDLFdBQVcsRUFBRSxZQUFZLENBQUMsRUFBRTtFQUNqRSxNQUFNLEdBQUcsR0FBRyxhQUFhLENBQUMsT0FBTyxFQUFFLFdBQVcsQ0FBQyxDQUFDO0VBQ2hELE1BQU0sS0FBSyxHQUFHLENBQUMsR0FBRyxHQUFHLENBQUMsZ0JBQWdCLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQztFQUN0RCxNQUFNLEtBQUssR0FBRyxLQUFLLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0VBQ3JDLE1BQU0sUUFBUSxHQUFHLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQztFQUNsQyxPQUFPO0lBQ0wsZUFBZSxFQUFFLFFBQVE7SUFDekIsZ0JBQWdCLEVBQUUsUUFBUTtJQUMxQixJQUFJLEVBQUU7TUFDSixPQUFPLEtBQUssQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLEtBQUssS0FBSyxDQUFDLEdBQUcsS0FBSyxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUM7S0FDOUQ7SUFDRCxRQUFRLEVBQUU7TUFDUixPQUFPLEtBQUssQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLEtBQUssS0FBSyxDQUFDLEdBQUcsS0FBSyxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUM7S0FDOUQ7R0FDRjtDQUNGOztBQUVELEFBQU8sU0FBUyxRQUFRLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRTtFQUMxQyxNQUFNLEdBQUcsR0FBRyxXQUFXLENBQUMsT0FBTyxFQUFFLE9BQU8sQ0FBQyxDQUFDO0VBQzFDLE9BQU87SUFDTCxRQUFRLEVBQUUsR0FBRyxDQUFDLFFBQVE7SUFDdEIsSUFBSSxFQUFFLEdBQUcsQ0FBQyxJQUFJO0dBQ2Y7Q0FDRjs7QUFFRCxBQUFPLFNBQVMsYUFBYSxFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUU7RUFDL0MsTUFBTSxXQUFXLEdBQUcsYUFBYSxDQUFDLE9BQU8sRUFBRSxPQUFPLENBQUMsWUFBWSxDQUFDLENBQUM7RUFDakUsTUFBTSxRQUFRLEdBQUcsV0FBVyxDQUFDLFlBQVksQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDO0VBQ2pFLE1BQU0sVUFBVSxHQUFHLENBQUMsR0FBRyxXQUFXLENBQUMsZ0JBQWdCLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztFQUMvRCxNQUFNLGFBQWEsR0FBRyxVQUFVLENBQUMsTUFBTSxDQUFDO0VBQ3hDLE1BQU0sV0FBVyxHQUFHLE9BQU8sS0FBSyxXQUFXLENBQUM7RUFDNUMsT0FBTztJQUNMLGdCQUFnQixFQUFFO01BQ2hCLE9BQU8sV0FBVyxHQUFHLE9BQU8sR0FBRyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUM7S0FDOUM7SUFDRCxlQUFlLEVBQUU7TUFDZixPQUFPLFdBQVcsR0FBRyxPQUFPLEdBQUcsVUFBVSxDQUFDLGFBQWEsR0FBRyxDQUFDLENBQUMsQ0FBQztLQUM5RDtJQUNELElBQUksRUFBRTtNQUNKLE1BQU0sS0FBSyxHQUFHLFVBQVUsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUM7TUFDMUMsSUFBSSxXQUFXLElBQUksS0FBSyxHQUFHLENBQUMsR0FBRyxhQUFhLEVBQUU7UUFDNUMsT0FBTyxVQUFVLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQyxDQUFDO09BQzlCLE1BQU07UUFDTCxPQUFPLFdBQVcsQ0FBQyxXQUFXLEVBQUUsT0FBTyxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUM7T0FDakQ7S0FDRjtJQUNELFFBQVEsRUFBRTtNQUNSLE1BQU0sS0FBSyxHQUFHLFVBQVUsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUM7TUFDMUMsSUFBSSxXQUFXLElBQUksS0FBSyxHQUFHLENBQUMsRUFBRTtRQUM1QixPQUFPLFVBQVUsQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLENBQUM7T0FDOUIsTUFBTTtRQUNMLE9BQU8sV0FBVyxDQUFDLFdBQVcsRUFBRSxPQUFPLENBQUMsQ0FBQyxRQUFRLEVBQUUsQ0FBQztPQUNyRDtLQUNGO0dBQ0Y7Q0FDRjs7QUFFRCxBQUFPLFNBQVMsVUFBVSxFQUFFLEVBQUUsRUFBRSxPQUFPLEVBQUU7RUFDdkMsSUFBSSxFQUFFLEtBQUssSUFBSSxFQUFFO0lBQ2YsT0FBTyxJQUFJLENBQUM7R0FDYixNQUFNLElBQUksRUFBRSxDQUFDLFlBQVksQ0FBQyxpQkFBaUIsQ0FBQyxFQUFFO0lBQzdDLE9BQU8sUUFBUSxDQUFDLEVBQUUsRUFBRSxPQUFPLENBQUMsQ0FBQztHQUM5QixNQUFNLElBQUksRUFBRSxDQUFDLFlBQVksQ0FBQyxxQkFBcUIsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsWUFBWSxDQUFDLEVBQUU7SUFDdEYsT0FBTyxhQUFhLENBQUMsRUFBRSxFQUFFLE9BQU8sQ0FBQyxDQUFDO0dBQ25DLE1BQU07SUFDTCxPQUFPLFdBQVcsQ0FBQyxFQUFFLEVBQUUsT0FBTyxDQUFDLENBQUM7R0FDakM7OztBQ3ZFSSxTQUFTLFVBQVUsRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFLENBQUMsV0FBVyxHQUFHLElBQUksRUFBRSxZQUFZLEdBQUcsT0FBTyxDQUFDLENBQUMsRUFBRSxFQUFFO0VBQzFGLE1BQU0sSUFBSSxHQUFHLENBQUMsR0FBRyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQztFQUNyRCxNQUFNLEtBQUssR0FBRyxDQUFDLEdBQUcsT0FBTyxDQUFDLGdCQUFnQixDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUM7RUFDMUQsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQztFQUNwQyxPQUFPO0lBQ0wsUUFBUSxFQUFFO01BQ1IsT0FBTyxJQUFJLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQyxLQUFLLEtBQUssQ0FBQyxHQUFHLElBQUksQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDO0tBQzVEO0lBQ0QsSUFBSSxFQUFFO01BQ0osT0FBTyxJQUFJLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQyxLQUFLLEtBQUssQ0FBQyxHQUFHLElBQUksQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDO0tBQzVEO0lBQ0QsSUFBSSxDQUFDLEtBQUssQ0FBQztNQUNULE9BQU8sS0FBSyxDQUFDLEtBQUssQ0FBQyxLQUFLLEtBQUssQ0FBQyxHQUFHLEtBQUssQ0FBQyxLQUFLLENBQUMsR0FBRyxJQUFJLENBQUM7S0FDdEQ7R0FDRixDQUFDO0NBQ0g7O0FBRUQsQUFBTyxTQUFTLE9BQU8sRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRTtFQUMvQyxNQUFNLE9BQU8sR0FBRyxVQUFVLENBQUMsT0FBTyxFQUFFLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQztFQUNuRCxPQUFPO0lBQ0wsUUFBUSxFQUFFLE9BQU8sQ0FBQyxRQUFRO0lBQzFCLElBQUksRUFBRSxPQUFPLENBQUMsSUFBSTtHQUNuQixDQUFDO0NBQ0g7O0FBRUQsQUFBTyxTQUFTLFNBQVMsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLENBQUMsV0FBVyxFQUFFLFlBQVksQ0FBQyxDQUFDLEVBQUUsRUFBRTtFQUN2RSxJQUFJLE1BQU0sS0FBSyxJQUFJLEVBQUU7SUFDbkIsT0FBTyxJQUFJLENBQUM7R0FDYjtFQUNELE1BQU0sQ0FBQyxHQUFHLGFBQWEsQ0FBQyxNQUFNLEVBQUUsV0FBVyxDQUFDLENBQUM7RUFDN0MsT0FBTyxDQUFDLENBQUMsWUFBWSxDQUFDLGlCQUFpQixDQUFDLEdBQUcsT0FBTyxDQUFDLENBQUMsRUFBRSxJQUFJLEVBQUU7TUFDeEQsV0FBVztNQUNYLFlBQVk7S0FDYixDQUFDLEdBQUcsVUFBVSxDQUFDLE1BQU0sRUFBRSxJQUFJLEVBQUUsQ0FBQyxXQUFXLEVBQUUsWUFBWSxDQUFDLENBQUMsQ0FBQzs7O0FDL0J4RCxTQUFTLE9BQU8sRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFO0VBQ3RDLE1BQU0sQ0FBQyxXQUFXLEVBQUUsWUFBWSxDQUFDLEdBQUcsT0FBTyxDQUFDO0VBQzVDLE9BQU87SUFDTCxTQUFTLENBQUMsTUFBTSxDQUFDO01BQ2YsTUFBTSxJQUFJLEdBQUcsVUFBVSxDQUFDLE1BQU0sRUFBRSxPQUFPLENBQUMsQ0FBQztNQUN6QyxJQUFJLE9BQU8sR0FBRyxVQUFVLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxFQUFFLE9BQU8sQ0FBQyxDQUFDO01BQy9DLE9BQU8sT0FBTyxLQUFLLElBQUksSUFBSSxPQUFPLENBQUMsZ0JBQWdCLEtBQUssS0FBSyxDQUFDLEVBQUU7UUFDOUQsT0FBTyxHQUFHLFVBQVUsQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLEVBQUUsT0FBTyxDQUFDLENBQUM7T0FDL0M7TUFDRCxPQUFPLE9BQU8sS0FBSyxJQUFJLEdBQUcsT0FBTyxDQUFDLGdCQUFnQixFQUFFLEdBQUcsTUFBTSxDQUFDO0tBQy9EO0lBQ0QsUUFBUSxDQUFDLE1BQU0sQ0FBQztNQUNkLE1BQU0sSUFBSSxHQUFHLFVBQVUsQ0FBQyxNQUFNLEVBQUUsT0FBTyxDQUFDLENBQUM7TUFDekMsSUFBSSxPQUFPLEdBQUcsVUFBVSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsRUFBRSxPQUFPLENBQUMsQ0FBQztNQUNuRCxPQUFPLE9BQU8sS0FBSyxJQUFJLElBQUksT0FBTyxDQUFDLGVBQWUsS0FBSyxLQUFLLENBQUMsRUFBRTtRQUM3RCxPQUFPLEdBQUcsVUFBVSxDQUFDLE9BQU8sQ0FBQyxRQUFRLEVBQUUsRUFBRSxPQUFPLENBQUMsQ0FBQztPQUNuRDtNQUNELE9BQU8sT0FBTyxLQUFLLElBQUksR0FBRyxPQUFPLENBQUMsZUFBZSxFQUFFLEdBQUcsTUFBTSxDQUFDO0tBQzlEO0lBQ0QsTUFBTSxDQUFDLE1BQU0sQ0FBQztNQUNaLE1BQU0sVUFBVSxHQUFHLGFBQWEsQ0FBQyxNQUFNLEVBQUUsV0FBVyxDQUFDLENBQUM7TUFDdEQsTUFBTSxLQUFLLEdBQUcsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxnQkFBZ0IsQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDO01BQzdELE1BQU0sR0FBRyxHQUFHLFNBQVMsQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLE9BQU8sQ0FBQyxDQUFDO01BQ2pELElBQUksTUFBTSxHQUFHLFNBQVMsQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLEVBQUUsSUFBSSxFQUFFLE9BQU8sQ0FBQyxDQUFDO01BQ3RELE9BQU8sTUFBTSxLQUFLLElBQUksSUFBSSxNQUFNLENBQUMsSUFBSSxLQUFLLEtBQUssQ0FBQyxFQUFFO1FBQ2hELE1BQU0sR0FBRyxTQUFTLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRSxFQUFFLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQztPQUN0RDs7TUFFRCxJQUFJLE1BQU0sS0FBSyxJQUFJLEVBQUU7UUFDbkIsT0FBTyxNQUFNLENBQUM7T0FDZjs7TUFFRCxJQUFJLFVBQVUsR0FBRyxLQUFLLENBQUMsT0FBTyxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUUsWUFBWSxDQUFDLENBQUMsQ0FBQztNQUNwRSxJQUFJLE9BQU8sR0FBRyxVQUFVLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsRUFBRSxPQUFPLENBQUMsQ0FBQztNQUMzRCxPQUFPLE9BQU8sS0FBSyxJQUFJLElBQUksT0FBTyxDQUFDLGdCQUFnQixLQUFLLEtBQUssQ0FBQyxJQUFJLFVBQVUsR0FBRyxDQUFDLEVBQUU7UUFDaEYsVUFBVSxFQUFFLENBQUM7UUFDYixPQUFPLEdBQUcsVUFBVSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLEVBQUUsT0FBTyxDQUFDLENBQUM7T0FDeEQ7TUFDRCxPQUFPLE9BQU8sQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO0tBQ25DO0lBQ0QsUUFBUSxDQUFDLE1BQU0sQ0FBQztNQUNkLE1BQU0sVUFBVSxHQUFHLGFBQWEsQ0FBQyxNQUFNLEVBQUUsV0FBVyxDQUFDLENBQUM7TUFDdEQsTUFBTSxLQUFLLEdBQUcsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxnQkFBZ0IsQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDO01BQzdELE1BQU0sR0FBRyxHQUFHLFNBQVMsQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLE9BQU8sQ0FBQyxDQUFDO01BQ2pELElBQUksTUFBTSxHQUFHLFNBQVMsQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLEVBQUUsSUFBSSxFQUFFLE9BQU8sQ0FBQyxDQUFDO01BQ2xELE9BQU8sTUFBTSxLQUFLLElBQUksSUFBSSxNQUFNLENBQUMsSUFBSSxLQUFLLEtBQUssQ0FBQyxFQUFFO1FBQ2hELE1BQU0sR0FBRyxTQUFTLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxFQUFFLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQztPQUNsRDs7TUFFRCxJQUFJLE1BQU0sS0FBSyxJQUFJLEVBQUU7UUFDbkIsT0FBTyxNQUFNLENBQUM7T0FDZjs7TUFFRCxJQUFJLFVBQVUsR0FBRyxLQUFLLENBQUMsT0FBTyxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUUsWUFBWSxDQUFDLENBQUMsQ0FBQztNQUNwRSxJQUFJLE9BQU8sR0FBRyxVQUFVLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsRUFBRSxPQUFPLENBQUMsQ0FBQztNQUMzRCxPQUFPLE9BQU8sS0FBSyxJQUFJLElBQUksT0FBTyxDQUFDLGdCQUFnQixLQUFLLEtBQUssQ0FBQyxJQUFJLFVBQVUsR0FBRyxDQUFDLEVBQUU7UUFDaEYsVUFBVSxFQUFFLENBQUM7UUFDYixPQUFPLEdBQUcsVUFBVSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLEVBQUUsT0FBTyxDQUFDLENBQUM7T0FDeEQ7TUFDRCxPQUFPLE9BQU8sQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO0tBQ25DO0dBQ0Y7OztBQzlESCxnQkFBZUMsTUFBSSxFQUFFO0dBQ2xCLElBQUksQ0FBQyxvQ0FBb0MsRUFBRSxZQUFZLENBQUMsRUFBRTtJQUN6RCxNQUFNLEtBQUssR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQzlDLEtBQUssQ0FBQyxTQUFTLEdBQUcsQ0FBQzs7OztLQUlsQixDQUFDLENBQUM7SUFDSCxNQUFNLEVBQUUsR0FBRyxPQUFPLENBQUMsS0FBSyxFQUFFLENBQUMsWUFBWSxFQUFFLElBQUksRUFBRSxXQUFXLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQzs7SUFFbkUsTUFBTSxLQUFLLEdBQUcsRUFBRSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7SUFDNUQsQ0FBQyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsRUFBRSxFQUFFLEdBQUcsQ0FBQyxDQUFDO0dBQ3hCLENBQUM7R0FDRCxJQUFJLENBQUMsaUVBQWlFLEVBQUUsWUFBWSxDQUFDLEVBQUU7SUFDdEYsTUFBTSxLQUFLLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUM5QyxLQUFLLENBQUMsU0FBUyxHQUFHLENBQUM7Ozs7S0FJbEIsQ0FBQyxDQUFDO0lBQ0gsTUFBTSxFQUFFLEdBQUcsT0FBTyxDQUFDLEtBQUssRUFBRSxDQUFDLFlBQVksRUFBRSxJQUFJLEVBQUUsV0FBVyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7SUFDbkUsTUFBTSxLQUFLLEdBQUcsRUFBRSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7SUFDNUQsQ0FBQyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsRUFBRSxFQUFFLEdBQUcsQ0FBQyxDQUFDO0dBQ3hCLENBQUM7R0FDRCxJQUFJLENBQUMsMERBQTBELEVBQUUsWUFBWSxDQUFDLEVBQUU7SUFDL0UsTUFBTSxLQUFLLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUM5QyxLQUFLLENBQUMsU0FBUyxHQUFHLENBQUM7Ozs7S0FJbEIsQ0FBQyxDQUFDO0lBQ0gsTUFBTSxFQUFFLEdBQUcsT0FBTyxDQUFDLEtBQUssRUFBRSxDQUFDLFlBQVksRUFBRSxJQUFJLEVBQUUsV0FBVyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7SUFDbkUsTUFBTSxLQUFLLEdBQUcsRUFBRSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7SUFDNUQsQ0FBQyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsRUFBRSxFQUFFLEdBQUcsQ0FBQyxDQUFDO0dBQ3hCLENBQUM7R0FDRCxJQUFJLENBQUMsNENBQTRDLEVBQUUsWUFBWSxDQUFDLEVBQUU7SUFDakUsTUFBTSxLQUFLLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUM5QyxLQUFLLENBQUMsU0FBUyxHQUFHLENBQUM7Ozs7S0FJbEIsQ0FBQyxDQUFDO0lBQ0gsTUFBTSxFQUFFLEdBQUcsT0FBTyxDQUFDLEtBQUssRUFBRSxDQUFDLFlBQVksRUFBRSxJQUFJLEVBQUUsV0FBVyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7SUFDbkUsTUFBTSxLQUFLLEdBQUcsRUFBRSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7SUFDNUQsQ0FBQyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsRUFBRSxFQUFFLEdBQUcsQ0FBQyxDQUFDO0dBQ3hCLENBQUM7R0FDRCxJQUFJLENBQUMsNkNBQTZDLEVBQUUsWUFBWSxDQUFDLEVBQUU7SUFDbEUsTUFBTSxLQUFLLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUM5QyxLQUFLLENBQUMsU0FBUyxHQUFHLENBQUM7Ozs7S0FJbEIsQ0FBQyxDQUFDO0lBQ0gsTUFBTSxFQUFFLEdBQUcsT0FBTyxDQUFDLEtBQUssRUFBRSxDQUFDLFlBQVksRUFBRSxJQUFJLEVBQUUsV0FBVyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7SUFDbkUsTUFBTSxLQUFLLEdBQUcsRUFBRSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUFDLG1CQUFtQixDQUFDLENBQUMsQ0FBQztJQUNyRSxDQUFDLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxFQUFFLEVBQUUsWUFBWSxDQUFDLENBQUM7R0FDakMsQ0FBQztHQUNELElBQUksQ0FBQywrQ0FBK0MsRUFBRSxZQUFZLENBQUMsRUFBRTtJQUNwRSxNQUFNLEtBQUssR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQzlDLEtBQUssQ0FBQyxTQUFTLEdBQUcsQ0FBQzs7OztLQUlsQixDQUFDLENBQUM7SUFDSCxNQUFNLEVBQUUsR0FBRyxPQUFPLENBQUMsS0FBSyxFQUFFLENBQUMsWUFBWSxFQUFFLElBQUksRUFBRSxXQUFXLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQztJQUNuRSxNQUFNLEtBQUssR0FBRyxFQUFFLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQztJQUM1RCxDQUFDLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxFQUFFLEVBQUUsWUFBWSxDQUFDLENBQUM7R0FDakMsQ0FBQztHQUNELElBQUksQ0FBQyxrREFBa0QsRUFBRSxZQUFZLENBQUMsRUFBRTtJQUN2RSxNQUFNLEtBQUssR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQzlDLEtBQUssQ0FBQyxTQUFTLEdBQUcsQ0FBQzs7OztLQUlsQixDQUFDLENBQUM7SUFDSCxNQUFNLEVBQUUsR0FBRyxPQUFPLENBQUMsS0FBSyxFQUFFLENBQUMsWUFBWSxFQUFFLElBQUksRUFBRSxXQUFXLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQztJQUNuRSxNQUFNLEtBQUssR0FBRyxFQUFFLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsbUJBQW1CLENBQUMsQ0FBQyxDQUFDO0lBQ3JFLENBQUMsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLEVBQUUsRUFBRSxHQUFHLENBQUMsQ0FBQztHQUN4QixDQUFDOztBQzlFSixlQUFlQSxNQUFJLEVBQUU7R0FDbEIsSUFBSSxDQUFDLHVDQUF1QyxFQUFFLFlBQVksQ0FBQyxFQUFFO0lBQzVELE1BQU0sS0FBSyxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDOUMsS0FBSyxDQUFDLFNBQVMsR0FBRyxDQUFDOzs7O0tBSWxCLENBQUMsQ0FBQztJQUNILE1BQU0sRUFBRSxHQUFHLE9BQU8sQ0FBQyxLQUFLLEVBQUUsQ0FBQyxZQUFZLEVBQUUsSUFBSSxFQUFFLFdBQVcsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDOztJQUVuRSxNQUFNLEtBQUssR0FBRyxFQUFFLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQztJQUMzRCxDQUFDLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxFQUFFLEVBQUUsR0FBRyxDQUFDLENBQUM7R0FDeEIsQ0FBQztHQUNELElBQUksQ0FBQyx1RUFBdUUsRUFBRSxZQUFZLENBQUMsRUFBRTtJQUM1RixNQUFNLEtBQUssR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQzlDLEtBQUssQ0FBQyxTQUFTLEdBQUcsQ0FBQzs7OztLQUlsQixDQUFDLENBQUM7SUFDSCxNQUFNLEVBQUUsR0FBRyxPQUFPLENBQUMsS0FBSyxFQUFFLENBQUMsWUFBWSxFQUFFLElBQUksRUFBRSxXQUFXLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQztJQUNuRSxNQUFNLEtBQUssR0FBRyxFQUFFLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQztJQUMzRCxDQUFDLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxFQUFFLEVBQUUsR0FBRyxDQUFDLENBQUM7R0FDeEIsQ0FBQztHQUNELElBQUksQ0FBQywwREFBMEQsRUFBRSxZQUFZLENBQUMsRUFBRTtJQUMvRSxNQUFNLEtBQUssR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQzlDLEtBQUssQ0FBQyxTQUFTLEdBQUcsQ0FBQzs7OztLQUlsQixDQUFDLENBQUM7SUFDSCxNQUFNLEVBQUUsR0FBRyxPQUFPLENBQUMsS0FBSyxFQUFFLENBQUMsWUFBWSxFQUFFLElBQUksRUFBRSxXQUFXLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQztJQUNuRSxNQUFNLEtBQUssR0FBRyxFQUFFLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQztJQUMzRCxDQUFDLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxFQUFFLEVBQUUsR0FBRyxDQUFDLENBQUM7R0FDeEIsQ0FBQztHQUNELElBQUksQ0FBQyw0Q0FBNEMsRUFBRSxZQUFZLENBQUMsRUFBRTtJQUNqRSxNQUFNLEtBQUssR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQzlDLEtBQUssQ0FBQyxTQUFTLEdBQUcsQ0FBQzs7OztLQUlsQixDQUFDLENBQUM7SUFDSCxNQUFNLEVBQUUsR0FBRyxPQUFPLENBQUMsS0FBSyxFQUFFLENBQUMsWUFBWSxFQUFFLElBQUksRUFBRSxXQUFXLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQztJQUNuRSxNQUFNLEtBQUssR0FBRyxFQUFFLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQztJQUMzRCxDQUFDLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxFQUFFLEVBQUUsR0FBRyxDQUFDLENBQUM7R0FDeEIsQ0FBQztHQUNELElBQUksQ0FBQyw2Q0FBNkMsRUFBRSxZQUFZLENBQUMsRUFBRTtJQUNsRSxNQUFNLEtBQUssR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQzlDLEtBQUssQ0FBQyxTQUFTLEdBQUcsQ0FBQzs7OztLQUlsQixDQUFDLENBQUM7SUFDSCxNQUFNLEVBQUUsR0FBRyxPQUFPLENBQUMsS0FBSyxFQUFFLENBQUMsWUFBWSxFQUFFLElBQUksRUFBRSxXQUFXLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQztJQUNuRSxNQUFNLEtBQUssR0FBRyxFQUFFLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsbUJBQW1CLENBQUMsQ0FBQyxDQUFDO0lBQ3BFLENBQUMsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLEVBQUUsRUFBRSxZQUFZLENBQUMsQ0FBQztHQUNqQyxDQUFDO0dBQ0QsSUFBSSxDQUFDLDBEQUEwRCxFQUFFLFlBQVksQ0FBQyxFQUFFO0lBQy9FLE1BQU0sS0FBSyxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDOUMsS0FBSyxDQUFDLFNBQVMsR0FBRyxDQUFDOzs7O0tBSWxCLENBQUMsQ0FBQztJQUNILE1BQU0sRUFBRSxHQUFHLE9BQU8sQ0FBQyxLQUFLLEVBQUUsQ0FBQyxZQUFZLEVBQUUsSUFBSSxFQUFFLFdBQVcsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO0lBQ25FLE1BQU0sS0FBSyxHQUFHLEVBQUUsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO0lBQzNELENBQUMsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLEVBQUUsRUFBRSxZQUFZLENBQUMsQ0FBQztHQUNqQyxDQUFDO0dBQ0QsSUFBSSxDQUFDLG1EQUFtRCxFQUFFLFlBQVksQ0FBQyxFQUFFO0lBQ3hFLE1BQU0sS0FBSyxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDOUMsS0FBSyxDQUFDLFNBQVMsR0FBRyxDQUFDOzs7O0tBSWxCLENBQUMsQ0FBQztJQUNILE1BQU0sRUFBRSxHQUFHLE9BQU8sQ0FBQyxLQUFLLEVBQUUsQ0FBQyxZQUFZLEVBQUUsSUFBSSxFQUFFLFdBQVcsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO0lBQ25FLE1BQU0sS0FBSyxHQUFHLEVBQUUsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDLENBQUM7SUFDcEUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsRUFBRSxFQUFFLEdBQUcsQ0FBQyxDQUFDO0dBQ3hCLENBQUM7O0FDN0VKLGFBQWVBLE1BQUksRUFBRTtHQUNsQixJQUFJLENBQUMsbUNBQW1DLEVBQUUsWUFBWSxDQUFDLEVBQUU7SUFDeEQsTUFBTSxLQUFLLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUM5QyxLQUFLLENBQUMsU0FBUyxHQUFHLENBQUM7Ozs7Ozs7OztLQVNsQixDQUFDLENBQUM7SUFDSCxNQUFNLEVBQUUsR0FBRyxPQUFPLENBQUMsS0FBSyxFQUFFLENBQUMsWUFBWSxFQUFFLElBQUksRUFBRSxXQUFXLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQzs7SUFFbkUsTUFBTSxLQUFLLEdBQUcsRUFBRSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUM7SUFDMUQsQ0FBQyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsRUFBRSxFQUFFLEdBQUcsQ0FBQyxDQUFDO0dBQ3hCLENBQUM7R0FDRCxJQUFJLENBQUMsa0VBQWtFLEVBQUUsWUFBWSxDQUFDLEVBQUU7SUFDdkYsTUFBTSxLQUFLLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUM5QyxLQUFLLENBQUMsU0FBUyxHQUFHLENBQUM7Ozs7Ozs7OztLQVNsQixDQUFDLENBQUM7SUFDSCxNQUFNLEVBQUUsR0FBRyxPQUFPLENBQUMsS0FBSyxFQUFFLENBQUMsWUFBWSxFQUFFLElBQUksRUFBRSxXQUFXLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQzs7SUFFbkUsTUFBTSxLQUFLLEdBQUcsRUFBRSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUM7SUFDMUQsQ0FBQyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsRUFBRSxFQUFFLElBQUksQ0FBQyxDQUFDO0dBQ3pCLENBQUM7R0FDRCxJQUFJLENBQUMsd0JBQXdCLEVBQUUsWUFBWSxDQUFDLEVBQUU7SUFDN0MsTUFBTSxLQUFLLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUM5QyxLQUFLLENBQUMsU0FBUyxHQUFHLENBQUM7Ozs7Ozs7Ozs7Ozs7O0tBY2xCLENBQUMsQ0FBQztJQUNILE1BQU0sRUFBRSxHQUFHLE9BQU8sQ0FBQyxLQUFLLEVBQUUsQ0FBQyxZQUFZLEVBQUUsSUFBSSxFQUFFLFdBQVcsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDOztJQUVuRSxNQUFNLEtBQUssR0FBRyxFQUFFLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQztJQUMxRCxDQUFDLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxFQUFFLEVBQUUsR0FBRyxDQUFDLENBQUM7R0FDeEIsQ0FBQztHQUNELElBQUksQ0FBQyx1RkFBdUYsRUFBRSxZQUFZLENBQUMsRUFBRTtJQUM1RyxNQUFNLEtBQUssR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQzlDLEtBQUssQ0FBQyxTQUFTLEdBQUcsQ0FBQzs7Ozs7Ozs7S0FRbEIsQ0FBQyxDQUFDO0lBQ0gsTUFBTSxFQUFFLEdBQUcsT0FBTyxDQUFDLEtBQUssRUFBRSxDQUFDLFlBQVksRUFBRSxJQUFJLEVBQUUsV0FBVyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7O0lBRW5FLE1BQU0sS0FBSyxHQUFHLEVBQUUsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDO0lBQzFELENBQUMsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLEVBQUUsRUFBRSxHQUFHLENBQUMsQ0FBQztHQUN4QixDQUFDOztBQ3hFSixlQUFlQSxNQUFJLEVBQUU7R0FDbEIsSUFBSSxDQUFDLHFDQUFxQyxFQUFFLFlBQVksQ0FBQyxFQUFFO0lBQzFELE1BQU0sS0FBSyxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDOUMsS0FBSyxDQUFDLFNBQVMsR0FBRyxDQUFDOzs7Ozs7Ozs7S0FTbEIsQ0FBQyxDQUFDO0lBQ0gsTUFBTSxFQUFFLEdBQUcsT0FBTyxDQUFDLEtBQUssRUFBRSxDQUFDLFlBQVksRUFBRSxJQUFJLEVBQUUsV0FBVyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7O0lBRW5FLE1BQU0sS0FBSyxHQUFHLEVBQUUsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO0lBQzNELENBQUMsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLEVBQUUsRUFBRSxJQUFJLENBQUMsQ0FBQztHQUN6QixDQUFDO0dBQ0QsSUFBSSxDQUFDLG1FQUFtRSxFQUFFLFlBQVksQ0FBQyxFQUFFO0lBQ3hGLE1BQU0sS0FBSyxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDOUMsS0FBSyxDQUFDLFNBQVMsR0FBRyxDQUFDOzs7Ozs7Ozs7S0FTbEIsQ0FBQyxDQUFDO0lBQ0gsTUFBTSxFQUFFLEdBQUcsT0FBTyxDQUFDLEtBQUssRUFBRSxDQUFDLFlBQVksRUFBRSxJQUFJLEVBQUUsV0FBVyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7O0lBRW5FLE1BQU0sS0FBSyxHQUFHLEVBQUUsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO0lBQzNELENBQUMsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLEVBQUUsRUFBRSxHQUFHLENBQUMsQ0FBQztHQUN4QixDQUFDO0dBQ0QsSUFBSSxDQUFDLDBCQUEwQixFQUFFLFlBQVksQ0FBQyxFQUFFO0lBQy9DLE1BQU0sS0FBSyxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDOUMsS0FBSyxDQUFDLFNBQVMsR0FBRyxDQUFDOzs7Ozs7Ozs7Ozs7OztLQWNsQixDQUFDLENBQUM7SUFDSCxNQUFNLEVBQUUsR0FBRyxPQUFPLENBQUMsS0FBSyxFQUFFLENBQUMsWUFBWSxFQUFFLElBQUksRUFBRSxXQUFXLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQzs7SUFFbkUsTUFBTSxLQUFLLEdBQUcsRUFBRSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7SUFDM0QsQ0FBQyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsRUFBRSxFQUFFLElBQUksQ0FBQyxDQUFDO0dBQ3pCLENBQUM7R0FDRCxJQUFJLENBQUMscUZBQXFGLEVBQUUsWUFBWSxDQUFDLEVBQUU7SUFDMUcsTUFBTSxLQUFLLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUM5QyxLQUFLLENBQUMsU0FBUyxHQUFHLENBQUM7Ozs7Ozs7O0tBUWxCLENBQUMsQ0FBQztJQUNILE1BQU0sRUFBRSxHQUFHLE9BQU8sQ0FBQyxLQUFLLEVBQUUsQ0FBQyxZQUFZLEVBQUUsSUFBSSxFQUFFLFdBQVcsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDOztJQUVuRSxNQUFNLEtBQUssR0FBRyxFQUFFLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQztJQUMzRCxDQUFDLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxFQUFFLEVBQUUsSUFBSSxDQUFDLENBQUM7R0FDekIsQ0FBQzs7QUN0RUpBLE1BQUksRUFBRTtHQUNILElBQUksQ0FBQyxTQUFTLENBQUM7R0FDZixJQUFJLENBQUMsUUFBUSxDQUFDO0dBQ2QsSUFBSSxDQUFDLE1BQU0sQ0FBQztHQUNaLElBQUksQ0FBQyxRQUFRLENBQUM7R0FDZCxHQUFHLEVBQUUsOzsifQ==
