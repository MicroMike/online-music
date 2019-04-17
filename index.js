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

    console.log(accounts.length)
  })
});

let runnerAccounts = {}
let imgs = {}
let clients = {}
let streams = {}
let webs = {}

let displayLength = (log) => {
  const values = Object.values(runnerAccounts)
  console.log(log, values.length)
}

io.on('connection', client => {
  client.emit('activate', client.id)

  client.on('runner', account => {
    runnerAccounts[client.id] = account
    streams[client.id] = client

    accounts = accounts.filter(a => Object.values(runnerAccounts).indexOf(a) < 0)

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
    const { del, max, env } = params

    accounts = accounts.filter(a => del.indexOf(a) < 0)

    displayLength('Connected')

    client.on('play', playerLength => {
      if (playerLength >= max) { return }

      const account = getAccount(env)

      if (account) {
        client.emit('run', account)
        displayLength('Add')
      }
    })

    client.on('loop', params => {
      const { errorMsg, account } = params
      displayLength(errorMsg + ' ' + account)
    });

    client.on('delete', account => {
      playing = playing.filter(a => a !== account)
      displayLength('Del ' + account)

      fs.readFile('napsterAccountDel.txt', 'utf8', function (err, data) {
        if (err) return console.log(err);
        data = data.split(',').filter(e => e)
        if (data.indexOf(account) < 0) { data.push(account) }
        fs.writeFile('napsterAccountDel.txt', data.length === 1 ? data[0] : data.join(','), function (err) {
          if (err) return console.log(err);
        });
      });
    })

    client.emit('goPlay')
  })

  client.on('disconnect', () => {
    if (clients[client.id]) {
      if (playing.length) {
        console.log('retreive', playing.length)
      }
      console.log('Disconnect')

      playing.forEach(a => {
        if (accounts.indexOf(a) < 0) { accounts.push(a) }
      });

      playing = []

      delete clients[client.id]
    }
    else if (webs[client.id]) {
      delete webs[client.id]
    }
    else if (streams[client.id]) {
      const runnerAccount = runnerAccounts[client.id]
      if (runnerAccount && accounts.indexOf(runnerAccount) < 0) { accounts.push(runnerAccount) }

      delete imgs[client.id]
      delete streams[client.id]
      delete runnerAccounts[client.id]

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
      accounts = accounts.filter(m => m.split(':')[0] !== 'spotify')
    })
  })
});

app.listen(process.env.PORT || 3000);