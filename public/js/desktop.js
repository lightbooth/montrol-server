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

  const protocol = window.protocol === 'https' ? 'wss://' : 'ws://'
  const url = protocol + window.location.host + window.location.pathname + window.location.search

  document.title = 'desk:' + window.location.pathname.split('/')[2]

  let mouseover = false

  log('connecting')
  const socket = new window.PersistentWebSocket(url, { pingTimeout: false })

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

  ui.screen.onclick = getPosition((pos, button) => {
    socket.send('mouse.move.' + pos)
    socket.send('mouse.click.' + buttons[button])
  })

  document.onkeypress = getKey(key =>
    socket.send('keyboard.press.' + key)
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
