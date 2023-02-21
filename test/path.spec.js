/* eslint-env mocha */

import { expect } from 'aegir/chai'
import fs from 'node:fs/promises'
import { execa } from 'execa'
import { download } from '../src/download.js'
import { path } from '../src/index.js'

describe('path', () => {
  it('ensures libp2p bin path exists', async () => {
    const downloadedPath = await download()
    const detectedPath = path()

    expect(detectedPath).to.equal(downloadedPath, 'downloaded path did not match detected path')

    const stat = await fs.stat(detectedPath)

    expect(stat).to.be.ok('should have been able to stat binary path')

    const output = await execa(detectedPath, ['--help'])

    // https://unix.stackexchange.com/questions/331611/do-progress-reports-logging-information-belong-on-stderr-or-stdout
    expect(output.stderr).to.include('Usage', 'should emit on stderr')
    expect(output.stdout).to.be.empty('should not emit anything on stdout')
  })
})
