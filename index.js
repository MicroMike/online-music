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

  return accounts.length ? accounts[0] : false
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

let lengthArr = {}
let displayLength = (log) => {
  const values = Object.values(lengthArr)
  const total = values.length && values.reduce((pv, cv) => {
    return pv + cv
  })

  console.log(log, values.length ? total : 0)
}

io.on('connection', client => {
  let inter
  let playing = []

  const setLength = (log) => {
    lengthArr[client.id] = playing.length
    displayLength(log)
  }

  client.emit('activate', client.id)

  client.on('ok', ({ accountsValid, max, env, del }) => {
    accounts = accounts.filter(a => accountsValid.indexOf(a) < 0)
    accounts = accounts.filter(a => del.indexOf(a) < 0)
    playing = accountsValid

    setLength('Connected')

    inter = setInterval(() => {
      if (playing.length >= max) { return }

      const account = getAccount(env)
      if (account) {
        client.emit('run', account)
        accounts = accounts.filter(a => a !== account)
        playing.push(account)
        setLength('Add')
      }
    }, 1000 * 30);
  })

  client.on('loop', account => {
    if (accounts.indexOf(account) < 0) { accounts.push(account) }
    playing = playing.filter(a => a !== account)
    setLength('Loop')
  });

  client.on('delete', account => {
    playing = playing.filter(a => a !== account)
    setLength('Del ' + account)
  })

  client.on('disconnect', () => {
    console.log('retreive', playing.length)

    playing.forEach(a => {
      if (accounts.indexOf(a) < 0) { accounts.push(a) }
    });

    playing = []
    delete lengthArr[client.id]
    displayLength('Disconnect')
    clearInterval(inter)
    client.removeAllListeners()
  })

  client.on('a', () => {
    console.log('reset')
    io.emit('b')
  })

  io.on('b', () => {
    client.emit('reStart')
  })
});

app.listen(process.env.PORT || 3000);