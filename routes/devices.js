const express = require('express')
    , config = require('../config')
    , Device = require('../models/device')
    , Desktop = require('../models/desktop')
    , Terminal = require('../models/terminal')
    , uuid = require('uuid')
    , path = require('path')
    , FS = require('../models/fs')

const router = express.Router()

module.exports = router

router.get('/', (req, res) => {
  res.send(Array.from(Device.keys()).map(d => `<p>
    ${d}:
    <a href="${ d }/terminals/00000000000000000000000000000000?key=${ config.tempPassword }">terminal</a>
    <a href="${ d }/desktop?key=${ config.tempPassword }">desktop</a>
    </p>
  `).join(''))
})

router.get('/:mac/desktop', (req, res, next) => {
  if (req.ws)
    return Desktop.handle(req.ws, req.params.mac)

  res.sendFile(path.join(__dirname, '../public/desktop.html'))
})

router.post('/:mac/terminals', findDevice, (req, res, next) => {
  res.redirect(req.url + '/' + uuid.v4().split('-').join(''))
})

router.get('/:mac/terminals/:session', (req, res, next) => {
  if (req.ws)
    return Terminal.handle(req.ws, req.params.mac, req.params.session)

  res.sendFile(path.join(__dirname, '../public/terminal.html'))
})

router.get('/:mac/fs', (req, res, next) => {
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
