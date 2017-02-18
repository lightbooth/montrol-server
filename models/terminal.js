const uws = require('uws')
    , Device = require('./device')

const wss = new uws.Server({ noServer: true })
    , connections = new Map()
    , backlogs = new Map()

module.exports = wss

Device.on('terminal', (device, data) => {
  if (!device.version) {
    const [message, session, ...rest] = data.split('.')
    data = session + '.' + message + '.' + rest.join('.')
  }

  const session = data.slice(0, 32)
      , content = data.slice(33)
      , id = device.mac + session

  if (content.startsWith('output.')) {
    const backlog = backlogs.get(id) || ''
    backlogs.set(id, backlog + content.slice(7))
  }

  const viewers = connections.get(id)

  if (viewers)
    viewers.forEach(c => { c.send(content) })
})

Device.on('connected', device => {
  connections.forEach((value, key) => {
    if (key.startsWith(device.mac)) {
      device.send('terminal.' + key.slice(12))
      value.forEach(socket => socket.send('online'))
    }
  })
})

Device.on('disconnected', device => {
  connections.forEach((value, key) => {
    if (key.startsWith(device.mac))
      value.forEach(socket => socket.send('offline'))
  })
})

wss.handle = function(args, mac, session) {
  wss.handleUpgrade(...args, socket => {
    const id = mac + session
        , device = Device.get(mac)

    socket.send(device ? 'online' : 'offline')

    const backlog = backlogs.get(id)

    if (backlog)
      socket.send('output.' + backlog)

    const viewers = connections.get(id) || new Set()
    viewers.id = session
    viewers.add(socket)

    if (viewers.size === 1)
      connections.set(id, viewers)

    if (device && !device.version)
      Device.send(mac, 'terminal.open.' + session)

    socket.on('message', data => {
      if (device && !device.version) {
        if (data.startsWith('input.'))
          Device.send(mac, 'terminal.input.' + session + '.' + data.slice(6))
        else if (data.startsWith('resize.'))
          Device.send(mac, 'terminal.resize.' + session + '.' + data.slice(7))
        return
      }

      if (data.startsWith('input.'))
        Device.send(mac, 'terminal.' + session + '.input.' + data.slice(6))
      else if (data.startsWith('resize.'))
        Device.send(mac, 'terminal.' + session + '.resize.' + data.slice(7))
    })

    socket.on('close', () => {
      viewers.delete(socket)
      if (viewers.size === 0)
        connections.delete(id)
    })
  })
}
