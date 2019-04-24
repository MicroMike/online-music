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
let restart = true
let checking = false

setTimeout(() => {
  restart = false
}, 1000 * 30);

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

const getAccounts = () => {
  fs.readFile(file, 'utf8', async (err, data) => {
    if (err) return console.log(err);

    fs.readFile('napsterAccountDel.txt', 'utf8', async (err2, dataDel) => {
      if (err2) return console.log(err2);

      accounts = data.split(',')

      dataDel = dataDel.split(',').filter(e => e)
      accounts = accounts.filter(e => dataDel.indexOf(e) < 0)
      // accounts = accounts.filter(m => m.split(':')[0] !== 'spotify')

      console.log(accounts.length)
    })
  });
}

getAccounts()

let imgs = {}
let clients = {}
let streams = {}
let webs = {}
let checkClient

let displayLength = (log) => {
  const values = Object.values(streams)
  console.log(log, values.length)
}

const getAllData = () => ({
  accounts: accounts.length,
  streams: Object.values(streams).length,
  ...Object.values(clients).map(c => Object.values(streams).filter(s => s.parentId === c.uniqId).length),
  webs: Object.values(webs).length,
  nopeStreams: Object.values(streams).filter(s => Object.values(clients).find(c => c.uniqId === s.parentId) === undefined).length,
  nopeClients: Object.values(clients).filter(c => Object.values(streams).find(s => s.parentId === c.uniqId) === undefined).length,
  restart
})

io.on('connection', client => {
  client.emit('activate', client.id)

  client.on('runner', ({ clientId, account, id }) => {
    client.parentId = clientId
    client.uniqId = id
    streams[id] = client
    accounts = accounts.filter(a => a !== account)
    displayLength('Add')

    client.on('player', clientId => {
      try {
        clients[clientId].emit('goPlay')

        Object.values(webs).forEach(w => {
          w.emit('allData', getAllData())
        })
      }
      catch (e) { }
    })

    client.on('screen', data => {
      if (data.errorMsg) {
        displayLength(data.errorMsg + ' ' + data.account)
      }
      imgs[client.uniqId] = data
      Object.values(webs).forEach(c => {
        c.emit('stream', data)
      })
    })

    client.on('stream', data => {
      data.log = imgs[client.uniqId] && imgs[client.uniqId].log
      Object.values(webs).forEach(w => {
        w.emit('stream', data)
      })
    })

    client.on('retryOk', () => {
      delete imgs[client.uniqId]
      Object.values(webs).forEach(w => {
        w.emit('endStream', client.uniqId)
      })
    })
  })

  client.on('ok', ({ accountsValid, del, max, env, first, id }) => {
    client.uniqId = id
    clients[id] = client

    if (max === 40) {
      checkClient = client
    }

    if (accountsValid) {
      accounts = accounts.filter(a => accountsValid.indexOf(a) < 0)
    }
    accounts = accounts.filter(a => del.indexOf(a) < 0)

    console.log('Connected', accountsValid ? accountsValid.length : 0)

    client.on('play', () => {
      setTimeout(() => {

        const playerLength = Object.values(streams).filter(s => s.parentId === client.uniqId).length

        if (playerLength >= max) { return }

        if (checking && checkClient.uniqId === client.uniqId) {
          const checkAccount = checkAccounts.length ? checkAccounts.shift() : false

          if (checkAccount) {
            client.emit('runCheck', checkAccount)
          }
        }
        else {
          const account = getAccount(env)

          if (account) {
            client.emit('run', account)
          }
        }

      }, 1000 * 10);
    })

    client.on('loop', ({ errorMsg, account }) => {
      setTimeout(() => {
        if (accounts.indexOf(account) < 0) { accounts.push(account) }
      }, errorMsg === 'Used' ? 1000 * 60 * 10 : 0);

      if (errorMsg) {
        displayLength(errorMsg + ' ' + account)
      }
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
    if (clients[client.uniqId]) {
      delete clients[client.uniqId]
    }
    else if (webs[client.id]) {
      delete webs[client.id]
    }
    else if (streams[client.uniqId]) {
      delete streams[client.uniqId]
    }

    client.removeAllListeners()
  })

  client.on('Cdisconnect', data => {
    if (clients[client.uniqId]) {
      const playerLength = data ? data.length : 0
      if (playerLength) {
        console.log('retreive', playerLength)
      }
      console.log('Disconnect')
    }
    else if (streams[client.uniqId]) {
      Object.values(webs).forEach(c => {
        c.emit('endStream', client.uniqId)
      })

      // delete imgs[client.uniqId]

      clients[data] && clients[data].emit('goPlay')

      Object.values(webs).forEach(w => {
        w.emit('allData', getAllData())
      })
    }
    else {
      console.log('Orphan proccess')
    }

    client.disconnect()
    client.removeAllListeners()
  })

  client.on('web', () => {
    webs[client.id] = client

    Object.values(imgs).forEach(d => {
      Object.values(webs).forEach(c => {
        c.emit('stream', d)
      })
    })

    client.on('getAllData', () => {
      client.emit('allData', getAllData())
    })

    client.on('clearData', () => {
      if (!restart) {
        Object.values(streams).filter(s => !clients[s.parentId]).forEach(c => c.disconnect())
        Object.values(clients).filter(c => Object.values(streams).find(s => s.parentId === c.uniqId) === undefined).forEach(c => c.disconnect())
      }
    })

    fs.readFile('napsterAccountDel.txt', 'utf8', async (err, delList) => {
      if (err) return console.log(err);
      client.emit('delList', delList)
    })

    client.on('runScript', ({ id, scriptText }) => {
      streams[id] && streams[id].emit('runScript', scriptText)
    })

    client.on('restart', () => {
      getAccounts()

      restart = true
      checking = false

      setTimeout(() => {
        restart = false
      }, 1000 * 30);

      Object.values(clients).forEach(c => {
        c.emit('restartClient')
      })
    })

    client.on('streamOn', clientId => {
      try {
        streams[clientId].emit('streamOn')
      }
      catch (e) {
        delete imgs[clientId]
        client.emit('endStream', clientId)
      }
    })

    client.on('streamOff', clientId => {
      try {
        streams[clientId].emit('streamOff')
      }
      catch (e) {
        delete imgs[clientId]
        client.emit('endStream', clientId)
      }
    })

    client.on('check', () => {
      fs.readFile('check.txt', 'utf8', async (err, data) => {
        if (err) return console.log(err);
        checkAccounts = data.split(',').filter(e => e)

        checking = true
        checkClient.emit('restartClient')
      })
    })

    client.on('endCheck', () => {
      checking = false
      checkClient.emit('restartClient')
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