import keyGrid from '../../index';
keyGrid(document.querySelector('[role=grid]'), {
  rowSelector: '[role=row]',
  cellSelector: '[role=gridcell]'
});