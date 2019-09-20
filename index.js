const {
  getCheckAccounts,
  getAllAccounts,
  actions,
  handler
} = require('./mongo')
const app = require('http').createServer(handler)
const io = require('socket.io')(app, {
  pingTimeout: 1000 * 60
});
const fs = require('fs');
const mongoose = require('mongoose');

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://heroku_hh7w1mwf:i77e7hdna588rqokcp2m62hq0d@ds231377.mlab.com:31377/heroku_hh7w1mwf', (error) => {
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
let restartTime = 0

actions('gain', body => {
  const r = body.g
  if (!body.new) {
    plays = r.plays
    nexts = r.nexts
    time = r.time
  }
})

const getAccounts = async (restart = false) => {
  let Taccounts = await getAllAccounts()

  playerCount = Taccounts.reduce((arr, a) => {
    arr[a.split(':')[0]] = arr[a.split(':')[0]] ? arr[a.split(':')[0]] + 1 : 1
    return arr
  }, {})

  if (!restart) {
    Object.values(streams).forEach(s => Taccounts = Taccounts.filter(a => a !== s.account))
    Object.values(used).forEach(usedaccount => Taccounts = Taccounts.filter(a => a !== usedaccount))
  }

  accounts = [...Taccounts]
}

let gain = 0
let gain2 = 0
let gain3 = 0
let gain3temp = plays
let tempPlays = []
let tempCalc = plays
let serverPlays = {}

const calcRatio = {}
const resultRatio = {}

