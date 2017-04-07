import node from 'rollup-plugin-node-resolve';

export default {
  entry: "./examples/table/index.js",
  plugins: [
    node({jsnext: true})
  ],
  dest: "./examples/table/dist/bundle.js",
  moduleName: "keygrid",
  format: "iife",
  sourceMap: 'inline'
};