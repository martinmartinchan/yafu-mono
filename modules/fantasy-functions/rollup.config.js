import resolve from '@rollup/plugin-node-resolve'
import replace from 'rollup-plugin-replace'

const setups = [ 'production', 'development' ]

export default [
  {
    input: './lib/definitions.js',
    output: {
      file: 'dist/cjs/definitions.js',
      format: 'cjs',
    },
  },
  ...setups.map((environment) => ({
    input: './dist/es6/fantasy-functions.js',
    treeshake: {
      moduleSideEffects: false,
    },
    plugins: [
      replace({ 'process.env.NODE_ENV': `'${environment}'` }),
      resolve(),
    ],
    output: {
      file: `dist/cjs/fantasy-functions-${environment}.js`,
      format: 'cjs',
    },
  })),
]
