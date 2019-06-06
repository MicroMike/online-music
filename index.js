var app = require('http').createServer(handler)
var io = require('socket.io')(app);
var fs = require('fs');
const request = require('ajax-request');

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

let restart = false
let start = true
setTimeout(() => {
  start = false
}, 1000 * 60);

let waitForRestart

let accounts
let busy = {}
let checkAccounts
let file = process.env.FILE || 'napsterAccount.txt'
let checking = false
let plays = 0
let nexts = 0
let time = 0

let imgs = {}
let clients = {}
let checkoutC = {}
let checkoutS = {}
let streams = {}
let webs = {}
let checkClient
let used = {}

request('http://online-accounts.herokuapp.com/gain', function (error, response, body) {
  const r = JSON.parse(body)
  plays = r.plays
  nexts = r.nexts
  time = r.time
})

let gain = 0
let gain2 = 0
let tempPlays = plays
setInterval(() => {
  gain = plays * 0.004 / ++time
  gain2 = (plays - tempPlays) * 0.004
  tempPlays = plays
  request('http://online-accounts.herokuapp.com/gain?' + plays + '/' + nexts + '/' + time, function (error, response, body) { })
}, 1000 * 60)

const rand = (max, min) => {
  return Math.floor(Math.random() * Math.floor(max) + (typeof min !== 'undefined' ? min : 0));
}

const getCheckAccounts = async () => {
  return new Promise(res => {
    request('https://online-accounts.herokuapp.com/checkAccounts', function (error, response, body) {
      const CA = JSON.parse(body)
      res(CA)
    })
  })
}

const getAccounts = async () => {
  return new Promise(res => {
    request('https://online-accounts.herokuapp.com/accounts', async (error, response, body) => {
      let Taccounts = JSON.parse(body)

      Object.values(streams).forEach(s => Taccounts = Taccounts.filter(a => a !== s.account))
      Object.values(used).forEach(usedaccount => Taccounts = Taccounts.filter(a => a !== usedaccount))

      accounts = Taccounts
      res(accounts)
    })
  })
}

// (async () => await getAccounts())()

const getAccount = async env => {
  accounts = await getAccounts()

  if (env.RAND) {
    for (let i = 0; i < accounts.length; i++) {
      accounts.sort(() => { return rand(2) })
    }
  }

  if (env.TYPE) {
    accounts = accounts.filter(m => m.split(':')[0] === env.TYPE)
  }

  let account = accounts.length ? accounts.shift() : false

  return account
}

let displayLength = (log) => {
  const values = Object.values(streams)
  console.log(log, values.length)
}

const stats = () => (Object.values(streams).reduce((acc, s) => {
  acc[s.parentId] = acc[s.parentId] ? acc[s.parentId] + 1 : 1
  return acc
}, []))

const getAllData = () => ({
  // clients: {
  //   ...Object.values(clients).map(c => Object.values(streams).filter(s => s.parentId === c.uniqId)),
  // },
  accounts: accounts && accounts.length,
  streams: Object.values(streams).length,
  used: Object.values(used).length,
  webs: Object.values(webs).length,
  checkLeft: checkAccounts && checkAccounts.length,
  nopeStreams: Object.values(streams).filter(s => Object.values(clients).find(c => c.uniqId === s.parentId) === undefined).length,
  nopeClients: Object.values(clients).filter(c => Object.values(streams).find(s => s.parentId === c.uniqId) === undefined).length,
  restart: restart || start,
  plays: plays * 0.004 + '€ (' + plays + ' / ' + nexts + ') ' + String(nexts / plays * 100).split('.')[0] + '%',
  gain: gain + '€/min ' + String(gain * 60 * 24 * 30).split('.')[0] + '€/mois',
  gain2: gain2 + '€/min ' + String(gain2 * 60 * 24 * 30).split('.')[0] + '€/mois',
  clients: stats()
})

