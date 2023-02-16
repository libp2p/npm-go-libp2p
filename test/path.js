var test = require('tape')
var fs = require('fs')
var path = require('path')
var cp = require('child_process')
const download = require('../src/download')

test('ensure libp2p bin path exists', async function (t) {
  t.plan(4)
  var p2pd = await download()
  console.log("P2pd is", p2pd)
  fs.stat(p2pd, function (err, stats) {
    t.error(err, 'libp2p bin should stat witout error')
    cp.exec([p2pd, '--help'].join(' '), function (err, stdout, stderr) {
      t.error(err, 'libp2p bin runs without error')
      t.true(stderr.indexOf('Usage') >= 0, 'libp2p bin executed')
      t.false(stdout, 'no stdout output')
    })
  })
})
