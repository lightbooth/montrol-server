const config = require('../config')

module.exports = (req, res, next) => {
  if (!config.tempPassword || req.query.key === config.tempPassword)
    return next()

  res.statusCode = 401
  res.end('Access denied')
}
