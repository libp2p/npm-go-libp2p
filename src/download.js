/*
  Download go-libp2p distribution package for desired version.
  API:
    download([<version>])
*/

/* eslint-disable no-console */

import cproc from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import * as url from 'node:url'
import util from 'node:util'
import browserReadableStreamToIt from 'browser-readablestream-to-it'
import cachedir from 'cachedir'
import delay from 'delay'
import gunzip from 'gunzip-maybe'
import toBuffer from 'it-to-buffer'
import { CID } from 'multiformats/cid'
import retry from 'p-retry'
import { packageConfigSync } from 'package-config'
import tarFS from 'tar-fs'
import { equals as uint8ArrayEquals } from 'uint8arrays/equals'
import unzip from 'unzip-stream'
import * as goenv from './go-platform.js'
import { hashFile } from './hash-file.js'

const __dirname = url.fileURLToPath(new URL('.', import.meta.url))
const isWin = process.platform === 'win32'

const { latest, versions } = JSON.parse(fs.readFileSync(path.join(__dirname, 'versions.json'), {
  encoding: 'utf-8'
}))

const DOWNLOAD_TIMEOUT_MS = 60000

/**
 * avoid expensive fetch if file is already in cache
 *
 * @param {string} url
 * @param {string} cid
 * @param {{ retries?: number, retryDelay?: number }} [options]
 */
async function cachingFetchAndVerify (url, cid, options = {}) {
  const cacheDir = process.env.NPM_GO_LIBP2P_CACHE || cachedir('npm-go-libp2p')
  const filename = url.split('/').pop()
  const retries = options.retries ?? 10
  const retryDelay = options.retryDelay ?? 5000

  if (!filename) {
    throw new Error('Invalid URL')
  }

  const cachedFilePath = path.join(cacheDir, filename)

  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true })
  }

  if (!fs.existsSync(cachedFilePath)) {
    console.info(`Cached file ${cachedFilePath} not found`)
    console.info(`Downloading ${url} to ${cacheDir}`)

    const buf = await retry(async () => {
      const signal = AbortSignal.timeout(DOWNLOAD_TIMEOUT_MS)

      try {
        const res = await fetch(url, {
          signal
        })

        console.info(`${url} ${res.status} ${res.statusText}`)

        if (!res.ok) {
          throw new Error(`${res.status}: ${res.statusText}`)
        }

        const body = res.body

        if (body == null) {
          throw new Error('Response had no body')
        }

        return await toBuffer(browserReadableStreamToIt(body))
      } catch (err) {
        if (signal.aborted) {
          console.error(`Download timed out after ${DOWNLOAD_TIMEOUT_MS}ms`)
        }

        throw err
      }
    }, {
      retries,
      onFailedAttempt: async (err) => {
        console.error('Attempt', err.attemptNumber, 'failed. There are', err.retriesLeft, 'retries left', err)
        console.info('Waiting for', retryDelay / 1000, 'seconds before retrying')
        await delay(retryDelay)
      }
    })

    // download file
    fs.writeFileSync(cachedFilePath, buf)
    console.info(`Downloaded ${url}`)
  } else {
    console.info(`Found ${cachedFilePath}`)
  }

  console.info(`Verifying ${filename} from ${cachedFilePath}`)
  const receivedCid = await hashFile(cachedFilePath)
  const downloadedCid = CID.parse(cid)

  if (!uint8ArrayEquals(downloadedCid.multihash.bytes, receivedCid.multihash.bytes)) {
    console.log(`Requested content with CID: ${downloadedCid}`)
    console.log(`Received content with CID:  ${receivedCid}`)

    throw new Error(`CID of ${cachedFilePath}' (${cid}) does not match expected value from ${cachedFilePath}`)
  }
  console.log(`OK ${receivedCid}`)

  return fs.createReadStream(cachedFilePath)
}

/**
 * @param {string} installPath
 * @param {import('stream').Readable} stream
 */
function unpack (installPath, stream) {
  return new Promise((resolve, reject) => {
    if (isWin) {
      return stream.pipe(
        unzip
          .Extract({ path: installPath })
          .on('close', resolve)
          .on('error', reject)
      )
    }

    return stream
      .pipe(gunzip())
      .pipe(
        tarFS
          .extract(installPath)
          .on('finish', resolve)
          .on('error', reject)
      )
  })
}

/**
 * @param {object} [options]
 * @param {string} [options.version]
 * @param {string} [options.platform]
 * @param {string} [options.arch]
 * @param {string} [options.installPath]
 * @param {number} [options.retries]
 * @param {number} [options.retryDelay]
 */
