const uws = require('uws')
    , Device = require('./device')
    , uuid = require('uuid')

const FS = module.exports
    , wss = new uws.Server({ noServer: true })
    , sockets = new Map()
    , emptyId = uuid.v4().split('-').join('')

Device.on('fs', (device, data) => {
  const socket = sockets.get(data.slice(0, 32))
  socket && socket.send(data.slice(33))
})

FS.send = function(mac, id = emptyId, data) {
  Device.send(mac, 'fs.' + id + '.' + data)
}

FS.handle = function(args, mac) {
  wss.handleUpgrade(...args, socket => {
    socket.id = args[0].query.id
    sockets.set(socket.id, socket)

    socket.on('message', data => {
      FS.send(mac, socket.id, data)
    })

    socket.on('close', () => sockets.delete(socket.id))
  })
}
