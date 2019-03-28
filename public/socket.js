var socket = io();

socket.on('request', function (socket) {
  console.log('request');
});

socket.on('broadcast', function (socket) {
  console.log('broadcast');
});
