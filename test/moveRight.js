import zora from 'zora';
import {keyGrid} from '../lib/keygrid';

export default zora()
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
  })