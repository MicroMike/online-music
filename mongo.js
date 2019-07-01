const mongoose = require('mongoose');
const fs = require('fs');

const SAccount = new mongoose.Schema({
  account: String,
  pending: Boolean,
  check: Boolean,
  pause: Boolean,
  del: Boolean,
});
const MAccount = mongoose.model('Account', SAccount, 'accounts');

const SGain = new mongoose.Schema({
  plays: Number,
  nexts: Number,
  time: Number,
  month: Number,
});
const MGain = mongoose.model('Gain', SGain, 'gain');

const SSong = new mongoose.Schema({
  song: String,
  plays: Number,
});
const MSong = mongoose.model('Song', SSong, 'songs');

const getCheckAccounts = async (callback) => {
  return new Promise(res => {
    MAccount.find({ check: true }, function (err, Ra) {
      if (err) return console.error(err);
      const Taccounts = Ra.map(a => a.account)
      callback ? callback(Taccounts) : res(Taccounts)
    })
  })
}

module.exports = {
  getAllAccounts: async (type) => {
    return new Promise(res => {

      const findParams = { check: false, del: false, pause: { $ne: true } }
      if (type) { findParams.account = { "$regex": `^${type}` } }

      MAccount.find(findParams, function (err, Ra) {
        if (err) return console.error(err);
        const Taccounts = Ra.map(a => a.account)
        res(Taccounts)
      })
    })
  },
  reset: async () => {
    return new Promise(res => {
      MAccount.find({}, function (err, Ra) {
        if (err) return console.error(err);
        const Taccounts = Ra.map(a => {
          a.check = false
          a.del = false
          a.save()
          return a.account
        })
        res(Taccounts)
      })
    })
  },
  getCheckAccounts,
  actions: (req, callback) => {
    const action = req.split('?')[0]
    const params = req.split('?')[1]

    switch (action) {
      case 'reset':
        getAccounts(a => callback && callback(a), true)
        break

      case 'listen':
        params && MSong.findOne({ song: params }, (err, Ra) => {
          if (!Ra) {
            const r = new MSong({ song: params, plays: 1 })
            r.save((err, g) => callback && callback(g))
          }
          else {
            Ra.plays = Ra.plays + 1
            Ra.save((err, a) => callback && callback(a))
          }
        })
        break

      case 'gain':
        const date = new Date()
        const month = date.getMonth() + 1

        if (params) {
          const p = params.split('/')

          p[0] && p[1] && MGain.findOne({ month }, (err, Rg) => {
            if (err) return console.error(err);

            if (!Rg) {
              const r = new MGain({ plays: 0, nexts: 0, time: 0 })
              r.save((err, g) => callback && callback(g))
            }
            else {
              Rg.plays = Number(p[0])
              Rg.nexts = Number(p[1])
              Rg.time = Number(p[2])
              Rg.save((err, g) => callback && callback(g))
            }
          })
        }
        else {
          MGain.findOne({ month }, function (err, Rg) {
            if (err) return console.error(err);

            if (!Rg) {
              const r = new MGain({ plays: 0, nexts: 0, time: 0 })
              r.save((err, g) => callback && callback(g))
            }
            else {
              callback && callback(Rg)
            }
          })
        }
        break

      case 'spotifyPause': {
        MAccount.find({ "account": { "$regex": "^spotify", "$options": "i" } }, (err, Ra) => {
          Ra.forEach(r => {
            r.pause = true
            r.save()
          })
        })
      }

      default:
        break
    }
  },
  handler: (req, res) => {
    const url = req.url.split('?')[0]
    const params = req.url.split('?')[1]

    if (url !== '/') {
      res.setHeader('Content-Type', 'application/json');
    }

    switch (url) {
      case '/addAccount': {
        const p = params && params.split('/')
        let accounts = {}
        p && p.forEach(a => {
          a && MAccount.findOne({ account: a }, (err, Ra) => {
            if (Ra) {
              accounts[a] = false
            }
            else {
              accounts[a] = true
              const r = new MAccount({ account: a, check: false, del: false });
              r.save((err, a) => { console.log(a) })
            }
          })
        })
        res.end(JSON.stringify({ accounts: accounts }));
        break
      }

      case '/checkAccounts':
        getCheckAccounts(a => res.end(JSON.stringify(a)))
        break

      // case '/copy':
      //   copy.map(a => {
      //     const r = new MAccount(a);
      //     r.save()
      //   })
      //   res.end(JSON.stringify({ copy }))
      //   break

      case '/error': {
        const p = params && params.split('/')
        p[0] && p[1] && MAccount.findOne({ account: p[1] }, (err, Ra) => {
          if (err) return console.error(err);
          Ra[p[0]] = true
          Ra.save((err, a) => { res.end(JSON.stringify(a)) })
        })
        res.end(JSON.stringify({ index: true }));
        break
      }

      case '/checkOk':
        params && MAccount.findOne({ account: params }, (err, Ra) => {
          Ra.check = false
          Ra.save((err, a) => { res.end(JSON.stringify(a)) })
        })
        break

      default:
        fs.readFile(__dirname + '/index.html',
          function (err, data) {
            if (err) {
              res.writeHead(500);
              return res.end('Error loading index.html');
            }

            res.writeHead(200);
            res.end(data);
          });
        break
    }
  }
}
