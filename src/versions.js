
/**
 * @typedef {object} Version
 * @property {string} darwin
 * @property {string} linux
 * @property {string} win32
 */

export const latest = 'v0.12.0'

/**
 * map version to ipfs cid
 *
 * @type {Record<string, Version>}
 */
export const versions = {
  'v0.12.0': {
    darwin: 'QmSstRe7VQtmbGF1qeiMkyG4i4YZiKJfxHvbqj2RtRRymu',
    linux: 'QmSMiiCCmu4YGdDfJL8cpbEeDtUGUULnvHtTBCeio8zbe7',
    win32: 'QmYrYKthxvoFZnLFP1hJX7BFTvQgoSip3mwNNuaKDZ3VTU'
  },
  'v0.11.0': {
    darwin: 'QmbRgQrwZFyR6cjwuN6dgSfadmr9KrLmM72hRJ1B3K6659',
    linux: 'QmW6hANCx63LR2Unb8TWwB7UkDC2SNKUV5QbaWzSyjsoPf',
    win32: 'QmW9zNiN8VL59UbC2DmStQoxdy7TTnZfNsTXBVSn9NR9Wy'
  },
  'v0.8.1': {
    darwin: 'QmSSvbrXjWNfTmTZ3Xe1jqpFXdo5iFxEn8EsviuDFTeUdy',
    linux: 'QmZTzykGoDz16apo8fVJ7mBYfpyWnqnqwDaJgtC34UbttR',
    win32: 'QmcMnz8bFneUhW87e8iaP3Cjpd7ZwyhB31JfwRnnoGrd2X'
  },
  'v0.5.0': {
    darwin: 'Qmeb9fK9DVYWHDXCknr6zEYAzvchKTYa11sr27QXjrxzFC',
    linux: 'QmW7d5CMmo6GPuRFWXXweSvMB3odzy3dxEHz4Y1HCKhfiB',
    win32: 'QmUSrv5k8zay7eYzr7hgrrgeqDHthzf7Kg91RkEuRoxWDC'
  },
  'v0.4.0': {
    darwin: 'QmXTAqBwpuAyYTsWD7gZ1MBq77cWmkeh1Lm8e286P47C7C',
    linux: 'QmZwvFy5e3RrxD39DcXLGHfhsga8uMEU3JpKKVbHfkcCdv',
    win32: 'QmdCyyCxLgAD3hNLAgYDRioKufPkyr5ggGnPokkW9FcfcZ'
  },
  'v0.3.1': {
    darwin: 'QmettTVLnaLaVF9DzKd2yik8fnGZ1rbK7PuHBF8eqB2Yft',
    linux: 'QmQdVisPPnESnvQYmify1AEULwG5puXQq1c6yQyD4AVCJd',
    win32: 'QmesyDksxpWCMHsKHM371bwhh3J7kmg9HrdqYg7WfH6TS2'
  },
  'v0.1.0': {
    darwin: 'QmajN9chpFzG4msziqEKRbF32VW87a5SeKRKXiao6qokVT',
    linux: 'QmaX7i8cFkVoN8FmgLhNaxfapkQrztpuChdMRgcYDZQmq1',
    win32: 'Qme6SrCD6fm8AFmH9kA5BYwyz3fBq2QjrsxePen5Xoy9R1'
  },
  // Old gx format releases
  'v6.0.30': {
    darwin: 'QmSS6iQ3JNJ96g73tFARAcdYaMmAsvjX1RVuMPqJThTs7D',
    linux: 'Qmdu8WCFUW43u8mHpbj2jV2ZSB1mP7JcjnJJcJ1oF6iMwW',
    win32: 'QmP5P6AYQjbG26j5qrzbohSqAW3AP2Mvsuun3fS99hC1x6'
  }
}
