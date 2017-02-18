const uws = require('uws')
    , Device = require('./device')

const wss = new uws.Server({ noServer: true })
    , connections = new Map()

module.exports = wss

Device.on('desktop', (device, data) => {
  const sockets = connections.get(device.mac)
  if (sockets)
    sockets.forEach(socket => socket.send(data, { binary: true }))
})

Device.on('connected', device => {
  const viewers = connections.get(device.mac)
  if (viewers) {
    device.send('desktop.on')
    viewers.forEach(socket => socket.send('online'))
  }
})

Device.on('disconnected', device => {
  const viewers = connections.get(device.mac)
  if (viewers)
    viewers.forEach(socket => socket.send('offline'))
})

wss.handle = function(args, mac) {
  wss.handleUpgrade(...args, socket => {
    socket.send(Device.has(mac) ? 'online' : 'offline')

    const viewers = connections.get(mac) || new Set()
    viewers.add(socket)

    if (viewers.size === 1) {
      Device.send(mac, 'desktop.on')
      connections.set(mac, viewers)
    }


    socket.on('message', data => Device.send(mac, 'desktop.' + data))

    socket.on('close', () => {
      viewers.delete(socket)
      if (viewers.size === 0) {
        connections.delete(mac)
        Device.send(mac, 'desktop.off')
      }
    })
  })

}
