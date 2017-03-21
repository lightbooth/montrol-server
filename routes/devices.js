const express = require('express')
    , config = require('../config')
    , Device = require('../models/device')
    , Desktop = require('../models/desktop')
    , Terminal = require('../models/terminal')
    , uuid = require('uuid')
    , path = require('path')
    , FS = require('../models/fs')
    , auth = require('../middleware/auth')

const router = express.Router()

module.exports = router

router.get('/', auth, (req, res) => {
  res.send(Array.from(Device.keys()).map(d => `<p>
    ${d}:
    <a href="/devices/${ d }/terminals/00000000000000000000000000000000?key=${ config.tempPassword }">terminal</a>
    <a href="/devices/${ d }/desktop?key=${ config.tempPassword }">desktop</a>
    </p>
  `).join(''))
})

router.get('/:mac', (req, res, next) => {
  req.ws ? Device.handle(req.ws, req.ip, req.params.mac) : next()
})

router.get('/:mac/desktop', auth, (req, res, next) => {
  if (req.ws)
    return Desktop.handle(req.ws, req.params.mac)

  res.sendFile(path.join(__dirname, '../public/desktop.html'))
})

router.post('/:mac/terminals', auth, findDevice, (req, res, next) => {
  res.redirect(req.url + '/' + uuid.v4().split('-').join(''))
})

router.get('/:mac/terminals/:session', auth, (req, res, next) => {
  if (req.ws)
    return Terminal.handle(req.ws, req.params.mac, req.params.session)

  res.sendFile(path.join(__dirname, '../public/terminal.html'))
})

router.get('/:mac/fs', auth, (req, res, next) => {
  if (req.ws)
    return FS.handle(req.ws, req.params.mac)

  if (!req.query.path)
    return res.sendFile(path.join(__dirname, '../public/fs.html'))

  next()
})

router.use('/:mac/fs', findDevice, require('./fs'))

function findDevice(req, res, next) {
  req.device = Device.get(req.params.mac)

  if (!req.device)
    return res.sendStatus(404)

  next()
}
