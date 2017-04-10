export const findContainer = (element, selector) => element.matches(selector) === true ? element : findContainer(element.parentElement, selector);
export const dataSelectorAttribute = 'data-keyboard-selector';
export const dataSkipAttribute = 'data-keyboard-skip';
export const valFunc = val => () => val;
export const valNull = valFunc(null);