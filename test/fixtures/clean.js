import fs from 'node:fs/promises'
import * as url from 'node:url'
import path from 'path'

const __dirname = url.fileURLToPath(new URL('.', import.meta.url))

export async function clean () {
  await Promise.all([
    rm(path.resolve(__dirname, '../../p2pd')),
    rm(path.resolve(__dirname, '../../p2pd.exe')),
    rm(path.resolve(__dirname, '../../bin/p2pd')),
    rm(path.resolve(__dirname, '../../bin/p2pd.exe'))
  ])
}

/**
 * @param {string} path
 */
async function rm (path) {
  let attempts = 5

  while (true) {
    try {
      attempts--
      await fs.rm(path)
    } catch (/** @type {any} */ err) {
      if (err.code === 'ENOENT') {
        return
      }

      if (attempts === 0) {
        throw err
      }

      // windows does not let you do file system operations in quick succession
      if (err.code === 'EPERM') {
        await new Promise((resolve) => {
          setTimeout(() => {
            resolve(null)
          }, 1000)
        })
      } else {
        throw err
      }
    }
  }
}
