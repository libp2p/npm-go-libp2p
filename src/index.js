import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import { resolve, join } from 'node:path'
import * as url from 'node:url'
const isWin = process.platform === 'win32'

const __dirname = url.fileURLToPath(new URL('.', import.meta.url))

const binaryLocations = isWin
  ? [
      resolve(join(__dirname, '..', 'p2pd.exe')),
      resolve(join(__dirname, '..', 'bin/p2pd.exe'))
    ]
  : [
      resolve(join(__dirname, '..', 'p2pd')),
      resolve(join(__dirname, '..', 'bin/p2pd'))
    ]

/**
 * @param {string} file
 * @returns {boolean}
 */
function isRealBinary (file) {
  let fd
  try {
    fd = fs.openSync(file, 'r')
    const header = Buffer.alloc(2)
    fs.readSync(fd, header, 0, 2, 0)
    return header.toString('latin1') !== '#!'
  } catch {
    return false
  } finally {
    if (fd != null) {
      fs.closeSync(fd)
    }
  }
}

const findBinary = () => binaryLocations.find(isRealBinary)

function installBinary () {
  execFileSync(process.execPath, [join(__dirname, 'post-install.js')], {
    cwd: resolve(join(__dirname, '..')),
    stdio: ['ignore', 2, 2]
  })
}

/**
 * @param {{ autoDownload?: boolean }} [options]
 * @returns {string}
 */
export function path (options = {}) {
  const { autoDownload = true } = options

  let binary = findBinary()

  if (binary == null && autoDownload) {
    installBinary()
    binary = findBinary()
  }

  if (binary == null) {
    throw new Error('p2pd binary not found, it may not be installed or an error may have occurred during installation')
  }

  return binary
}
