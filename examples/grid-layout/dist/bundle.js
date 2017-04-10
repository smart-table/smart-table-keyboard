(function () {
'use strict';

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
  } else if (el.getAttribute(dataSkipAttribute) === 'true') {
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

function keyGrid$1 (grid, options) {
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

var keyGrid$$1 = function (grid, {rowSelector = 'tr', cellSelector = 'td,th'}={}) {
  let lastFocus = null;

  const isNavigable = r => r.getAttribute(dataSkipAttribute) !== 'true';
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

  const kg = keyGrid$1(grid, {rowSelector, cellSelector});

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
};

keyGrid$$1(document.querySelector('[role=grid]'), {
  rowSelector: '[role=row]',
  cellSelector: '[role=gridcell]'
});

}());
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnVuZGxlLmpzIiwic291cmNlcyI6WyIuLi8uLi8uLi9saWIvdXRpbC5qcyIsIi4uLy4uLy4uL2xpYi9jZWxsLmpzIiwiLi4vLi4vLi4vbGliL3Jvdy5qcyIsIi4uLy4uLy4uL2xpYi9rZXlncmlkLmpzIiwiLi4vLi4vLi4vaW5kZXguanMiLCIuLi9pbmRleC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJleHBvcnQgY29uc3QgZmluZENvbnRhaW5lciA9IChlbGVtZW50LCBzZWxlY3RvcikgPT4gZWxlbWVudC5tYXRjaGVzKHNlbGVjdG9yKSA9PT0gdHJ1ZSA/IGVsZW1lbnQgOiBmaW5kQ29udGFpbmVyKGVsZW1lbnQucGFyZW50RWxlbWVudCwgc2VsZWN0b3IpO1xuZXhwb3J0IGNvbnN0IGRhdGFTZWxlY3RvckF0dHJpYnV0ZSA9ICdkYXRhLWtleWJvYXJkLXNlbGVjdG9yJztcbmV4cG9ydCBjb25zdCBkYXRhU2tpcEF0dHJpYnV0ZSA9ICdkYXRhLWtleWJvYXJkLXNraXAnO1xuZXhwb3J0IGNvbnN0IHZhbEZ1bmMgPSB2YWwgPT4gKCkgPT4gdmFsO1xuZXhwb3J0IGNvbnN0IHZhbE51bGwgPSB2YWxGdW5jKG51bGwpOyIsImltcG9ydCB7XG4gIGZpbmRDb250YWluZXIsXG4gIGRhdGFTZWxlY3RvckF0dHJpYnV0ZSxcbiAgZGF0YVNraXBBdHRyaWJ1dGUsXG4gIHZhbEZ1bmNcbn0gZnJvbSAnLi91dGlsJztcblxuZXhwb3J0IGZ1bmN0aW9uIHJlZ3VsYXJDZWxsIChlbGVtZW50LCB7cm93U2VsZWN0b3IsIGNlbGxTZWxlY3Rvcn0pIHtcbiAgY29uc3Qgcm93ID0gZmluZENvbnRhaW5lcihlbGVtZW50LCByb3dTZWxlY3Rvcik7XG4gIGNvbnN0IGNlbGxzID0gWy4uLnJvdy5xdWVyeVNlbGVjdG9yQWxsKGNlbGxTZWxlY3RvcildO1xuICBjb25zdCBpbmRleCA9IGNlbGxzLmluZGV4T2YoZWxlbWVudCk7XG4gIGNvbnN0IHJldHVybkVsID0gdmFsRnVuYyhlbGVtZW50KTtcbiAgcmV0dXJuIHtcbiAgICBzZWxlY3RGcm9tQWZ0ZXI6IHJldHVybkVsLFxuICAgIHNlbGVjdEZyb21CZWZvcmU6IHJldHVybkVsLFxuICAgIG5leHQoKXtcbiAgICAgIHJldHVybiBjZWxsc1tpbmRleCArIDFdICE9PSB2b2lkIDAgPyBjZWxsc1tpbmRleCArIDFdIDogbnVsbDtcbiAgICB9LFxuICAgIHByZXZpb3VzKCl7XG4gICAgICByZXR1cm4gY2VsbHNbaW5kZXggLSAxXSAhPT0gdm9pZCAwID8gY2VsbHNbaW5kZXggLSAxXSA6IG51bGw7XG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBza2lwQ2VsbCAoZWxlbWVudCwgb3B0aW9ucykge1xuICBjb25zdCByZWcgPSByZWd1bGFyQ2VsbChlbGVtZW50LCBvcHRpb25zKTtcbiAgcmV0dXJuIHtcbiAgICBwcmV2aW91czogcmVnLnByZXZpb3VzLFxuICAgIG5leHQ6IHJlZy5uZXh0XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNvbXBvc2l0ZUNlbGwgKGVsZW1lbnQsIG9wdGlvbnMpIHtcbiAgY29uc3QgY2VsbEVsZW1lbnQgPSBmaW5kQ29udGFpbmVyKGVsZW1lbnQsIG9wdGlvbnMuY2VsbFNlbGVjdG9yKTtcbiAgY29uc3Qgc2VsZWN0b3IgPSBjZWxsRWxlbWVudC5nZXRBdHRyaWJ1dGUoZGF0YVNlbGVjdG9yQXR0cmlidXRlKTtcbiAgY29uc3Qgc3ViV2lkZ2V0cyA9IFsuLi5jZWxsRWxlbWVudC5xdWVyeVNlbGVjdG9yQWxsKHNlbGVjdG9yKV07XG4gIGNvbnN0IHdpZGdldHNMZW5ndGggPSBzdWJXaWRnZXRzLmxlbmd0aDtcbiAgY29uc3QgaXNTdWJXaWRnZXQgPSBlbGVtZW50ICE9PSBjZWxsRWxlbWVudDtcbiAgcmV0dXJuIHtcbiAgICBzZWxlY3RGcm9tQmVmb3JlKCl7XG4gICAgICByZXR1cm4gaXNTdWJXaWRnZXQgPyBlbGVtZW50IDogc3ViV2lkZ2V0c1swXTtcbiAgICB9LFxuICAgIHNlbGVjdEZyb21BZnRlcigpe1xuICAgICAgcmV0dXJuIGlzU3ViV2lkZ2V0ID8gZWxlbWVudCA6IHN1YldpZGdldHNbd2lkZ2V0c0xlbmd0aCAtIDFdO1xuICAgIH0sXG4gICAgbmV4dCgpe1xuICAgICAgY29uc3QgaW5kZXggPSBzdWJXaWRnZXRzLmluZGV4T2YoZWxlbWVudCk7XG4gICAgICBpZiAoaXNTdWJXaWRnZXQgJiYgaW5kZXggKyAxIDwgd2lkZ2V0c0xlbmd0aCkge1xuICAgICAgICByZXR1cm4gc3ViV2lkZ2V0c1tpbmRleCArIDFdO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHJlZ3VsYXJDZWxsKGNlbGxFbGVtZW50LCBvcHRpb25zKS5uZXh0KCk7XG4gICAgICB9XG4gICAgfSxcbiAgICBwcmV2aW91cygpe1xuICAgICAgY29uc3QgaW5kZXggPSBzdWJXaWRnZXRzLmluZGV4T2YoZWxlbWVudCk7XG4gICAgICBpZiAoaXNTdWJXaWRnZXQgJiYgaW5kZXggPiAwKSB7XG4gICAgICAgIHJldHVybiBzdWJXaWRnZXRzW2luZGV4IC0gMV07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gcmVndWxhckNlbGwoY2VsbEVsZW1lbnQsIG9wdGlvbnMpLnByZXZpb3VzKCk7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVDZWxsIChlbCwgb3B0aW9ucykge1xuICBpZiAoZWwgPT09IG51bGwpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfSBlbHNlIGlmIChlbC5nZXRBdHRyaWJ1dGUoZGF0YVNraXBBdHRyaWJ1dGUpID09PSAndHJ1ZScpIHtcbiAgICByZXR1cm4gc2tpcENlbGwoZWwsIG9wdGlvbnMpO1xuICB9IGVsc2UgaWYgKGVsLmhhc0F0dHJpYnV0ZShkYXRhU2VsZWN0b3JBdHRyaWJ1dGUpIHx8ICFlbC5tYXRjaGVzKG9wdGlvbnMuY2VsbFNlbGVjdG9yKSkge1xuICAgIHJldHVybiBjb21wb3NpdGVDZWxsKGVsLCBvcHRpb25zKTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gcmVndWxhckNlbGwoZWwsIG9wdGlvbnMpO1xuICB9XG59IiwiaW1wb3J0IHtmaW5kQ29udGFpbmVyLCBkYXRhU2tpcEF0dHJpYnV0ZX0gZnJvbSAnLi91dGlsJztcblxuZXhwb3J0IGZ1bmN0aW9uIHJlZ3VsYXJSb3cgKGVsZW1lbnQsIGdyaWQsIHtyb3dTZWxlY3RvciA9ICd0cicsIGNlbGxTZWxlY3RvciA9ICd0aCx0ZCd9PXt9KSB7XG4gIGNvbnN0IHJvd3MgPSBbLi4uZ3JpZC5xdWVyeVNlbGVjdG9yQWxsKHJvd1NlbGVjdG9yKV07XG4gIGNvbnN0IGNlbGxzID0gWy4uLmVsZW1lbnQucXVlcnlTZWxlY3RvckFsbChjZWxsU2VsZWN0b3IpXTtcbiAgY29uc3QgaW5kZXggPSByb3dzLmluZGV4T2YoZWxlbWVudCk7XG4gIHJldHVybiB7XG4gICAgcHJldmlvdXMoKXtcbiAgICAgIHJldHVybiByb3dzW2luZGV4IC0gMV0gIT09IHZvaWQgMCA/IHJvd3NbaW5kZXggLSAxXSA6IG51bGw7XG4gICAgfSxcbiAgICBuZXh0KCl7XG4gICAgICByZXR1cm4gcm93c1tpbmRleCArIDFdICE9PSB2b2lkIDAgPyByb3dzW2luZGV4ICsgMV0gOiBudWxsO1xuICAgIH0sXG4gICAgaXRlbShpbmRleCl7XG4gICAgICByZXR1cm4gY2VsbHNbaW5kZXhdICE9PSB2b2lkIDAgPyBjZWxsc1tpbmRleF0gOiBudWxsO1xuICAgIH1cbiAgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNraXBSb3cgKGVsZW1lbnQsIGdyaWQsIG9wdGlvbnMpIHtcbiAgY29uc3QgcmVndWxhciA9IHJlZ3VsYXJSb3coZWxlbWVudCwgZ3JpZCwgb3B0aW9ucyk7XG4gIHJldHVybiB7XG4gICAgcHJldmlvdXM6IHJlZ3VsYXIucHJldmlvdXMsXG4gICAgbmV4dDogcmVndWxhci5uZXh0XG4gIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVSb3cgKHRhcmdldCwgZ3JpZCwge3Jvd1NlbGVjdG9yLCBjZWxsU2VsZWN0b3J9PXt9KSB7XG4gIGlmICh0YXJnZXQgPT09IG51bGwpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuICBjb25zdCByID0gZmluZENvbnRhaW5lcih0YXJnZXQsIHJvd1NlbGVjdG9yKTtcbiAgcmV0dXJuIHIuaGFzQXR0cmlidXRlKGRhdGFTa2lwQXR0cmlidXRlKSA/IHNraXBSb3cociwgZ3JpZCwge1xuICAgICAgcm93U2VsZWN0b3IsXG4gICAgICBjZWxsU2VsZWN0b3JcbiAgICB9KSA6IHJlZ3VsYXJSb3codGFyZ2V0LCBncmlkLCB7cm93U2VsZWN0b3IsIGNlbGxTZWxlY3Rvcn0pO1xufSIsImltcG9ydCB7Y3JlYXRlQ2VsbH0gZnJvbSAnLi9jZWxsJztcbmltcG9ydCB7Y3JlYXRlUm93fSBmcm9tICcuL3Jvdyc7XG5pbXBvcnQge2ZpbmRDb250YWluZXJ9IGZyb20gJy4vdXRpbCc7XG5cbmV4cG9ydCBmdW5jdGlvbiBrZXlHcmlkIChncmlkLCBvcHRpb25zKSB7XG4gIGNvbnN0IHtyb3dTZWxlY3RvciwgY2VsbFNlbGVjdG9yfSA9IG9wdGlvbnM7XG4gIHJldHVybiB7XG4gICAgbW92ZVJpZ2h0KHRhcmdldCl7XG4gICAgICBjb25zdCBjZWxsID0gY3JlYXRlQ2VsbCh0YXJnZXQsIG9wdGlvbnMpO1xuICAgICAgbGV0IG5ld0NlbGwgPSBjcmVhdGVDZWxsKGNlbGwubmV4dCgpLCBvcHRpb25zKTtcbiAgICAgIHdoaWxlIChuZXdDZWxsICE9PSBudWxsICYmIG5ld0NlbGwuc2VsZWN0RnJvbUJlZm9yZSA9PT0gdm9pZCAwKSB7XG4gICAgICAgIG5ld0NlbGwgPSBjcmVhdGVDZWxsKG5ld0NlbGwubmV4dCgpLCBvcHRpb25zKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBuZXdDZWxsICE9PSBudWxsID8gbmV3Q2VsbC5zZWxlY3RGcm9tQmVmb3JlKCkgOiB0YXJnZXQ7XG4gICAgfSxcbiAgICBtb3ZlTGVmdCh0YXJnZXQpe1xuICAgICAgY29uc3QgY2VsbCA9IGNyZWF0ZUNlbGwodGFyZ2V0LCBvcHRpb25zKTtcbiAgICAgIGxldCBuZXdDZWxsID0gY3JlYXRlQ2VsbChjZWxsLnByZXZpb3VzKCksIG9wdGlvbnMpO1xuICAgICAgd2hpbGUgKG5ld0NlbGwgIT09IG51bGwgJiYgbmV3Q2VsbC5zZWxlY3RGcm9tQWZ0ZXIgPT09IHZvaWQgMCkge1xuICAgICAgICBuZXdDZWxsID0gY3JlYXRlQ2VsbChuZXdDZWxsLnByZXZpb3VzKCksIG9wdGlvbnMpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIG5ld0NlbGwgIT09IG51bGwgPyBuZXdDZWxsLnNlbGVjdEZyb21BZnRlcigpIDogdGFyZ2V0O1xuICAgIH0sXG4gICAgbW92ZVVwKHRhcmdldCl7XG4gICAgICBjb25zdCByb3dFbGVtZW50ID0gZmluZENvbnRhaW5lcih0YXJnZXQsIHJvd1NlbGVjdG9yKTtcbiAgICAgIGNvbnN0IGNlbGxzID0gWy4uLnJvd0VsZW1lbnQucXVlcnlTZWxlY3RvckFsbChjZWxsU2VsZWN0b3IpXTtcbiAgICAgIGNvbnN0IHJvdyA9IGNyZWF0ZVJvdyhyb3dFbGVtZW50LCBncmlkLCBvcHRpb25zKTtcbiAgICAgIGxldCBuZXdSb3cgPSBjcmVhdGVSb3cocm93LnByZXZpb3VzKCksIGdyaWQsIG9wdGlvbnMpO1xuICAgICAgd2hpbGUgKG5ld1JvdyAhPT0gbnVsbCAmJiBuZXdSb3cuaXRlbSA9PT0gdm9pZCAwKSB7XG4gICAgICAgIG5ld1JvdyA9IGNyZWF0ZVJvdyhuZXdSb3cucHJldmlvdXMoKSwgZ3JpZCwgb3B0aW9ucyk7XG4gICAgICB9XG5cbiAgICAgIGlmIChuZXdSb3cgPT09IG51bGwpIHtcbiAgICAgICAgcmV0dXJuIHRhcmdldDtcbiAgICAgIH1cblxuICAgICAgbGV0IGFza2VkSW5kZXggPSBjZWxscy5pbmRleE9mKGZpbmRDb250YWluZXIodGFyZ2V0LCBjZWxsU2VsZWN0b3IpKTtcbiAgICAgIGxldCBuZXdDZWxsID0gY3JlYXRlQ2VsbChuZXdSb3cuaXRlbShhc2tlZEluZGV4KSwgb3B0aW9ucyk7XG4gICAgICB3aGlsZSAobmV3Q2VsbCA9PT0gbnVsbCB8fCBuZXdDZWxsLnNlbGVjdEZyb21CZWZvcmUgPT09IHZvaWQgMCAmJiBhc2tlZEluZGV4ID4gMCkge1xuICAgICAgICBhc2tlZEluZGV4LS07XG4gICAgICAgIG5ld0NlbGwgPSBjcmVhdGVDZWxsKG5ld1Jvdy5pdGVtKGFza2VkSW5kZXgpLCBvcHRpb25zKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBuZXdDZWxsLnNlbGVjdEZyb21CZWZvcmUoKTtcbiAgICB9LFxuICAgIG1vdmVEb3duKHRhcmdldCl7XG4gICAgICBjb25zdCByb3dFbGVtZW50ID0gZmluZENvbnRhaW5lcih0YXJnZXQsIHJvd1NlbGVjdG9yKTtcbiAgICAgIGNvbnN0IGNlbGxzID0gWy4uLnJvd0VsZW1lbnQucXVlcnlTZWxlY3RvckFsbChjZWxsU2VsZWN0b3IpXTtcbiAgICAgIGNvbnN0IHJvdyA9IGNyZWF0ZVJvdyhyb3dFbGVtZW50LCBncmlkLCBvcHRpb25zKTtcbiAgICAgIGxldCBuZXdSb3cgPSBjcmVhdGVSb3cocm93Lm5leHQoKSwgZ3JpZCwgb3B0aW9ucyk7XG4gICAgICB3aGlsZSAobmV3Um93ICE9PSBudWxsICYmIG5ld1Jvdy5pdGVtID09PSB2b2lkIDApIHtcbiAgICAgICAgbmV3Um93ID0gY3JlYXRlUm93KG5ld1Jvdy5uZXh0KCksIGdyaWQsIG9wdGlvbnMpO1xuICAgICAgfVxuXG4gICAgICBpZiAobmV3Um93ID09PSBudWxsKSB7XG4gICAgICAgIHJldHVybiB0YXJnZXQ7XG4gICAgICB9XG5cbiAgICAgIGxldCBhc2tlZEluZGV4ID0gY2VsbHMuaW5kZXhPZihmaW5kQ29udGFpbmVyKHRhcmdldCwgY2VsbFNlbGVjdG9yKSk7XG4gICAgICBsZXQgbmV3Q2VsbCA9IGNyZWF0ZUNlbGwobmV3Um93Lml0ZW0oYXNrZWRJbmRleCksIG9wdGlvbnMpO1xuICAgICAgd2hpbGUgKG5ld0NlbGwgPT09IG51bGwgfHwgbmV3Q2VsbC5zZWxlY3RGcm9tQmVmb3JlID09PSB2b2lkIDAgJiYgYXNrZWRJbmRleCA+IDApIHtcbiAgICAgICAgYXNrZWRJbmRleC0tO1xuICAgICAgICBuZXdDZWxsID0gY3JlYXRlQ2VsbChuZXdSb3cuaXRlbShhc2tlZEluZGV4KSwgb3B0aW9ucyk7XG4gICAgICB9XG4gICAgICByZXR1cm4gbmV3Q2VsbC5zZWxlY3RGcm9tQmVmb3JlKCk7XG4gICAgfVxuICB9XG59IiwiaW1wb3J0IHtrZXlHcmlkfSBmcm9tICcuL2xpYi9rZXlncmlkJztcbmltcG9ydCB7ZGF0YVNraXBBdHRyaWJ1dGV9IGZyb20gJy4vbGliL3V0aWwnXG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIChncmlkLCB7cm93U2VsZWN0b3IgPSAndHInLCBjZWxsU2VsZWN0b3IgPSAndGQsdGgnfT17fSkge1xuICBsZXQgbGFzdEZvY3VzID0gbnVsbDtcblxuICBjb25zdCBpc05hdmlnYWJsZSA9IHIgPT4gci5nZXRBdHRyaWJ1dGUoZGF0YVNraXBBdHRyaWJ1dGUpICE9PSAndHJ1ZSc7XG4gIGNvbnN0IG5hdmlnYWJsZVJvd3MgPSBbLi4uZ3JpZC5xdWVyeVNlbGVjdG9yQWxsKHJvd1NlbGVjdG9yKV0uZmlsdGVyKGlzTmF2aWdhYmxlKTtcbiAgZm9yIChsZXQgcm93IG9mIG5hdmlnYWJsZVJvd3MpIHtcbiAgICBjb25zdCBuYXZpZ2FibGVDZWxscyA9IFsuLi5yb3cucXVlcnlTZWxlY3RvckFsbChjZWxsU2VsZWN0b3IpXS5maWx0ZXIoaXNOYXZpZ2FibGUpO1xuICAgIGZvciAobGV0IGMgb2YgbmF2aWdhYmxlQ2VsbHMpIHtcbiAgICAgIGlmIChsYXN0Rm9jdXMgPT09IG51bGwpIHtcbiAgICAgICAgbGFzdEZvY3VzID0gYztcbiAgICAgICAgYy5zZXRBdHRyaWJ1dGUoJ3RhYmluZGV4JywgJzAnKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGMuc2V0QXR0cmlidXRlKCd0YWJpbmRleCcsICctMScpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGNvbnN0IGtnID0ga2V5R3JpZChncmlkLCB7cm93U2VsZWN0b3IsIGNlbGxTZWxlY3Rvcn0pO1xuXG4gIGdyaWQuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsICh7dGFyZ2V0LCBrZXlDb2RlfSkgPT4ge1xuICAgIGxldCBuZXdDZWxsID0gbnVsbDtcbiAgICBpZiAoa2V5Q29kZSA9PT0gMzcpIHtcbiAgICAgIG5ld0NlbGwgPSBrZy5tb3ZlTGVmdCh0YXJnZXQpO1xuICAgIH0gZWxzZSBpZiAoa2V5Q29kZSA9PT0gMzgpIHtcbiAgICAgIG5ld0NlbGwgPSBrZy5tb3ZlVXAodGFyZ2V0KTtcbiAgICB9IGVsc2UgaWYgKGtleUNvZGUgPT09IDM5KSB7XG4gICAgICBuZXdDZWxsID0ga2cubW92ZVJpZ2h0KHRhcmdldCk7XG4gICAgfSBlbHNlIGlmIChrZXlDb2RlID09PSA0MCkge1xuICAgICAgbmV3Q2VsbCA9IGtnLm1vdmVEb3duKHRhcmdldCk7XG4gICAgfVxuXG4gICAgaWYgKG5ld0NlbGwgIT09IG51bGwpIHtcbiAgICAgIG5ld0NlbGwuZm9jdXMoKTtcbiAgICAgIGlmIChsYXN0Rm9jdXMgIT09IG51bGwpIHtcbiAgICAgICAgbGFzdEZvY3VzLnNldEF0dHJpYnV0ZSgndGFiaW5kZXgnLCAnLTEnKTtcbiAgICAgIH1cbiAgICAgIG5ld0NlbGwuc2V0QXR0cmlidXRlKCd0YWJpbmRleCcsICcwJyk7XG4gICAgICBsYXN0Rm9jdXMgPSBuZXdDZWxsO1xuICAgIH1cbiAgfSk7XG59IiwiaW1wb3J0IGtleUdyaWQgZnJvbSAnLi4vLi4vaW5kZXgnO1xua2V5R3JpZChkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdbcm9sZT1ncmlkXScpLCB7XG4gIHJvd1NlbGVjdG9yOiAnW3JvbGU9cm93XScsXG4gIGNlbGxTZWxlY3RvcjogJ1tyb2xlPWdyaWRjZWxsXSdcbn0pOyJdLCJuYW1lcyI6WyJrZXlHcmlkIl0sIm1hcHBpbmdzIjoiOzs7QUFBTyxNQUFNLGFBQWEsR0FBRyxDQUFDLE9BQU8sRUFBRSxRQUFRLEtBQUssT0FBTyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsS0FBSyxJQUFJLEdBQUcsT0FBTyxHQUFHLGFBQWEsQ0FBQyxPQUFPLENBQUMsYUFBYSxFQUFFLFFBQVEsQ0FBQyxDQUFDO0FBQ2xKLEFBQU8sTUFBTSxxQkFBcUIsR0FBRyx3QkFBd0IsQ0FBQztBQUM5RCxBQUFPLE1BQU0saUJBQWlCLEdBQUcsb0JBQW9CLENBQUM7QUFDdEQsQUFBTyxNQUFNLE9BQU8sR0FBRyxHQUFHLElBQUksTUFBTSxHQUFHLENBQUMsQUFDeEMsQUFBTzs7QUNHQSxTQUFTLFdBQVcsRUFBRSxPQUFPLEVBQUUsQ0FBQyxXQUFXLEVBQUUsWUFBWSxDQUFDLEVBQUU7RUFDakUsTUFBTSxHQUFHLEdBQUcsYUFBYSxDQUFDLE9BQU8sRUFBRSxXQUFXLENBQUMsQ0FBQztFQUNoRCxNQUFNLEtBQUssR0FBRyxDQUFDLEdBQUcsR0FBRyxDQUFDLGdCQUFnQixDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUM7RUFDdEQsTUFBTSxLQUFLLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQztFQUNyQyxNQUFNLFFBQVEsR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUM7RUFDbEMsT0FBTztJQUNMLGVBQWUsRUFBRSxRQUFRO0lBQ3pCLGdCQUFnQixFQUFFLFFBQVE7SUFDMUIsSUFBSSxFQUFFO01BQ0osT0FBTyxLQUFLLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQyxLQUFLLEtBQUssQ0FBQyxHQUFHLEtBQUssQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDO0tBQzlEO0lBQ0QsUUFBUSxFQUFFO01BQ1IsT0FBTyxLQUFLLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQyxLQUFLLEtBQUssQ0FBQyxHQUFHLEtBQUssQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDO0tBQzlEO0dBQ0Y7Q0FDRjs7QUFFRCxBQUFPLFNBQVMsUUFBUSxFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUU7RUFDMUMsTUFBTSxHQUFHLEdBQUcsV0FBVyxDQUFDLE9BQU8sRUFBRSxPQUFPLENBQUMsQ0FBQztFQUMxQyxPQUFPO0lBQ0wsUUFBUSxFQUFFLEdBQUcsQ0FBQyxRQUFRO0lBQ3RCLElBQUksRUFBRSxHQUFHLENBQUMsSUFBSTtHQUNmO0NBQ0Y7O0FBRUQsQUFBTyxTQUFTLGFBQWEsRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFO0VBQy9DLE1BQU0sV0FBVyxHQUFHLGFBQWEsQ0FBQyxPQUFPLEVBQUUsT0FBTyxDQUFDLFlBQVksQ0FBQyxDQUFDO0VBQ2pFLE1BQU0sUUFBUSxHQUFHLFdBQVcsQ0FBQyxZQUFZLENBQUMscUJBQXFCLENBQUMsQ0FBQztFQUNqRSxNQUFNLFVBQVUsR0FBRyxDQUFDLEdBQUcsV0FBVyxDQUFDLGdCQUFnQixDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7RUFDL0QsTUFBTSxhQUFhLEdBQUcsVUFBVSxDQUFDLE1BQU0sQ0FBQztFQUN4QyxNQUFNLFdBQVcsR0FBRyxPQUFPLEtBQUssV0FBVyxDQUFDO0VBQzVDLE9BQU87SUFDTCxnQkFBZ0IsRUFBRTtNQUNoQixPQUFPLFdBQVcsR0FBRyxPQUFPLEdBQUcsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDO0tBQzlDO0lBQ0QsZUFBZSxFQUFFO01BQ2YsT0FBTyxXQUFXLEdBQUcsT0FBTyxHQUFHLFVBQVUsQ0FBQyxhQUFhLEdBQUcsQ0FBQyxDQUFDLENBQUM7S0FDOUQ7SUFDRCxJQUFJLEVBQUU7TUFDSixNQUFNLEtBQUssR0FBRyxVQUFVLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDO01BQzFDLElBQUksV0FBVyxJQUFJLEtBQUssR0FBRyxDQUFDLEdBQUcsYUFBYSxFQUFFO1FBQzVDLE9BQU8sVUFBVSxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUMsQ0FBQztPQUM5QixNQUFNO1FBQ0wsT0FBTyxXQUFXLENBQUMsV0FBVyxFQUFFLE9BQU8sQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDO09BQ2pEO0tBQ0Y7SUFDRCxRQUFRLEVBQUU7TUFDUixNQUFNLEtBQUssR0FBRyxVQUFVLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDO01BQzFDLElBQUksV0FBVyxJQUFJLEtBQUssR0FBRyxDQUFDLEVBQUU7UUFDNUIsT0FBTyxVQUFVLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQyxDQUFDO09BQzlCLE1BQU07UUFDTCxPQUFPLFdBQVcsQ0FBQyxXQUFXLEVBQUUsT0FBTyxDQUFDLENBQUMsUUFBUSxFQUFFLENBQUM7T0FDckQ7S0FDRjtHQUNGO0NBQ0Y7O0FBRUQsQUFBTyxTQUFTLFVBQVUsRUFBRSxFQUFFLEVBQUUsT0FBTyxFQUFFO0VBQ3ZDLElBQUksRUFBRSxLQUFLLElBQUksRUFBRTtJQUNmLE9BQU8sSUFBSSxDQUFDO0dBQ2IsTUFBTSxJQUFJLEVBQUUsQ0FBQyxZQUFZLENBQUMsaUJBQWlCLENBQUMsS0FBSyxNQUFNLEVBQUU7SUFDeEQsT0FBTyxRQUFRLENBQUMsRUFBRSxFQUFFLE9BQU8sQ0FBQyxDQUFDO0dBQzlCLE1BQU0sSUFBSSxFQUFFLENBQUMsWUFBWSxDQUFDLHFCQUFxQixDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxZQUFZLENBQUMsRUFBRTtJQUN0RixPQUFPLGFBQWEsQ0FBQyxFQUFFLEVBQUUsT0FBTyxDQUFDLENBQUM7R0FDbkMsTUFBTTtJQUNMLE9BQU8sV0FBVyxDQUFDLEVBQUUsRUFBRSxPQUFPLENBQUMsQ0FBQztHQUNqQzs7O0FDdkVJLFNBQVMsVUFBVSxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsQ0FBQyxXQUFXLEdBQUcsSUFBSSxFQUFFLFlBQVksR0FBRyxPQUFPLENBQUMsQ0FBQyxFQUFFLEVBQUU7RUFDMUYsTUFBTSxJQUFJLEdBQUcsQ0FBQyxHQUFHLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDO0VBQ3JELE1BQU0sS0FBSyxHQUFHLENBQUMsR0FBRyxPQUFPLENBQUMsZ0JBQWdCLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQztFQUMxRCxNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0VBQ3BDLE9BQU87SUFDTCxRQUFRLEVBQUU7TUFDUixPQUFPLElBQUksQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLEtBQUssS0FBSyxDQUFDLEdBQUcsSUFBSSxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUM7S0FDNUQ7SUFDRCxJQUFJLEVBQUU7TUFDSixPQUFPLElBQUksQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLEtBQUssS0FBSyxDQUFDLEdBQUcsSUFBSSxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUM7S0FDNUQ7SUFDRCxJQUFJLENBQUMsS0FBSyxDQUFDO01BQ1QsT0FBTyxLQUFLLENBQUMsS0FBSyxDQUFDLEtBQUssS0FBSyxDQUFDLEdBQUcsS0FBSyxDQUFDLEtBQUssQ0FBQyxHQUFHLElBQUksQ0FBQztLQUN0RDtHQUNGLENBQUM7Q0FDSDs7QUFFRCxBQUFPLFNBQVMsT0FBTyxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFO0VBQy9DLE1BQU0sT0FBTyxHQUFHLFVBQVUsQ0FBQyxPQUFPLEVBQUUsSUFBSSxFQUFFLE9BQU8sQ0FBQyxDQUFDO0VBQ25ELE9BQU87SUFDTCxRQUFRLEVBQUUsT0FBTyxDQUFDLFFBQVE7SUFDMUIsSUFBSSxFQUFFLE9BQU8sQ0FBQyxJQUFJO0dBQ25CLENBQUM7Q0FDSDs7QUFFRCxBQUFPLFNBQVMsU0FBUyxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsQ0FBQyxXQUFXLEVBQUUsWUFBWSxDQUFDLENBQUMsRUFBRSxFQUFFO0VBQ3ZFLElBQUksTUFBTSxLQUFLLElBQUksRUFBRTtJQUNuQixPQUFPLElBQUksQ0FBQztHQUNiO0VBQ0QsTUFBTSxDQUFDLEdBQUcsYUFBYSxDQUFDLE1BQU0sRUFBRSxXQUFXLENBQUMsQ0FBQztFQUM3QyxPQUFPLENBQUMsQ0FBQyxZQUFZLENBQUMsaUJBQWlCLENBQUMsR0FBRyxPQUFPLENBQUMsQ0FBQyxFQUFFLElBQUksRUFBRTtNQUN4RCxXQUFXO01BQ1gsWUFBWTtLQUNiLENBQUMsR0FBRyxVQUFVLENBQUMsTUFBTSxFQUFFLElBQUksRUFBRSxDQUFDLFdBQVcsRUFBRSxZQUFZLENBQUMsQ0FBQyxDQUFDOzs7QUMvQnhELFNBQVNBLFNBQU8sRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFO0VBQ3RDLE1BQU0sQ0FBQyxXQUFXLEVBQUUsWUFBWSxDQUFDLEdBQUcsT0FBTyxDQUFDO0VBQzVDLE9BQU87SUFDTCxTQUFTLENBQUMsTUFBTSxDQUFDO01BQ2YsTUFBTSxJQUFJLEdBQUcsVUFBVSxDQUFDLE1BQU0sRUFBRSxPQUFPLENBQUMsQ0FBQztNQUN6QyxJQUFJLE9BQU8sR0FBRyxVQUFVLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxFQUFFLE9BQU8sQ0FBQyxDQUFDO01BQy9DLE9BQU8sT0FBTyxLQUFLLElBQUksSUFBSSxPQUFPLENBQUMsZ0JBQWdCLEtBQUssS0FBSyxDQUFDLEVBQUU7UUFDOUQsT0FBTyxHQUFHLFVBQVUsQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLEVBQUUsT0FBTyxDQUFDLENBQUM7T0FDL0M7TUFDRCxPQUFPLE9BQU8sS0FBSyxJQUFJLEdBQUcsT0FBTyxDQUFDLGdCQUFnQixFQUFFLEdBQUcsTUFBTSxDQUFDO0tBQy9EO0lBQ0QsUUFBUSxDQUFDLE1BQU0sQ0FBQztNQUNkLE1BQU0sSUFBSSxHQUFHLFVBQVUsQ0FBQyxNQUFNLEVBQUUsT0FBTyxDQUFDLENBQUM7TUFDekMsSUFBSSxPQUFPLEdBQUcsVUFBVSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsRUFBRSxPQUFPLENBQUMsQ0FBQztNQUNuRCxPQUFPLE9BQU8sS0FBSyxJQUFJLElBQUksT0FBTyxDQUFDLGVBQWUsS0FBSyxLQUFLLENBQUMsRUFBRTtRQUM3RCxPQUFPLEdBQUcsVUFBVSxDQUFDLE9BQU8sQ0FBQyxRQUFRLEVBQUUsRUFBRSxPQUFPLENBQUMsQ0FBQztPQUNuRDtNQUNELE9BQU8sT0FBTyxLQUFLLElBQUksR0FBRyxPQUFPLENBQUMsZUFBZSxFQUFFLEdBQUcsTUFBTSxDQUFDO0tBQzlEO0lBQ0QsTUFBTSxDQUFDLE1BQU0sQ0FBQztNQUNaLE1BQU0sVUFBVSxHQUFHLGFBQWEsQ0FBQyxNQUFNLEVBQUUsV0FBVyxDQUFDLENBQUM7TUFDdEQsTUFBTSxLQUFLLEdBQUcsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxnQkFBZ0IsQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDO01BQzdELE1BQU0sR0FBRyxHQUFHLFNBQVMsQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLE9BQU8sQ0FBQyxDQUFDO01BQ2pELElBQUksTUFBTSxHQUFHLFNBQVMsQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLEVBQUUsSUFBSSxFQUFFLE9BQU8sQ0FBQyxDQUFDO01BQ3RELE9BQU8sTUFBTSxLQUFLLElBQUksSUFBSSxNQUFNLENBQUMsSUFBSSxLQUFLLEtBQUssQ0FBQyxFQUFFO1FBQ2hELE1BQU0sR0FBRyxTQUFTLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRSxFQUFFLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQztPQUN0RDs7TUFFRCxJQUFJLE1BQU0sS0FBSyxJQUFJLEVBQUU7UUFDbkIsT0FBTyxNQUFNLENBQUM7T0FDZjs7TUFFRCxJQUFJLFVBQVUsR0FBRyxLQUFLLENBQUMsT0FBTyxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUUsWUFBWSxDQUFDLENBQUMsQ0FBQztNQUNwRSxJQUFJLE9BQU8sR0FBRyxVQUFVLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsRUFBRSxPQUFPLENBQUMsQ0FBQztNQUMzRCxPQUFPLE9BQU8sS0FBSyxJQUFJLElBQUksT0FBTyxDQUFDLGdCQUFnQixLQUFLLEtBQUssQ0FBQyxJQUFJLFVBQVUsR0FBRyxDQUFDLEVBQUU7UUFDaEYsVUFBVSxFQUFFLENBQUM7UUFDYixPQUFPLEdBQUcsVUFBVSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLEVBQUUsT0FBTyxDQUFDLENBQUM7T0FDeEQ7TUFDRCxPQUFPLE9BQU8sQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO0tBQ25DO0lBQ0QsUUFBUSxDQUFDLE1BQU0sQ0FBQztNQUNkLE1BQU0sVUFBVSxHQUFHLGFBQWEsQ0FBQyxNQUFNLEVBQUUsV0FBVyxDQUFDLENBQUM7TUFDdEQsTUFBTSxLQUFLLEdBQUcsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxnQkFBZ0IsQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDO01BQzdELE1BQU0sR0FBRyxHQUFHLFNBQVMsQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLE9BQU8sQ0FBQyxDQUFDO01BQ2pELElBQUksTUFBTSxHQUFHLFNBQVMsQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLEVBQUUsSUFBSSxFQUFFLE9BQU8sQ0FBQyxDQUFDO01BQ2xELE9BQU8sTUFBTSxLQUFLLElBQUksSUFBSSxNQUFNLENBQUMsSUFBSSxLQUFLLEtBQUssQ0FBQyxFQUFFO1FBQ2hELE1BQU0sR0FBRyxTQUFTLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxFQUFFLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQztPQUNsRDs7TUFFRCxJQUFJLE1BQU0sS0FBSyxJQUFJLEVBQUU7UUFDbkIsT0FBTyxNQUFNLENBQUM7T0FDZjs7TUFFRCxJQUFJLFVBQVUsR0FBRyxLQUFLLENBQUMsT0FBTyxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUUsWUFBWSxDQUFDLENBQUMsQ0FBQztNQUNwRSxJQUFJLE9BQU8sR0FBRyxVQUFVLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsRUFBRSxPQUFPLENBQUMsQ0FBQztNQUMzRCxPQUFPLE9BQU8sS0FBSyxJQUFJLElBQUksT0FBTyxDQUFDLGdCQUFnQixLQUFLLEtBQUssQ0FBQyxJQUFJLFVBQVUsR0FBRyxDQUFDLEVBQUU7UUFDaEYsVUFBVSxFQUFFLENBQUM7UUFDYixPQUFPLEdBQUcsVUFBVSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLEVBQUUsT0FBTyxDQUFDLENBQUM7T0FDeEQ7TUFDRCxPQUFPLE9BQU8sQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO0tBQ25DO0dBQ0Y7OztBQzlESCxpQkFBZSxVQUFVLElBQUksRUFBRSxDQUFDLFdBQVcsR0FBRyxJQUFJLEVBQUUsWUFBWSxHQUFHLE9BQU8sQ0FBQyxDQUFDLEVBQUUsRUFBRTtFQUM5RSxJQUFJLFNBQVMsR0FBRyxJQUFJLENBQUM7O0VBRXJCLE1BQU0sV0FBVyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsWUFBWSxDQUFDLGlCQUFpQixDQUFDLEtBQUssTUFBTSxDQUFDO0VBQ3RFLE1BQU0sYUFBYSxHQUFHLENBQUMsR0FBRyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsV0FBVyxDQUFDLENBQUM7RUFDbEYsS0FBSyxJQUFJLEdBQUcsSUFBSSxhQUFhLEVBQUU7SUFDN0IsTUFBTSxjQUFjLEdBQUcsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxnQkFBZ0IsQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxXQUFXLENBQUMsQ0FBQztJQUNuRixLQUFLLElBQUksQ0FBQyxJQUFJLGNBQWMsRUFBRTtNQUM1QixJQUFJLFNBQVMsS0FBSyxJQUFJLEVBQUU7UUFDdEIsU0FBUyxHQUFHLENBQUMsQ0FBQztRQUNkLENBQUMsQ0FBQyxZQUFZLENBQUMsVUFBVSxFQUFFLEdBQUcsQ0FBQyxDQUFDO09BQ2pDLE1BQU07UUFDTCxDQUFDLENBQUMsWUFBWSxDQUFDLFVBQVUsRUFBRSxJQUFJLENBQUMsQ0FBQztPQUNsQztLQUNGO0dBQ0Y7O0VBRUQsTUFBTSxFQUFFLEdBQUdBLFNBQU8sQ0FBQyxJQUFJLEVBQUUsQ0FBQyxXQUFXLEVBQUUsWUFBWSxDQUFDLENBQUMsQ0FBQzs7RUFFdEQsSUFBSSxDQUFDLGdCQUFnQixDQUFDLFNBQVMsRUFBRSxDQUFDLENBQUMsTUFBTSxFQUFFLE9BQU8sQ0FBQyxLQUFLO0lBQ3RELElBQUksT0FBTyxHQUFHLElBQUksQ0FBQztJQUNuQixJQUFJLE9BQU8sS0FBSyxFQUFFLEVBQUU7TUFDbEIsT0FBTyxHQUFHLEVBQUUsQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUM7S0FDL0IsTUFBTSxJQUFJLE9BQU8sS0FBSyxFQUFFLEVBQUU7TUFDekIsT0FBTyxHQUFHLEVBQUUsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUM7S0FDN0IsTUFBTSxJQUFJLE9BQU8sS0FBSyxFQUFFLEVBQUU7TUFDekIsT0FBTyxHQUFHLEVBQUUsQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUM7S0FDaEMsTUFBTSxJQUFJLE9BQU8sS0FBSyxFQUFFLEVBQUU7TUFDekIsT0FBTyxHQUFHLEVBQUUsQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUM7S0FDL0I7O0lBRUQsSUFBSSxPQUFPLEtBQUssSUFBSSxFQUFFO01BQ3BCLE9BQU8sQ0FBQyxLQUFLLEVBQUUsQ0FBQztNQUNoQixJQUFJLFNBQVMsS0FBSyxJQUFJLEVBQUU7UUFDdEIsU0FBUyxDQUFDLFlBQVksQ0FBQyxVQUFVLEVBQUUsSUFBSSxDQUFDLENBQUM7T0FDMUM7TUFDRCxPQUFPLENBQUMsWUFBWSxDQUFDLFVBQVUsRUFBRSxHQUFHLENBQUMsQ0FBQztNQUN0QyxTQUFTLEdBQUcsT0FBTyxDQUFDO0tBQ3JCO0dBQ0YsQ0FBQyxDQUFDO0NBQ0o7O0FDMUNEQSxVQUFPLENBQUMsUUFBUSxDQUFDLGFBQWEsQ0FBQyxhQUFhLENBQUMsRUFBRTtFQUM3QyxXQUFXLEVBQUUsWUFBWTtFQUN6QixZQUFZLEVBQUUsaUJBQWlCO0NBQ2hDLENBQUMsOzsifQ==
