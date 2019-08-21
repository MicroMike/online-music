const {
  getCheckAccounts,
  getAllAccounts,
  actions,
  handler
} = require('./mongo')
const app = require('http').createServer(handler)
const io = require('socket.io')(app);
const fs = require('fs');
const mongoose = require('mongoose');

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, (error) => {
  if (error) {
    console.error('Please make sure Mongodb is installed and running!'); // eslint-disable-line no-console
    throw error;
  }
});

setTimeout(() => {
  start = false
}, 1000 * 60);

let waitForRestart

let accounts
let checkAccounts = null
let plays = 0
let nexts = 0
let time = 0
let resetTime = 0

let imgs = {}
let clients = {}
let streams = {}
let locks = {}
let webs = {}
let checkClient
let used = {}
let errs = []
let playerCount

actions('gain', body => {
  const r = body.g
  if (!body.new) {
    plays = r.plays
    nexts = r.nexts
    time = r.time
  }
})

const getAccounts = async () => {
  let Taccounts = await getAllAccounts()
  playerCount = Taccounts.reduce((arr, a) => {
    arr[a.split(':')[0]] = arr[a.split(':')[0]] ? arr[a.split(':')[0]] + 1 : 1
    return arr
  }, {})
  Object.values(streams).forEach(s => Taccounts = Taccounts.filter(a => a !== s.account))
  Object.values(used).forEach(usedaccount => Taccounts = Taccounts.filter(a => a !== usedaccount))
  accounts = Taccounts
}

let gain = 0
let gain2 = 0
let tempPlays = []
let tempCalc = plays

setInterval(async () => {
  gain = plays * 0.004 * 0.9 / ++time
  await getAccounts()
}, 1000 * 60)

setInterval(async () => {
  const calcul = plays - tempCalc
  tempCalc = plays
  const minutes = 2

  if (tempPlays.length === 6 * minutes) {
    tempPlays.shift()
  }
  tempPlays.push(calcul)

  gain2 = tempPlays.reduce((a, b) => a + b, 0) * 0.004 * 0.9 / minutes
}, 1000 * 10)

const rand = (max, min) => {
  return Math.floor(Math.random() * Math.floor(max) + (typeof min !== 'undefined' ? min : 0));
}

(async () => await getAccounts())()

let aCount = 0
const getAccount = async env => {
  return new Promise(r => {
    setTimeout(() => {
      let Taccounts = accounts
      Object.values(streams).forEach(s => Taccounts = Taccounts.filter(a => a !== s.account))
      Object.values(used).forEach(usedaccount => Taccounts = Taccounts.filter(a => a !== usedaccount))

      if (env.TYPE) {
        const typeAccounts = accounts.filter(m => m.split(':')[0] === env.TYPE)
        return typeAccounts[0]
      }

      const index = env.RAND ? rand(Taccounts.length) : 0
      const account = Taccounts[index]
      accounts = Taccounts.filter(a => a !== account)

      aCount--
      r(account)
    }, 1000 * (++aCount));
  })
}

let displayLength = (log) => {
  const values = Object.values(streams)
  console.log(log, values.length)
}

const getNumbers = () => {
  const numbers = Object.values(streams).map(s => s.parentId).reduce((arr, s) => { arr[s] = arr[s] ? arr[s] + 1 : 1; return arr }, {})
  return numbers
}

const getErrs = () => {
  const numbers = errs.reduce((arr, s) => { arr[s] = arr[s] ? arr[s] + 1 : 1; return arr }, {})
  return numbers
}

const getAllData = () => ({
  // clients: {
  //   ...Object.values(clients).map(c => Object.values(streams).filter(s => s.parentId === c.uniqId)),
  // },
  accounts: accounts && accounts.length,
  streams: Object.values(streams).length,
  playing: Object.values(streams).filter(s => s.infos).length,
  used: Object.values(used).length,
  webs: Object.values(webs).length,
  checkLeft: checkAccounts && checkAccounts.length,
  nopeStreams: Object.values(streams).filter(s => s.parentId < resetTime).length,
  ...playerCount,
  plays: plays * 0.004 + '€ (' + plays + ' / ' + nexts + ') ' + String(nexts / plays * 100).split('.')[0] + '%',
  gain: gain + '€/min ' + String(gain * 60 * 24).split('.')[0] + '€/jour ' + String(gain * 60 * 24 * 30).split('.')[0] + '€/mois',
  gain2: gain2 + '€/min ' + String(gain2 * 60 * 24).split('.')[0] + '€/jour ' + String(gain2 * 60 * 24 * 30).split('.')[0] + '€/mois',
  clients: getNumbers(),
  errs: getErrs(),
})

