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
let imgs = []

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

let clients = {}
let webs = {}
let lengthArr = {}
let displayLength = (log) => {
  const values = Object.values(lengthArr)
  const total = values.length && values.reduce((pv, cv) => {
    return pv + cv
  })

  console.log(log, values.length ? total : 0)
}

io.on('connection', client => {
  let playing = []

  const setLength = (log) => {
    lengthArr[client.id] = playing.length
    displayLength(log)
  }

  client.emit('activate', client.id)

  client.on('player', clientId => {
    try {
      clients[clientId].emit('goPlay')
    }
    catch (e) { }
  })

  client.on('ok', params => {
    clients[client.id] = client
    const { accountsValid, del, max, env } = params

    playing = accountsValid
    accounts = accounts.filter(a => accountsValid.indexOf(a) < 0)
    accounts = accounts.filter(a => del.indexOf(a) < 0)

    setLength('Connected')

    client.on('play', () => {
      if (playing.length >= max) { return }

      const account = getAccount(env)

      if (account) {
        client.emit('run', account)
        accounts = accounts.filter(a => a !== account)
        playing.push(account)
        setLength('Add')
      }
    })

    client.on('loop', params => {
      const { errorMsg, account } = params
      if (accounts.indexOf(account) < 0) { accounts.push(account) }
      playing = playing.filter(a => a !== account)
      setLength(errorMsg + ' ' + account)
      client.emit('goPlay')
    });

    client.on('delete', account => {
      playing = playing.filter(a => a !== account)
      setLength('Del ' + account)
      client.emit('goPlay')

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

  client.on('screen', data => {
    imgs.push(data)
    Object.values(webs).forEach(c => {
      c.emit('displayScreen', data)
    })
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

      delete lengthArr[client.id]
      delete clients[client.id]
    }
    else if (webs[client.id]) {
      delete webs[client.id]
    }

    client.removeAllListeners()
  })

  fs.readFile('napsterAccountDel.txt', 'utf8', async (err, delList) => {
    if (err) return console.log(err);
    client.emit('delList', delList)
  })

  client.on('html', ({ clientId, html }) => {
    Object.values(webs).forEach(c => {
      c.emit('writeHtml', { clientId, html })
    })
  })

  client.on('web', () => {
    webs[client.id] = client

    imgs.forEach(d => {
      Object.values(webs).forEach(c => {
        c.emit('displayScreen', d)
      })
    })

    client.on('a', () => {
      Object.values(clients).forEach(c => {
        c.emit('reStart')
      })
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
      imgs = []
    })
  })
});

app.listen(process.env.PORT || 3000);