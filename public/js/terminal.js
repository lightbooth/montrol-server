(function() {

  const ui = {
    terminal: document.getElementById('terminal'),
    status: document.getElementById('status'),
    desktop: document.getElementById('desktop')
  }

  const term = new window.Terminal()
      , protocol = window.location.protocol === 'https:' ? 'wss://' : 'ws://'
      , url = protocol + window.location.host + window.location.pathname + window.location.search

  let onCWD

  ui.desktop.src = window.location.pathname.split('/terminals')[0] + '/desktop' + window.location.search
  document.title = 'term:' + window.location.pathname.split('/')[2]

  const socket = new window.PersistentWebSocket(url)
  socket.pingTimeout = false

  term.open(ui.terminal)

  term.on('data', data => socket.send('input.' + data))
  term.on('resize', size => socket.send('resize.' + size.cols + ',' + size.rows))

  socket.onopen = () => {
    log('connected')
    term.clear()
    socket.onmessage = e => {
      if (e.data.startsWith('output.'))
        return term.write(e.data.slice(7))

      if (e.data.startsWith('cwd.'))
        return onCWD ? onCWD(e.data.slice(4)) : log('unhandled cwd', e.data)

      log(e.data)
    }
    term.fit()
  }

  socket.onclose = () => {
    log('closed')
  }

  socket.onerror = err => {
    log('socket error', err)
  }

  'drag dragstart dragend dragover dragenter dragleave drop'.split(' ').forEach(event => {
    ui.terminal.addEventListener(event, function(e) {
      e.preventDefault()
      e.stopPropagation()
    })
  })

  let enters = 0

  ui.terminal.addEventListener('dragenter', function() {
    enters++
    ui.terminal.classList.add('dragging')
  })

  'dragleave dragend drop'.split(' ').forEach(event => {
    ui.terminal.addEventListener(event, out)
  })

  function out() {
    enters--
    if (enters === 0)
      ui.terminal.classList.remove('dragging')
  }

  ui.terminal.addEventListener('drop', function(e) {
    const files = e.dataTransfer.files

    if (files.length === 0)
      return window.alert('No files')

    socket.send('cwd')
    onCWD = uploadFiles.bind(null, files)
  })

  function uploadFiles(files, destination) {
    onCWD = null
    const xhr = new XMLHttpRequest()
        , form = new FormData()

    Array.from(files).forEach((file, i) => {
      form.append('file' + 1, file, file.name)
    })

    const url = window.location.href.split('/terminals')[0]

    xhr.open('POST'
      , url + '/fs' + (window.location.search || '?') + '&path=' + encodeURIComponent(destination)
      , true)

    xhr.upload.onprogress = (e) => ui.status.innerText = Math.round((e.loaded / e.total) * 100) + '%'
    xhr.onload = () => log(xhr.status === 200 ? 'Transferred' : 'Error: ' + xhr.status)
    xhr.onerror = err => log(err)
    xhr.send(form)
  }

  function log() {
    ui.status.innerText = Array.from(arguments).join('\n')
    console.log.apply(console, arguments) // eslint-disable-line
  }

}())
