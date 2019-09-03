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

let imgs = {}
let clients = {}
let streams = {}
let parents = {}
let locks = {}
let webs = {}
let checkClient
let used = {}
let errs = []
let playerCount
let firstCheck

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
let gain3 = 0
let gain3temp = plays
let tempPlays = []
let tempCalc = plays

setInterval(async () => {
  gain = plays * 0.004 * 0.9 / ++time
  gain3 = (plays - gain3temp) * 0.004 * 0.9
  gain3temp = plays
  await getAccounts()
}, 1000 * 60)

const timer = 5
setInterval(async () => {
  const calcul = plays - tempCalc
  tempCalc = plays
  const minutes = 2

  if (tempPlays.length === 60 / timer * minutes) {
    tempPlays.shift()
  }
  tempPlays.push(calcul)

  gain2 = tempPlays.reduce((a, b) => a + b, 0) * 0.004 * 0.9 / minutes
}, 1000 * timer)

const rand = (max, min) => {
  return Math.floor(Math.random() * Math.floor(max) + (typeof min !== 'undefined' ? min : 0));
}

(async () => await getAccounts())()

const getAccount = env => {
  let Taccounts = accounts
  Object.values(streams).forEach(s => Taccounts = Taccounts.filter(a => a !== s.account))
  Object.values(used).forEach(usedaccount => Taccounts = Taccounts.filter(a => a !== usedaccount))

  if (env.TYPE) {
    const typeAccounts = accounts.filter(m => m.split(':')[0] === env.TYPE)
    return typeAccounts[0]
  }

  const index = !env.TYPE ? rand(Taccounts.length) : 0
  const account = Taccounts[index]
  accounts = Taccounts.filter(a => a !== account)

  return account
}

const getNumbers = () => {
  const numbers = Object.values(streams).map(s => s.parentId).reduce((arr, s) => { arr[s] = arr[s] ? arr[s] + 1 : 1; return arr }, {})
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
  ...playerCount,
  plays: plays * 0.004 * 0.9 + '€ (' + plays + ' / ' + nexts + ') ' + String(nexts / plays * 100).split('.')[0] + '%',
  gain: gain + '€/min ' + String(gain * 60 * 24).split('.')[0] + '€/jour ' + String(gain * 60 * 24 * 30).split('.')[0] + '€/mois',
  gain2: gain2 + '€/min ' + String(gain2 * 60 * 24).split('.')[0] + '€/jour ' + String(gain2 * 60 * 24 * 30).split('.')[0] + '€/mois',
  gain3: gain3 + '€/min ' + String(gain3 * 60 * 24).split('.')[0] + '€/jour ' + String(gain3 * 60 * 24 * 30).split('.')[0] + '€/mois',
  clients: getNumbers(),
  errs,
})

const Ddisconnect = (c) => {
  if (c.uniqId) {
    c.out = true
    clearInterval(c.loopInter)
    c.emit('Cdisconnect')

    console.log('Ddisconnect')
    delete parents[c.uniqId]
    errs[c.uniqId] = []

    Object.values(streams).forEach(s => {
      if (s.parentId === c.uniqId) { delete streams[s.id] }
    })
  }
  else {
    delete webs[c.id]
  }

  c.removeAllListeners()

  Object.values(webs).forEach(w => {
    w.emit('allData', getAllData())
    w.emit('playerInfos', Object.values(streams).map(s => s.infos))
  })
}

