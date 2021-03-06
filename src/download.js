'use strict'

/*
  Download go-libp2p distribution package for desired version.
  API:
    download([<version>])
*/

const goenv = require('./go-platform')
const gunzip = require('gunzip-maybe')
const path = require('path')
const got = require('got').default
const tarFS = require('tar-fs')
const unzip = require('unzip-stream')
const { latest, versions } = require('./versions')
const fs = require('fs')
// @ts-ignore no types
const cachedir = require('cachedir')
const pkgConf = require('pkg-conf')
const isWin = process.platform === 'win32'
const cproc = require('child_process')
// @ts-ignore no types
const Hash = require('ipfs-only-hash')
const os = require('os')

/**
 * avoid expensive fetch if file is already in cache
 * @param {string} url
 */
async function cachingFetchAndVerify (url) {
  const cacheDir = process.env.NPM_GO_LIBP2P_CACHE || cachedir('npm-go-libp2p')
  const filename = url.split('/').pop()

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
    // download file
    fs.writeFileSync(cachedFilePath, await got(url).buffer())
    console.info(`Downloaded ${url}`)
  } else {
    console.info(`Found ${cachedFilePath}`)
  }

  console.info(`Verifying ${filename}`)

  const data = fs.readFileSync(cachedFilePath)
  const calculatedSha = await Hash.of(data)
  if (calculatedSha !== filename) {
    console.log(`Expected CID: ${filename}`)
    console.log(`Actual   CID: ${calculatedSha}`)
    throw new Error(`SHA512 of ${cachedFilePath}' (${calculatedSha}) does not match expected value from ${cachedFilePath}`)
  }
  console.log(`OK ${calculatedSha}`)

  return fs.createReadStream(cachedFilePath)
}

/**
 * @param {string} url
 * @param {string} installPath
 * @param {import('stream').Readable} stream
 */
function unpack (url, installPath, stream) {
  return new Promise((resolve, reject) => {
    if (url.endsWith('.zip')) {
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
 * @param {string} [version]
 * @param {string} [platform]
 * @param {string} [arch]
 * @param {string} [installPath]
 */
function cleanArguments (version, platform, arch, installPath) {
  const conf = pkgConf.sync('go-libp2p', {
    cwd: process.env.INIT_CWD || process.cwd(),
    defaults: {
      version: version || latest,
      distUrl: 'https://ipfs.io'
    }
  })

  return {
    version: process.env.TARGET_VERSION || version || conf.version,
    platform: process.env.TARGET_OS || platform || os.platform(),
    arch: process.env.TARGET_ARCH || arch || goenv.GOARCH,
    distUrl: process.env.GO_LIBP2P_DIST_URL || conf.distUrl,
    installPath: installPath ? path.resolve(installPath) : process.cwd()
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

  return `${distUrl}/ipfs/${cid}`
}

/**
 * @param {object} options
 * @param {string} options.version
 * @param {string} options.platform
 * @param {string} options.arch
 * @param {string} options.installPath
 * @param {string} options.distUrl
 */
async function download ({ version, platform, arch, installPath, distUrl }) {
  const url = await getDownloadURL(version, platform, arch, distUrl)
  const data = await cachingFetchAndVerify(url)

  await unpack(url, installPath, data)
  console.info(`Unpacked ${installPath}`)

  return path.join(installPath, `p2pd${platform === 'windows' ? '.exe' : ''}`)
}

/**
 * @param {object} options
 * @param {string} options.depBin
 */
async function link ({ depBin }) {
  let localBin = path.resolve(path.join(__dirname, '..', 'bin', 'p2pd'))

  if (isWin) {
    localBin += '.exe'
  }

  if (!fs.existsSync(depBin)) {
    throw new Error('p2pd binary not found. maybe go-libp2p did not install correctly?')
  }

  if (fs.existsSync(localBin)) {
    fs.unlinkSync(localBin)
  }

  console.info('Linking', depBin, 'to', localBin)
  fs.symlinkSync(depBin, localBin)

  if (isWin) {
    // On Windows, update the shortcut file to use the .exe
    const cmdFile = path.join(__dirname, '..', '..', 'p2pd.cmd')

    fs.writeFileSync(cmdFile, `@ECHO OFF
  "%~dp0\\node_modules\\go-libp2p\\bin\\p2pd.exe" %*`)
  }

  // test libp2p installed correctly.
  var result = cproc.spawnSync(localBin, ['--help'])
  if (result.error) {
    throw new Error('p2pd binary failed: ' + result.error)
  }

  var outstr = result.stderr.toString()
  var m = /Usage of/.exec(outstr)

  if (!m) {
    console.info(outstr, m)
    throw new Error('Could not execute p2pd')
  }

  return localBin
}

/**
 * @param {string} [version]
 * @param {string} [platform]
 * @param {string} [arch]
 * @param {string} [installPath]
 */
module.exports = async (version, platform, arch, installPath) => {
  const args = cleanArguments(version, platform, arch, installPath)

  return link({
    ...args,
    depBin: await download(args)
  })
}
