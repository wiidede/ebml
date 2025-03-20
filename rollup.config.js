import process from 'node:process'
import json from '@rollup/plugin-json'
import resolve from '@rollup/plugin-node-resolve'
import replace from '@rollup/plugin-replace'
import terser from '@rollup/plugin-terser'
import { defineConfig } from 'rollup'
import builtins from 'rollup-plugin-node-builtins'
import globals from 'rollup-plugin-node-globals'

const plugins = [
  resolve({
    browser: true,
    jsnext: true,
    main: true,
    module: true,
    preferBuiltins: true,
  }),
  builtins(),
  globals(),
  replace({
    vars: {
      ENV: process.env.NODE_ENV || 'development',
    },
    preventAssignment: true,
  }),
  json(),
]

const sourcemap = process.env.SOURCE_MAPS || true

export default defineConfig([
  {
    input: './src/ebml/index.js',
    output: [
      {
        file: 'lib/ebml.esm.js',
        format: 'esm',
        sourcemap,
      },
    ],
    plugins,
  },
  {
    input: './src/ebml/index.js',
    output: [
      {
        file: 'lib/ebml.esm.min.js',
        format: 'esm',
      },
    ],
    plugins: [...plugins, terser()],
  },
])
