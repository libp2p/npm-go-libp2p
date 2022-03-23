'use strict'

const fs = require('fs-extra')
const path = require('path')
const execa = require('execa')

module.exports = async function clean () {
  await fs.remove(path.resolve(__dirname, '../../p2pd'))
  await execa('git', ['checkout', '--', path.resolve(__dirname, '../../bin/p2pd')])
}