io.on('connection', client => {
  client.emit('activate', client.id)

  client.on('lockScreen', data => {
    client.uniqId = data.streamId
    locks[data.streamId] = client
    Object.values(webs).forEach(c => {
      c.emit('stream', data)
    })
  })

  client.on('log', log => {
    console.log(log)
  })

  client.on('clearErrs', log => {
    errs = []
    Object.values(webs).forEach(w => {
      w.emit('allData', getAllData())
    })
  })

  client.on('plays', ({ next, currentAlbum }) => {
    plays++
    if (next) { nexts++ }

    client.countPlays = client.countPlays + 1

    actions('listen?' + currentAlbum)
    actions('gain?' + plays + '/' + nexts + '/' + time, body => {
      if (body.new) {
        plays = 0
        nexts = 0
        time = 0
      }
    })

    Object.values(webs).forEach(w => {
      w.emit('allData', getAllData())
    })
  })

  client.on('runner', async ({ clientId, time, account, id, env }) => {
    !env.CHECK && resetTime && time < resetTime && client.emit('forceOut')

    if (env.CHECK && env.FIRST) {
      checkAccounts = await getCheckAccounts()
    }

    const runnerAccount = account || (env.CHECK ? checkAccounts && checkAccounts.shift() : await getAccount(env))

    if (!runnerAccount) {
      client.emit('forceOut')
      return
    }

    client.parentId = clientId
    client.time = time
    client.account = runnerAccount
    client.uniqId = id
    client.countPlays = 0
    streams[id] = client

    // accounts = accounts.filter(a => a !== account)
    // displayLength('Add')

    Object.values(webs).forEach(w => {
      w.emit('allData', getAllData())
    })

    client.on('outLog', e => {
      const err = client.parentId + ' ' + e
      errs.push(err)
    })

    // client.on('out', cid => {
    //   const playerLength = Object.values(streams).filter(s => s.parentId === cid).length
    //   const ok = !clients[cid] || playerLength >= clients[cid].max
    //   console.log('out: ' + playerLength + ' ' + ok)
    //   client.emit('outOk', ok)
    // })

    client.on('playerInfos', datas => {
      resetTime && client.time < resetTime && client.emit('forceOut')

      if (streams[datas.streamId]) {
        streams[datas.streamId].infos = {
          ...datas,
          countPlays: client.countPlays
        }
      }

      Object.values(webs).forEach(w => {
        // Object.values(streams).filter(s => !clients[s.parentId]).map(s => w.emit('playerInfos', { account: s.account, id: s.uniqId, nope: true }))
        w.emit('playerInfos', Object.values(streams).map(s => s.infos))
      })
    })

    client.on('screen', data => {
      imgs[runnerAccount] = data
      Object.values(webs).forEach(c => {
        c.emit('stream', data)
      })
    })

    client.on('stream', data => {
      data.log = imgs[runnerAccount] && imgs[runnerAccount].log
      Object.values(webs).forEach(w => {
        w.emit('stream', data)
      })
    })

    client.on('retryOk', () => {
      delete imgs[runnerAccount]
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

    if (account) { client.emit('resume') }
    else { client.emit('streams', runnerAccount) }
  })

  client.on('disconnect', () => {
    // getAccounts()
    delete webs[client.id]
    delete clients[client.uniqId]
    delete streams[client.uniqId]
    delete locks[client.uniqId]
    // delete imgs[client.uniqId]

    client.removeAllListeners()

    Object.values(webs).forEach(w => {
      w.emit('allData', getAllData())
      w.emit('playerInfos', Object.values(streams).map(s => s.infos))
    })
  })

  client.on('Cdisconnect', () => {
    if (clients[client.uniqId]) { }
    else if (streams[client.uniqId]) {
    }

    if (client.account && accounts.indexOf(client.account) < 0) {
      accounts.push(client.account)
    }

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
      locks[id] && locks[id].emit('runScript', scriptText)
    })

    client.on('runCode', ({ id, scriptText }) => {
      streams[id] && streams[id].emit('runCode', scriptText)
      locks[id] && locks[id].emit('runCode', scriptText)
    })

    client.on('restart', async cid => {
      if (cid) {
        Object.values(streams).forEach(s => {
          if (s.connected) {
            s.parentId === cid ? s.emit('forceOut') : false
          }
          else {
            delete streams[s.uniqId]
          }
        })
      }
      if (!cid) {
        resetTime = Date.now()
        imgs = {}
        errs = []
      }
    })

    client.on('streamOn', clientId => {
      try {
        streams[clientId].emit('streamOn')
      }
      catch (e) {
        if (streams[clientId]) {
          delete imgs[streams[clientId].account]
        }
        client.emit('endStream', clientId)
      }
    })

    client.on('streamOff', clientId => {
      try {
        streams[clientId].emit('streamOff')
      }
      catch (e) {
        if (streams[clientId]) {
          delete imgs[streams[clientId].account]
        }
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

    client.on('updateAccounts', async () => {
      await getAccounts()
    })

    client.on('screenshot', id => {
      streams[id] && streams[id].emit('screenshot')
    })

    client.on('spotifyPause', () => {
      accounts = accounts.filter(a => a.split(':')[0] !== 'spotify')
    })
  })
});

// io.on('connection', client => {
//   client.emit('activate', client.id)
// })

app.listen(process.env.PORT || 3000);