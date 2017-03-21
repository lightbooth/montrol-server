const log = require('./log')
    , http = require('http')
    , path = require('path')
    , https = require('https')
    , config = require('./config')
    , express = require('express')
    , morgan = require('morgan')
    , Device = require('./models/device')
    , devices = require('./routes/devices')

const app = express()

app.enable('trust proxy')

app.use(morgan('combined'))

app.use(express.static(path.join(__dirname, 'public')))

app.use('/devices', devices)

const server = config.https
    ? https.createServer(config.https, app)
    : http.createServer(app)

server.on('upgrade', function(req, socket, head) {
  const res = new http.ServerResponse(req)
  res.assignSocket(socket)

  res.on('finish', () => res.socket.destroy())

  req.ws = arguments
  app(req, res)
})

server.on('listening', () => log('Listening on port', config.port))
server.listen(config.port)
