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
let checkAccounts
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

fs.readFile('check.txt', 'utf8', async (err, data) => {
  if (err) return console.log(err);
  checkAccounts = data.split(',').filter(e => e)
})

let imgs = {}
let clients = {}
let streams = {}
let webs = {}
let startRun = {}

let displayLength = (log) => {
  const values = Object.values(streams)
  console.log(log, values.length)
}

io.on('connection', client => {
  client.emit('activate', client.id)

  client.on('startRun', () => {
    startRun[client.id] = client
  })

  client.on('runner', ({ clientId, account }) => {
    client.parentId = clientId
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

    client.on('play', accountsValid => {
      const playerLength = accountsValid ? accountsValid.length : 0
      if (playerLength >= max) { return }

      const account = getAccount(env)

      if (account) {
        client.emit('run', account)
      }
    })

    client.on('playCheck', () => {
      const checkAccount = checkAccounts.length ? checkAccounts.shift() : false

      if (checkAccount) {
        client.emit('runCheck', checkAccount)
      }
    })

    client.on('loop', params => {
      const { errorMsg, account } = params
      if (errorMsg === 'Used') {
        setTimeout(() => {
          if (accounts.indexOf(account) < 0) { accounts.push(account) }
        }, 1000 * 60 * 10);
      }
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

    const streamLeft = Object.values(streams).find(s => s.parentId === client.id)
    if (!streamLeft) {
      client.emit('goPlay')
    }
  })

  client.on('disconnect', id => {
    delete clients[id]
    delete streams[id]
    delete imgs[id]
    delete startRun[client.id]
  })

  client.on('customDisconnect', ({ accountsValid, clientId, loop }) => {
    if (clients[client.id]) {
      const playerLength = accountsValid ? accountsValid.length : 0
      if (playerLength) {
        console.log('retreive', playerLength)
      }
      console.log('Disconnect')

      Object.values(streams).forEach(s => {
        if (s.parentId === client.id) {
          s.emit('reStart')
        }
      })
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

      if (loop) {
        try {
          clients[clientId].emit('goPlay')
        }
        catch (e) { }
      }
      else {
        const streamLeft = Object.values(streams).find(s => s.parentId === clientId)
        if (!streamLeft) {
          const client = clients[clientId]
          client.emit('exitRun')
          if (client.restart) {

          }
          delete clients[clientId]
        }
      }
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

    client.on('runScript', ({ id, scriptText }) => {
      streams[id].emit('runScript', scriptText)
    })

    client.on('reset', () => {
      Object.values(startRun).forEach(c => {
        c.emit('reseted')
      })
    })

    client.on('start', () => {
      Object.values(startRun).forEach(c => {
        c.emit('started')
      })
    })

    client.on('stop', () => {
      Object.values(startRun).forEach(c => {
        c.emit('stopped')
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
      let checkClient = Object.values(clients)[0]
      if (!checkClient) { return console.log('error check') }

      checkClient.emit('check')
    })

    client.on('endCheck', () => {
      let checkClient = Object.values(clients)[0]
      if (!checkClient) { return console.log('error check') }

      checkClient.emit('endCheck')
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