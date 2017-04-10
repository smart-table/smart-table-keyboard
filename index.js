import {keyGrid} from './lib/keygrid';
import {dataSkipAttribute} from './lib/util'

export default function (grid, {rowSelector = 'tr', cellSelector = 'td,th'}={}) {
  let lastFocus = null;

  const isNavigable = r => r.hasAttribute(dataSkipAttribute) === false;
  const navigableRows = [...grid.querySelectorAll(rowSelector)].filter(isNavigable);
  for (let row of navigableRows) {
    const navigableCells = [...row.querySelectorAll(cellSelector)].filter(isNavigable);
    for (let c of navigableCells) {
      if (lastFocus === null) {
        lastFocus = c;
        c.setAttribute('tabindex', '0');
      } else {
        c.setAttribute('tabindex', '-1');
      }
    }
  }

  const kg = keyGrid(grid, {rowSelector, cellSelector});

  grid.addEventListener('keydown', ({target, keyCode}) => {
    let newCell = null;
    if (keyCode === 37) {
      newCell = kg.moveLeft(target);
    } else if (keyCode === 38) {
      newCell = kg.moveUp(target);
    } else if (keyCode === 39) {
      newCell = kg.moveRight(target);
    } else if (keyCode === 40) {
      newCell = kg.moveDown(target);
    }

    if (newCell !== null) {
      newCell.focus();
      if (lastFocus !== null) {
        lastFocus.setAttribute('tabindex', '-1');
      }
      newCell.setAttribute('tabindex', '0');
      lastFocus = newCell;
    }
  });
}