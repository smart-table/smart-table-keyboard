import buble from 'rollup-plugin-buble';
import node from 'rollup-plugin-node-resolve';

export default {
  entry: "./index.js",
  plugins: [
    node({jsnext: true}),
    buble({
      target: {chrome: 52}
    })
  ],
  dest: "./dist/smart-table-keyboard.js",
  moduleName: "smart-table-keyboard",
  format: "umd",
  sourceMap: true
};