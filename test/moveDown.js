import zora from 'zora';
import {keyGrid} from '../lib/keygrid';


export default zora()
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