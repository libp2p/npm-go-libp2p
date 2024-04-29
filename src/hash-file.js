import fs from 'node:fs'
import { BlackHoleBlockstore } from 'blockstore-core/black-hole'
import { importer } from 'ipfs-unixfs-importer'
import { fixedSize } from 'ipfs-unixfs-importer/chunker'
import { balanced } from 'ipfs-unixfs-importer/layout'
import last from 'it-last'

/**
 * @typedef {import('multiformats/cid').CID} CID
 */

/**
 * @param {string} filePath
 * @returns {Promise<CID>}
 */
export async function hashFile (filePath) {
  const blockstore = new BlackHoleBlockstore()
  const input = fs.createReadStream(filePath)
  const result = await last(importer([{
    content: input
  }], blockstore, {
    cidVersion: 1,
    rawLeaves: true,
    chunker: fixedSize({ chunkSize: 1024 * 1024 }),
    layout: balanced({ maxChildrenPerNode: 1024 })
  }))

  if (result == null) {
    throw new Error('Import failed')
  }

  return result.cid
}
