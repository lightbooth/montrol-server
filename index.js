const log = require('./log')
    , http = require('http')
    , path = require('path')
    , https = require('https')
    , config = require('./config')
    , express = require('express')
    , devices = require('./routes/devices')
    , auth = require('basic-auth')

const app = express()

app.use((req, res, next) => {
  if (!config.baPassword)
    return next()

  const user = auth(req)
  if (user && user.name === config.baUser && user.pass === config.baPassword)
    return next()

  res.statusCode = 401
  res.setHeader('WWW-Authenticate', 'Basic realm="montrol"')
  res.end('Access denied')
})

app.use('/devices', devices)
app.use(express.static(path.join(__dirname, 'public')))

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
