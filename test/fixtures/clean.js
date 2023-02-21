import fs from 'node:fs/promises'
import path from 'path'
import * as url from 'node:url'

const __dirname = url.fileURLToPath(new URL('.', import.meta.url))

export async function clean () {
  await fs.rm(path.resolve(__dirname, '../../p2pd')).catch(err => {
    if (err.code !== 'ENOENT') {
      throw err
    }
  })

  await fs.rm(path.resolve(__dirname, '../../bin/p2pd')).catch(err => {
    if (err.code !== 'ENOENT') {
      throw err
    }
  })
}