function cleanArguments (options = {}) {
  const conf = packageConfigSync('go-libp2p', {
    cwd: process.env.INIT_CWD ?? process.cwd(),
    defaults: {
      version: options.version ?? latest,
      distUrl: 'https://github.com/libp2p/go-libp2p-daemon/releases/download/%s/p2pd-%s-%s.%s'
    }
  })

  return {
    version: process.env.TARGET_VERSION ?? options.version ?? conf.version,
    platform: process.env.TARGET_OS ?? options.platform ?? os.platform(),
    arch: process.env.TARGET_ARCH ?? options.arch ?? goenv.GOARCH,
    distUrl: process.env.GO_LIBP2P_DIST_URL ?? conf.distUrl,
    installPath: options.installPath ? path.resolve(options.installPath) : process.cwd(),
    retries: Number(process.env.RETRIES ?? options.retries ?? 10),
    retryDelay: Number(process.env.RETRY_DELAY ?? options.retryDelay ?? 5000)
  }
}

/**
 * @param {string} version
 * @param {string} platform
 * @param {string} arch
 * @param {string} distUrl
 */
async function getDownloadURL (version, platform, arch, distUrl) {
  const versionData = versions[version]

  if (versionData == null) {
    throw new Error(`Version '${version}' not available`)
  }

  if (platform !== 'darwin' && platform !== 'linux' && platform !== 'win32') {
    throw new Error(`Invalid platform specified - "${platform}", must be one of 'darwin', 'linux' or 'win32'}`)
  }

  const cid = versionData[`${platform}-${arch}`] ?? versionData[platform]

  if (cid == null) {
    throw new Error(`No binary available for platform '${platform}' and/or arch ${arch}`)
  }

  let downloadTarget = `${platform}-${arch}`

  if (platform === 'darwin') {
    downloadTarget = 'darwin'
  }

  let extension = 'tar.gz'

  if (platform === 'win32') {
    extension = 'zip'
  }

  return {
    url: util.format(distUrl, version, version, downloadTarget, extension),
    cid
  }
}

/**
 * @param {object} options
 * @param {string} options.version
 * @param {string} options.platform
 * @param {string} options.arch
 * @param {string} options.installPath
 * @param {string} options.distUrl
 * @param {number} options.retries
 * @param {number} options.retryDelay
 */
async function downloadFile ({ version, platform, arch, installPath, distUrl, retries, retryDelay }) {
  const { cid, url } = await getDownloadURL(version, platform, arch, distUrl)
  const data = await cachingFetchAndVerify(url, cid, {
    retries,
    retryDelay
  })

  await unpack(installPath, data)
  console.info(`Unpacked ${installPath}`)

  return findBin({ installPath, platform, arch })
}

/**
 * Different versions return the exe differently. Handle this here
 *
 * @param {object} options
 * @param {string} options.installPath
 * @param {string} options.platform
 * @param {string} options.arch
 * @returns {Promise<string>}
 */
async function findBin ({ installPath, platform, arch }) {
  const binSuffix = platform === 'win32' ? '.exe' : ''
  const bins = [
    path.join(installPath, 'p2pd'),
    path.join(installPath, 'bin', `p2pd-${platform}${binSuffix}`),
    path.join(installPath, 'bin', `p2pd-${platform}-${arch}${binSuffix}`)
  ]

  for (const bin of bins) {
    if (await fs.promises.stat(bin).then(() => true).catch(() => false)) {
      return bin
    }
  }

  throw new Error(`Could not find bin, tried ${bins}`)
}

/**
 * @param {object} options
 * @param {string} options.depBin
 */
async function link ({ depBin }) {
  let localBin = path.resolve(path.join(__dirname, '..', 'bin', 'p2pd'))

  if (!fs.existsSync(depBin)) {
    throw new Error('p2pd binary not found. maybe go-libp2p did not install correctly?')
  }

  if (fs.existsSync(localBin)) {
    fs.unlinkSync(localBin)
  }

  if (isWin) {
    localBin += '.exe'

    console.info('Moving', depBin, 'to', localBin)
    fs.renameSync(depBin, localBin)

    // On Windows, update the shortcut file to use the .exe
    const cmdFile = path.join(__dirname, '..', '..', 'p2pd.cmd')

    fs.writeFileSync(cmdFile, `@ECHO OFF
  "%~dp0\\node_modules\\go-libp2p\\bin\\p2pd.exe" %*`)
  } else {
    console.info('Linking', depBin, 'to', localBin)
    fs.symlinkSync(depBin, localBin)
  }

  // test libp2p installed correctly.
  const result = cproc.spawnSync(localBin, ['--help'])
  if (result.error) {
    throw new Error('p2pd binary failed: ' + result.error)
  }

  const outstr = result.stderr.toString()
  const m = /Usage of/.exec(outstr)

  if (!m) {
    console.info(outstr, m)
    throw new Error('Could not execute p2pd')
  }

  return localBin
}

/**
 * @param {object} [options]
 * @param {string} [options.version]
 * @param {string} [options.platform]
 * @param {string} [options.arch]
 * @param {string} [options.installPath]
 * @param {number} [options.retries]
 * @param {number} [options.retryDelay]
 * @returns {Promise<string>}
 */
export async function download (options = {}) {
  const args = cleanArguments(options)

  return link({
    ...args,
    depBin: await downloadFile(args)
  })
}
