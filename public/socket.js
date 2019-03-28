var socket = io();

socket.on('refresh', function (data) {
  const className = account.split('@').join('-')

  if (data.exit) {
    document.querySelector('#list .' + className).remove()
  }

  if (data.used) {
    document.querySelector('#list .' + className).remove()
    document.querySelector('#used').insertAdjacentHTML('beforeEnd', '<div id="' + className + '">' + data.account + '</div>')
  }

  if (data.play) {
    document.querySelector('#used .' + className).remove()
    document.querySelector('#list').insertAdjacentHTML('beforeEnd', '<div id="' + className + '">' + data.account + '</div>')
  }
});
