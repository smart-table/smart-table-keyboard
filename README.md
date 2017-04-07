# smart-table-keyboard

keyboard navigation for widgets implementing the [grid pattern](https://www.w3.org/TR/wai-aria-practices/#grid)

## Installation

``npm install --save smart-table-keyboard``

or

``yarn add smart-table-keyboard``

## Usage

Assuming you have
```Markup
<table role="grid">
<!-- ... your rows and cells -->
</table
```

```Javascript
import stk from 'smart-table-keyboard';

const grid = document.querySelector('table[role="grid"])' // the the grid widget

stk(grid,{rowSelector:'tr', cellSelector:'th,td'});
```
Note it does not have to be a table: you can have for example

```Javascript
stk(grid,{rowSelector:'[role="row"]', cellSelector:'[role="gridcell"]'});
```

### skipping some elements

You can skip a cell or a row from the navigation by adding the attribute ``data-keyboard-skip="true"`` to the related html element

### Navigate within a cell

You can force navigation within a cell to sub widgets using the attribute ``data-keyboard-selector``

```Markup
<td data-keyboard-selector="button">
    <button>b1</button>
    <button>b2</button>
</td>
```

The cell won't be focused but directly the buttons

## Examples

You'll find more [examples](./examples) extracted from the [wai aria guide](https://www.w3.org/TR/wai-aria-practices/#grid)

## Contribute

### Tests

``npm test`` or ``yarn test``

### Issues

**reproducible bugs** only.