io.on('connection', client => {

  const waitBeforeActivate = () => {
    if (waitForRestart) {
      setTimeout(() => {
        waitBeforeActivate()
      }, 1000 * 5);
    }
    else {
      client.emit('activate', client.id)
    }
  }

  waitBeforeActivate()

  client.on('log', log => {
    console.log(log)
  })

  client.on('plays', next => {
    if (next) { nexts++ }
    else { plays++ }

    request('http://online-accounts.herokuapp.com/gain?' + plays + '/' + nexts + '/' + time, function (error, response, body) { })

    Object.values(webs).forEach(w => {
      w.emit('allData', getAllData())
    })
  })

  client.on('runner', async ({ clientId, account, id, player, env }) => {
    const runnerAccount = await getAccount(env)

    client.parentId = clientId
    client.account = runnerAccount
    client.uniqId = id
    streams[id] = client

    // accounts = accounts.filter(a => a !== account)
    // displayLength('Add')

    Object.values(webs).forEach(w => {
      w.emit('allData', getAllData())
    })

    // client.on('out', cid => {
    //   const playerLength = Object.values(streams).filter(s => s.parentId === cid).length
    //   const ok = !clients[cid] || playerLength >= clients[cid].max
    //   console.log('out: ' + playerLength + ' ' + ok)
    //   client.emit('outOk', ok)
    // })

    client.on('playerInfos', datas => {
      if (!restart && !start) {
        // Object.values(streams).forEach(s => !clients[s.parentId] ? s.emit('forceOut') : false)
        // !clients[client.parentId] && client.emit('forceOut')
      }

      Object.values(webs).forEach(w => {
        // Object.values(streams).filter(s => !clients[s.parentId]).map(s => w.emit('playerInfos', { account: s.account, id: s.uniqId, nope: true }))
        w.emit('playerInfos', { ...datas, id: client.uniqId })
      })
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

    client.on('loop', ({ errorMsg, account }) => {
      if (errorMsg === 'used') {
        // displayLength(errorMsg + ' ' + account)
        used[account] = account
        setTimeout(() => { delete used[account] }, 1000 * 60 * 10);
      }
    });

    client.on('delete', account => {
      // displayLength('Del ' + account)
      // accounts = accounts.filter(a => a !== account)

      fs.readFile('napsterAccountDel.txt', 'utf8', function (err, data) {
        if (err) return console.log(err);
        data = data.split(',').filter(e => e)
        if (data.indexOf(account) < 0) { data.push(account) }
        fs.writeFile('napsterAccountDel.txt', data.length === 1 ? data[0] : data.join(','), function (err) {
          if (err) return console.log(err);
        });
      });
    })

    client.emit('streams', runnerAccount)
  })

  client.on('ok', async ({ accountsValid, del, max, env, first, id, check }) => {
    console.log('accountsValid', accountsValid.length)
    client.playTimeout
    client.max = max
    client.uniqId = id
    clients[id] = client

    Object.values(webs).forEach(w => {
      w.emit('allData', getAllData())
    })

    if (check) {
      checkAccounts = await getCheckAccounts()
      checkClient = client
    }

    client.on('play', async () => {
      if (waitForRestart) { return }

      // await getAccounts()

      client.playTimeout = setTimeout(() => {
        client.emit('goPlay')
      }, check ? 1000 * 30 : 1000 * 30 + rand(1000 * 90));

      // if ((start || restart) && !first) { return }

      const playerLength = Object.values(streams).filter(s => s.parentId === client.uniqId).length
      let accountToRun

      if (playerLength < max) {
        if (check) {
          accountToRun = checkAccounts.length > 0 && checkAccounts.shift()
        }
        else {
          accountToRun = getAccount(env)
        }

        if (accountToRun) {
          client.emit('run', accountToRun)
        }
      }
      else if (!rand(5)) {
        Object.values(streams).filter(s => s.parentId === client.uniqId)[0].emit('out')
      }
    })

    client.on('retrieve', playerLength => {
      console.log('retreive', playerLength)
    })

    const tryStart = () => {
      if (!waitForRestart) {
        console.log('Connected', accountsValid ? accountsValid.length : 0)
        client.emit('goPlay')
      }
      else {
        setTimeout(() => {
          tryStart()
        }, 1000 * 5);
      }
    }

    setTimeout(() => {
      tryStart()
    }, 1000 * 5);
  })

  client.on('disconnect', () => {
    Object.values(webs).forEach(w => {
      w.emit('allData', getAllData())
      w.emit('playerInfos', { account: client.account, id: client.uniqId, out: true })
    })

    // getAccounts()
    delete webs[client.id]
    delete clients[client.uniqId]
    delete streams[client.uniqId]
    // delete imgs[client.uniqId]

    client.removeAllListeners()
  })

  client.on('Cdisconnect', code => {
    if (clients[client.uniqId]) { }
    else if (streams[client.uniqId]) { }

    delete clients[client.uniqId]
    delete streams[client.uniqId]

    client.disconnect()
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
      if (!Object.values(clients).filter(c => Object.values(streams).find(s => s.parentId === c.uniqId) === undefined).length) {
        Object.values(streams).filter(s => !clients[s.parentId]).forEach(c => c.emit('forceOut'))
        // Object.values(clients).filter(c => Object.values(streams).find(s => s.parentId === c.uniqId) === undefined).forEach(c => c.disconnect())
      }
    })

    fs.readFile('napsterAccountDel.txt', 'utf8', async (err, delList) => {
      if (err) return console.log(err);
      client.emit('delList', delList)
    })

    client.on('runScript', ({ id, scriptText }) => {
      streams[id] && streams[id].emit('runScript', scriptText)
    })

    client.on('restart', cid => {

      restart = true
      checking = false

      setTimeout(() => {
        restart = false
      }, 1000 * 60);

      // if (cid) {
      //   fs.readFile('check.txt', 'utf8', async (err, data) => {
      //     if (err) return console.log(err);
      //     checkAccounts = data.split(',').filter(e => e)

      //     checking = true
      //     checkClient = clients[cid]
      //   })
      // }
      if (!cid) {
        waitForRestart = true
        tempC = Object.values(clients)

        const out = () => {
          Object.values(clients).forEach(c => {
            clearTimeout(c.playTimeout)
          })

          Object.values(webs).forEach(w => {
            w.emit('clean')
          })

          setTimeout(() => {
            console.log('clients', Object.values(clients).length)
            console.log('streams', Object.values(streams).length)

            if (Object.values(streams).length) {
              Object.values(streams).forEach(s => {
                s.emit('forceOut')
              })
              out()
            }
            else if (Object.values(clients).length) {
              Object.values(clients).forEach(c => {
                c.emit('restart')
              })
              out()
            }
            else {
              waitForRestart = false
            }
          }, 1000 * 15);
        }

        out()
      }
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
        checkClient.emit('restart')
      })
    })

    client.on('endCheck', () => {
      checking = false
      checkClient.emit('restart')
    })

    client.on('clearScreen', () => {
      imgs = {}
    })

    client.on('screenshot', id => {
      streams[id] && streams[id].emit('screenshot')
    })

    client.on('spotifyPause', () => {
      accounts = accounts.filter(a => a.split(':')[0] !== 'spotify')
    })
  })
});

app.listen(process.env.PORT || 3000);