var socket = io();

socket.on('refresh', function (data) {
  const className = data.account.replace(/[^a-z0-9]/gi, '')

  if (data.accountsValid) {
    document.querySelector('h1').innerText = data.accountsValid + ' accounts playing'
  }

  if (data.exit) {
    document.querySelector('#list .' + className) && document.querySelector('#list .' + className).remove()
  }

  if (data.used) {
    document.querySelector('#list .' + className) && document.querySelector('#list .' + className).remove()
    document.querySelector('#used').insertAdjacentHTML('beforeEnd', '<div id="' + className + '">' + data.account + '</div>')
  }

  if (data.play) {
    document.querySelector('#used .' + className) && document.querySelector('#used .' + className).remove()
    document.querySelector('#list').insertAdjacentHTML('beforeEnd', '<div id="' + className + '">' + data.account + '</div>')
  }
});
