function getGoOs () {
  switch (process.platform) {
    case 'sunos':
      return 'solaris'
    case 'win32':
      return 'windows'
    default:
      return process.platform
  }
}

function getGoArch () {
  switch (process.arch) {
    case 'ia32':
      return '386'
    case 'x64':
      return 'amd64'
    case 'arm':
      return 'arm'
    case 'arm64':
      return 'arm64'
    default:
      return process.arch
  }
}

export const GOOS = getGoOs()
export const GOARCH = getGoArch()
