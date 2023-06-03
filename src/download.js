/*
  Download go-libp2p distribution package for desired version.
  API:
    download([<version>])
*/

/* eslint-disable no-console */

// @ts-expect-error no types
import cproc from 'node:child_process'
import fs from 'node:fs'
// @ts-expect-error no types
import os from 'node:os'
import path from 'node:path'
import * as url from 'node:url'
import util from 'node:util'
import cachedir from 'cachedir'
import delay from 'delay'
import got from 'got'
import gunzip from 'gunzip-maybe'
import Hash from 'ipfs-only-hash'
import { CID } from 'multiformats/cid'
import retry from 'p-retry'
import { packageConfigSync } from 'pkg-conf'
import tarFS from 'tar-fs'
import unzip from 'unzip-stream'
import * as goenv from './go-platform.js'
import { latest, versions } from './versions.js'

const __dirname = url.fileURLToPath(new URL('.', import.meta.url))
const isWin = process.platform === 'win32'

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

    const buf = await retry(async (attempt) => {
      return await got(url).buffer()
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

  console.info(`Verifying ${filename}`)

  const data = fs.readFileSync(cachedFilePath)
  const calculatedSha = await Hash.of(data)
  if (calculatedSha !== cid) {
    console.log(`Expected CID: ${cid}`)
    console.log(`Actual   CID: ${calculatedSha}`)
    throw new Error(`CID of ${cachedFilePath}' (${calculatedSha}) does not match expected value from ${cachedFilePath}`)
  }
  console.log(`OK ${calculatedSha}`)

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
      distUrl: 'https://%s.ipfs.w3s.link'
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

  const cid = versionData[platform]

  if (cid == null) {
    throw new Error(`No binary available for platform '${platform}'`)
  }

  return {
    url: util.format(distUrl, CID.parse(cid).toV1().toString()),
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

  return findBin({ installPath, platform })
}

/** Different versions return the exe differently. Handle this here
 *
 * @param {object} options
 * @param {string} options.installPath
 * @param {string} options.platform
 * @returns string
 */
async function findBin ({ installPath, platform }) {
  const binSuffix = platform === 'windows' ? '.exe' : ''
  const rawBin = path.join(installPath, 'p2pd')
  const platformScopedBin = path.join(installPath, 'bin', `p2pd-${platform}${binSuffix}`)
  if (await fs.promises.stat(rawBin).then(() => true).catch(() => false)) {
    return rawBin
  }

  return platformScopedBin
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
