/* eslint-disable no-console */
import fs from 'node:fs'
import { join, resolve } from 'node:path'
import * as url from 'node:url'
import { ARCHITECTURES } from '../src/arches.js'
import { hashFile } from '../src/hash-file.js'

const __dirname = url.fileURLToPath(new URL('.', import.meta.url))
const versionsPath = join(__dirname, '..', 'src', 'versions.json')

const version = fs.readFileSync(join(__dirname, '..', 'Makefile'), {
  encoding: 'utf8'
})
  .split('\n')
  .map(line => line.trim())
  .filter(line => line.startsWith('COMMIT?='))
  .pop()
  .replace('COMMIT?=', '')

const versions = {}

for (const arch of ARCHITECTURES) {
  const filePath = resolve(join(__dirname, '..', `p2pd-${version}-${arch}.${arch.includes('win32') ? 'zip' : 'tar.gz'}`))
  const cid = await hashFile(filePath)
  versions[arch] = cid.toString()
}

const manifest = JSON.parse(fs.readFileSync(versionsPath, {
  encoding: 'utf8'
}))

manifest.versions[version] = versions

fs.writeFileSync(versionsPath, JSON.stringify(manifest, null, 2), {
  encoding: 'utf8'
})
