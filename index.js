var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var PORT = process.env.PORT || 3000

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});

app.use(express.static('public'));

io.on('connection', function (socket) {
  socket.on('update', function (data) {
    io.emit('refresh', data)
  })

  socket.on('message', function (data) {
    console.log(data)
  })
});

http.listen(PORT, function () {
  console.log('listening on *:' + PORT);
});