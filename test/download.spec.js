/* eslint-env mocha */

import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { expect } from 'aegir/chai'
import { download } from '../src/download.js'
import { path as detectLocation } from '../src/index.js'
import { clean } from './fixtures/clean.js'

describe('download', () => {
  beforeEach(async () => {
    process.env.NPM_GO_LIBP2P_CACHE = path.join(os.tmpdir(), `npm-go-libp2p-test-cache-${Date.now()}`)
    await clean()
  })

  afterEach(async () => {
    delete process.env.NPM_GO_LIBP2P_CACHE
  })

  it('downloads libp2p (current version and platform)', async () => {
    const installPath = await download()
    const stats = await fs.stat(installPath)

    expect(stats).to.be.ok('go-libp2p was not downloaded')
    expect(installPath).to.equal(detectLocation(), 'go-libp2p binary was not detected')
  })

  it('returns an error when version unsupported', async () => {
    await expect(download({ version: 'bogusversion', platform: 'linux' })).to.eventually.be.rejected
      .with.property('message').that.matches(/not available/)
  })

  it('returns an error when dist url is 404', async () => {
    process.env.GO_LIBP2P_DIST_URL = 'https://dist.ipfs.io/notfound'

    await expect(download({ version: 'v0.4.0', retries: 0 })).to.eventually.be.rejected
      .with.property('message').that.matches(/404/)

    delete process.env.GO_LIBP2P_DIST_URL
  })

  it('path returns undefined when no binary has been downloaded', async () => {
    expect(detectLocation).to.throw(/not found/, 'Path did not throw when binary is not installed')
  })
})
