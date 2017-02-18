const uws = require('uws')
    , log = require('../log')
    , config = require('../config')
    , events = require('events')

const devices = new Map()
    , Device = new events.EventEmitter()
    , wss = new uws.Server({ noServer: true })

Device.get = mac => devices.get(mac)
Device.has = mac => devices.has(mac)
Device.keys = () => devices.keys()

module.exports = Device

Device.send = function(mac, data) {
  const device = devices.get(mac)
  if (device)
    device.send(data)
}

Device.handle = function(args, mac) {
  wss.handleUpgrade(...args, socket => {
    const device = new events.EventEmitter()
    device.send = function(data) {
      heartbeat(socket)
      socket.send(data, log.ifError)
    }
    device.mac = mac
    device.ip = getIp(...args)

    log(device.ip, 'Device', mac, 'connected')

    devices.set(mac, device)

    Device.emit('connected', device)

    heartbeat(socket)

    socket.on('close', () => {
      Device.emit('disconnected', device)
      log(socket.ip, 'Device', mac, 'disconnected')
    })

    socket.on('message', data => {
      clearTimeout(socket.pongTimeout)

      if (typeof data !== 'string')
        return Device.emit('desktop', device, data)

      if (data.startsWith('version.'))
        return device.version = data.slice(8)

      if (data.startsWith('pong.'))
        return log.debug(mac, 'heartbeat', Date.now() - data.split('.')[1] + 'ms')

      if (data.startsWith('terminal.'))
        return Device.emit('terminal', device, data.slice(9))

      if (data.startsWith('fs.'))
        return Device.emit('fs', device, data.slice(3))
    })
  })
}

function heartbeat(socket) {
  clearInterval(socket.pingTimer)
  socket.pingTimer = setInterval(() => {
    socket.send('ping.' + Date.now())
    socket.pongTimeout = setTimeout(() => socket.close(), config.pongTimeout)
  }, config.pingTimeout)
}

function getIp(req) {
  return (req.headers['x-forwarded-for'] && req.headers['x-forwarded-for'][0])
      || req.connection.remoteAddress
      || req.socket.remoteAddress
}