setInterval(async () => {
  gain = plays * 0.004 * 0.9 / ++time
  gain3 = (plays - gain3temp) * 0.004 * 0.9
  gain3temp = plays

  const testDouble = []
  Object.values(streams).forEach(s => {
    if (!s.connected) { delete streams[s.streamId] }
    else {
      testDouble[s.account] = testDouble[s.account] ? testDouble[s.account] + 1 : 1
    }
  })
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
  let Taccounts = accounts && [...accounts]

  Object.values(streams).forEach(s => Taccounts = Taccounts.filter(a => a !== s.account))
  Object.values(used).forEach(usedaccount => Taccounts = Taccounts.filter(a => a !== usedaccount))

  if (env.TYPE) {
    const typeAccounts = accounts.filter(m => m.split(':')[0] === env.TYPE)
    return typeAccounts[0]
  }

  const index = !env.TYPE ? rand(Taccounts.length) : 0
  const account = Taccounts[index]
  accounts = Taccounts.filter(a => a !== account)

  accounts = [...Taccounts]

  return account
}

const getNumbers = (id) => {
  const numbers = Object.values(streams).map(s => s.parentId).reduce((arr, s) => { arr[s] = arr[s] ? arr[s] + 1 : 1; return arr }, {})
  return id ? (numbers[id] || 0) : numbers
}

const maxs = () => {
  let pmax = {}
  Object.values(parents).forEach(p => pmax[p.uniqId] = p.max)
  return pmax
}

const playing = (id = false) => {
  let p = {}
  Object.values(streams).forEach(s => {
    if (s.infos && s.infos.countPlays && s.infos.countPlays >= 0) {
      p[s.parentId] = p[s.parentId] ? p[s.parentId] + 1 : 1
    }
  })
  return id ? p[id] : p
}

const getAllData = () => ({
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
  parents: getNumbers(),
  resultRatio,
  errs,
  parentsMax: maxs(),
})

// const runLoop = (c, { parentId, env, max }) => {
//   const RUN_WAIT_PAGE = Object.values(streams).filter(s => s.parentId === parentId && s.infos && s.infos.time && s.infos.other).length

//   if (/*!parents[parentId].wait && !RUN_WAIT_PAGE && */getNumbers(parentId) < max) {
//     const runnerAccount = env.CHECK ? checkAccounts.shift() : getAccount(env)
//     if (!runnerAccount) { return }

//     const streamId = rand(10000) + '-' + rand(10000) + '-' + rand(10000) + '-' + rand(10000)
//     c.emit('run', { runnerAccount, streamId })
//   }
// }


setInterval(() => {
  Object.values(webs).forEach(w => {
    w.emit('allData', getAllData())
    w.emit('playerInfos', Object.values(streams).map(s => s.infos))
  })
}, 1000);

setInterval(() => {
  Object.values(parents).forEach(p => {
    if (!calcRatio[p.uniqId]) { calcRatio[p.uniqId] = [] }

    calcRatio[p.uniqId].push(serverPlays[p.uniqId] || 0)
    serverPlays[p.uniqId] = 0

    if (calcRatio[p.uniqId].length > 6) { calcRatio[p.uniqId].shift() }

    const calc = calcRatio[p.uniqId].reduce((a, b) => a + b, 0) / playing(p.uniqId)
    resultRatio[p.uniqId] = Math.floor(calc * 10) / 10
  })
}, 1000 * 10);

io.on('connect', client => {
  client.on('outLog', e => {
    if (!errs[client.uniqId]) { errs[client.uniqId] = [] }

    if (!errs[client.uniqId][e]) { errs[client.uniqId][e] = 0 }
    else { errs[client.uniqId][e] = errs[client.uniqId][e] + 1 }
  })

  client.on('log', log => {
    console.log(log)
  })

  client.on('run', ({ parentId, env, max }) => {
    const RUN_WAIT_PAGE = Object.values(streams).filter(s => s.parentId === parentId && s.infos && s.infos.other).length

    if (resultRatio[parentId] >= 1 && !RUN_WAIT_PAGE && getNumbers(parentId) < max) {
      const runnerAccount = env.CHECK ? checkAccounts.shift() : getAccount(env)
      if (!runnerAccount) { return }

      const streamId = rand(10000) + '-' + rand(10000) + '-' + rand(10000) + '-' + rand(10000)

      client.emit('run', { runnerAccount, streamId })
    }
  })

  client.on('parent', async ({ parentId, connected, env, max }) => {
    if (env.CHECK) { checkAccounts = await getCheckAccounts() }

    if (!connected) {
      Object.values(streams).forEach(s => {
        if (s.parentId === parentId) { delete streams[s.id] }
      })
    }

    client.uniqId = parentId
    client.max = max
    client.env = env
    // client.inter = setInterval(() => {
    //   runLoop(client, { parentId, env, max })
    // }, 1000 * 60 + rand(1000 * 60));

    parents[parentId] = client
  })

  client.on('client', async ({ parentId, streamId, account }) => {
    client.uniqId = streamId
    client.parentId = parentId
    client.account = account
    client.infos = streams[streamId] ? streams[streamId].infos : {}

    streams[streamId] = client
  })

  client.on('used', ({ streamId, account }) => {
    used[streamId] = account
    setTimeout(() => { delete used[streamId] }, 1000 * 60 * 10);
  });

  client.on('retryOk', ({ streamId }) => {
    delete imgs[streamId]

    Object.values(webs).forEach(w => {
      w.emit('endStream', streamId)
    })

    client.emit('retryOk')
  })

  client.on('screen', data => {
    imgs[data.streamId] = data
    Object.values(webs).forEach(c => {
      c.emit('stream', data)
    })
  })

  client.on('plays', ({ streamId, parentId, next, currentAlbum, countPlays }) => {
    plays++
    if (next) { nexts++ }

    serverPlays[parentId] = serverPlays[parentId] ? serverPlays[parentId] + 1 : 1
    if (streams[streamId] && streams[streamId].infos) {
      streams[streamId].infos.countPlays = countPlays
    }

    actions('listen?' + currentAlbum)
    actions('gain?' + plays + '/' + nexts + '/' + time, body => {
      if (body.new) {
        plays = 0
        nexts = 0
        time = 0
      }
    })
  })

  client.on('playerInfos', datas => {
    if (streams[datas.streamId]) {
      streams[datas.streamId].infos = { ...datas }
    }
    else {
      streams[datas.streamId] = { uniqId: datas.streamId, parentId: datas.parentId, account: datas.account, infos: { ...datas } }
    }
  })

  client.on('disconnect', why => {

    if (streams[client.uniqId]) {
      delete streams[client.uniqId]
    }

    if (parents[client.uniqId]) {
      console.log(why)
      clearInterval(client.inter)
      delete parents[client.uniqId]
    }

    if (webs[client.id]) { delete webs[client.id] }

    client.removeAllListeners()
  })

  client.on('web', () => {
    webs[client.id] = client

    Object.values(imgs).forEach(d => {
      Object.values(webs).forEach(c => {
        c.emit('stream', d)
      })
    })

    client.on('screenshot', streamId => {
      const stream = streams[streamId]
      stream && stream.emit('screenshot')
    })

    client.on('streamOn', streamId => {
      try {
        streams[streamId].emit('streamOn')
      }
      catch (e) {
        delete imgs[streamId]
        client.emit('endStream', streamId)
      }
    })

    client.on('streamOff', streamId => {
      try {
        streams[streamId].emit('streamOff')
      }
      catch (e) {
        delete imgs[streamId]
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
      const stream = streams[streamId]
      stream && stream.emit('runScript', scriptText)
    })

    client.on('kill', async streamId => {
      const stream = streams[streamId]
      stream && stream.emit && stream.emit('forceOut', streamId)
    })

    client.on('killall', async parentId => {
      const parent = parents[parentId]
      parent && parent.emit('killall')
    })

    client.on('restart', async cid => {
      if (cid) {
        const p = parents[cid]
        if (p) {
          p.out = true
          p.emit('CdisconnectU')
        }
        Object.values(streams).filter(s => s.parentId === cid).forEach(s => !s.connected && delete streams[s.uniqId])
      }
      else {
        Object.values(parents).forEach(p => {
          p.out = true
          p.emit('Cdisconnect')
        })
      }

      await getAccounts(true)
    })
  })

  client.emit('activate', client.id)
});

app.listen(process.env.PORT || 3000);
