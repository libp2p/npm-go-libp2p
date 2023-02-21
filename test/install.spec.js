/* eslint-env mocha */

import { expect } from 'aegir/chai'
import fs from 'node:fs/promises'
import path from 'path'
import { execa } from 'execa'
// @ts-expect-error no types
import cachedir from 'cachedir'
import * as url from 'node:url'

const __dirname = url.fileURLToPath(new URL('.', import.meta.url))

/*
  Test that correct go-ipfs is downloaded during npm install.
*/

async function clean () {
  await fs.rm(path.join(__dirname, 'fixtures', 'example-project', 'node_modules'), {
    recursive: true
  }).catch(err => {
    if (err.code !== 'ENOENT') {
      throw err
    }
  })
  await fs.rm(path.join(__dirname, 'fixtures', 'example-project', 'package-lock.json')).catch(err => {
    if (err.code !== 'ENOENT') {
      throw err
    }
  })
  await fs.rm(cachedir('npm-go-libp2p'), {
    recursive: true
  }).catch(err => {
    if (err.code !== 'ENOENT') {
      throw err
    }
  })
}

describe('install', () => {
  /** @type {string} */
  let expectedVersion

  before(async () => {
    const pkg = JSON.parse(await fs.readFile(path.join(__dirname, '..', 'package.json'), {
      encoding: 'utf8'
    }))

    expectedVersion = pkg.version
  })

  beforeEach(async () => {
    await clean()
  })

  after(async () => {
    await clean()
  })

  it('ensures go-libp2p defined in package.json is fetched on dependency install', async () => {
    await clean()

    const exampleProjectRoot = path.join(__dirname, 'fixtures', 'example-project')

    // from `example-project`, install the module
    await execa('npm', ['install'], {
      cwd: exampleProjectRoot
    })

    // confirm package.json is correct
    const fetchedVersion = JSON.parse(await fs.readFile(path.join(exampleProjectRoot, 'node_modules', 'go-libp2p', 'package.json'), {
      encoding: 'utf-8'
    })).version
    expect(expectedVersion).to.equal(fetchedVersion, `package.json version did not match '${expectedVersion}'`)

    // confirm binary is correct
    /* skipped because go-libp2p-daemon has no --version flag
    const binary = path.join(exampleProjectRoot, 'node_modules', 'go-libp2p', 'bin', 'p2pd')
    const versionRes = execa.sync(binary, ['--version'], {
      cwd: exampleProjectRoot
    })

    t.ok(versionRes.stdout === `libp2p version ${expectedVersion}`, `libp2p --version output match '${expectedVersion}'`)
    */
  })
})
