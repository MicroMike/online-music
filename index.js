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

let restart = false
let start = true
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
let webs = {}
let checkClient
let used = {}
let errs = []

actions('gain', body => {
  const r = body
  plays = r.plays
  nexts = r.nexts
  time = r.time
})

const getAccounts = async () => {
  let Taccounts = await getAllAccounts()
  Object.values(streams).forEach(s => Taccounts = Taccounts.filter(a => a !== s.account))
  Object.values(used).forEach(usedaccount => Taccounts = Taccounts.filter(a => a !== usedaccount))
  accounts = Taccounts
}

let gain = 0
let gain2 = 0
let tempPlays = plays
setInterval(async () => {
  gain = plays * 0.004 / ++time
  gain2 = (plays - tempPlays) * 0.004
  tempPlays = plays
  actions('gain?' + plays + '/' + nexts + '/' + time)
  await getAccounts()
}, 1000 * 60)

const rand = (max, min) => {
  return Math.floor(Math.random() * Math.floor(max) + (typeof min !== 'undefined' ? min : 0));
}

(async () => await getAccounts())()

const getAccount = async env => {
  let Taccounts = accounts
  Object.values(streams).forEach(s => Taccounts = Taccounts.filter(a => a !== s.account))
  Object.values(used).forEach(usedaccount => Taccounts = Taccounts.filter(a => a !== usedaccount))
  accounts = Taccounts

  if (env.RAND) {
    return Taccounts[rand(Taccounts.length)]
  }

  if (env.TYPE) {
    const typeAccounts = accounts.filter(m => m.split(':')[0] === env.TYPE)
    return typeAccounts[0]
  }

  return accounts[0]
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
  used: Object.values(used).length,
  webs: Object.values(webs).length,
  checkLeft: checkAccounts && checkAccounts.length,
  nopeStreams: Object.values(streams).filter(s => s.parentId < resetTime).length,
  restart: restart || start,
  plays: plays * 0.004 + '€ (' + plays + ' / ' + nexts + ') ' + String(nexts / plays * 100).split('.')[0] + '%',
  gain: gain + '€/min ' + String(gain * 60 * 24 * 30).split('.')[0] + '€/mois',
  gain2: gain2 + '€/min ' + String(gain2 * 60 * 24 * 30).split('.')[0] + '€/mois',
  clients: getNumbers(),
  errs: getErrs(),
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

  client.on('clearErrs', log => {
    errs = []
    Object.values(webs).forEach(w => {
      w.emit('allData', getAllData())
    })
  })

  client.on('plays', ({ next, currentAlbum }) => {
    if (next) { nexts++ }
    else {
      plays++
    }

    actions('listen?' + currentAlbum)
    actions('gain?' + plays + '/' + nexts + '/' + time)

    Object.values(webs).forEach(w => {
      w.emit('allData', getAllData())
    })
  })

  client.on('runner', async ({ clientId, time, account, id, env }) => {
    if (env.CHECK && env.FIRST) {
      checkAccounts = await getCheckAccounts()
    }

    const runnerAccount = env.CHECK ? checkAccounts && checkAccounts.shift() : account || await getAccount(env)

    if (!runnerAccount) {
      client.emit('forceOut')
      return
    }

    client.parentId = clientId
    client.time = time
    client.account = runnerAccount
    client.uniqId = id
    streams[id] = client

    // accounts = accounts.filter(a => a !== account)
    // displayLength('Add')

    Object.values(webs).forEach(w => {
      w.emit('allData', getAllData())
    })

    client.on('outLog', e => {
      const err = e.split(' ')[0]
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

      streams[datas.streamId].infos = datas

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

    !account && client.emit('streams', runnerAccount)
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

    client.on('restart', async cid => {
      if (cid) {
        Object.values(streams).forEach(s => s.parentId === cid ? s.emit('forceOut') : false)
      }
      if (!cid) {
        restart = true
        checking = false
        waitForRestart = true
        resetTime = Date.now()

        setTimeout(async () => {
          restart = false
          await getAccounts()
        }, 1000 * 60);

        tempC = Object.values(clients)

        const out = () => {
          Object.values(clients).forEach(c => {
            clearTimeout(c.playTimeout)
          })

          Object.values(webs).forEach(w => {
            w.emit('clean')
          })

          setTimeout(() => {
            // console.log('clients', Object.values(clients).length)
            console.log('streams', Object.values(streams).length)

            if (Object.values(streams).length) {
              Object.values(streams).forEach(s => {
                s.emit('forceOut')
              })
              out()
            }
            // else if (Object.values(clients).length) {
            //   Object.values(clients).forEach(c => {
            //     c.emit('restart')
            //   })
            //   out()
            // }
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