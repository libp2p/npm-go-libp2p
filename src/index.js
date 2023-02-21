import fs from 'node:fs'
import { resolve, join } from 'node:path'
import * as url from 'node:url'
const isWin = process.platform === 'win32'

const __dirname = url.fileURLToPath(new URL('.', import.meta.url))

/**
 * @returns {string}
 */
export function path () {
  const paths = isWin
    ? [
        resolve(join(__dirname, '..', 'p2pd.exe')),
        resolve(join(__dirname, '..', 'bin/p2pd.exe'))
      ]
    : [
        resolve(join(__dirname, '..', 'p2pd')),
        resolve(join(__dirname, '..', 'bin/p2pd'))
      ]

  for (const bin of paths) {
    if (fs.existsSync(bin)) {
      return bin
    }
  }

  throw new Error('p2pd binary not found, it may not be installed or an error may have occurred during installation')
}
