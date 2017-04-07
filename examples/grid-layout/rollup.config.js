import node from 'rollup-plugin-node-resolve';

export default {
  entry: "./examples/grid-layout/index.js",
  plugins: [
    node({jsnext: true})
  ],
  dest: "./examples/grid-layout/dist/bundle.js",
  moduleName: "keygrid",
  format: "iife",
  sourceMap: 'inline'
};