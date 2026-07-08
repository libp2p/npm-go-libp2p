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

// The package ships bin/p2pd as a small JS stub that the installer replaces with
// the real binary. Treat the stub (a "#!" shebang script) as not-yet-installed
// so first use triggers the download rather than returning the placeholder.
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

// Returns the installed binary, or undefined if it has not been downloaded yet.
const findBinary = () => binaryLocations.find(isRealBinary)

// Download the binary by running the installer in a child process. The installer
// is async, so running it synchronously here keeps path() synchronous while
// reusing the same download, checksum and extraction logic. npm v12 makes
// install scripts opt-in, so the binary usually arrives here on first use rather
// than from a postinstall script.
function installBinary () {
  execFileSync(process.execPath, [join(__dirname, 'post-install.js')], {
    cwd: resolve(join(__dirname, '..')),
    // The installer logs progress to stdout; send it to this process's stderr so
    // a programmatic path() keeps its own stdout clean for the value it returns.
    stdio: ['ignore', 2, 2]
  })
}

/**
 * Resolve the path to the p2pd binary, downloading it on first use when it has
 * not been installed yet. Pass `{ autoDownload: false }` to resolve only an
 * already-installed binary and throw when it is missing.
 *
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
