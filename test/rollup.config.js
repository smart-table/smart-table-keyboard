import node from 'rollup-plugin-node-resolve';

export default {
  entry: "./test/index.js",
  plugins: [
    node({jsnext: true}),
  ],
  dest: "./test/dist/test.js",
  moduleName: "test",
  format: "iife",
  sourceMap: 'inline'
};