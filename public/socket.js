var socket = io();

socket.on('refresh', function (data) {
  document.querySelector('#messages').innerHTML = data
});
