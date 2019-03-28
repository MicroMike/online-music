var socket = io();

socket.on('refresh', function (data) {
  if (data.exit) {
    document.querySelector('#list #' + data.account).remove()
  }

  if (data.used) {
    document.querySelector('#list #' + data.account).remove()
    document.querySelector('#used').insertAdjacentHTML('beforeEnd', '<div id="' + data.account + '">' + data.account + '</div>')
  }

  if (data.play) {
    document.querySelector('#used #' + data.account).remove()
    document.querySelector('#list').insertAdjacentHTML('beforeEnd', '<div id="' + data.account + '">' + data.account + '</div>')
  }
});
