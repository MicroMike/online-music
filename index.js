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

const albums = {
  napster: [
    'https://app.napster.com/artist/honey/album/just-another-emotion',
    'https://app.napster.com/artist/yokem/album/boombeats',
    'https://app.napster.com/artist/mahone/album/stone-distraction',
    'https://app.napster.com/artist/hazel/album/electric-nature',
    'https://app.napster.com/artist/dj-reid/album/satisfaction-spell',
    'https://app.napster.com/artist/xondes/album/the-last-heat',
    'https://app.napster.com/artist/dj-otl/album/about-other-people',
    'https://app.napster.com/artist/dhn/album/blue-gun',
    // 'https://app.napster.com/artist/hanke/album/new-york-story',
    // 'https://app.napster.com/artist/hanke/album/100-revenge',
    // 'https://app.napster.com/artist/lapilluledors/album/red-beast',
  ],
  amazon: [
    'https://music.amazon.fr/albums/B07G9RM2MG',
    'https://music.amazon.fr/albums/B07CZDXC9B',
    'https://music.amazon.fr/albums/B07D3NQ235',
    'https://music.amazon.fr/albums/B07G5PPYSY',
    'https://music.amazon.fr/albums/B07D3PGSR4',
    'https://music.amazon.fr/albums/B07MTV7JYS',
    'https://music.amazon.fr/albums/B07PGN58LX',
    'https://music.amazon.fr/albums/B07QCBN3Z4',
    'https://music.amazon.fr/albums/B07RGRZL9F',
    'https://music.amazon.fr/albums/B07RNYTBXG',
  ],
  tidal: [
    'https://listen.tidal.com/album/93312939',
    'https://listen.tidal.com/album/93087422',
    'https://listen.tidal.com/album/88716570',
    'https://listen.tidal.com/album/101927847',
    'https://listen.tidal.com/album/102564740',
    'https://listen.tidal.com/album/102503463',
    'https://listen.tidal.com/album/105237098',
    'https://listen.tidal.com/album/108790098',
    'https://listen.tidal.com/album/108980716',
  ],
  spotify: [
    'https://open.spotify.com/album/3FJdPTLyJVPYMqQQUyb6lr',
    'https://open.spotify.com/album/5509gS9cZUrbTFege0fpTk',
    'https://open.spotify.com/album/2jmPHLM2be2g19841vHjWE',
    'https://open.spotify.com/album/5CPIRky6BGgl3CCdzMYAXZ',
    'https://open.spotify.com/album/0Tt1ldQ8b4zn5LRcM706ll',
    'https://open.spotify.com/album/2kFEMTIWWw0jXD57Ewr7go',
    'https://open.spotify.com/album/4BR7o0DwEPj1wF1nfcypiY',
    'https://open.spotify.com/album/6045wkKBhEx1DBoqn3aXSe',
    'https://open.spotify.com/album/7Jh67aHTA9ly7R1OTbzqGF',
  ]
}

let accounts
let busy = {}
let checkAccounts
let file = process.env.FILE || 'napsterAccount.txt'
let restart = false
let checking = false
let plays = 0
let nexts = 0

let imgs = {}
let clients = {}
let streams = {}
let webs = {}
let checkClient
let used = {}

const rand = (max, min) => {
  return Math.floor(Math.random() * Math.floor(max) + (typeof min !== 'undefined' ? min : 0));
}

const getCheckAccounts = () => {
  fs.readFile('check.txt', 'utf8', async (err, data) => {
    if (err) return console.log(err);
    checkAccounts = data.split(',').filter(e => e)
  })
}

getCheckAccounts()

const getAccounts = () => {
  fs.readFile(file, 'utf8', async (err, data) => {
    if (err) return console.log(err);

    fs.readFile('napsterAccountDel.txt', 'utf8', async (err2, dataDel) => {
      if (err2) return console.log(err2);

      let Taccounts = data.split(',')

      dataDel = dataDel.split(',').filter(e => e)
      Taccounts = Taccounts.filter(e => dataDel.indexOf(e) < 0)

      Object.values(streams).forEach(s => Taccounts = Taccounts.filter(a => a !== s.account))
      Object.values(used).forEach(usedaccount => Taccounts = Taccounts.filter(a => a !== usedaccount))
      checkAccounts.forEach(CA => Taccounts = Taccounts.filter(a => a !== CA))

      accounts = Taccounts
    })
  });
}

getAccounts()

const getAccount = env => {
  if (env.RAND) {
    for (let i = 0; i < accounts.length; i++) {
      accounts.sort(() => { return rand(2) })
    }
  }

  if (env.TYPE) {
    accounts = accounts.filter(m => m.split(':')[0] === env.TYPE)
  }

  const account = accounts.length && !busy[account] ? accounts.shift() : false

  busy[account] = true
  setTimeout(() => {
    delete busy[account]
  }, 1000 * 60);

  return account
}

