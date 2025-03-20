import json from '@rollup/plugin-json'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import replace from '@rollup/plugin-replace'
import terser from '@rollup/plugin-terser'
import { defineConfig } from 'rollup'

export default defineConfig({
  input: 'src/ebml/index.js',
  output: [
    {
      file: 'dist/ebml.js',
      format: 'es',
      sourcemap: true,
    },
    {
      file: 'dist/ebml.min.js',
      format: 'es',
      sourcemap: true,
      plugins: [terser()],
    },
  ],
  plugins: [
    nodeResolve({
      browser: true,
      preferBuiltins: false,
    }),
    replace({
      preventAssignment: true,
    }),
    json(),
  ],
})
