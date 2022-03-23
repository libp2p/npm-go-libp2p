const fs = require('fs-extra')
const path = require('path')
const test = require('tape')
const execa = require('execa')
const cachedir = require('cachedir')

/*
  Test that correct go-ipfs is downloaded during npm install.
*/

const expectedVersion = require('../package.json').version

async function clean () {
  await fs.remove(path.join(__dirname, 'fixtures', 'example-project', 'node_modules'))
  await fs.remove(path.join(__dirname, 'fixtures', 'example-project', 'package-lock.json'))
  await fs.remove(cachedir('npm-go-libp2p'))
}

test.onFinish(clean)

test('Ensure go-libp2p defined in package.json is fetched on dependency install', async (t) => {
  await clean()

  const exampleProjectRoot = path.join(__dirname, 'fixtures', 'example-project')

  // from `example-project`, install the module
  execa.sync('npm', ['install'], {
    cwd: exampleProjectRoot
  })

  // confirm package.json is correct
  const fetchedVersion = require(path.join(exampleProjectRoot, 'node_modules', 'go-libp2p', 'package.json')).version
  t.ok(expectedVersion === fetchedVersion, `package.json versions match '${expectedVersion}'`)

  // confirm binary is correct
  /* skipped because go-libp2p-daemon has no --version flag
  const binary = path.join(exampleProjectRoot, 'node_modules', 'go-libp2p', 'bin', 'p2pd')
  const versionRes = execa.sync(binary, ['--version'], {
    cwd: exampleProjectRoot
  })

  t.ok(versionRes.stdout === `libp2p version ${expectedVersion}`, `libp2p --version output match '${expectedVersion}'`)
  */

  t.end()
})
