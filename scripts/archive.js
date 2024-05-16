/* eslint-disable no-console */

// Mac OS X tar doesn't support `--owner=0` etc so use a script to do something
// similar in a cross-platform way

import fs from 'node:fs'
import tar from 'tar-stream'

if (process.argv.length !== 4) {
  throw new Error('Not enough arguments')
}

const outputFile = process.argv[2]
const inputFile = process.argv[3]
const pack = tar.pack()
const stat = fs.statSync(inputFile)

const entry = pack.entry({
  name: inputFile,
  mode: 0o755,
  mtime: new Date('1970-01-01'),
  size: stat.size
}, (err) => {
  if (err) {
    console.error(err)
    process.exit(1)
  }

  pack.finalize()
})

fs.createReadStream(inputFile)
  .pipe(entry)

pack.pipe(fs.createWriteStream(outputFile))
