(function() {

  const ui = {
    screen: document.getElementById('screen'),
    status: document.getElementById('status')
  }

  const buttons = {
    1: 'left',
    2: 'middle',
    3: 'right'
  }

  const url = 'ws://' + window.location.host + window.location.pathname + window.location.search

  document.title = 'desk:' + window.location.pathname.split('/')[2]

  let mouseover = false

  log('connecting')
  const socket = new window.PersistentWebSocket(url)
  socket.pingTimeout = false

  socket.onopen = () => {
    log('connected')
    socket.onmessage = e => {
      if (typeof e.data === 'string')
        return log(e.data)

      ui.screen.src = window.URL.createObjectURL(e.data)
    }
  }

  socket.onclose = () => {
    log('closed')
  }

  socket.onerror = err => {
    log('socket error', err)
  }

  ui.screen.onmouseenter = e => mouseover = true
  ui.screen.onmouseleave = e => mouseover = false

  ui.screen.onmousemove = getPosition(pos =>
    socket.send('mouse.move.' + pos)
  )

  ui.screen.onmousedown = getPosition((pos, button) => {
    socket.send('mouse.move.' + pos)
    socket.send('mouse.down.' + buttons[button])
  })

  ui.screen.onmouseup = getPosition((pos, button) => {
    socket.send('mouse.move.' + pos)
    socket.send('mouse.up.' + buttons[button])
  })

  document.onkeyup = getKey(key =>
    socket.send('keyboard.up.' + key)
  )

  document.onkeydown = getKey(key =>
    socket.send('keyboard.down.' + key)
  )

  document.onmousewheel = e => {
    socket.send('mouse.scroll.' + e.wheelDelta)
  }

  ui.screen.oncontextmenu = e => e.preventDefault()

  function getKey(fn) {
    return function(e) {
      if (!mouseover)
        return

      e.preventDefault()
      e.stopPropagation()
      const key = window.keycode(e)
      return key && fn(key)
    }
  }

  function getPosition(fn) {
    return function(e) {
      e.preventDefault()
      const rect = e.target.getBoundingClientRect()

      fn([e.clientX - rect.left, e.clientY - rect.top].join(','), e.which)
    }
  }

  function log() {
    ui.status.innerText = Array.from(arguments).join('\n')
    console.log.apply(console, arguments)
  }

}())
