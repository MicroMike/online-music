var socket = io();

const reboot = () => {
  socket.emit('reset')
}
