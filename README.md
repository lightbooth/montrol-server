# Montrol server

HTTP URIs

For devices

For browsers
`get  /devices`
`get  /devices/:mac`
`get  /devices/:mac/logs`
`get  /devices/:mac/terminals`
`get  /devices/:mac/desktop`
`post /devices/:mac/uploads/:guid`
`get  /devices/:mac/downloads/:guid`

WS URIs

For devices
`upgrade /devices/:mac`

For browsers
`upgrade /devices/:mac/desktop`
`upgrade /devices/:mac/terminals/new` // forwards to new session
`upgrade /devices/:mac/terminals/:guid` // connects to existing session
`upgrade /devices/:mac/fs` // connects to existing session
