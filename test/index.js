const postcssWalk = require('../')

postcssWalk({
  input: 'test/lib'
, output: 'test/build'
, copyAssets: ['jpg']
, plugins: [
    require('postcss-import')
  , require('precss')
  , require('postcss-color-function')
  , require('autoprefixer')
  ]
, log: true
})
