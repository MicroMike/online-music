const mongoose = require('mongoose');

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
});
const MGain = mongoose.model('Gain', SGain, 'gain');

const SSong = new mongoose.Schema({
  song: String,
  plays: Number,
});
const MSong = mongoose.model('Song', SSong, 'songs');

module.exports = {
  getAccounts: async () => {
    return new Promise(res => {
      MAccount.find(reset ? {} : { check: false, del: false, pause: { $ne: true } }, function (err, Ra) {
        if (err) return console.error(err);
        const Taccounts = Ra.map(a => {
          if (reset) {
            a.check = false
            a.del = false
            a.save()
          }
          return a.account
        })

        Object.values(streams).forEach(s => Taccounts = Taccounts.filter(a => a !== s.account))
        Object.values(used).forEach(usedaccount => Taccounts = Taccounts.filter(a => a !== usedaccount))

        accounts = Taccounts
        res(accounts)
      })
    })
  },
  getCheckAccounts: async () => {
    return new Promise(res => {
      MAccount.find({ check: true }, function (err, Ra) {
        if (err) return console.error(err);
        const Taccounts = Ra.map(a => a.account)
        res(Taccounts)
      })
    })
  },
  actions: (req, callback) => {
    const action = req.url.split('?')[0]
    const params = req.url.split('?')[1]

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
        if (params) {
          const p = params.split('/')
          p[0] && p[1] && MGain.findOne((err, Rg) => {
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
          MGain.findOne(function (err, Rg) {
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
    res.setHeader('Content-Type', 'application/json');
    res.writeHead(200);

    const url = req.url.split('?')[0]
    const params = req.url.split('?')[1]

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

      case '/copy':
        copy.map(a => {
          const r = new MAccount(a);
          r.save()
        })
        break

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

const copy = [
  {
    "_id": {
      "$oid": "5cf63d9de155800017d5a6f0"
    },
    "account": "napster:selis@fastair.info:20192019",
    "__v": 0,
    "check": false,
    "del": false
  },
  {
    "_id": {
      "$oid": "5cf63d9de155800017d5a6f2"
    },
    "account": "napster:nacelodim@skymailgroup.com:20192019",
    "__v": 0,
    "check": false,
    "del": false
  },
  {
    "_id": {
      "$oid": "5cf63d9de155800017d5a6f3"
    },
    "account": "napster:kiceso@planet-travel.club:20192019",
    "__v": 0,
    "check": false,
    "del": false
  },
  {
    "_id": {
      "$oid": "5cf63d9de155800017d5a6f4"
    },
    "account": "napster:sepayizeta@eaglemail.top:20192019",
    "__v": 0,
    "check": false,
    "del": false
  },
  {
    "_id": {
      "$oid": "5cf63d9de155800017d5a6f5"
    },
    "account": "napster:bivexas@max-mail.com:20192019",
    "__v": 0,
    "check": false,
    "del": false
  },
  {
    "_id": {
      "$oid": "5cf63d9de155800017d5a6f1"
    },
    "account": "napster:kurowu@air-blog.com:20192019",
    "__v": 0,
    "check": false,
    "del": false
  },
  {
    "_id": {
      "$oid": "5cf63d9de155800017d5a6f7"
    },
    "account": "tidal:cafo@idea-mail.com:cafo@idea-mail.com",
    "__v": 0,
    "check": false,
    "del": true
  },
  {
    "_id": {
      "$oid": "5cf63d9de155800017d5a6f9"
    },
    "account": "tidal:nilelehino@max-mail.com:nilelehino@max-mail.com",
    "__v": 0,
    "check": false,
    "del": true
  },
  {
    "_id": {
      "$oid": "5cf63d9de155800017d5a6fa"
    },
    "account": "tidal:nopelok@atech5.com:nopelok@atech5.com",
    "__v": 0,
    "check": false,
    "del": true
  },
  {
    "_id": {
      "$oid": "5cf63d9de155800017d5a6f6"
    },
    "account": "napster:bexiceb@mailhub.top:20192019",
    "__v": 0,
    "check": false,
    "del": false
  },
  {
    "_id": {
      "$oid": "5cf63d9de155800017d5a6fe"
    },
    "account": "tidal:mebotom@idea-mail.com:mebotom@idea-mail.com",
    "__v": 0,
    "check": false,
    "del": true
  },
  {
    "_id": {
      "$oid": "5cf63d9de155800017d5a6ff"
    },
    "account": "tidal:zazokeje@greentech5.com:zazokeje@greentech5.com",
    "__v": 0,
    "check": false,
    "del": true
  },
  {
    "_id": {
      "$oid": "5cf63d9de155800017d5a703"
    },
    "account": "tidal:foditeg@mailhub.top:foditeg@mailhub.top",
    "__v": 0,
    "check": false,
    "del": true
  },
  {
    "_id": {
      "$oid": "5cf63d9de155800017d5a704"
    },
    "account": "tidal:zovihe@idea-mail.com:zovihe@idea-mail.com",
    "__v": 0,
    "check": false,
    "del": true
  },
  {
    "_id": {
      "$oid": "5cf63d9de155800017d5a6fc"
    },
    "account": "tidal:hepomud@mailsource.info:hepomud@mailsource.info",
    "__v": 0,
    "check": false,
    "del": true
  },
  {
    "_id": {
      "$oid": "5cf63d9de155800017d5a708"
    },
    "account": "tidal:buhola@shoproyal.net:buhola@shoproyal.net",
    "__v": 0,
    "check": false,
    "del": true
  },
  {
    "_id": {
      "$oid": "5cf63d9de155800017d5a6fb"
    },
    "account": "tidal:cakurafe@tech5group.com:cakurafe@tech5group.com",
    "__v": 0,
    "check": false,
    "del": true
  },
  {
    "_id": {
      "$oid": "5cf63d9de155800017d5a709"
    },
    "account": "tidal:yebeti@max-mail.com:yebeti@max-mail.com",
    "__v": 0,
    "check": false,
    "del": true
  },
  {
    "_id": {
      "$oid": "5cf63d9de155800017d5a70e"
    },
    "account": "tidal:degenaz@royalgifts.info:degenaz@royalgifts.info",
    "__v": 0,
    "check": false,
    "del": false
  },
  {
    "_id": {
      "$oid": "5cf63d9de155800017d5a712"
    },
    "account": "napster:warumim@mrmail.info:20192019",
    "__v": 0,
    "check": false,
    "del": false
  },
  {
    "_id": {
      "$oid": "5cf63d9de155800017d5a713"
    },
    "account": "napster:wavu@mail-finder.net:20192019",
    "__v": 0,
    "check": false,
    "del": false
  },
  {
    "_id": {
      "$oid": "5cf63d9de155800017d5a717"
    },
    "account": "napster:hivuniho@royalhost.info:20192019",
    "__v": 0,
    "check": false,
    "del": false
  },
  {
    "_id": {
      "$oid": "5cf63d9de155800017d5a718"
    },
    "account": "napster:weguj@royalmail.top:20192019",
    "__v": 0,
    "check": false,
    "del": false
  },
  {
    "_id": {
      "$oid": "5cf63d9de155800017d5a701"
    },
    "account": "tidal:hihekori@greentech5.com:hihekori@greentech5.com",
    "__v": 0,
    "check": false,
    "del": true
  },
  {
    "_id": {
      "$oid": "5cf63d9de155800017d5a702"
    },
    "account": "tidal:gufesefug@atech5.com:gufesefug@atech5.com",
    "__v": 0,
    "check": false,
    "del": true
  },
  {
    "_id": {
      "$oid": "5cf63d9de155800017d5a71c"
    },
    "account": "tidal:rafutes@mrmail.info:rafutes@mrmail.info",
    "__v": 0,
    "check": false,
    "del": true
  },
  {
    "_id": {
      "$oid": "5cf63d9de155800017d5a700"
    },
    "account": "tidal:hokicuf@mailsource.info:hokicuf@mailsource.info",
    "__v": 0,
    "check": false,
    "del": true
  },
  {
    "_id": {
      "$oid": "5cf63d9de155800017d5a71d"
    },
    "account": "tidal:movax@royalmail.top:movax@royalmail.top",
    "__v": 0,
    "check": false,
    "del": true
  },
  {
    "_id": {
      "$oid": "5cf63d9de155800017d5a706"
    },
    "account": "tidal:rafena@max-mail.com:rafena@max-mail.com",
    "__v": 0,
    "check": false,
    "del": true
  },
  {
    "_id": {
      "$oid": "5cf63d9de155800017d5a707"
    },
    "account": "tidal:maca@idea-mail.com:maca@idea-mail.com",
    "__v": 0,
    "check": false,
    "del": true
  },
  {
    "_id": {
      "$oid": "5cf63d9de155800017d5a70b"
    },
    "account": "tidal:xolefoz@tech5group.com:xolefoz@tech5group.com",
    "__v": 0,
    "check": false,
    "del": false
  },
  {
    "_id": {
      "$oid": "5cf63d9de155800017d5a721"
    },
    "account": "tidal:cusohuti@key-mail.net:cusohuti@key-mail.net",
    "__v": 0,
    "check": false,
    "del": true
  },
  {
    "_id": {
      "$oid": "5cf63d9de155800017d5a70c"
    },
    "account": "tidal:kozuse@mailsource.info:kozuse@mailsource.info",
    "__v": 0,
    "check": false,
    "del": true
  },
  {
    "_id": {
      "$oid": "5cf63d9de155800017d5a711"
    },
    "account": "napster:mazipavey@max-mail.com:20192019",
    "__v": 0,
    "check": false,
    "del": false
  },
  {
    "_id": {
      "$oid": "5cf63d9de155800017d5a710"
    },
    "account": "napster:focihuruti@shoproyal.net:20192019",
    "__v": 0,
    "check": false,
    "del": false
  },
  {
    "_id": {
      "$oid": "5cf63d9de155800017d5a726"
    },
    "account": "tidal:vaxovof@quick-mail.club:vaxovof@quick-mail.club",
    "__v": 0,
    "check": false,
    "del": true
  },
  {
    "_id": {
      "$oid": "5cf63d9de155800017d5a716"
    },
    "account": "napster:yihisefopu@clickmail.info:20192019",
    "__v": 0,
    "check": false,
    "del": false
  },
  {
    "_id": {
      "$oid": "5cf63d9de155800017d5a70f"
    },
    "account": "napster:rifamiro@greentech5.com:20192019",
    "__v": 0,
    "check": false,
    "del": false
  },
  {
    "_id": {
      "$oid": "5cf63d9de155800017d5a715"
    },
    "account": "napster:zoru@royal-soft.net:20192019",
    "__v": 0,
    "check": false,
    "del": false
  },
  {
    "_id": {
      "$oid": "5cf63d9de155800017d5a71b"
    },
    "account": "tidal:kohar@royalmail.top:kohar@royalmail.top",
    "__v": 0,
    "check": false,
    "del": true
  },
  {
    "_id": {
      "$oid": "5cf63d9de155800017d5a714"
    },
    "account": "napster:tetupis@mrmail.info:20192019",
    "__v": 0,
    "check": false,
    "del": false
  },
  {
    "_id": {
      "$oid": "5cf63d9de155800017d5a720"
    },
    "account": "tidal:weno@first-mail.info:weno@first-mail.info",
    "__v": 0,
    "check": false,
    "del": true
  },
  {
    "_id": {
      "$oid": "5cf63d9de155800017d5a71a"
    },
    "account": "napster:hagog@first-mail.info:20192019",
    "__v": 0,
    "check": false,
    "del": true
  },
  {
    "_id": {
      "$oid": "5cf63d9de155800017d5a725"
    },
    "account": "tidal:luhus@directmail.top:luhus@directmail.top",
    "__v": 0,
    "check": false,
    "del": true
  },
  {
    "_id": {
      "$oid": "5cf63d9de155800017d5a719"
    },
    "account": "napster:duvuwabeha@mail-finder.net:20192019",
    "__v": 0,
    "check": false,
    "del": false
  },
  {
    "_id": {
      "$oid": "5cf63d9de155800017d5a72a"
    },
    "account": "tidal:topuhoya@cyber-host.net:topuhoya@cyber-host.net",
    "__v": 0,
    "check": false,
    "del": true
  },
  {
    "_id": {
      "$oid": "5cf63d9de155800017d5a71f"
    },
    "account": "tidal:rezudak@mail-finder.net:rezudak@mail-finder.net",
    "__v": 0,
    "check": false,
    "del": true
  },
  {
    "_id": {
      "$oid": "5cf63d9de155800017d5a734"
    },
    "account": "tidal:xipisu@hostguru.info:xipisu@hostguru.info",
    "__v": 0,
    "check": false,
    "del": true
  },
  {
    "_id": {
      "$oid": "5cf63d9de155800017d5a724"
    },
    "account": "tidal:vokiso@royal-soft.net:vokiso@royal-soft.net",
    "__v": 0,
    "check": false,
    "del": true
  },
  {
    "_id": {
      "$oid": "5cf63d9de155800017d5a71e"
    },
    "account": "tidal:bifayaban@mrmail.info:bifayaban@mrmail.info",
    "__v": 0,
    "check": false,
    "del": true
  },
  {
    "_id": {
      "$oid": "5cf63d9de155800017d5a739"
    },
    "account": "tidal:yoracizap@hostguru.info:yoracizap@hostguru.info",
    "__v": 0,
    "check": false,
    "del": true
  },
  {
    "_id": {
      "$oid": "5cf63d9de155800017d5a729"
    },
    "account": "napster:mefudajiza@key-mail.net:20192019",
    "__v": 0,
    "check": false,
    "del": true
  },
  {
    "_id": {
      "$oid": "5cf63d9de155800017d5a730"
    },
    "account": "tidal:wojamo@dc-business.com:wojamo@dc-business.com",
    "__v": 0,
    "check": false,
    "del": true
  },
  {
    "_id": {
      "$oid": "5cfa71f97e111a0017e569b9"
    },
    "account": "napster:kiyu@topmailer.info:20192019",
    "check": false,
    "del": false,
    "__v": 0
  },
  {
    "_id": {
      "$oid": "5cfa72e17e111a0017e569ba"
    },
    "account": "napster:vacajobe@crypto-net.club:20192019",
    "check": false,
    "del": false,
    "__v": 0
  },
  {
    "_id": {
      "$oid": "5cfa751b7e111a0017e569bb"
    },
    "account": "napster:zeze@2p-mail.com:20192019",
    "check": false,
    "del": false,
    "__v": 0
  },
  {
    "_id": {
      "$oid": "5cfa790b7e111a0017e569bc"
    },
    "account": "napster:giva@geo-crypto.com:20192019",
    "check": false,
    "del": false,
    "__v": 0
  },
  {
    "_id": {
      "$oid": "5d0212c28e1ae900176aa6b3"
    },
    "account": "spotify:derekdrayson@gmail.com:Hellohello1",
    "check": false,
    "del": true,
    "__v": 0,
    "pause": true
  },
  {
    "_id": {
      "$oid": "5d0212c28e1ae900176aa6b6"
    },
    "account": "spotify:dejknahs@gmail.com:crazyjoe",
    "check": false,
    "del": true,
    "__v": 0,
    "pause": true
  },
  {
    "_id": {
      "$oid": "5d0212c28e1ae900176aa6b7"
    },
    "account": "spotify:luana.lucena@hotmail.com:imbatman",
    "check": false,
    "del": true,
    "__v": 0,
    "pause": true
  },
  {
    "_id": {
      "$oid": "5d03bcd1be021e001751b5e7"
    },
    "account": "tidal:gokuvisih@hostguru.top:gokuvisih@hostguru.top",
    "check": false,
    "del": false,
    "__v": 0
  },
  {
    "_id": {
      "$oid": "5d03be47be021e001751b5e8"
    },
    "account": "tidal:tihut@royalmarket.club:tihut@royalmarket.club",
    "check": false,
    "del": true,
    "__v": 0
  },
  {
    "_id": {
      "$oid": "5cf63d9de155800017d5a73e"
    },
    "account": "tidal:yerus@email-server.info:yerus@email-server.info",
    "__v": 0,
    "check": false,
    "del": true
  },
  {
    "_id": {
      "$oid": "5cf63d9de155800017d5a723"
    },
    "account": "tidal:leja@royalhost.info:leja@royalhost.info",
    "__v": 0,
    "check": false,
    "del": true
  },
  {
    "_id": {
      "$oid": "5cf63d9de155800017d5a72c"
    },
    "account": "tidal:mewo@simpleemail.info:mewo@simpleemail.info",
    "__v": 0,
    "check": false,
    "del": true
  },
  {
    "_id": {
      "$oid": "5cf63d9de155800017d5a728"
    },
    "account": "tidal:sasu@mrmail.info:sasu@mrmail.info",
    "__v": 0,
    "check": false,
    "del": true
  },
  {
    "_id": {
      "$oid": "5cf63d9de155800017d5a731"
    },
    "account": "tidal:yiyicimu@hostguru.info:yiyicimu@hostguru.info",
    "__v": 0,
    "check": false,
    "del": true
  },
  {
    "_id": {
      "$oid": "5cf63d9de155800017d5a748"
    },
    "account": "napster:jtymwks@businessagent.email:jtymwks",
    "__v": 0,
    "check": false,
    "del": true
  },
  {
    "_id": {
      "$oid": "5cf63d9de155800017d5a74d"
    },
    "account": "amazon:jamarie.chandler@e.mail.fr:jamarie.chandler",
    "__v": 0,
    "check": false,
    "del": false
  },
  {
    "_id": {
      "$oid": "5cf63d9de155800017d5a744"
    },
    "account": "napster:yacabu@webgmail.info:yacabu@webgmail.info",
    "__v": 0,
    "check": false,
    "del": false
  },
  {
    "_id": {
      "$oid": "5cf63d9de155800017d5a752"
    },
    "account": "tidal:gabrielesala1998@gmail.com:1998sala",
    "__v": 0,
    "check": false,
    "del": true
  },
  {
    "_id": {
      "$oid": "5cf63d9de155800017d5a749"
    },
    "account": "amazon:jr.zyhir@yopmail.com:jr.zyhir",
    "__v": 0,
    "check": false,
    "del": false
  },
  {
    "_id": {
      "$oid": "5cf63d9de155800017d5a757"
    },
    "account": "napster:joel.deanna@comcast.net:ttownsue",
    "__v": 0,
    "check": false,
    "del": false
  },
  {
    "_id": {
      "$oid": "5cf63d9de155800017d5a74e"
    },
    "account": "amazon:dedric.kylenn@e.mail.fr:dedric.kylenn",
    "__v": 0,
    "check": false,
    "del": false
  },
  {
    "_id": {
      "$oid": "5cf63d9de155800017d5a75c"
    },
    "account": "napster:cstella63@aol.com:winter11",
    "__v": 0,
    "check": false,
    "del": false
  },
  {
    "_id": {
      "$oid": "5cf63d9de155800017d5a753"
    },
    "account": "tidal:cviola91@gmail.com:vacation",
    "__v": 0,
    "check": false,
    "del": false
  },
  {
    "_id": {
      "$oid": "5cf63d9de155800017d5a73b"
    },
    "account": "napster:pixoric@cyber-host.net:pixoric",
    "__v": 0,
    "check": false,
    "del": false
  },
  {
    "_id": {
      "$oid": "5cf63d9de155800017d5a742"
    },
    "account": "tidal:yolofisin@host-info.com:yolofisin@host-info.com",
    "__v": 0,
    "check": false,
    "del": true
  },
  {
    "_id": {
      "$oid": "5cf63d9de155800017d5a758"
    },
    "account": "napster:barrazajm2@att.net:jb8445",
    "__v": 0,
    "check": false,
    "del": false
  },
  {
    "_id": {
      "$oid": "5cf63d9de155800017d5a73c"
    },
    "account": "tidal:gikeh@email-list.online:gikeh@email-list.online",
    "__v": 0,
    "check": false,
    "del": true
  },
  {
    "_id": {
      "$oid": "5cf63d9de155800017d5a761"
    },
    "account": "napster:ladyj2762@yahoo.com:God1st",
    "__v": 0,
    "check": false,
    "del": false
  },
  {
    "_id": {
      "$oid": "5cf63d9de155800017d5a75d"
    },
    "account": "napster:breen@breen.com:ellston",
    "__v": 0,
    "check": false,
    "del": false
  },
  {
    "_id": {
      "$oid": "5cf63d9de155800017d5a740"
    },
    "account": "tidal:rapahov@dc-business.com:rapahov@dc-business.com",
    "__v": 0,
    "check": false,
    "del": true
  },
  {
    "_id": {
      "$oid": "5cf63d9de155800017d5a747"
    },
    "account": "napster:rogijo@maillink.live:rogijo",
    "__v": 0,
    "check": false,
    "del": false
  },
  {
    "_id": {
      "$oid": "5cf63d9de155800017d5a766"
    },
    "account": "napster:drtanigawa@yahoo.com:coors1",
    "__v": 0,
    "check": false,
    "del": false
  },
  {
    "_id": {
      "$oid": "5cf63d9de155800017d5a762"
    },
    "account": "napster:nurseeasley05@aol.com:Rainbow23",
    "__v": 0,
    "check": false,
    "del": false
  },
  {
    "_id": {
      "$oid": "5cf63d9de155800017d5a741"
    },
    "account": "tidal:dovak@webgmail.info:dovak@webgmail.info",
    "__v": 0,
    "check": false,
    "del": true
  },
  {
    "_id": {
      "$oid": "5cf63d9de155800017d5a76b"
    },
    "account": "napster:jazira1103@yahoo.com:nov32006",
    "__v": 0,
    "check": false,
    "del": true
  },
  {
    "_id": {
      "$oid": "5cf63d9de155800017d5a74c"
    },
    "account": "amazon:moxon.rawlins@e.mail.fr:moxon.rawlins",
    "__v": 0,
    "check": false,
    "del": false
  },
  {
    "_id": {
      "$oid": "5cf63d9de155800017d5a767"
    },
    "account": "napster:grivinda25@yahoo.com:tim4ever",
    "__v": 0,
    "check": false,
    "del": false
  },
  {
    "_id": {
      "$oid": "5cf63d9de155800017d5a770"
    },
    "account": "napster:innerpoint@aol.com:spirit1",
    "__v": 0,
    "check": false,
    "del": false
  },
  {
    "_id": {
      "$oid": "5cf63d9de155800017d5a746"
    },
    "account": "tidal:jerimelim@cloudstat.top:jerimelim@cloudstat.top",
    "__v": 0,
    "check": false,
    "del": true
  },
  {
    "_id": {
      "$oid": "5cf63d9de155800017d5a76c"
    },
    "account": "napster:annax94@hotmail.com:amspbh123",
    "__v": 0,
    "check": false,
    "del": true
  },
  {
    "_id": {
      "$oid": "5cf63d9de155800017d5a751"
    },
    "account": "napster:zediya@easy-apps.info:zediya",
    "__v": 0,
    "check": false,
    "del": false
  },
  {
    "_id": {
      "$oid": "5cf63d9de155800017d5a775"
    },
    "account": "napster:missmichalkelly@yahoo.com:findmenow",
    "__v": 0,
    "check": false,
    "del": false
  },
  {
    "_id": {
      "$oid": "5cf63d9de155800017d5a745"
    },
    "account": "tidal:efrrptqzw@max-mail.info:efrrptqzw@max-mail.info",
    "__v": 0,
    "check": false,
    "del": true
  },
  {
    "_id": {
      "$oid": "5cf63d9de155800017d5a771"
    },
    "account": "napster:mercedesnanson@yahoo.com:Petsmart1",
    "__v": 0,
    "check": false,
    "del": false
  },
  {
    "_id": {
      "$oid": "5cf63d9de155800017d5a74b"
    },
    "account": "amazon:cassian.jhon@e.mail.fr:cassian.jhon",
    "__v": 0,
    "check": false,
    "del": false
  },
  {
    "_id": {
      "$oid": "5cf63d9de155800017d5a756"
    },
    "account": "napster:et1003@hotmail.com:benelana",
    "__v": 0,
    "check": false,
    "del": false
  },
  {
    "_id": {
      "$oid": "5cf63d9de155800017d5a776"
    },
    "account": "spotify:pedro.gomes@yopmail.com:pedro.gomes",
    "__v": 0,
    "check": false,
    "del": false,
    "pause": true
  },
  {
    "_id": {
      "$oid": "5cf63d9de155800017d5a77f"
    },
    "account": "spotify:svencando@gmail.com:6495859",
    "__v": 0,
    "check": false,
    "del": false,
    "pause": true
  },
  {
    "_id": {
      "$oid": "5cf63d9de155800017d5a750"
    },
    "account": "napster:jr.zyhir@bullstore.net:jr.zyhir",
    "__v": 0,
    "check": false,
    "del": false
  },
  {
    "_id": {
      "$oid": "5cf63d9de155800017d5a77b"
    },
    "account": "spotify:liquidflamelf@hotmail.com:a4r3i1lf",
    "__v": 0,
    "check": false,
    "del": true,
    "pause": true
  },
  {
    "_id": {
      "$oid": "5cf63d9de155800017d5a75b"
    },
    "account": "napster:jude@jbroussard.com:tapman01",
    "__v": 0,
    "check": false,
    "del": false
  },
  {
    "_id": {
      "$oid": "5cf63d9de155800017d5a780"
    },
    "account": "spotify:amrosenfeld26@gmail.com:Ilovewisco11",
    "__v": 0,
    "check": false,
    "del": true,
    "pause": true
  },
  {
    "_id": {
      "$oid": "5cf63d9de155800017d5a755"
    },
    "account": "napster:ctpr2310@aol.com:born1970",
    "__v": 0,
    "check": false,
    "del": false
  },
  {
    "_id": {
      "$oid": "5cf63d9de155800017d5a760"
    },
    "account": "napster:erica2wed@yahoo.com:myloved2",
    "__v": 0,
    "check": false,
    "del": true
  },
  {
    "_id": {
      "$oid": "5cf63d9de155800017d5a75a"
    },
    "account": "napster:hardin.nathan@gmail.com:moonraker11",
    "__v": 0,
    "check": false,
    "del": true
  },
  {
    "_id": {
      "$oid": "5cf63d9de155800017d5a74f"
    },
    "account": "napster:mahezur@email-host.info:mahezur",
    "__v": 0,
    "check": false,
    "del": false
  },
  {
    "_id": {
      "$oid": "5cf63d9de155800017d5a765"
    },
    "account": "napster:lisadiaz999@gmail.com:maci888",
    "__v": 0,
    "check": false,
    "del": false
  },
  {
    "_id": {
      "$oid": "5cf63d9de155800017d5a75f"
    },
    "account": "napster:chrgary@gmail.com:yougo4it",
    "__v": 0,
    "check": false,
    "del": false
  },
  {
    "_id": {
      "$oid": "5cf63d9de155800017d5a754"
    },
    "account": "napster:lechantellh@hotmail.com:lonnie",
    "__v": 0,
    "check": false,
    "del": false
  },
  {
    "_id": {
      "$oid": "5cf63d9de155800017d5a76a"
    },
    "account": "napster:jorell2000@yahoo.com:texas23",
    "__v": 0,
    "check": false,
    "del": false
  },
  {
    "_id": {
      "$oid": "5cf63d9de155800017d5a764"
    },
    "account": "napster:gabby.lonion@gmail.com:nicole",
    "__v": 0,
    "check": false,
    "del": true
  },
  {
    "_id": {
      "$oid": "5cf63d9de155800017d5a759"
    },
    "account": "napster:bkirchhofer@t-online.de:vincenzo",
    "__v": 0,
    "check": false,
    "del": false
  },
  {
    "_id": {
      "$oid": "5cf63d9de155800017d5a769"
    },
    "account": "napster:gljones406@hotmail.com:leboeuf",
    "__v": 0,
    "check": false,
    "del": false
  },
  {
    "_id": {
      "$oid": "5cf63d9de155800017d5a75e"
    },
    "account": "napster:dpowell7299@yahoo.com:1860sam",
    "__v": 0,
    "check": false,
    "del": false
  },
  {
    "_id": {
      "$oid": "5cf63d9de155800017d5a76f"
    },
    "account": "napster:hitx60@hotmail.com:mookie01",
    "__v": 0,
    "check": false,
    "del": false
  },
  {
    "_id": {
      "$oid": "5cf63d9de155800017d5a76e"
    },
    "account": "napster:joycek613@yahoo.com:player99",
    "__v": 0,
    "check": false,
    "del": true
  },
  {
    "_id": {
      "$oid": "5cf63d9de155800017d5a774"
    },
    "account": "napster:lbissoudre@numericable.fr:laet2264",
    "__v": 0,
    "check": false,
    "del": true
  },
  {
    "_id": {
      "$oid": "5cf63d9de155800017d5a763"
    },
    "account": "napster:jcollman@hotmail.com:zephyr123",
    "__v": 0,
    "check": false,
    "del": true
  },
  {
    "_id": {
      "$oid": "5cf63d9de155800017d5a779"
    },
    "account": "spotify:juan.gomes@yopmail.com:juan.gomes",
    "__v": 0,
    "check": false,
    "del": false,
    "pause": true
  },
  {
    "_id": {
      "$oid": "5cf63d9de155800017d5a773"
    },
    "account": "napster:kieran@gartonjones.co.uk:bond007",
    "__v": 0,
    "check": false,
    "del": false
  },
  {
    "_id": {
      "$oid": "5cf63d9de155800017d5a768"
    },
    "account": "napster:lmlloyd54@gmail.com:george01",
    "__v": 0,
    "check": false,
    "del": false
  },
  {
    "_id": {
      "$oid": "5cf63d9de155800017d5a77e"
    },
    "account": "spotify:tm.landmann@googlemail.com:encore12",
    "__v": 0,
    "check": false,
    "del": false,
    "pause": true
  },
  {
    "_id": {
      "$oid": "5cf63d9de155800017d5a778"
    },
    "account": "spotify:lola.gomes@yopmail.com:lola.gomes",
    "__v": 0,
    "check": false,
    "del": false,
    "pause": true
  },
  {
    "_id": {
      "$oid": "5cf63d9de155800017d5a76d"
    },
    "account": "napster:hoppieusa88@yahoo.com:Adr11AnA",
    "__v": 0,
    "check": false,
    "del": false
  },
  {
    "_id": {
      "$oid": "5cf63d9de155800017d5a77d"
    },
    "account": "spotify:lucy.mann@loewygroup.com:sparkle68",
    "__v": 0,
    "check": false,
    "del": true,
    "pause": true
  },
  {
    "_id": {
      "$oid": "5cf63d9de155800017d5a772"
    },
    "account": "napster:badlambo@aol.com:674277",
    "__v": 0,
    "check": false,
    "del": false
  },
  {
    "_id": {
      "$oid": "5cf63d9de155800017d5a777"
    },
    "account": "spotify:joan.gomes@yopmail.com:joan.gomes",
    "__v": 0,
    "check": false,
    "del": false,
    "pause": true
  },
  {
    "_id": {
      "$oid": "5cf63d9de155800017d5a77c"
    },
    "account": "spotify:krieger_denis@web.de:Dennis21",
    "__v": 0,
    "check": false,
    "del": true,
    "pause": true
  },
  {
    "_id": {
      "$oid": "5cf642d2d0b99f0017df3346"
    },
    "account": "napster:mulawu@fastair.info:20192019",
    "__v": 0,
    "check": false,
    "del": false
  },
  {
    "_id": {
      "$oid": "5cf643b6d0b99f0017df3347"
    },
    "account": "napster:labezeyuk@theskymail.com:20192019",
    "__v": 0,
    "check": false,
    "del": false
  },
  {
    "_id": {
      "$oid": "5cf652220a869d0017494639"
    },
    "account": "napster:civuyopiwi@fastair.info:20192019",
    "__v": 0,
    "check": false,
    "del": false
  },
  {
    "_id": {
      "$oid": "5cf6535d0a869d001749463a"
    },
    "account": "napster:dikosifeto@planet-travel.club:20192019",
    "__v": 0,
    "check": false,
    "del": false
  },
  {
    "_id": {
      "$oid": "5cf6549f0a869d001749463b"
    },
    "account": "napster:gopafugup@skymailapp.com:20192019",
    "__v": 0,
    "check": false,
    "del": false
  },
  {
    "_id": {
      "$oid": "5cf665feffc42c001703b8cb"
    },
    "account": "napster:lomeso@airsport.top:20192019",
    "__v": 0,
    "check": false,
    "del": false
  },
  {
    "_id": {
      "$oid": "5cf66d56ffc42c001703b8cc"
    },
    "account": "napster:kasu@eaglemail.top:20192019",
    "__v": 0,
    "check": false,
    "del": true
  },
  {
    "_id": {
      "$oid": "5cf6795bffc42c001703b8cd"
    },
    "account": "napster:niro@planet-travel.club:20192019",
    "__v": 0,
    "check": false,
    "del": false
  },
  {
    "_id": {
      "$oid": "5cf67a9dffc42c001703b8ce"
    },
    "account": "napster:xifibox@planet-travel.club:20192019",
    "__v": 0,
    "check": false,
    "del": false
  },
  {
    "_id": {
      "$oid": "5cf67cfaffc42c001703b8cf"
    },
    "account": "napster:nola@safe-planet.com:20192019",
    "__v": 0,
    "check": false,
    "del": false
  },
  {
    "_id": {
      "$oid": "5cf67e3bffc42c001703b8d0"
    },
    "account": "napster:mole@theskymail.com:20192019",
    "__v": 0,
    "check": false,
    "del": false
  },
  {
    "_id": {
      "$oid": "5cf686ddffc42c001703b8d3"
    },
    "account": "tidal:civalojaf@airsport.top:civalojaf@airsport.top",
    "__v": 0,
    "check": false,
    "del": false
  },
  {
    "_id": {
      "$oid": "5cf68965ffc42c001703b8d4"
    },
    "account": "tidal:laduzoxoh@airsport.top:laduzoxoh@airsport.top",
    "__v": 0,
    "check": false,
    "del": false
  },
  {
    "_id": {
      "$oid": "5cf68a4bffc42c001703b8d5"
    },
    "account": "tidal:cive@theskymail.com:cive@theskymail.com",
    "__v": 0,
    "check": false,
    "del": false
  },
  {
    "_id": {
      "$oid": "5cf68a59ffc42c001703b8d6"
    },
    "account": "tidal:gusus@theskymail.com:gusus@theskymail.com",
    "__v": 0,
    "check": false,
    "del": false
  },
  {
    "_id": {
      "$oid": "5cf68a7affc42c001703b8d9"
    },
    "account": "tidal:sijekopu@fastair.info:sijekopu@fastair.info",
    "__v": 0,
    "check": false,
    "del": false
  },
  {
    "_id": {
      "$oid": "5cf77e59ffc42c001703b8df"
    },
    "account": "tidal:xiwodod@safe-planet.com:xiwodod@safe-planet.com",
    "__v": 0,
    "check": false,
    "del": false
  },
  {
    "_id": {
      "$oid": "5cf77e69ffc42c001703b8e0"
    },
    "account": "tidal:zafuyu@eaglemail.top:zafuyu@eaglemail.top",
    "__v": 0,
    "check": true,
    "del": false
  },
  {
    "_id": {
      "$oid": "5cf77e88ffc42c001703b8e3"
    },
    "account": "tidal:midelefo@eaglemail.top:midelefo@eaglemail.top",
    "__v": 0,
    "check": false,
    "del": false
  },
  {
    "_id": {
      "$oid": "5cf77f49ffc42c001703b8e4"
    },
    "account": "tidal:xopofa@air-blog.com:xopofa@air-blog.com",
    "__v": 0,
    "check": false,
    "del": true
  },
  {
    "_id": {
      "$oid": "5cf77f51ffc42c001703b8e5"
    },
    "account": "tidal:lanefuziri@airsport.top:lanefuziri@airsport.top",
    "__v": 0,
    "check": false,
    "del": false
  },
  {
    "_id": {
      "$oid": "5cf77f70ffc42c001703b8e8"
    },
    "account": "tidal:dewap@theskymail.com:dewap@theskymail.com",
    "__v": 0,
    "check": false,
    "del": false
  },
  {
    "_id": {
      "$oid": "5cf78223ffc42c001703b8ea"
    },
    "account": "tidal:dukures@fastair.info:dukures@fastair.info",
    "__v": 0,
    "check": false,
    "del": true
  },
  {
    "_id": {
      "$oid": "5cf782edffc42c001703b8ee"
    },
    "account": "tidal:kesiy@eaglemail.top:kesiy@eaglemail.top",
    "__v": 0,
    "check": false,
    "del": false
  },
  {
    "_id": {
      "$oid": "5cf78317ffc42c001703b8ef"
    },
    "account": "tidal:jonica@eaglemail.top:jonica@eaglemail.top",
    "__v": 0,
    "check": false,
    "del": false
  },
  {
    "_id": {
      "$oid": "5cf7833dffc42c001703b8f0"
    },
    "account": "tidal:kufirutec@airsport.top:kufirutec@airsport.top",
    "__v": 0,
    "check": false,
    "del": true
  },
  {
    "_id": {
      "$oid": "5cf68cdaffc42c001703b8da"
    },
    "account": "tidal:sasajuf@skymailgroup.com:sasajuf@skymailgroup.com",
    "__v": 0,
    "check": false,
    "del": false
  },
  {
    "_id": {
      "$oid": "5cf77f68ffc42c001703b8e7"
    },
    "account": "tidal:vubeyasuja@skymailgroup.com:vubeyasuja@skymailgroup.com",
    "__v": 0,
    "check": false,
    "del": true
  },
  {
    "_id": {
      "$oid": "5cf63d9de155800017d5a6f8"
    },
    "account": "tidal:vobahogehi@shoproyal.net:vobahogehi@shoproyal.net",
    "__v": 0,
    "check": false,
    "del": true
  },
  {
    "_id": {
      "$oid": "5cf63d9de155800017d5a6fd"
    },
    "account": "tidal:bumejikam@greentech5.com:bumejikam@greentech5.com",
    "__v": 0,
    "check": false,
    "del": true
  },
  {
    "_id": {
      "$oid": "5cf63d9de155800017d5a70d"
    },
    "account": "tidal:yibisifo@royalgifts.info:yibisifo@royalgifts.info",
    "__v": 0,
    "check": false,
    "del": false
  },
  {
    "_id": {
      "$oid": "5cf63d9de155800017d5a705"
    },
    "account": "tidal:gokepaya@mailsource.info:gokepaya@mailsource.info",
    "__v": 0,
    "check": false,
    "del": true
  },
  {
    "_id": {
      "$oid": "5cf63d9de155800017d5a722"
    },
    "account": "tidal:tetayah@business-agent.info:tetayah@business-agent.info",
    "__v": 0,
    "check": false,
    "del": true
  },
  {
    "_id": {
      "$oid": "5cf63d9de155800017d5a70a"
    },
    "account": "tidal:tudivexoko@shoproyal.net:tudivexoko@shoproyal.net",
    "__v": 0,
    "check": false,
    "del": false
  },
  {
    "_id": {
      "$oid": "5cf63d9de155800017d5a72f"
    },
    "account": "tidal:xevuwoteha@hostguru.info:xevuwoteha@hostguru.info",
    "__v": 0,
    "check": false,
    "del": true
  },
  {
    "_id": {
      "$oid": "5cf63d9de155800017d5a72b"
    },
    "account": "tidal:zupunijuk@cyber-host.net:zupunijuk@cyber-host.net",
    "__v": 0,
    "check": false,
    "del": true
  },
  {
    "_id": {
      "$oid": "5cf63d9de155800017d5a727"
    },
    "account": "tidal:boloziludu@royalmail.top:boloziludu@royalmail.top",
    "__v": 0,
    "check": false,
    "del": true
  },
  {
    "_id": {
      "$oid": "5cf63d9de155800017d5a735"
    },
    "account": "tidal:webuseto@dc-business.com:webuseto@dc-business.com",
    "__v": 0,
    "check": false,
    "del": true
  },
  {
    "_id": {
      "$oid": "5cf63d9de155800017d5a743"
    },
    "account": "tidal:ranivecuxo@email-wizard.com:ranivecuxo@email-wizard.com",
    "__v": 0,
    "check": false,
    "del": true
  },
  {
    "_id": {
      "$oid": "5cf63d9de155800017d5a73a"
    },
    "account": "tidal:haxones@simpleemail.info:haxones@simpleemail.info",
    "__v": 0,
    "check": false,
    "del": true
  },
  {
    "_id": {
      "$oid": "5cf63d9de155800017d5a73f"
    },
    "account": "tidal:suzicebudo@webgmail.info:suzicebudo@webgmail.info",
    "__v": 0,
    "check": false,
    "del": true
  },
  {
    "_id": {
      "$oid": "5cf63d9de155800017d5a733"
    },
    "account": "tidal:nisozobeju@dc-business.com:nisozobeju@dc-business.com",
    "__v": 0,
    "check": false,
    "del": true
  },
  {
    "_id": {
      "$oid": "5cf63d9de155800017d5a72e"
    },
    "account": "tidal:fexakego@dc-business.com:fexakego@dc-business.com",
    "__v": 0,
    "check": false,
    "del": true
  },
  {
    "_id": {
      "$oid": "5cf63d9de155800017d5a72d"
    },
    "account": "tidal:hehexodi@business-agent.info:hehexodi@business-agent.info",
    "__v": 0,
    "check": false,
    "del": true
  },
  {
    "_id": {
      "$oid": "5cf63d9de155800017d5a738"
    },
    "account": "tidal:ciweyalade@webgmail.info:ciweyalade@webgmail.info",
    "__v": 0,
    "check": false,
    "del": true
  },
  {
    "_id": {
      "$oid": "5cf63d9de155800017d5a732"
    },
    "account": "tidal:sujarenupe@business-agent.info:sujarenupe@business-agent.info",
    "__v": 0,
    "check": false,
    "del": true
  },
  {
    "_id": {
      "$oid": "5cf63d9de155800017d5a736"
    },
    "account": "tidal:zowifuren@simpleemail.info:zowifuren@simpleemail.info",
    "__v": 0,
    "check": false,
    "del": true
  },
  {
    "_id": {
      "$oid": "5cf63d9de155800017d5a73d"
    },
    "account": "tidal:humarapone@host-info.com:humarapone@host-info.com",
    "__v": 0,
    "check": false,
    "del": true
  },
  {
    "_id": {
      "$oid": "5cf63d9de155800017d5a737"
    },
    "account": "tidal:xizabilayi@email-wizard.com:xizabilayi@email-wizard.com",
    "__v": 0,
    "check": false,
    "del": true
  },
  {
    "_id": {
      "$oid": "5cf63d9de155800017d5a74a"
    },
    "account": "amazon:ireland.abdurahman@e.mail.fr:ireland.abdurahman",
    "__v": 0,
    "check": false,
    "del": false
  },
  {
    "_id": {
      "$oid": "5cf68a6effc42c001703b8d8"
    },
    "account": "tidal:luzanagoz@planet-travel.club:luzanagoz@planet-travel.club",
    "__v": 0,
    "check": false,
    "del": true
  },
  {
    "_id": {
      "$oid": "5cf68687ffc42c001703b8d2"
    },
    "account": "tidal:jusabo@planet-travel.club:jusabo@planet-travel.club",
    "__v": 0,
    "check": false,
    "del": false
  },
  {
    "_id": {
      "$oid": "5cf68a65ffc42c001703b8d7"
    },
    "account": "tidal:rizuwizek@skymailgroup.com:rizuwizek@skymailgroup.com",
    "__v": 0,
    "check": false,
    "del": false
  },
  {
    "_id": {
      "$oid": "5cf6ad2effc42c001703b8de"
    },
    "account": "tidal:nebuyopaxi@airsport.top:nebuyopaxi@airsport.top",
    "__v": 0,
    "check": false,
    "del": true
  },
  {
    "_id": {
      "$oid": "5cf68de9ffc42c001703b8dd"
    },
    "account": "tidal:sasajuf@skymailgroup.com:sasajuf@skymailgroup.com",
    "__v": 0,
    "check": false,
    "del": false
  },
  {
    "_id": {
      "$oid": "5cf77e7fffc42c001703b8e2"
    },
    "account": "tidal:megihek@skymailgroup.com:megihek@skymailgroup.com",
    "__v": 0,
    "check": false,
    "del": false
  },
  {
    "_id": {
      "$oid": "5cf78292ffc42c001703b8eb"
    },
    "account": "tidal:vupogoguhu@theskymail.com:vupogoguhu@theskymail.com",
    "__v": 0,
    "check": false,
    "del": false
  },
  {
    "_id": {
      "$oid": "5cf782c1ffc42c001703b8ec"
    },
    "account": "tidal:lodugoyil@skymailapp.com:lodugoyil@skymailapp.com",
    "__v": 0,
    "check": false,
    "del": false
  },
  {
    "_id": {
      "$oid": "5cf68d20ffc42c001703b8dc"
    },
    "account": "tidal:dosebijelo@bizsearch.info:dosebijelo@bizsearch.info",
    "__v": 0,
    "check": false,
    "del": false
  },
  {
    "_id": {
      "$oid": "5cf77e72ffc42c001703b8e1"
    },
    "account": "tidal:zecudipe@skymailgroup.com:zecudipe@skymailgroup.com",
    "__v": 0,
    "check": false,
    "del": false
  },
  {
    "_id": {
      "$oid": "5cf77f5dffc42c001703b8e6"
    },
    "account": "tidal:vayikab@planet-travel.club:vayikab@planet-travel.club",
    "__v": 0,
    "check": false,
    "del": false
  },
  {
    "_id": {
      "$oid": "5cf7cd133ae42f0017dafe51"
    },
    "account": "napster:cujolos@bizsearch.info:20192019",
    "check": false,
    "del": false,
    "__v": 0
  },
  {
    "_id": {
      "$oid": "5cf7ce533ae42f0017dafe52"
    },
    "account": "napster:kejisagew@eaglemail.top:20192019",
    "check": false,
    "del": false,
    "__v": 0
  },
  {
    "_id": {
      "$oid": "5cf7d0c63ae42f0017dafe53"
    },
    "account": "tidal:jecabova@skymailapp.com:jecabova@skymailapp.com",
    "check": false,
    "del": false,
    "__v": 0
  },
  {
    "_id": {
      "$oid": "5cf7d44c3ae42f0017dafe54"
    },
    "account": "tidal:dadufo@bizsearch.info:dadufo@bizsearch.info",
    "check": false,
    "del": false,
    "__v": 0
  },
  {
    "_id": {
      "$oid": "5cf7d5683ae42f0017dafe55"
    },
    "account": "tidal:fobuyub@skymailapp.com:fobuyub@skymailapp.com",
    "check": false,
    "del": false,
    "__v": 0
  },
  {
    "_id": {
      "$oid": "5cf7d65f3ae42f0017dafe56"
    },
    "account": "tidal:heripe@safe-planet.com:heripe@safe-planet.com",
    "check": false,
    "del": false,
    "__v": 0
  },
  {
    "_id": {
      "$oid": "5cf7d73f3ae42f0017dafe57"
    },
    "account": "tidal:tuwelon@planet-travel.club:tuwelon@planet-travel.club",
    "check": false,
    "del": false,
    "__v": 0
  },
  {
    "_id": {
      "$oid": "5cf7d83a3ae42f0017dafe58"
    },
    "account": "tidal:vufihi@fastair.info:vufihi@fastair.info",
    "check": false,
    "del": false,
    "__v": 0
  },
  {
    "_id": {
      "$oid": "5cf8f103550d230017e8d880"
    },
    "account": "tidal:somicina@rockmailgroup.com:somicina@rockmailgroup.com",
    "check": false,
    "del": false,
    "__v": 0
  },
  {
    "_id": {
      "$oid": "5cf8f110550d230017e8d881"
    },
    "account": "tidal:savifitupo@coin-link.com:savifitupo@coin-link.com",
    "check": false,
    "del": false,
    "__v": 0
  },
  {
    "_id": {
      "$oid": "5cf8f119550d230017e8d882"
    },
    "account": "tidal:kayanem@rockmailgroup.com:kayanem@rockmailgroup.com",
    "check": false,
    "del": false,
    "__v": 0
  },
  {
    "_id": {
      "$oid": "5cf8f123550d230017e8d883"
    },
    "account": "tidal:noha@geo-crypto.com:noha@geo-crypto.com",
    "check": false,
    "del": false,
    "__v": 0
  },
  {
    "_id": {
      "$oid": "5cf928fd550d230017e8d884"
    },
    "account": "tidal:xiji@fastair.info:xiji@fastair.info",
    "check": false,
    "del": false,
    "__v": 0
  },
  {
    "_id": {
      "$oid": "5cf92913550d230017e8d885"
    },
    "account": "tidal:jiba@rockmailgroup.com:jiba@rockmailgroup.com",
    "check": false,
    "del": false,
    "__v": 0
  },
  {
    "_id": {
      "$oid": "5cf92923550d230017e8d886"
    },
    "account": "tidal:pohijom@top-mailer.net:pohijom@top-mailer.net",
    "check": false,
    "del": false,
    "__v": 0
  },
  {
    "_id": {
      "$oid": "5cf9292f550d230017e8d887"
    },
    "account": "tidal:tawivohiyu@top-mailer.net:tawivohiyu@top-mailer.net",
    "check": false,
    "del": true,
    "__v": 0
  },
  {
    "_id": {
      "$oid": "5cf9293b550d230017e8d888"
    },
    "account": "tidal:xidob@rockmail.top:xidob@rockmail.top",
    "check": false,
    "del": false,
    "__v": 0
  },
  {
    "_id": {
      "$oid": "5cf929a6550d230017e8d889"
    },
    "account": "tidal:wakarakuyo@air-blog.com:wakarakuyo@air-blog.com",
    "check": false,
    "del": false,
    "__v": 0
  },
  {
    "_id": {
      "$oid": "5cf929b0550d230017e8d88a"
    },
    "account": "tidal:cihumacuj@skymailapp.com:cihumacuj@skymailapp.com",
    "check": false,
    "del": false,
    "__v": 0
  },
  {
    "_id": {
      "$oid": "5cf929b8550d230017e8d88b"
    },
    "account": "tidal:deyusayo@airsport.top:deyusayo@airsport.top",
    "check": false,
    "del": false,
    "__v": 0
  },
  {
    "_id": {
      "$oid": "5cf929c0550d230017e8d88c"
    },
    "account": "tidal:hofebow@theskymail.com:hofebow@theskymail.com",
    "check": false,
    "del": true,
    "__v": 0
  },
  {
    "_id": {
      "$oid": "5cf929cf550d230017e8d88d"
    },
    "account": "tidal:pomen@geo-crypto.com:pomen@geo-crypto.com",
    "check": false,
    "del": true,
    "__v": 0
  },
  {
    "_id": {
      "$oid": "5cf932c4550d230017e8d88e"
    },
    "account": "napster:podus@coin-link.com:20192019",
    "check": false,
    "del": false,
    "__v": 0
  },
  {
    "_id": {
      "$oid": "5cf933b2550d230017e8d88f"
    },
    "account": "napster:feco@coin-link.com:20192019",
    "check": false,
    "del": false,
    "__v": 0
  },
  {
    "_id": {
      "$oid": "5cf93480550d230017e8d890"
    },
    "account": "napster:wekey@rockmailapp.com:20192019",
    "check": false,
    "del": false,
    "__v": 0
  },
  {
    "_id": {
      "$oid": "5cf93568550d230017e8d891"
    },
    "account": "napster:carebivu@cryptonet.top:20192019",
    "check": false,
    "del": false,
    "__v": 0
  },
  {
    "_id": {
      "$oid": "5cf93653550d230017e8d892"
    },
    "account": "napster:zuguye@rockmail.top:20192019",
    "check": false,
    "del": false,
    "__v": 0
  },
  {
    "_id": {
      "$oid": "5cf9379e550d230017e8d893"
    },
    "account": "napster:vuyepuj@top-mailer.net:20192019",
    "check": false,
    "del": false,
    "__v": 0
  },
  {
    "_id": {
      "$oid": "5cf938d6550d230017e8d894"
    },
    "account": "napster:nirowig@rockmail.top:20192019",
    "check": false,
    "del": false,
    "__v": 0
  },
  {
    "_id": {
      "$oid": "5cf93a92550d230017e8d895"
    },
    "account": "napster:hegetim@rockmailgroup.com:20192019",
    "check": false,
    "del": false,
    "__v": 0
  },
  {
    "_id": {
      "$oid": "5cf93c60550d230017e8d896"
    },
    "account": "napster:nekiten@rockmail.top:20192019",
    "check": false,
    "del": false,
    "__v": 0
  },
  {
    "_id": {
      "$oid": "5d0212c28e1ae900176aa6b5"
    },
    "account": "spotify:adrenaline_airwave@aol.com:zelda561",
    "check": false,
    "del": false,
    "__v": 0,
    "pause": true
  },
  {
    "_id": {
      "$oid": "5d0212c28e1ae900176aa6b9"
    },
    "account": "spotify:carmen@grooves.de:Tigerente",
    "check": false,
    "del": true,
    "__v": 0,
    "pause": true
  },
  {
    "_id": {
      "$oid": "5d0212c28e1ae900176aa6bb"
    },
    "account": "spotify:allisonbuethe@gmail.com:allibee5",
    "check": false,
    "del": false,
    "__v": 0,
    "pause": true
  },
  {
    "_id": {
      "$oid": "5d0212c28e1ae900176aa6bc"
    },
    "account": "spotify:wesley.scott42@gmail.com:mlb4life",
    "check": false,
    "del": false,
    "__v": 0,
    "pause": true
  },
  {
    "_id": {
      "$oid": "5d025b30af4c13001778eacd"
    },
    "account": "napster:latatagu@royalmarket.club:20192019",
    "check": false,
    "del": false,
    "__v": 0
  },
  {
    "_id": {
      "$oid": "5d0212c28e1ae900176aa6b4"
    },
    "account": "spotify:crystallouisesmith@outlook.com:crystal4",
    "check": false,
    "del": false,
    "__v": 0,
    "pause": true
  },
  {
    "_id": {
      "$oid": "5d0212c28e1ae900176aa6b8"
    },
    "account": "spotify:daryllonglastname@yahoo.com:soccerlover",
    "check": false,
    "del": true,
    "__v": 0,
    "pause": true
  },
  {
    "_id": {
      "$oid": "5cf63d9de155800017d5a77a"
    },
    "account": "spotify:roberto.gomes@yopmail.com:roberto.gomes",
    "__v": 0,
    "check": false,
    "del": false,
    "pause": true
  },
  {
    "_id": {
      "$oid": "5d0212c28e1ae900176aa6ba"
    },
    "account": "spotify:bellacastellanos99@gmail.com:bubbadog1",
    "check": false,
    "del": true,
    "__v": 0,
    "pause": true
  },
  {
    "_id": {
      "$oid": "5d036f2dbe021e001751b5e4"
    },
    "account": "napster:sarabuh@uber-mail.com:20192019",
    "check": false,
    "del": false,
    "__v": 0
  },
  {
    "_id": {
      "$oid": "5d03bb3dbe021e001751b5e5"
    },
    "account": "tidal:limenihise@marketlink.info:limenihise@marketlink.info",
    "check": false,
    "del": false,
    "__v": 0
  },
  {
    "_id": {
      "$oid": "5d03bc35be021e001751b5e6"
    },
    "account": "tidal:genatig@marketlink.info:genatig@marketlink.info",
    "check": false,
    "del": true,
    "__v": 0
  },
  {
    "_id": {
      "$oid": "5d03bf62be021e001751b5e9"
    },
    "account": "tidal:walevebud@uber-mail.com:walevebud@uber-mail.com",
    "check": false,
    "del": false,
    "__v": 0
  },
  {
    "_id": {
      "$oid": "5d076676cdcf20001704e64a"
    },
    "account": "tidal:toyesiyo@coinlink.club:toyesiyo@coinlink.club",
    "check": false,
    "del": true,
    "__v": 0
  },
  {
    "_id": {
      "$oid": "5d07673fcdcf20001704e64b"
    },
    "account": "tidal:geru@coinlink.club:geru@coinlink.club",
    "check": false,
    "del": false,
    "__v": 0
  },
  {
    "_id": {
      "$oid": "5d0767fecdcf20001704e64c"
    },
    "account": "tidal:limahuy@coinbroker.club:limahuy@coinbroker.club",
    "check": false,
    "del": false,
    "__v": 0
  },
  {
    "_id": {
      "$oid": "5d07691bcdcf20001704e64e"
    },
    "account": "tidal:rize@uber-mail.com:rize@uber-mail.com",
    "check": false,
    "del": false,
    "__v": 0
  },
  {
    "_id": {
      "$oid": "5d07691bcdcf20001704e64f"
    },
    "account": "tidal:beripepi@marketlink.info:beripepi@marketlink.info",
    "check": false,
    "del": false,
    "__v": 0
  },
  {
    "_id": {
      "$oid": "5d07691bcdcf20001704e650"
    },
    "account": "tidal:matoj@royalmarket.club:matoj@royalmarket.club",
    "check": false,
    "del": false,
    "__v": 0
  },
  {
    "_id": {
      "$oid": "5d077ae76c7d9c0017cc6b6b"
    },
    "account": "tidal:lusiwi@uber-mail.com:lusiwi@uber-mail.com",
    "check": false,
    "del": false,
    "__v": 0
  },
  {
    "_id": {
      "$oid": "5d077c086c7d9c0017cc6b6c"
    },
    "account": "tidal:solabose@daymailonline.com:solabose@daymailonline.com",
    "check": false,
    "del": false,
    "__v": 0
  },
  {
    "_id": {
      "$oid": "5d077d646c7d9c0017cc6b6d"
    },
    "account": "tidal:cayapol@marketlink.info:cayapol@marketlink.info",
    "check": false,
    "del": false,
    "__v": 0
  },
  {
    "_id": {
      "$oid": "5d077e586c7d9c0017cc6b6e"
    },
    "account": "tidal:ruxi@uber-mail.com:ruxi@uber-mail.com",
    "check": false,
    "del": false,
    "__v": 0
  },
  {
    "_id": {
      "$oid": "5d077fa66c7d9c0017cc6b6f"
    },
    "account": "tidal:safoxag@daymail.life:safoxag@daymail.life",
    "check": false,
    "del": false,
    "__v": 0
  },
  {
    "_id": {
      "$oid": "5d07809c6c7d9c0017cc6b70"
    },
    "account": "tidal:lotit@royalmarket.club:lotit@royalmarket.club",
    "check": false,
    "del": true,
    "__v": 0
  },
  {
    "_id": {
      "$oid": "5d0785576c7d9c0017cc6b71"
    },
    "account": "tidal:kaxoyepoy@daymailonline.com:kaxoyepoy@daymailonline.com",
    "check": false,
    "del": false,
    "__v": 0
  },
  {
    "_id": {
      "$oid": "5d0787176c7d9c0017cc6b72"
    },
    "account": "tidal:bodijir@uber-mail.com:bodijir@uber-mail.com",
    "check": false,
    "del": false,
    "__v": 0
  },
  {
    "_id": {
      "$oid": "5d0788116c7d9c0017cc6b73"
    },
    "account": "tidal:xudanije@royalmarket.club:xudanije@royalmarket.club",
    "check": false,
    "del": false,
    "__v": 0
  },
  {
    "_id": {
      "$oid": "5d07892f6c7d9c0017cc6b74"
    },
    "account": "tidal:fopejajoba@hostguru.top:fopejajoba@hostguru.top",
    "check": false,
    "del": false,
    "__v": 0
  },
  {
    "_id": {
      "$oid": "5d078ca46c7d9c0017cc6b75"
    },
    "account": "tidal:gokemibema@royalmarket.club:gokemibema@royalmarket.club",
    "check": false,
    "del": false,
    "__v": 0
  },
  {
    "_id": {
      "$oid": "5d078e546c7d9c0017cc6b76"
    },
    "account": "tidal:zacewum@uber-mail.com:zacewum@uber-mail.com",
    "check": false,
    "del": true,
    "__v": 0
  },
  {
    "_id": {
      "$oid": "5d08dbff28d04b00174e9aaf"
    },
    "account": "napster:hibotev@daymailonline.com:20192019",
    "check": false,
    "del": false,
    "__v": 0
  },
  {
    "_id": {
      "$oid": "5d08e8c928d04b00174e9ab0"
    },
    "account": "napster:leliv@coinlink.club:20192019",
    "check": false,
    "del": false,
    "__v": 0
  },
  {
    "_id": {
      "$oid": "5d09fd2728d04b00174e9ab1"
    },
    "account": "napster:balijiwuz@daymail.life:20192019",
    "check": false,
    "del": false,
    "__v": 0
  },
  {
    "_id": {
      "$oid": "5d09fed328d04b00174e9ab2"
    },
    "account": "napster:tayoveso@uber-mail.com:20192019",
    "check": false,
    "del": false,
    "__v": 0
  },
  {
    "_id": {
      "$oid": "5d0a05f928d04b00174e9ab3"
    },
    "account": "napster:rowufax@marketlink.info:20192019",
    "check": false,
    "del": false,
    "__v": 0
  },
  {
    "_id": {
      "$oid": "5d0a071028d04b00174e9ab4"
    },
    "account": "napster:zonuhezof@marketlink.info:20192019",
    "check": false,
    "del": false,
    "__v": 0
  },
  {
    "_id": {
      "$oid": "5d0a07d228d04b00174e9ab5"
    },
    "account": "napster:bihogaleg@uber-mail.com:20192019",
    "check": false,
    "del": false,
    "__v": 0
  },
  {
    "_id": {
      "$oid": "5d0a088828d04b00174e9ab6"
    },
    "account": "napster:manom@atnextmail.com:20192019",
    "check": false,
    "del": false,
    "__v": 0
  },
  {
    "_id": {
      "$oid": "5d0a095328d04b00174e9ab7"
    },
    "account": "napster:bafodijeda@marketlink.info:20192019",
    "check": false,
    "del": false,
    "__v": 0
  },
  {
    "_id": {
      "$oid": "5d0a19458455530017e86540"
    },
    "account": "napster:zecive@daymail.life:20192019",
    "check": false,
    "del": false,
    "__v": 0
  },
  {
    "_id": {
      "$oid": "5d0a1e3a8455530017e86541"
    },
    "account": "napster:xuzile@daymail.life:20192019",
    "check": false,
    "del": false,
    "__v": 0
  },
  {
    "_id": {
      "$oid": "5d0a1f148455530017e86542"
    },
    "account": "napster:finugefug@daymail.life:20192019",
    "check": false,
    "del": false,
    "__v": 0
  },
  {
    "_id": {
      "$oid": "5d0a202b8455530017e86543"
    },
    "account": "napster:rosehaduf@silvercoin.life:20192019",
    "check": false,
    "del": false,
    "__v": 0
  },
  {
    "_id": {
      "$oid": "5d0d1a99386bc300176c974f"
    },
    "account": "napster:pejelujik@mailsoul.com:20192019",
    "check": false,
    "del": false,
    "__v": 0
  },
  {
    "_id": {
      "$oid": "5d0d2867386bc300176c9750"
    },
    "account": "napster:butezejido@emailate.com:20192019",
    "check": false,
    "del": false,
    "__v": 0
  },
  {
    "_id": {
      "$oid": "5d0d2989386bc300176c9751"
    },
    "account": "napster:bewivo@eyeemail.com:20192019",
    "check": false,
    "del": false,
    "__v": 0
  },
  {
    "_id": {
      "$oid": "5d0d2a3b386bc300176c9752"
    },
    "account": "napster:cocinu@2emailock.com:20192019",
    "check": false,
    "del": false,
    "__v": 0
  },
  {
    "_id": {
      "$oid": "5d0d2adb386bc300176c9753"
    },
    "account": "napster:kohogotu@emailate.com:20192019",
    "check": false,
    "del": false,
    "__v": 0
  },
  {
    "_id": {
      "$oid": "5d0d2b90386bc300176c9754"
    },
    "account": "napster:tufise@emailay.com:20192019",
    "check": false,
    "del": false,
    "__v": 0
  },
  {
    "_id": {
      "$oid": "5d0d2c38386bc300176c9755"
    },
    "account": "napster:vupekulam@2emailock.com:20192019",
    "check": false,
    "del": false,
    "__v": 0
  },
  {
    "_id": {
      "$oid": "5d0eb7ffcb1c4a001764c2b9"
    },
    "account": "napster:cogak@emailay.com:20192019",
    "check": false,
    "del": false,
    "__v": 0
  },
  {
    "_id": {
      "$oid": "5d0eb8a6cb1c4a001764c2ba"
    },
    "account": "napster:xepiza@mailmetal.com:20192019",
    "check": false,
    "del": false,
    "__v": 0
  },
  {
    "_id": {
      "$oid": "5d0eb94bcb1c4a001764c2bb"
    },
    "account": "napster:giburarek@2emailock.com:20192019",
    "check": false,
    "del": false,
    "__v": 0
  },
  {
    "_id": {
      "$oid": "5d0eb9eccb1c4a001764c2bc"
    },
    "account": "napster:rozezuf@eyeemail.com:20192019",
    "check": false,
    "del": false,
    "__v": 0
  },
  {
    "_id": {
      "$oid": "5d0ebaaecb1c4a001764c2bd"
    },
    "account": "napster:sebiki@emailay.com:20192019",
    "check": false,
    "del": false,
    "__v": 0
  },
  {
    "_id": {
      "$oid": "5d0ebb60cb1c4a001764c2be"
    },
    "account": "napster:bekeva@mailsoul.com:20192019",
    "check": false,
    "del": false,
    "__v": 0
  },
  {
    "_id": {
      "$oid": "5d10e091369b220017dbf5b6"
    },
    "account": "tidal:racev@emailay.com:racev@emailay.com",
    "check": true,
    "del": false,
    "__v": 0
  }
]