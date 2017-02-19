const path = require('path')
    , uuid = require('uuid')
    , Busboy = require('busboy')
    , express = require('express')
    , FS = require('../models/fs')

const router = express.Router()
    , transfers = new Map()

module.exports = router

router.get('/', (req, res, next) => {
  const id = uuid.v4().split('-').join('')

  res.set('Content-disposition', 'attachment; filename=' + path.basename(req.query.path))
  transfers.set(id, res)
  FS.send(req.device.mac, req.query.id, JSON.stringify({
    type: 'upload',
    path: req.query.path,
    destination: '/devices/' + req.device.mac + '/fs/' + id
  }))
})

router.get('/:id', (req, res) => {
  const transfer = transfers.get(req.params.id)
  if (!transfer)
    return res.sendStatus(404)

  res.set('Content-disposition', 'attachment; filename=' + transfer.filename)
  transfer.file.pipe(res)
})

router.post('/', (req, res) => {
  const busboy = new Busboy({ headers: req.headers })

  busboy.on('file', (fieldname, file, filename) => {
    if (!filename)
      return

    const id = uuid.v4().split('-').join('')

    transfers.set(id, { file, filename })
    FS.send(req.device.mac, id, JSON.stringify({
      type: 'download',
      path: '/devices/' + req.device.mac + '/fs/' + id,
      destination: path.join(req.query.path, filename)
    }))
  })

  busboy.on('finish', () => res.sendStatus(200))

  req.pipe(busboy)
})

router.post('/:id', (req, res, next) => {
  const transfer = transfers.get(req.params.id)
  if (!transfer)
    return res.sendStatus(404)

  transfer.set('Content-Length', req.headers['content-length'])
  transfer.set('Content-Type', req.headers['content-type'])

  req.pipe(transfer)
  req.on('end', () => res.sendStatus(200))
  req.on('error', err => {
    res.statusCode = 500
    res.send(err)
  })
})