let tempPlays = 0
let gain = 0
setInterval(() => {
  gain = (plays - tempPlays) * 0.004
  tempPlays = plays
}, 1000 * 60)

let displayLength = (log) => {
  const values = Object.values(streams)
  console.log(log, values.length)
}

const getAllData = () => ({
  // clients: {
  //   ...Object.values(clients).map(c => Object.values(streams).filter(s => s.parentId === c.uniqId)),
  // },
  accounts: accounts.length,
  streams: Object.values(streams).length,
  used: Object.values(used).length,
  webs: Object.values(webs).length,
  nopeStreams: Object.values(streams).filter(s => Object.values(clients).find(c => c.uniqId === s.parentId) === undefined).length,
  nopeClients: Object.values(clients).filter(c => Object.values(streams).find(s => s.parentId === c.uniqId) === undefined).length,
  restart,
  plays: plays * 0.004 + '€ (' + plays + ' / ' + nexts + ') ' + String(nexts / plays * 100).split('.')[0] + '%',
  gain: gain + '€/min ' + String(gain * 60 * 24 * 30).split('.')[0] + '€/mois',
  clients: {
    ...Object.values(clients).map(c => ({
      id: c.uniqId,
      L: Object.values(streams).filter(s => s.parentId === c.uniqId).length,
    }))
  }
})

io.on('connection', client => {

  client.emit('activate', client.id)

  client.on('log', log => {
    console.log(log)
  })

  client.on('plays', next => {
    if (next) { nexts++ }
    else { plays++ }

    Object.values(webs).forEach(w => {
      w.emit('allData', getAllData())
    })
  })

  client.on('runner', ({ clientId, account, id, player }) => {
    client.parentId = clientId
    client.account = account
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

    client.on('tidalOk', account => {
      checkAccounts = checkAccounts.filter(a => a !== account)
    })

    client.on('playerInfos', datas => {
      Object.values(webs).forEach(w => {
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
        displayLength(errorMsg + ' ' + account)
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

    client.emit('albums', albums[player])
  })

  client.on('ok', ({ accountsValid, del, max, env, first, id, check }) => {
    client.playTimeout
    client.max = max
    client.uniqId = id
    clients[id] = client

    Object.values(webs).forEach(w => {
      w.emit('allData', getAllData())
    })

    if (check) { checkClient = client }

    console.log('Connected', accountsValid ? accountsValid.length : 0)

    client.on('play', () => {
      // clearTimeout(client.playTimeout)

      client.playTimeout = setTimeout(() => {
        client.emit('goPlay')
      }, 1000 * 60);

      if (restart && !first) { return }
      const playerLength = Object.values(streams).filter(s => s.parentId === client.uniqId).length

      if (playerLength < max) {
        if (checkClient && checkClient.uniqId === client.uniqId) {
          const checkAccount = checkAccounts.length > 0 && checkAccounts.shift()

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
      }
      else if (!rand(5)) {
        Object.values(streams).filter(s => s.parentId === client.uniqId)[0].emit('out')
      }

      getAccounts()
    })

    client.on('retrieve', playerLength => {
      console.log('retreive', playerLength)
    })

    setTimeout(() => {
      client.emit('goPlay')
    }, 1000 * 30 + rand(1000 * 90));
  })

  client.on('disconnect', () => {
    Object.values(webs).forEach(w => {
      w.emit('allData', getAllData())
    })

    getAccounts()

    delete webs[client.id]
    delete clients[client.uniqId]
    delete streams[client.uniqId]
    // delete imgs[client.uniqId]

    setTimeout(() => {
      restart = false
    }, 1000 * 10);

    client.removeAllListeners()
  })

  client.on('Cdisconnect', code => {
    if (clients[client.uniqId]) {
      console.log('Disconnect Client ' + client.uniqId)
    }
    else if (streams[client.uniqId]) {
      Object.values(webs).forEach(w => {
        w.emit('playerInfos', { id: client.uniqId })
      })
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

    client.on('restart', cid => {

      restart = true
      checking = false

      if (cid) {
        fs.readFile('check.txt', 'utf8', async (err, data) => {
          if (err) return console.log(err);
          checkAccounts = data.split(',').filter(e => e)

          checking = true
          checkClient = clients[cid]
        })
      }
      else {
        Object.values(clients).forEach(c => {
          clearTimeout(c.playTimeout)
          c.emit('restart')
        })

        Object.values(webs).forEach(w => {
          w.emit('clean')
        })
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

    client.on('spotifyPause', () => {
      accounts = accounts.filter(a => a.split(':')[0] !== 'spotify')
    })
  })
});

app.listen(process.env.PORT || 3000);