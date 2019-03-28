var socket = io();

socket.on('refresh', function (data) {
  console.log(data)
  document.querySelector('#messages').innerHTML = data
});
