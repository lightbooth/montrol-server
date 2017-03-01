/* global m */

(function() {

  const handlers = new Map()
      , fs = {}

  const protocol = window.protocol === 'https:' ? 'wss://' : 'ws://'
      , url = protocol + window.location.host + window.location.pathname + '?id=' + guid()
      , socket = new window.PersistentWebSocket(url)

  let selected = ['/']
    , status = ''
    , columns = getColumns()

  socket.pingTimeout = false

  socket.onmessage = e => {
    let data
    try {
      data = JSON.parse(e.data)
    } catch (err) {
      return console.error(err)
    }

    if (data.error)
      return console.error(data.error)

    const handler = handlers.get(data.type)
    handler && handler(data)
    m.redraw()
  }

  handlers.set('readdir', data => {
    let next = fs

    data.path.forEach((name, i) => {
      if (name && !next[name])
        next[name] = { '' : { name: name, level: i, type: 'folder' } }

      next = next[name]

      if (data.path.length === i + 1) {
        data.result.forEach((p) => {
          p.level = i + 1
          next[p.name] = { '' : p }
        })
      }

    })

    columns = getColumns()
  })

  socket.onopen = () => {
    log('connected')
    socket.send(JSON.stringify({ type: 'readdir', path: ['/'] }))
  }
  socket.onclose = () => log('closed')
  socket.onerror = err => log('socket error', err)

  function log() {
    status = Array.from(arguments).join('\n')
    console.log.apply(console, arguments)
    m.redraw()
  }

  function row([name, item]) {
    const level = item[''].level
    return m('li', {
      class: [
        item[''].type,
        selected[level] === name ? 'selected' : '',
        name.startsWith('.') ? 'hidden' : ''
      ].join(' '),
      onclick: item[''].type === 'folder' && (e => {
        e.stopPropagation()
        select(name, item)
      }),
      ondblclick: item[''].type === 'file' && (e => download(name, item))
    }, m('span', name))
  }

  // symlink ['/'].concat(item[''].path.split('/').filter(a => a))

  function column(item) {
    if (!item)
      return

    return m('ul', !item['']
      ? m('li', m('span', '(loading)'))
      : item[''].type === 'folder'
        ? Object.entries(item).slice(1).map(row)
        : stat(item)
    )
  }

  function stat(item) {
    return m('strong', 'stat', JSON.stringify(item))
  }

  const app = {
    view: vnode => [
      m('pre#status', status),
      m('#files', {
      }, columns.map(column))
    ]
  }

  function getColumns() {
    let next = fs
    const cols = selected.map(part => {
      next = next[part] || { '/' : {} }
      return next
    })

    return cols
  }

  function download(name, item) {
    const link = document.createElement('a')
    link.download = name
    link.href = window.location + '?path=' + selected.concat(name).join('/').replace('//', '/')
    link.click()
  }

  function select(name, item) {
    const level = item[''].level
    selected = (selected.length !== level + 1 || selected[level] !== name)
               ? selected.slice(0, level).concat(name)
               : selected.slice(0, level)

    if (!columns[level])
      columns[level] = {}

    columns = columns.slice(0, level + 1)
    m.redraw()
    window.requestAnimationFrame(() =>
      document.body.scrollLeft = document.body.scrollWidth - document.body.clientWidth
    )

    socket.send(JSON.stringify({
      type: 'readdir',
      path: selected
    }))
  }

  m.mount(document.body, app)

  function guid() {
    return 'xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0
          , v = c === 'x' ? r : (r & 0x3 | 0x8)

      return v.toString(16)
    })
  }
}())
