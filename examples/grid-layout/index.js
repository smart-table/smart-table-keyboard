import keymap from '../../index';

keymap(document.querySelector('[role=grid]'),{
  rowSelector:'[role=row]',
  cellSelector:'[role=gridcell]'
});