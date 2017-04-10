import zora from 'zora';
import {keyGrid} from '../lib/keygrid';

export default zora()
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
  })