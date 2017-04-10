import {keyGrid} from './lib/keymap';

export default function gridKeyMap (grid, {cellSelector = 'td,th', rowSelector = 'tr'} ={}) {

  let lastFocused = null;

  const kg = keyGrid(grid, {cellSelector, rowSelector});

  const gridEventListener = (ev) => {
    const {target, keyCode} =ev;
    let newFocused = null;
    if (keyCode === 37) {//left
      newFocused = kg.moveLeft(target);
    } else if (keyCode === 38) {//up
      newFocused = kg.moveUp(target);
    } else if (keyCode === 39) {//right
      newFocused = kg.moveRight(target);
    } else if (keyCode === 40) {//down
      newFocused = kg.moveDown(target);
    }
    if (newFocused !== null) {
      if (lastFocused !== null) {
        lastFocused.setAttribute('tabindex', '-1');
      }
      newFocused.setAttribute('tabindex', '0');
      newFocused.focus();
      lastFocused = newFocused;
    }
  };
  const hasNotSkipAttribute = el => el.hasAttribute('data-keyboard-skip') === false;
  const compositeEventListener = ({target}) => {
    const selector = target.getAttribute('data-keyboard-selector');
    const item = target.querySelector(selector);
    item.focus();
  };

  grid.addEventListener('keydown', gridEventListener);

  const rows = Array.from(grid.querySelectorAll(rowSelector)).filter(hasNotSkipAttribute);
  for (let r of rows) {
    const cells = [...r.querySelectorAll(cellSelector)].filter(hasNotSkipAttribute);
    for (let c of cells) {
      if (lastFocused === null) {
        lastFocused = c;
      }
      c.setAttribute('tabindex', '-1');
    }
  }

  const cells = [...grid.querySelectorAll(cellSelector)];
  const composites = cells.filter(c => c.hasAttribute('data-keyboard-selector') === true);
  for (let c of composites) {
    c.addEventListener('focus', compositeEventListener);
  }

  lastFocused.setAttribute('tabindex', '0');

  return {
    clean(){
      grid.removeEventListener('keydown', gridEventListener);
      for (let c of composites) {
        c.removeEventListener('focus', compositeEventListener);
      }
    }
  }
}