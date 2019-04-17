var app = require('http').createServer(handler)
var io = require('socket.io')(app);
var fs = require('fs');

function handler(req, res) {
  fs.readFile(__dirname + '/index.html',
    function (err, data) {
      if (err) {
        res.writeHead(500);
        return res.end('Error loading index.html');
      }

      res.writeHead(200);
      res.end(data);
    });
}

let accounts
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

  return accounts.length ? accounts.shift() : false
}

fs.readFile(file, 'utf8', async (err, data) => {
  if (err) return console.log(err);

  fs.readFile('napsterAccountDel.txt', 'utf8', async (err2, dataDel) => {
    if (err2) return console.log(err2);

    accounts = data.split(',')

    dataDel = dataDel.split(',').filter(e => e)
    accounts = accounts.filter(e => dataDel.indexOf(e) < 0)
    accounts = accounts.filter(m => m.split(':')[0] !== 'spotify')

    console.log(accounts.length)
  })
});

let imgs = {}
let clients = {}
let streams = {}
let webs = {}

let displayLength = (log) => {
  const values = Object.values(streams)
  console.log(log, values.length)
}

io.on('connection', client => {
  client.emit('activate', client.id)

  client.on('runner', account => {
    streams[client.id] = client
    accounts = accounts.filter(a => a !== account)
    displayLength('Add')

    client.on('player', clientId => {
      try {
        clients[clientId].emit('goPlay')
      }
      catch (e) { }
    })

    client.on('screen', data => {
      imgs[client.id] = data
      Object.values(webs).forEach(c => {
        c.emit('stream', data)
      })
    })

    client.on('stream', data => {
      data.log = imgs[client.id] && imgs[client.id].log
      Object.values(webs).forEach(c => {
        c.emit('stream', data)
      })
    })

    client.on('retryOk', () => {
      delete imgs[client.id]
      Object.values(webs).forEach(c => {
        c.emit('endStream', client.id)
      })
    })
  })

  client.on('ok', params => {
    clients[client.id] = client
    const { accountsValid, del, max, env } = params

    if (accountsValid) {
      accounts = accounts.filter(a => accountsValid.indexOf(a) < 0)
    }
    accounts = accounts.filter(a => del.indexOf(a) < 0)

    console.log('Connected', accountsValid ? accountsValid.length : 0)

    client.on('play', playerLength => {
      if (playerLength >= max) { return }

      const account = getAccount(env)

      if (account) {
        client.emit('run', account)
      }
    })

    client.on('loop', params => {
      const { errorMsg, account } = params
      if (accounts.indexOf(account) < 0) { accounts.push(account) }
      displayLength(errorMsg + ' ' + account)
    });

    client.on('delete', account => {
      displayLength('Del ' + account)
      accounts = accounts.filter(a => a !== account)

      fs.readFile('napsterAccountDel.txt', 'utf8', function (err, data) {
        if (err) return console.log(err);
        data = data.split(',').filter(e => e)
        if (data.indexOf(account) < 0) { data.push(account) }
        fs.writeFile('napsterAccountDel.txt', data.length === 1 ? data[0] : data.join(','), function (err) {
          if (err) return console.log(err);
        });
      });
    })

    client.on('retrieve', playerLength => {
      console.log('retreive', playerLength)
    })

    client.emit('goPlay')
  })

  client.on('disconnect', () => {
    if (clients[client.id]) {
      console.log('Disconnect')
      delete clients[client.id]
    }
    else if (webs[client.id]) {
      delete webs[client.id]
    }
    else if (streams[client.id]) {
      delete imgs[client.id]
      delete streams[client.id]

      Object.values(webs).forEach(c => {
        c.emit('endStream', client.id)
      })
    }

    client.removeAllListeners()
  })

  client.on('web', () => {
    webs[client.id] = client

    Object.values(imgs).forEach(d => {
      Object.values(webs).forEach(c => {
        c.emit('stream', d)
      })
    })

    fs.readFile('napsterAccountDel.txt', 'utf8', async (err, delList) => {
      if (err) return console.log(err);
      client.emit('delList', delList)
    })

    client.on('a', () => {
      Object.values(clients).forEach(c => {
        c.emit('reStart')
      })
    })

    client.on('streamOn', clientId => {
      try {
        streams[clientId].emit('streamOn')
      }
      catch (e) { }
    })

    client.on('streamOff', clientId => {
      try {
        streams[clientId].emit('streamOff')
      }
      catch (e) { }
    })

    client.on('check', () => {
      let checkAccounts
      let checkClient = Object.values(clients)[0]

      if (!checkClient) { return console.log('error check') }

      client.on('endCheck', () => {
        checkClient.emit('endCheck')
      })

      fs.readFile('check.txt', 'utf8', async (err, data) => {
        if (err) return console.log(err);

        checkAccounts = data.split(',').filter(e => e)

        checkClient.emit('check')
      })

      checkClient.on('playCheck', () => {
        checkAccount = checkAccounts.length ? checkAccounts.shift() : false

        if (checkAccount) {
          checkClient.emit('runCheck', checkAccount)
        }
      })
    })

    client.on('clearScreen', () => {
      imgs = {}
    })

    client.on('spotifyPause', () => {
      fs.readFile(file, 'utf8', async (err, data) => {
        if (err) return console.log(err);

        fs.readFile('napsterAccountDel.txt', 'utf8', async (err2, dataDel) => {
          if (err2) return console.log(err2);

          accounts = data.split(',')

          dataDel = dataDel.split(',').filter(e => e)
          accounts = accounts.filter(e => dataDel.indexOf(e) < 0)

          console.log(accounts.length)
        })
      });
    })
  })
});

app.listen(process.env.PORT || 3000);