const fs = require('fs');
const server = require('http').createServer();
const io = require('socket.io')(server);

let accounts
let nbAccounts
let file = process.env.FILE || 'napsterAccount.txt'

const rand = (max, min) => {
  return Math.floor(Math.random() * Math.floor(max) + (typeof min !== 'undefined' ? min : 0));
}

const getAccount = env => {
  if (env.RAND) {
    for (let i = 0; i < accounts.length; i++) {
      accounts.sort(() => { return rand(2) })
    }
  }

  if (env.TYPE) {
    accounts = accounts.filter(m => m.split(':')[0] === env.TYPE)
  }

  return accounts.length ? accounts[0] : false
}

fs.readFile(file, 'utf8', async (err, data) => {
  if (err) return console.log(err);

  fs.readFile('napsterAccountDel.txt', 'utf8', async (err2, dataDel) => {
    if (err2) return console.log(err2);

    accounts = data.split(',')

    dataDel = dataDel.split(',').filter(e => e)
    accounts = accounts.filter(e => dataDel.indexOf(e) < 0)

    nbAccounts = accounts.length
    console.log(nbAccounts)
  })
});

io.on('connection', client => {
  let inter
  let playing = []

  console.log('connected', accounts.length)

  client.emit('activate', client.id)

  client.on('ok', ({ accountsValid, max, env }) => {
    accounts = accounts.filter(a => accountsValid.indexOf(a) < 0)

    inter = setInterval(() => {
      if (playing.length >= max) { return }

      const account = getAccount(env)
      if (account) {
        accounts = accounts.filter(a => a !== account)
        playing.push(account)
        client.emit('run', account)
      }
    }, 1000 * 30);
  })

  client.on('loop', account => {
    if (accounts.indexOf(account) < 0) { accounts.push(account) }
    playing = playing.filter(a => a !== account)
    console.log('loop', nbAccounts - accounts.length)
  });

  client.on('delete', account => {
    nbAccounts--
    console.log('del', account, nbAccounts - accounts.length)

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

  client.on('disconnect', () => {
    console.log('retreive', playing.length, nbAccounts - accounts.length)

    playing.forEach(a => {
      if (accounts.indexOf(a) < 0) { accounts.push(a) }
    });

    playing = []
    clearInterval(inter)
    client.removeAllListeners()

    console.log('disconnect')
  })

});


server.listen(process.env.PORT || 3000);