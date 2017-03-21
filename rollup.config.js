import json from 'rollup-plugin-json';
import babel from 'rollup-plugin-babel';
import babelrc from 'babelrc-rollup';
import nodeResolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import strip from 'rollup-plugin-strip';

export default {
  entry: 'src/index.js',
  format: 'umd',
  globals: {},
  moduleName: 'flow',
  plugins: [
    nodeResolve({ jsnext: true, main: true }),
    json(),
    babel(babelrc()),
    commonjs(),
    strip({
      // set this to `false` if you don't want to
      // remove debugger statements
      debugger: true,

      // defaults to `[ 'console.*', 'assert.*']`
      functions: [ 'console.log', 'assert.*', 'debug'],

      // set this to `false` if you're not using sourcemaps –
      // defaults to `true`
      sourceMap: false
    })
  ],
  external: [],
  dest: 'build/js/flow.js',
  acorn: {
    allowReserved: true
  }//,
  //sourceMap: true,
  //sourceMapFile: 'build/flow.js'
};