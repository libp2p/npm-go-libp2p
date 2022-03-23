var test = require('tape')
var fs = require('fs')
var path = require('path')
var cp = require('child_process')
var p2pd = path.join(__dirname, '..', 'bin', 'p2pd')

test('ensure libp2p bin path exists', function (t) {
  t.plan(4)
  fs.stat(p2pd, function (err, stats) {
    t.error(err, 'libp2p bin should stat witout error')
    cp.exec([p2pd, '--help'].join(' '), function (err, stdout, stderr) {
      t.error(err, 'libp2p bin runs without error')
      t.true(stdout.indexOf('Usage') >= 0, 'libp2p bin executed')
      t.false(stderr, 'no stderr output')
    })
  })
})
