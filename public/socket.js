var socket = io();

socket.on('refresh', function (data) {
  console.log(data);
});
