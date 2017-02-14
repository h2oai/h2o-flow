import json from 'rollup-plugin-json';
import babel from 'rollup-plugin-babel';
import nodeResolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs'; 

export default {
  entry: 'test/index.js',
  format: 'umd',
  globals: {},
  moduleName: 'headless-test',
  plugins: [
    nodeResolve({ jsnext: true, main: true }),
    json(),
    babel(),
    commonjs()
  ],
  external: [],
  dest: 'build/headless-test.js',
  acorn: {
    allowReserved: true
  }//,
  //sourceMap: true,
  //sourceMapFile: 'build/headless-test.js'
};