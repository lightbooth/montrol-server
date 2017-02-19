/* eslint no-process-env: 0 */

const fs = require('fs')

const config = module.exports = {
  production    : process.env.NODE_ENV === 'production',
  port          : process.env.PORT || 5000,
  sslCertPath   : process.env.SSL_CERTIFICATE_PATH,
  sslKeyPath    : process.env.SSL_PRIVATE_KEY_PATH,
  pingTimeout   : process.env.PING_TIMEOUT || 25 * 1000,
  pongTimeout   : process.env.PONG_TIMEOUT || 10 * 1000,
  baUser        : process.env.BA_USER,
  baPassword    : process.env.BA_PASSWORD
}

config.https = config.sslKeyPath && config.sslCertPath ? {
  key: fs.readFileSync(config.sslKeyPath),
  cert: fs.readFileSync(config.sslCertPath)
} : null
