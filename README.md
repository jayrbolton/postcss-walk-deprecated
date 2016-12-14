
# postcss-walk

Recursively walk through a directory, compiling index files and copying assets into an output directory. Useful for multipage apps with many CSS main files. Also see postcss-watch, which uses this plus watches files.

```js
import postcssWalk from 'postcss-walk'

postcssWalk({
  input: 'input/directory'
, output: 'output/directory'
, plugins: [ require('postcss-import') , require('precss') ]
, log: true
, copyAssets: ['jpg', 'png', 'otf', 'tiff']
})
```
