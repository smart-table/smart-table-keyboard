(function () {
'use strict';

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
      } else if (newRowIndex === gridWrapped.rows.length) {
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
    return newCell.hasAttribute('data-keyboard-skip') === false ? newCell : createCell(newCell).moveLeft(); //todo get "virtual" index taking into account colspan
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

function gridKeyMap (grid, {cellSelector = 'td,th', rowSelector = 'tr'} ={}) {

  let lastFocused = null;

  const kg = keyGrid(grid, {cellSelector, rowSelector});

  grid.addEventListener('keydown', (ev) => {
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
      newFocused.focus();
      newFocused.setAttribute('tabindex', '0');
      lastFocused = newFocused;
    }
  });

  let hasNotSkipAttribute = el => el.hasAttribute('data-keyboard-skip') === false;
  const rows = [...grid.querySelectorAll(rowSelector)].filter(hasNotSkipAttribute);
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
    c.addEventListener('focus', ev => {
      const selector = c.getAttribute('data-keyboard-selector');
      const item = c.querySelector(selector);
      item.focus();
    });
  }

  lastFocused.setAttribute('tabindex','0');
}

gridKeyMap(document.querySelector('[role=grid]'),{
  rowSelector:'[role=row]',
  cellSelector:'[role=gridcell]'
});

}());
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnVuZGxlLmpzIiwic291cmNlcyI6WyIuLi8uLi8uLi9saWIva2V5bWFwLmpzIiwiLi4vLi4vLi4vaW5kZXguanMiLCIuLi9pbmRleC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJjb25zdCBmaW5kQ29udGFpbmVyID0gKGVsZW1lbnQsIHNlbGVjdG9yKSA9PiBlbGVtZW50Lm1hdGNoZXMoc2VsZWN0b3IpID09PSB0cnVlID8gZWxlbWVudCA6IGZpbmRDb250YWluZXIoZWxlbWVudC5wYXJlbnRFbGVtZW50LCBzZWxlY3Rvcik7XG5cbmV4cG9ydCBmdW5jdGlvbiBrZXlHcmlkIChncmlkLCB7Y2VsbFNlbGVjdG9yLCByb3dTZWxlY3Rvcn0pIHtcblxuICBjb25zdCBkb2VzU2tpcEtleWJvYXJkID0gZWwgPT4gZWwuZ2V0QXR0cmlidXRlKCdkYXRhLWtleWJvYXJkLXNraXAnKSA9PT0gJ3RydWUnO1xuXG4gIGNvbnN0IGNyZWF0ZUdyaWQgPSAoZ3JpZCkgPT4ge1xuICAgIGNvbnN0IGluc3RhbmNlID0ge307XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGluc3RhbmNlLCAncm93cycsIHtcbiAgICAgIGdldCgpe1xuICAgICAgICByZXR1cm4gZ3JpZC5yb3dzICE9PSB2b2lkIDAgPyBncmlkLnJvd3MgOiBbLi4uZ3JpZC5xdWVyeVNlbGVjdG9yQWxsKHJvd1NlbGVjdG9yKV1cbiAgICAgIH1cbiAgICB9KTtcblxuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShpbnN0YW5jZSwgJ2VsZW1lbnQnLCB7dmFsdWU6IGdyaWR9KTtcbiAgICByZXR1cm4gaW5zdGFuY2U7XG4gIH07XG5cbiAgY29uc3QgZ3JpZFdyYXBwZWQgPSBjcmVhdGVHcmlkKGdyaWQpO1xuXG4gIGNvbnN0IHJvd1Byb3RvID0ge1xuICAgIG1vdmVVcCgpe1xuICAgICAgY29uc3Qgcm93SW5kZXggPSB0aGlzLnJvd0luZGV4O1xuICAgICAgY29uc3QgbmV3Um93SW5kZXggPSBNYXRoLm1heChyb3dJbmRleCAtIDEsIDApO1xuICAgICAgY29uc3QgbmV3Um93ID0gZ3JpZFdyYXBwZWQucm93c1tuZXdSb3dJbmRleF07XG4gICAgICBpZiAoZG9lc1NraXBLZXlib2FyZChuZXdSb3cpID09PSBmYWxzZSkge1xuICAgICAgICByZXR1cm4gbmV3Um93O1xuICAgICAgfSBlbHNlIGlmIChuZXdSb3dJbmRleCA9PT0gMCkge1xuICAgICAgICByZXR1cm4gdGhpcy5lbGVtZW50O1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGNyZWF0ZVJvdyhuZXdSb3cpLm1vdmVVcCgpO1xuICAgICAgfVxuICAgIH0sXG4gICAgbW92ZURvd24oKXtcbiAgICAgIGNvbnN0IHJvd0luZGV4ID0gdGhpcy5yb3dJbmRleDtcbiAgICAgIGNvbnN0IG5ld1Jvd0luZGV4ID0gTWF0aC5taW4ocm93SW5kZXggKyAxLCBncmlkV3JhcHBlZC5yb3dzLmxlbmd0aCAtIDEpO1xuICAgICAgY29uc3QgbmV3Um93ID0gZ3JpZFdyYXBwZWQucm93c1tuZXdSb3dJbmRleF07XG4gICAgICBpZiAoZG9lc1NraXBLZXlib2FyZChuZXdSb3cpID09PSBmYWxzZSkge1xuICAgICAgICByZXR1cm4gbmV3Um93O1xuICAgICAgfSBlbHNlIGlmIChuZXdSb3dJbmRleCA9PT0gZ3JpZFdyYXBwZWQucm93cy5sZW5ndGgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZWxlbWVudDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBjcmVhdGVSb3cobmV3Um93KS5tb3ZlRG93bigpO1xuICAgICAgfVxuICAgIH1cbiAgfTtcblxuICBmdW5jdGlvbiBjcmVhdGVSb3cgKHJvd0VsZW1lbnQpIHtcbiAgICByZXR1cm4gT2JqZWN0LmNyZWF0ZShyb3dQcm90bywge1xuICAgICAgY2VsbHM6IHtcbiAgICAgICAgZ2V0KCl7XG4gICAgICAgICAgcmV0dXJuIHJvd0VsZW1lbnQuY2VsbHMgIT09IHZvaWQgMCA/IFsuLi5yb3dFbGVtZW50LmNlbGxzXSA6IFsuLi5yb3dFbGVtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoY2VsbFNlbGVjdG9yKV07XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICByb3dJbmRleDoge1xuICAgICAgICBnZXQoKXtcbiAgICAgICAgICByZXR1cm4gcm93RWxlbWVudC5yb3dJbmRleCAhPT0gdm9pZCAwID8gcm93RWxlbWVudC5yb3dJbmRleCA6IFsuLi5ncmlkLnF1ZXJ5U2VsZWN0b3JBbGwocm93U2VsZWN0b3IpXS5pbmRleE9mKHJvd0VsZW1lbnQpO1xuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgZWxlbWVudDoge3ZhbHVlOiByb3dFbGVtZW50fVxuICAgIH0pO1xuICB9XG5cbiAgY29uc3QgY2VsbFByb3RvID0ge1xuICAgIG1vdmVSaWdodCgpe1xuICAgICAgY29uc3Qgcm93ID0gY3JlYXRlUm93KGZpbmRDb250YWluZXIodGhpcy5lbGVtZW50LCByb3dTZWxlY3RvcikpO1xuICAgICAgY29uc3Qgcm93Q2VsbHMgPSByb3cuY2VsbHM7XG4gICAgICBjb25zdCBjZWxsSW5kZXggPSB0aGlzLmNlbGxJbmRleDtcbiAgICAgIGNvbnN0IG5ld0luZGV4ID0gTWF0aC5taW4ocm93Q2VsbHMubGVuZ3RoIC0gMSwgY2VsbEluZGV4ICsgMSk7XG4gICAgICBjb25zdCBuZXdDZWxsID0gcm93Q2VsbHNbbmV3SW5kZXhdO1xuICAgICAgaWYgKGRvZXNTa2lwS2V5Ym9hcmQobmV3Q2VsbCkgPT09IGZhbHNlKSB7XG4gICAgICAgIHJldHVybiBuZXdDZWxsO1xuICAgICAgfSBlbHNlIGlmIChuZXdJbmRleCA9PT0gcm93Q2VsbHMubGVuZ3RoIC0gMSkge1xuICAgICAgICByZXR1cm4gdGhpcy5lbGVtZW50O1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGNyZWF0ZUNlbGwobmV3Q2VsbCkubW92ZVJpZ2h0KCk7XG4gICAgICB9XG4gICAgfSxcbiAgICBtb3ZlTGVmdCgpe1xuICAgICAgY29uc3Qgcm93ID0gY3JlYXRlUm93KGZpbmRDb250YWluZXIodGhpcy5lbGVtZW50LCByb3dTZWxlY3RvcikpO1xuICAgICAgY29uc3Qgcm93Q2VsbHMgPSByb3cuY2VsbHM7XG4gICAgICBjb25zdCBjZWxsSW5kZXggPSB0aGlzLmNlbGxJbmRleDtcbiAgICAgIGNvbnN0IG5ld0luZGV4ID0gTWF0aC5tYXgoMCwgY2VsbEluZGV4IC0gMSk7XG4gICAgICBjb25zdCBuZXdDZWxsID0gcm93Q2VsbHNbbmV3SW5kZXhdO1xuICAgICAgaWYgKGRvZXNTa2lwS2V5Ym9hcmQobmV3Q2VsbCkgPT09IGZhbHNlKSB7XG4gICAgICAgIHJldHVybiBuZXdDZWxsO1xuICAgICAgfSBlbHNlIGlmIChuZXdJbmRleCA9PT0gMCkge1xuICAgICAgICByZXR1cm4gdGhpcy5lbGVtZW50O1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGNyZWF0ZUNlbGwobmV3Q2VsbCkubW92ZUxlZnQoKTtcbiAgICAgIH1cbiAgICB9XG4gIH07XG5cbiAgY29uc3QgdmlydHVhbENlbGxQcm90byA9IHtcbiAgICBtb3ZlUmlnaHQoKXtcbiAgICAgIGlmICh0aGlzLmN1cnJlbnRJbmRleCA9PT0gdGhpcy52aXJ0dWFsQ2VsbHMubGVuZ3RoIC0gMSkge1xuICAgICAgICBjb25zdCBuZXdDZWxsID0gY3JlYXRlQ2VsbCh0aGlzLmNlbGxFbGVtZW50KS5tb3ZlUmlnaHQoKTtcbiAgICAgICAgcmV0dXJuIG5ld0NlbGwgPT09IHRoaXMuY2VsbEVsZW1lbnQgPyB0aGlzLmVsZW1lbnQgOiBuZXdDZWxsO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudmlydHVhbENlbGxzW3RoaXMuY3VycmVudEluZGV4ICsgMV07XG4gICAgICB9XG4gICAgfSxcbiAgICBtb3ZlTGVmdCgpe1xuICAgICAgaWYgKHRoaXMuY3VycmVudEluZGV4ID09PSAwKSB7XG4gICAgICAgIGNvbnN0IG5ld0NlbGwgPSBjcmVhdGVDZWxsKHRoaXMuY2VsbEVsZW1lbnQpLm1vdmVMZWZ0KCk7XG4gICAgICAgIHJldHVybiBuZXdDZWxsID09PSB0aGlzLmNlbGxFbGVtZW50ID8gdGhpcy5lbGVtZW50IDogbmV3Q2VsbDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiB0aGlzLnZpcnR1YWxDZWxsc1t0aGlzLmN1cnJlbnRJbmRleCAtIDFdO1xuICAgICAgfVxuICAgIH1cbiAgfTtcblxuICBmdW5jdGlvbiBjcmVhdGVDZWxsIChjZWxsRWxlbWVudCkge1xuICAgIGNvbnN0IHJvdyA9IGZpbmRDb250YWluZXIoY2VsbEVsZW1lbnQsIHJvd1NlbGVjdG9yKTtcbiAgICByZXR1cm4gT2JqZWN0LmNyZWF0ZShjZWxsUHJvdG8sIHtcbiAgICAgIGNlbGxJbmRleDoge1xuICAgICAgICBnZXQoKXtcbiAgICAgICAgICByZXR1cm4gY2VsbEVsZW1lbnQuY2VsbEluZGV4ICE9PSB2b2lkIDAgPyBjZWxsRWxlbWVudC5jZWxsSW5kZXggOiBbLi4ucm93LnF1ZXJ5U2VsZWN0b3JBbGwoY2VsbFNlbGVjdG9yKV0uaW5kZXhPZihjZWxsRWxlbWVudCk7XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICBlbGVtZW50OiB7dmFsdWU6IGNlbGxFbGVtZW50fVxuICAgIH0pO1xuICB9XG5cbiAgZnVuY3Rpb24gY3JlYXRlQ29tcG9zaXRlQ2VsbCAoY2VsbEVsZW1lbnQsIGVsZW1lbnQpIHtcbiAgICBjb25zdCBzZWxlY3RvciA9IGNlbGxFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1rZXlib2FyZC1zZWxlY3RvcicpO1xuICAgIGNvbnN0IHZpcnR1YWxDZWxscyA9IFsuLi5jZWxsRWxlbWVudC5xdWVyeVNlbGVjdG9yQWxsKHNlbGVjdG9yKV07XG4gICAgY29uc3QgY3VycmVudEluZGV4ID0gdmlydHVhbENlbGxzLmluZGV4T2YoZWxlbWVudCk7XG4gICAgcmV0dXJuIE9iamVjdC5jcmVhdGUodmlydHVhbENlbGxQcm90bywge1xuICAgICAgdmlydHVhbENlbGxzOiB7dmFsdWU6IHZpcnR1YWxDZWxsc30sXG4gICAgICBjdXJyZW50SW5kZXg6IHt2YWx1ZTogY3VycmVudEluZGV4fSxcbiAgICAgIGNlbGxFbGVtZW50OiB7dmFsdWU6IGNlbGxFbGVtZW50fSxcbiAgICAgIGVsZW1lbnQ6IHt2YWx1ZTogZWxlbWVudH1cbiAgICB9KTtcbiAgfVxuXG4gIGNvbnN0IG1vdmVSaWdodCA9ICh0YXJnZXQpID0+IHtcbiAgICBjb25zdCBjZWxsRWxlbWVudCA9IGZpbmRDb250YWluZXIodGFyZ2V0LCBjZWxsU2VsZWN0b3IpO1xuICAgIGNvbnN0IGNlbGwgPSBjZWxsRWxlbWVudCA9PT0gdGFyZ2V0ID8gY3JlYXRlQ2VsbChjZWxsRWxlbWVudCkgOiBjcmVhdGVDb21wb3NpdGVDZWxsKGNlbGxFbGVtZW50LCB0YXJnZXQpO1xuICAgIHJldHVybiBjZWxsLm1vdmVSaWdodCgpO1xuICB9O1xuXG4gIGNvbnN0IG1vdmVMZWZ0ID0gdGFyZ2V0ID0+IHtcbiAgICBjb25zdCBjZWxsRWxlbWVudCA9IGZpbmRDb250YWluZXIodGFyZ2V0LCBjZWxsU2VsZWN0b3IpO1xuICAgIGNvbnN0IGNlbGwgPSBjZWxsRWxlbWVudCA9PT0gdGFyZ2V0ID8gY3JlYXRlQ2VsbChjZWxsRWxlbWVudCkgOiBjcmVhdGVDb21wb3NpdGVDZWxsKGNlbGxFbGVtZW50LCB0YXJnZXQpO1xuICAgIHJldHVybiBjZWxsLm1vdmVMZWZ0KCk7XG4gIH07XG5cbiAgY29uc3QgbW92ZVVwID0gdGFyZ2V0ID0+IHtcbiAgICBjb25zdCBjZWxsID0gY3JlYXRlQ2VsbChmaW5kQ29udGFpbmVyKHRhcmdldCwgY2VsbFNlbGVjdG9yKSk7XG4gICAgY29uc3Qgcm93ID0gY3JlYXRlUm93KGZpbmRDb250YWluZXIoY2VsbC5lbGVtZW50LCByb3dTZWxlY3RvcikpO1xuICAgIGNvbnN0IGNlbGxJbmRleCA9IGNlbGwuY2VsbEluZGV4O1xuICAgIGNvbnN0IG5ld1JvdyA9IGNyZWF0ZVJvdyhyb3cubW92ZVVwKCkpO1xuICAgIGNvbnN0IG5ld0NlbGwgPSBuZXdSb3cuY2VsbHNbTWF0aC5taW4obmV3Um93LmNlbGxzLmxlbmd0aCAtIDEsIGNlbGxJbmRleCldO1xuICAgIHJldHVybiBuZXdDZWxsLmhhc0F0dHJpYnV0ZSgnZGF0YS1rZXlib2FyZC1za2lwJykgPT09IGZhbHNlID8gbmV3Q2VsbCA6IGNyZWF0ZUNlbGwobmV3Q2VsbCkubW92ZUxlZnQoKTsgLy90b2RvIGdldCBcInZpcnR1YWxcIiBpbmRleCB0YWtpbmcgaW50byBhY2NvdW50IGNvbHNwYW5cbiAgfTtcblxuICBjb25zdCBtb3ZlRG93biA9IHRhcmdldCA9PiB7XG4gICAgY29uc3QgY2VsbCA9IGNyZWF0ZUNlbGwoZmluZENvbnRhaW5lcih0YXJnZXQsIGNlbGxTZWxlY3RvcikpO1xuICAgIGNvbnN0IHJvdyA9IGNyZWF0ZVJvdyhmaW5kQ29udGFpbmVyKGNlbGwuZWxlbWVudCwgcm93U2VsZWN0b3IpKTtcbiAgICBjb25zdCBjZWxsSW5kZXggPSBjZWxsLmNlbGxJbmRleDtcbiAgICBjb25zdCBuZXdSb3cgPSBjcmVhdGVSb3cocm93Lm1vdmVEb3duKCkpO1xuICAgIGNvbnN0IG5ld0NlbGwgPSBuZXdSb3cuY2VsbHNbTWF0aC5taW4obmV3Um93LmNlbGxzLmxlbmd0aCAtIDEsIGNlbGxJbmRleCldO1xuICAgIHJldHVybiBuZXdDZWxsLmhhc0F0dHJpYnV0ZSgnZGF0YS1rZXlib2FyZC1za2lwJykgPT09IGZhbHNlID8gbmV3Q2VsbCA6IGNyZWF0ZUNlbGwobmV3Q2VsbCkubW92ZUxlZnQoKTtcbiAgfTtcblxuICByZXR1cm4ge1xuICAgIG1vdmVEb3duLFxuICAgIG1vdmVMZWZ0LFxuICAgIG1vdmVVcCxcbiAgICBtb3ZlUmlnaHRcbiAgfTtcbn0iLCJpbXBvcnQge2tleUdyaWR9IGZyb20gJy4vbGliL2tleW1hcCc7XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGdyaWRLZXlNYXAgKGdyaWQsIHtjZWxsU2VsZWN0b3IgPSAndGQsdGgnLCByb3dTZWxlY3RvciA9ICd0cid9ID17fSkge1xuXG4gIGxldCBsYXN0Rm9jdXNlZCA9IG51bGw7XG5cbiAgY29uc3Qga2cgPSBrZXlHcmlkKGdyaWQsIHtjZWxsU2VsZWN0b3IsIHJvd1NlbGVjdG9yfSk7XG5cbiAgZ3JpZC5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgKGV2KSA9PiB7XG4gICAgY29uc3Qge3RhcmdldCwga2V5Q29kZX0gPWV2O1xuICAgIGxldCBuZXdGb2N1c2VkID0gbnVsbDtcbiAgICBpZiAoa2V5Q29kZSA9PT0gMzcpIHsvL2xlZnRcbiAgICAgIG5ld0ZvY3VzZWQgPSBrZy5tb3ZlTGVmdCh0YXJnZXQpO1xuICAgIH0gZWxzZSBpZiAoa2V5Q29kZSA9PT0gMzgpIHsvL3VwXG4gICAgICBuZXdGb2N1c2VkID0ga2cubW92ZVVwKHRhcmdldCk7XG4gICAgfSBlbHNlIGlmIChrZXlDb2RlID09PSAzOSkgey8vcmlnaHRcbiAgICAgIG5ld0ZvY3VzZWQgPSBrZy5tb3ZlUmlnaHQodGFyZ2V0KTtcbiAgICB9IGVsc2UgaWYgKGtleUNvZGUgPT09IDQwKSB7Ly9kb3duXG4gICAgICBuZXdGb2N1c2VkID0ga2cubW92ZURvd24odGFyZ2V0KTtcbiAgICB9XG4gICAgaWYgKG5ld0ZvY3VzZWQgIT09IG51bGwpIHtcbiAgICAgIGlmIChsYXN0Rm9jdXNlZCAhPT0gbnVsbCkge1xuICAgICAgICBsYXN0Rm9jdXNlZC5zZXRBdHRyaWJ1dGUoJ3RhYmluZGV4JywgJy0xJyk7XG4gICAgICB9XG4gICAgICBuZXdGb2N1c2VkLmZvY3VzKCk7XG4gICAgICBuZXdGb2N1c2VkLnNldEF0dHJpYnV0ZSgndGFiaW5kZXgnLCAnMCcpO1xuICAgICAgbGFzdEZvY3VzZWQgPSBuZXdGb2N1c2VkO1xuICAgIH1cbiAgfSk7XG5cbiAgbGV0IGhhc05vdFNraXBBdHRyaWJ1dGUgPSBlbCA9PiBlbC5oYXNBdHRyaWJ1dGUoJ2RhdGEta2V5Ym9hcmQtc2tpcCcpID09PSBmYWxzZTtcbiAgY29uc3Qgcm93cyA9IFsuLi5ncmlkLnF1ZXJ5U2VsZWN0b3JBbGwocm93U2VsZWN0b3IpXS5maWx0ZXIoaGFzTm90U2tpcEF0dHJpYnV0ZSk7XG4gIGZvciAobGV0IHIgb2Ygcm93cykge1xuICAgIGNvbnN0IGNlbGxzID0gWy4uLnIucXVlcnlTZWxlY3RvckFsbChjZWxsU2VsZWN0b3IpXS5maWx0ZXIoaGFzTm90U2tpcEF0dHJpYnV0ZSk7XG4gICAgZm9yIChsZXQgYyBvZiBjZWxscykge1xuICAgICAgaWYgKGxhc3RGb2N1c2VkID09PSBudWxsKSB7XG4gICAgICAgIGxhc3RGb2N1c2VkID0gYztcbiAgICAgIH1cbiAgICAgIGMuc2V0QXR0cmlidXRlKCd0YWJpbmRleCcsICctMScpO1xuICAgIH1cbiAgfVxuXG4gIGNvbnN0IGNlbGxzID0gWy4uLmdyaWQucXVlcnlTZWxlY3RvckFsbChjZWxsU2VsZWN0b3IpXTtcbiAgY29uc3QgY29tcG9zaXRlcyA9IGNlbGxzLmZpbHRlcihjID0+IGMuaGFzQXR0cmlidXRlKCdkYXRhLWtleWJvYXJkLXNlbGVjdG9yJykgPT09IHRydWUpO1xuICBmb3IgKGxldCBjIG9mIGNvbXBvc2l0ZXMpIHtcbiAgICBjLmFkZEV2ZW50TGlzdGVuZXIoJ2ZvY3VzJywgZXYgPT4ge1xuICAgICAgY29uc3Qgc2VsZWN0b3IgPSBjLmdldEF0dHJpYnV0ZSgnZGF0YS1rZXlib2FyZC1zZWxlY3RvcicpO1xuICAgICAgY29uc3QgaXRlbSA9IGMucXVlcnlTZWxlY3RvcihzZWxlY3Rvcik7XG4gICAgICBpdGVtLmZvY3VzKCk7XG4gICAgfSk7XG4gIH1cblxuICBsYXN0Rm9jdXNlZC5zZXRBdHRyaWJ1dGUoJ3RhYmluZGV4JywnMCcpO1xufSIsImltcG9ydCBrZXltYXAgZnJvbSAnLi4vLi4vaW5kZXgnO1xuXG5rZXltYXAoZG9jdW1lbnQucXVlcnlTZWxlY3RvcignW3JvbGU9Z3JpZF0nKSx7XG4gIHJvd1NlbGVjdG9yOidbcm9sZT1yb3ddJyxcbiAgY2VsbFNlbGVjdG9yOidbcm9sZT1ncmlkY2VsbF0nXG59KTsiXSwibmFt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
