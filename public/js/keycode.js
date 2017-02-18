(function() {

  window.keycode = keycode

  const codes = {
    8   : 'backspace',
    9   : 'tab',
    13  : 'enter',
    16  : 'shift',
    17  : 'control',
    18  : 'alt',
    27  : 'escape',
    32  : 'space',
    33  : 'pageup',
    34  : 'pagedown',
    35  : 'end',
    36  : 'home',
    37  : 'left',
    38  : 'up',
    39  : 'right',
    40  : 'down',
    45  : 'insert',
    46  : 'delete',
    91  : 'command',
    93  : 'command',
    186 : ';',
    187 : '=',
    188 : ',',
    189 : '-',
    190 : '.',
    191 : '/',
    192 : '`',
    219 : '[',
    220 : '\\',
    221 : ']',
    222 : '\''
  }

  for (let i = 97; i < 123; i++) codes[i - 32] = String.fromCharCode(i)
  for (let i = 48; i < 58; i++) codes[i] = String(i - 48)
  for (let i = 1; i < 13; i++) codes[i + 111] = 'f' + i
  for (let i = 0; i < 10; i++) codes[i + 96] = 'numpad_' + i

  function keycode(e) {
    return codes[e.which || e.keyCode || e.charCode]
  }

}())
