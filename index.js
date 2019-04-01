const fs = require('fs');
const server = require('http').createServer();
const io = require('socket.io')(server);

let accounts
let nbAccounts
let file = process.env.FILE || 'napsterAccount.txt'

const rand = (max, min) => {
  return Math.floor(Math.random() * Math.floor(max) + (typeof min !== 'undefined' ? min : 0));
}

function shuffle(arr) {
  for (let i = 0; i < arr.length; i++) {
    arr.sort(() => { return rand(2) })
  }
  return arr
}

fs.readFile(file, 'utf8', async (err, data) => {
  if (err) return console.log(err);

  fs.readFile('napsterAccountDel.txt', 'utf8', async (err2, dataDel) => {
    if (err2) return console.log(err2);

    accounts = data.split(',')

    dataDel = dataDel.split(',').filter(e => e)
    accounts = accounts.filter(e => dataDel.indexOf(e) < 0)

    if (process.env.TYPE) {
      accounts = accounts.filter(m => m.split(':')[0] === process.env.TYPE)
    }

    nbAccounts = accounts.length
    console.log(nbAccounts)
  })
});

io.on('connection', client => {
  console.log('connected', accounts.length)
  client.emit('done')

  client.on('getOne', (isRand) => {
    const account = isRand ? shuffle(accounts)[0] : accounts[0]
    accounts = accounts.filter(a => a !== account)
    client.emit('run', account)
    console.log('current', nbAccounts - accounts.length)
  })

  client.on('loop', account => {
    accounts.push(account)
  });

  client.on('delete', account => {
    nbAccounts--

    fs.readFile('napsterAccountDel.txt', 'utf8', function (err, data) {
      if (err) return console.log(err);
      data = data.split(',').filter(e => e)
      data = data.filter(a => a !== account)
      data.push(account)
      fs.writeFile('napsterAccountDel.txt', data.length === 1 ? data[0] : data.join(','), function (err) {
        if (err) return console.log(err);
      });
    });
  })

  client.on('exitScript', data => {
    accounts = accounts.concat(data)
    console.log('retreive', data.length, nbAccounts - accounts.length)
  });

});


server.listen(process.env.PORT || 3000);