'use strict'

const fs = require('fs')
const path = require('path')

module.exports.path = function () {
  const paths = [
    path.resolve(path.join(__dirname, '..', 'p2pd')),
    path.resolve(path.join(__dirname, '..', 'p2pd.exe')),
    path.resolve(path.join(__dirname, '..', 'bin/p2pd')),
    path.resolve(path.join(__dirname, '..', 'bin/p2pd.exe')),
  ]

  for (const bin of paths) {
    if (fs.existsSync(bin)) {
      return bin
    }
  }

  throw new Error('p2pd binary not found, it may not be installed or an error may have occurred during installation')
}
