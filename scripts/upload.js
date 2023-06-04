import { join } from 'node:path'
import * as url from 'node:url'
import fs from 'node:fs'
import { Web3Storage, getFilesFromPath } from 'web3.storage'
import { API_TOKEN } from './.config.js'

const __dirname = url.fileURLToPath(new URL('.', import.meta.url))

// Construct with token and endpoint
const client = new Web3Storage({ token: API_TOKEN })

const commit = process.env.COMMIT ?? 'v0.5.0'

const tarballs = [
  `p2pd-${commit}-darwin.tar.gz`,
  `p2pd-${commit}-linux-386.tar.gz`,
  `p2pd-${commit}-linux-amd64.tar.gz`,
  `p2pd-${commit}-linux-arm64.tar.gz`,
  `p2pd-${commit}-win32-386.zip`,
  `p2pd-${commit}-win32-amd64.zip`,
  `p2pd-${commit}-win32-arm64.zip`
]

const output = {}

// Pack files into a CAR and send to web3.storage
const rootCid = await client.put(await getFilesFromPath(tarballs.map(tarball => join(__dirname, '..', tarball))), {
  onStoredChunk: (size) => {
    console.info('stored', size)
  },
  onRootCidReady: (cid) => {
    console.info('root', cid)
  }
}) // Promise<CIDString>

console.info('upload complete')
console.info('root cid', rootCid)

// Fetch and verify files from web3.storage
const res = await client.get(rootCid) // Promise<Web3Response | null>
const files = await res.files() // Promise<Web3File[]>

for (const file of files) {
  output[file.name.split(`${commit}-`)[1].split('.')[0]] = file.cid
}

console.info('updating src/versions.json')

const { versions } = JSON.parse(fs.readFileSync(join(__dirname, '..', 'src', 'versions.json'), {
  encoding: 'utf-8'
}))

versions[commit] = output

fs.writeFileSync(join(__dirname, '..', 'src', 'versions.json'), JSON.stringify({ latest: commit, versions }, null, 2), {
  encoding: 'utf-8'
})

console.info('done')
