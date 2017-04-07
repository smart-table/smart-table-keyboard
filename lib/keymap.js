const findContainer = (element, selector) => element.matches(selector) === true ? element : findContainer(element.parentElement, selector);

export function keyGrid (grid, {cellSelector, rowSelector}) {

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