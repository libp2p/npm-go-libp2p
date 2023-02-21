/* eslint-env mocha */

import { expect } from 'aegir/chai'
import fs from 'node:fs/promises'
import { download } from '../src/download.js'
import { path as detectLocation } from '../src/index.js'
import { clean } from './fixtures/clean.js'

describe('download', () => {
  beforeEach(async () => {
    await clean()
  })

  it('downloads libp2p (current version and platform)', async () => {
    const installPath = await download()
    const stats = await fs.stat(installPath)

    expect(stats).to.be.ok('go-libp2p was not downloaded')
    expect(installPath).to.equal(detectLocation(), 'go-libp2p binary was not detected')
  })

  it('returns an error when version unsupported', async () => {
    await expect(download('bogusversion', 'linux')).to.eventually.be.rejected
      .with.property('message').that.matches(/not available/)
  })

  it('returns an error when dist url is 404', async () => {
    process.env.GO_LIBP2P_DIST_URL = 'https://dist.ipfs.io/notfound'

    await expect(download('v0.3.1')).to.eventually.be.rejected
      .with.property('message').that.matches(/404/)

    delete process.env.GO_LIBP2P_DIST_URL
  })

  it('Path returns undefined when no binary has been downloaded', async () => {
    expect(detectLocation).to.throw(/not found/, 'Path did not throw when binary is not installed')
  })
})