io.on('connection', client => {
  client.emit('activate', client.id)

  client.on('Ddisconnect', () => {
    client.out = true
    Ddisconnect(client)
  })

  client.on('outLog', e => {
    if (!errs[client.uniqId]) { errs[client.uniqId] = [] }

    if (!errs[client.uniqId][e]) { errs[client.uniqId][e] = 0 }
    else { errs[client.uniqId][e] = errs[client.uniqId][e] + 1 }
  })

  client.on('log', log => {
    console.log(log)
  })

  client.on('streamInfos', s => {
    Object.assign(streams, s)

    Object.values(webs).forEach(w => {
      w.emit('playerInfos', Object.values(streams).map(s => s.infos))
    })
  })

  client.on('parent', async ({ parentId, connected, s, env }) => {
    if (env.CHECK) { checkAccounts = await getCheckAccounts() }
    if (connected) { Object.assign(streams, s) }

    client.uniqId = parentId
    parents[parentId] = client

    client.loopInter = setInterval(() => {
      if (client.out) { return }

      client.emit('streamInfos')

      const RUN_WAIT_PAGE = Object.values(streams).filter(s => s.parentId === parentId && s.infos && s.infos.time && String(s.infos.time).match(/RUN|WAIT_PAGE/)).length
      // const CONNECT = Object.values(streams).filter(s => s.parentId === id && s.infos && s.infos.time && String(s.infos.time).match(/CONNECT/)).length

      if (!RUN_WAIT_PAGE) { client.emit('run') }
    }, 1000 * 10)
  })

  client.on('getAccount', async ({ streamId, parentId, env }) => {
    const runnerAccount = env.CHECK ? checkAccounts.shift() : getAccount(env)

    if (!runnerAccount) {
      client.emit('account', { fail: true })
      return
    }

    streams[streamId] = { account: runnerAccount, id: streamId, parentId }

    Object.values(webs).forEach(w => {
      w.emit('allData', getAllData())
    })

    client.emit('account', { runnerAccount, streamId })
  })

  client.on('used', account => {
    used[account] = account
    setTimeout(() => { delete used[account] }, 1000 * 60 * 10);
  });

  client.on('retryOk', ({ account, streamId }) => {
    delete imgs[account]

    Object.values(webs).forEach(w => {
      w.emit('endStream', streamId)
    })

    client.emit('retryOk', streamId)
  })

  client.on('screen', data => {
    imgs[data.account] = data
    Object.values(webs).forEach(c => {
      c.emit('stream', data)
    })
  })

  client.on('plays', ({ streamId, next, currentAlbum, matchTime }) => {
    plays++
    if (next) { nexts++ }

    if (streams[streamId]) {
      streams[streamId].countPlays = streams[streamId].countPlays ? streams[streamId].countPlays + 1 : 0
    }

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

  client.on('playerInfos', datas => {
    const stream = streams[datas.streamId]

    if (stream) {
      streams[datas.streamId].infos = {
        ...datas,
        countPlays: stream.countPlays
      }
    }

    Object.values(webs).forEach(w => {
      // Object.values(streams).filter(s => !clients[s.parentId]).map(s => w.emit('playerInfos', { account: s.account, id: s.uniqId, nope: true }))
      w.emit('playerInfos', Object.values(streams).map(s => s.infos))
    })
  })

  client.on('Cdisconnect', streamId => {
    const stream = streams[streamId]

    if (stream && stream.account && accounts.indexOf(stream.account) < 0) {
      accounts.push(stream.account)
    }

    delete streams[streamId]

    Object.values(webs).forEach(w => {
      w.emit('allData', getAllData())
      w.emit('playerInfos', Object.values(streams).map(s => s.infos))
    })
  })

  client.on('web', () => {
    webs[client.id] = client

    Object.values(imgs).forEach(d => {
      Object.values(webs).forEach(c => {
        c.emit('stream', d)
      })
    })

    client.on('screenshot', streamId => {
      const parentId = streams[streamId].parentId
      const parent = parents[parentId]

      parent && parent.emit('screenshot', streamId)
    })

    client.on('streamOn', streamId => {
      try {
        const parentId = streams[streamId].parentId
        const parent = parents[parentId]

        parent && parent.emit('streamOn', streamId)
      }
      catch (e) {
        const img = Object.values(imgs).find(i => i.streamId === streamId)
        if (img) { delete imgs[img.account] }
        client.emit('endStream', streamId)
      }
    })

    client.on('streamOff', streamId => {
      try {
        const parentId = streams[streamId].parentId
        const parent = parents[parentId]

        parent && parent.emit('streamOff', streamId)
      }
      catch (e) {
        const img = Object.values(imgs).find(i => i.streamId === streamId)
        if (img) { delete imgs[img.account] }
        client.emit('endStream', streamId)
      }
    })

    client.on('getAllData', () => {
      client.emit('allData', getAllData())
    })

    client.on('clearScreen', () => {
      imgs = {}
    })

    client.on('clearErrs', () => {
      errs = []
    })

    client.on('updateAccounts', async () => {
      await getAccounts()
    })

    client.on('runScript', ({ streamId, scriptText }) => {
      const parentId = streams[streamId].parentId
      const parent = parents[parentId]

      parent && parent.emit('runScript', { id: streamId, scriptText })
    })

    client.on('kill', async streamId => {
      const parentId = streams[streamId].parentId
      const parent = parents[parentId]

      parent && parent.emit('forceOut', streamId)
    })

    client.on('restart', async cid => {
      if (cid) {
        const p = parents[cid]
        if (p) {
          Ddisconnect(p)
        }

      }
      else {
        Object.values(parents).forEach(p => {
          Ddisconnect(p)
        })
      }

      await getAccounts()
    })
  })
});

app.listen(process.env.PORT || 3000);
