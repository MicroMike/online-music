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
});
const MGain = mongoose.model('Gain', SGain, 'gain');

const SSong = new mongoose.Schema({
  song: String,
  plays: Number,
});
const MSong = mongoose.model('Song', SSong, 'songs');

module.exports = {
  getAllAccounts: async (reset) => {
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
        res(Taccounts)
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

      case '/copy':
        copy.map(a => {
          const r = new MAccount(a);
          r.save()
        })
        res.end(JSON.stringify({ copy }))
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
    "account": "napster:selis@fastair.info:20192019",
    "check": false,
    "del": false
  },
  {
    "account": "napster:nacelodim@skymailgroup.com:20192019",
    "check": false,
    "del": false
  },
  {
    "account": "napster:kiceso@planet-travel.club:20192019",
    "check": false,
    "del": false
  },
  {
    "account": "napster:sepayizeta@eaglemail.top:20192019",
    "check": false,
    "del": false
  },
  {
    "account": "napster:bivexas@max-mail.com:20192019",
    "check": false,
    "del": false
  },
  {
    "account": "napster:kurowu@air-blog.com:20192019",
    "check": false,
    "del": false
  },
  {
    "account": "tidal:cafo@idea-mail.com:cafo@idea-mail.com",
    "check": false,
    "del": true
  },
  {
    "account": "tidal:nilelehino@max-mail.com:nilelehino@max-mail.com",
    "check": false,
    "del": true
  },
  {
    "account": "tidal:nopelok@atech5.com:nopelok@atech5.com",
    "check": false,
    "del": true
  },
  {
    "account": "napster:bexiceb@mailhub.top:20192019",
    "check": false,
    "del": false
  },
  {
    "account": "tidal:mebotom@idea-mail.com:mebotom@idea-mail.com",
    "check": false,
    "del": true
  },
  {
    "account": "tidal:zazokeje@greentech5.com:zazokeje@greentech5.com",
    "check": false,
    "del": true
  },
  {
    "account": "tidal:foditeg@mailhub.top:foditeg@mailhub.top",
    "check": false,
    "del": true
  },
  {
    "account": "tidal:zovihe@idea-mail.com:zovihe@idea-mail.com",
    "check": false,
    "del": true
  },
  {
    "account": "tidal:hepomud@mailsource.info:hepomud@mailsource.info",
    "check": false,
    "del": true
  },
  {
    "account": "tidal:buhola@shoproyal.net:buhola@shoproyal.net",
    "check": false,
    "del": true
  },
  {
    "account": "tidal:cakurafe@tech5group.com:cakurafe@tech5group.com",
    "check": false,
    "del": true
  },
  {
    "account": "tidal:yebeti@max-mail.com:yebeti@max-mail.com",
    "check": false,
    "del": true
  },
  {
    "account": "tidal:degenaz@royalgifts.info:degenaz@royalgifts.info",
    "check": false,
    "del": false
  },
  {
    "account": "napster:warumim@mrmail.info:20192019",
    "check": false,
    "del": false
  },
  {
    "account": "napster:wavu@mail-finder.net:20192019",
    "check": false,
    "del": false
  },
  {
    "account": "napster:hivuniho@royalhost.info:20192019",
    "check": false,
    "del": false
  },
  {
    "account": "napster:weguj@royalmail.top:20192019",
    "check": false,
    "del": false
  },
  {
    "account": "tidal:hihekori@greentech5.com:hihekori@greentech5.com",
    "check": false,
    "del": true
  },
  {
    "account": "tidal:gufesefug@atech5.com:gufesefug@atech5.com",
    "check": false,
    "del": true
  },
  {
    "account": "tidal:rafutes@mrmail.info:rafutes@mrmail.info",
    "check": false,
    "del": true
  },
  {
    "account": "tidal:hokicuf@mailsource.info:hokicuf@mailsource.info",
    "check": false,
    "del": true
  },
  {
    "account": "tidal:movax@royalmail.top:movax@royalmail.top",
    "check": false,
    "del": true
  },
  {
    "account": "tidal:rafena@max-mail.com:rafena@max-mail.com",
    "check": false,
    "del": true
  },
  {
    "account": "tidal:maca@idea-mail.com:maca@idea-mail.com",
    "check": false,
    "del": true
  },
  {
    "account": "tidal:xolefoz@tech5group.com:xolefoz@tech5group.com",
    "check": false,
    "del": false
  },
  {
    "account": "tidal:cusohuti@key-mail.net:cusohuti@key-mail.net",
    "check": false,
    "del": true
  },
  {
    "account": "tidal:kozuse@mailsource.info:kozuse@mailsource.info",
    "check": false,
    "del": true
  },
  {
    "account": "napster:mazipavey@max-mail.com:20192019",
    "check": false,
    "del": false
  },
  {
    "account": "napster:focihuruti@shoproyal.net:20192019",
    "check": false,
    "del": false
  },
  {
    "account": "tidal:vaxovof@quick-mail.club:vaxovof@quick-mail.club",
    "check": false,
    "del": true
  },
  {
    "account": "napster:yihisefopu@clickmail.info:20192019",
    "check": false,
    "del": false
  },
  {
    "account": "napster:rifamiro@greentech5.com:20192019",
    "check": false,
    "del": false
  },
  {
    "account": "napster:zoru@royal-soft.net:20192019",
    "check": false,
    "del": false
  },
  {
    "account": "tidal:kohar@royalmail.top:kohar@royalmail.top",
    "check": false,
    "del": true
  },
  {
    "account": "napster:tetupis@mrmail.info:20192019",
    "check": false,
    "del": false
  },
  {
    "account": "tidal:weno@first-mail.info:weno@first-mail.info",
    "check": false,
    "del": true
  },
  {
    "account": "napster:hagog@first-mail.info:20192019",
    "check": false,
    "del": true
  },
  {
    "account": "tidal:luhus@directmail.top:luhus@directmail.top",
    "check": false,
    "del": true
  },
  {
    "account": "napster:duvuwabeha@mail-finder.net:20192019",
    "check": false,
    "del": false
  },
  {
    "account": "tidal:topuhoya@cyber-host.net:topuhoya@cyber-host.net",
    "check": false,
    "del": true
  },
  {
    "account": "tidal:rezudak@mail-finder.net:rezudak@mail-finder.net",
    "check": false,
    "del": true
  },
  {
    "account": "tidal:xipisu@hostguru.info:xipisu@hostguru.info",
    "check": false,
    "del": true
  },
  {
    "account": "tidal:vokiso@royal-soft.net:vokiso@royal-soft.net",
    "check": false,
    "del": true
  },
  {
    "account": "tidal:bifayaban@mrmail.info:bifayaban@mrmail.info",
    "check": false,
    "del": true
  },
  {
    "account": "tidal:yoracizap@hostguru.info:yoracizap@hostguru.info",
    "check": false,
    "del": true
  },
  {
    "account": "napster:mefudajiza@key-mail.net:20192019",
    "check": false,
    "del": true
  },
  {
    "account": "tidal:wojamo@dc-business.com:wojamo@dc-business.com",
    "check": false,
    "del": true
  },
  {
    "account": "napster:kiyu@topmailer.info:20192019",
    "check": false,
    "del": false,
  },
  {
    "account": "napster:vacajobe@crypto-net.club:20192019",
    "check": false,
    "del": false,
  },
  {
    "account": "napster:zeze@2p-mail.com:20192019",
    "check": false,
    "del": false,
  },
  {
    "account": "napster:giva@geo-crypto.com:20192019",
    "check": false,
    "del": false,
  },
  {
    "account": "spotify:derekdrayson@gmail.com:Hellohello1",
    "check": false,
    "del": true,
    "pause": true
  },
  {
    "account": "spotify:dejknahs@gmail.com:crazyjoe",
    "check": false,
    "del": true,
    "pause": true
  },
  {
    "account": "spotify:luana.lucena@hotmail.com:imbatman",
    "check": false,
    "del": true,
    "pause": true
  },
  {
    "account": "tidal:gokuvisih@hostguru.top:gokuvisih@hostguru.top",
    "check": false,
    "del": false,
  },
  {
    "account": "tidal:tihut@royalmarket.club:tihut@royalmarket.club",
    "check": false,
    "del": true,
  },
  {
    "account": "tidal:yerus@email-server.info:yerus@email-server.info",
    "check": false,
    "del": true
  },
  {
    "account": "tidal:leja@royalhost.info:leja@royalhost.info",
    "check": false,
    "del": true
  },
  {
    "account": "tidal:mewo@simpleemail.info:mewo@simpleemail.info",
    "check": false,
    "del": true
  },
  {
    "account": "tidal:sasu@mrmail.info:sasu@mrmail.info",
    "check": false,
    "del": true
  },
  {
    "account": "tidal:yiyicimu@hostguru.info:yiyicimu@hostguru.info",
    "check": false,
    "del": true
  },
  {
    "account": "napster:jtymwks@businessagent.email:jtymwks",
    "check": false,
    "del": true
  },
  {
    "account": "amazon:jamarie.chandler@e.mail.fr:jamarie.chandler",
    "check": false,
    "del": false
  },
  {
    "account": "napster:yacabu@webgmail.info:yacabu@webgmail.info",
    "check": false,
    "del": false
  },
  {
    "account": "tidal:gabrielesala1998@gmail.com:1998sala",
    "check": false,
    "del": true
  },
  {
    "account": "amazon:jr.zyhir@yopmail.com:jr.zyhir",
    "check": false,
    "del": false
  },
  {
    "account": "napster:joel.deanna@comcast.net:ttownsue",
    "check": false,
    "del": false
  },
  {
    "account": "amazon:dedric.kylenn@e.mail.fr:dedric.kylenn",
    "check": false,
    "del": false
  },
  {
    "account": "napster:cstella63@aol.com:winter11",
    "check": false,
    "del": false
  },
  {
    "account": "tidal:cviola91@gmail.com:vacation",
    "check": false,
    "del": false
  },
  {
    "account": "napster:pixoric@cyber-host.net:pixoric",
    "check": false,
    "del": false
  },
  {
    "account": "tidal:yolofisin@host-info.com:yolofisin@host-info.com",
    "check": false,
    "del": true
  },
  {
    "account": "napster:barrazajm2@att.net:jb8445",
    "check": false,
    "del": false
  },
  {
    "account": "tidal:gikeh@email-list.online:gikeh@email-list.online",
    "check": false,
    "del": true
  },
  {
    "account": "napster:ladyj2762@yahoo.com:God1st",
    "check": false,
    "del": false
  },
  {
    "account": "napster:breen@breen.com:ellston",
    "check": false,
    "del": false
  },
  {
    "account": "tidal:rapahov@dc-business.com:rapahov@dc-business.com",
    "check": false,
    "del": true
  },
  {
    "account": "napster:rogijo@maillink.live:rogijo",
    "check": false,
    "del": false
  },
  {
    "account": "napster:drtanigawa@yahoo.com:coors1",
    "check": false,
    "del": false
  },
  {
    "account": "napster:nurseeasley05@aol.com:Rainbow23",
    "check": false,
    "del": false
  },
  {
    "account": "tidal:dovak@webgmail.info:dovak@webgmail.info",
    "check": false,
    "del": true
  },
  {
    "account": "napster:jazira1103@yahoo.com:nov32006",
    "check": false,
    "del": true
  },
  {
    "account": "amazon:moxon.rawlins@e.mail.fr:moxon.rawlins",
    "check": false,
    "del": false
  },
  {
    "account": "napster:grivinda25@yahoo.com:tim4ever",
    "check": false,
    "del": false
  },
  {
    "account": "napster:innerpoint@aol.com:spirit1",
    "check": false,
    "del": false
  },
  {
    "account": "tidal:jerimelim@cloudstat.top:jerimelim@cloudstat.top",
    "check": false,
    "del": true
  },
  {
    "account": "napster:annax94@hotmail.com:amspbh123",
    "check": false,
    "del": true
  },
  {
    "account": "napster:zediya@easy-apps.info:zediya",
    "check": false,
    "del": false
  },
  {
    "account": "napster:missmichalkelly@yahoo.com:findmenow",
    "check": false,
    "del": false
  },
  {
    "account": "tidal:efrrptqzw@max-mail.info:efrrptqzw@max-mail.info",
    "check": false,
    "del": true
  },
  {
    "account": "napster:mercedesnanson@yahoo.com:Petsmart1",
    "check": false,
    "del": false
  },
  {
    "account": "amazon:cassian.jhon@e.mail.fr:cassian.jhon",
    "check": false,
    "del": false
  },
  {
    "account": "napster:et1003@hotmail.com:benelana",
    "check": false,
    "del": false
  },
  {
    "account": "spotify:pedro.gomes@yopmail.com:pedro.gomes",
    "check": false,
    "del": false,
    "pause": true
  },
  {
    "account": "spotify:svencando@gmail.com:6495859",
    "check": false,
    "del": false,
    "pause": true
  },
  {
    "account": "napster:jr.zyhir@bullstore.net:jr.zyhir",
    "check": false,
    "del": false
  },
  {
    "account": "spotify:liquidflamelf@hotmail.com:a4r3i1lf",
    "check": false,
    "del": true,
    "pause": true
  },
  {
    "account": "napster:jude@jbroussard.com:tapman01",
    "check": false,
    "del": false
  },
  {
    "account": "spotify:amrosenfeld26@gmail.com:Ilovewisco11",
    "check": false,
    "del": true,
    "pause": true
  },
  {
    "account": "napster:ctpr2310@aol.com:born1970",
    "check": false,
    "del": false
  },
  {
    "account": "napster:erica2wed@yahoo.com:myloved2",
    "check": false,
    "del": true
  },
  {
    "account": "napster:hardin.nathan@gmail.com:moonraker11",
    "check": false,
    "del": true
  },
  {
    "account": "napster:mahezur@email-host.info:mahezur",
    "check": false,
    "del": false
  },
  {
    "account": "napster:lisadiaz999@gmail.com:maci888",
    "check": false,
    "del": false
  },
  {
    "account": "napster:chrgary@gmail.com:yougo4it",
    "check": false,
    "del": false
  },
  {
    "account": "napster:lechantellh@hotmail.com:lonnie",
    "check": false,
    "del": false
  },
  {
    "account": "napster:jorell2000@yahoo.com:texas23",
    "check": false,
    "del": false
  },
  {
    "account": "napster:gabby.lonion@gmail.com:nicole",
    "check": false,
    "del": true
  },
  {
    "account": "napster:bkirchhofer@t-online.de:vincenzo",
    "check": false,
    "del": false
  },
  {
    "account": "napster:gljones406@hotmail.com:leboeuf",
    "check": false,
    "del": false
  },
  {
    "account": "napster:dpowell7299@yahoo.com:1860sam",
    "check": false,
    "del": false
  },
  {
    "account": "napster:hitx60@hotmail.com:mookie01",
    "check": false,
    "del": false
  },
  {
    "account": "napster:joycek613@yahoo.com:player99",
    "check": false,
    "del": true
  },
  {
    "account": "napster:lbissoudre@numericable.fr:laet2264",
    "check": false,
    "del": true
  },
  {
    "account": "napster:jcollman@hotmail.com:zephyr123",
    "check": false,
    "del": true
  },
  {
    "account": "spotify:juan.gomes@yopmail.com:juan.gomes",
    "check": false,
    "del": false,
    "pause": true
  },
  {
    "account": "napster:kieran@gartonjones.co.uk:bond007",
    "check": false,
    "del": false
  },
  {
    "account": "napster:lmlloyd54@gmail.com:george01",
    "check": false,
    "del": false
  },
  {
    "account": "spotify:tm.landmann@googlemail.com:encore12",
    "check": false,
    "del": false,
    "pause": true
  },
  {
    "account": "spotify:lola.gomes@yopmail.com:lola.gomes",
    "check": false,
    "del": false,
    "pause": true
  },
  {
    "account": "napster:hoppieusa88@yahoo.com:Adr11AnA",
    "check": false,
    "del": false
  },
  {
    "account": "spotify:lucy.mann@loewygroup.com:sparkle68",
    "check": false,
    "del": true,
    "pause": true
  },
  {
    "account": "napster:badlambo@aol.com:674277",
    "check": false,
    "del": false
  },
  {
    "account": "spotify:joan.gomes@yopmail.com:joan.gomes",
    "check": false,
    "del": false,
    "pause": true
  },
  {
    "account": "spotify:krieger_denis@web.de:Dennis21",
    "check": false,
    "del": true,
    "pause": true
  },
  {
    "account": "napster:mulawu@fastair.info:20192019",
    "check": false,
    "del": false
  },
  {
    "account": "napster:labezeyuk@theskymail.com:20192019",
    "check": false,
    "del": false
  },
  {
    "account": "napster:civuyopiwi@fastair.info:20192019",
    "check": false,
    "del": false
  },
  {
    "account": "napster:dikosifeto@planet-travel.club:20192019",
    "check": false,
    "del": false
  },
  {
    "account": "napster:gopafugup@skymailapp.com:20192019",
    "check": false,
    "del": false
  },
  {
    "account": "napster:lomeso@airsport.top:20192019",
    "check": false,
    "del": false
  },
  {
    "account": "napster:kasu@eaglemail.top:20192019",
    "check": false,
    "del": true
  },
  {
    "account": "napster:niro@planet-travel.club:20192019",
    "check": false,
    "del": false
  },
  {
    "account": "napster:xifibox@planet-travel.club:20192019",
    "check": false,
    "del": false
  },
  {
    "account": "napster:nola@safe-planet.com:20192019",
    "check": false,
    "del": false
  },
  {
    "account": "napster:mole@theskymail.com:20192019",
    "check": false,
    "del": false
  },
  {
    "account": "tidal:civalojaf@airsport.top:civalojaf@airsport.top",
    "check": false,
    "del": false
  },
  {
    "account": "tidal:laduzoxoh@airsport.top:laduzoxoh@airsport.top",
    "check": false,
    "del": false
  },
  {
    "account": "tidal:cive@theskymail.com:cive@theskymail.com",
    "check": false,
    "del": false
  },
  {
    "account": "tidal:gusus@theskymail.com:gusus@theskymail.com",
    "check": false,
    "del": false
  },
  {
    "account": "tidal:sijekopu@fastair.info:sijekopu@fastair.info",
    "check": false,
    "del": false
  },
  {
    "account": "tidal:xiwodod@safe-planet.com:xiwodod@safe-planet.com",
    "check": false,
    "del": false
  },
  {
    "account": "tidal:zafuyu@eaglemail.top:zafuyu@eaglemail.top",
    "check": true,
    "del": false
  },
  {
    "account": "tidal:midelefo@eaglemail.top:midelefo@eaglemail.top",
    "check": false,
    "del": false
  },
  {
    "account": "tidal:xopofa@air-blog.com:xopofa@air-blog.com",
    "check": false,
    "del": true
  },
  {
    "account": "tidal:lanefuziri@airsport.top:lanefuziri@airsport.top",
    "check": false,
    "del": false
  },
  {
    "account": "tidal:dewap@theskymail.com:dewap@theskymail.com",
    "check": false,
    "del": false
  },
  {
    "account": "tidal:dukures@fastair.info:dukures@fastair.info",
    "check": false,
    "del": true
  },
  {
    "account": "tidal:kesiy@eaglemail.top:kesiy@eaglemail.top",
    "check": false,
    "del": false
  },
  {
    "account": "tidal:jonica@eaglemail.top:jonica@eaglemail.top",
    "check": false,
    "del": false
  },
  {
    "account": "tidal:kufirutec@airsport.top:kufirutec@airsport.top",
    "check": false,
    "del": true
  },
  {
    "account": "tidal:sasajuf@skymailgroup.com:sasajuf@skymailgroup.com",
    "check": false,
    "del": false
  },
  {
    "account": "tidal:vubeyasuja@skymailgroup.com:vubeyasuja@skymailgroup.com",
    "check": false,
    "del": true
  },
  {
    "account": "tidal:vobahogehi@shoproyal.net:vobahogehi@shoproyal.net",
    "check": false,
    "del": true
  },
  {
    "account": "tidal:bumejikam@greentech5.com:bumejikam@greentech5.com",
    "check": false,
    "del": true
  },
  {
    "account": "tidal:yibisifo@royalgifts.info:yibisifo@royalgifts.info",
    "check": false,
    "del": false
  },
  {
    "account": "tidal:gokepaya@mailsource.info:gokepaya@mailsource.info",
    "check": false,
    "del": true
  },
  {
    "account": "tidal:tetayah@business-agent.info:tetayah@business-agent.info",
    "check": false,
    "del": true
  },
  {
    "account": "tidal:tudivexoko@shoproyal.net:tudivexoko@shoproyal.net",
    "check": false,
    "del": false
  },
  {
    "account": "tidal:xevuwoteha@hostguru.info:xevuwoteha@hostguru.info",
    "check": false,
    "del": true
  },
  {
    "account": "tidal:zupunijuk@cyber-host.net:zupunijuk@cyber-host.net",
    "check": false,
    "del": true
  },
  {
    "account": "tidal:boloziludu@royalmail.top:boloziludu@royalmail.top",
    "check": false,
    "del": true
  },
  {
    "account": "tidal:webuseto@dc-business.com:webuseto@dc-business.com",
    "check": false,
    "del": true
  },
  {
    "account": "tidal:ranivecuxo@email-wizard.com:ranivecuxo@email-wizard.com",
    "check": false,
    "del": true
  },
  {
    "account": "tidal:haxones@simpleemail.info:haxones@simpleemail.info",
    "check": false,
    "del": true
  },
  {
    "account": "tidal:suzicebudo@webgmail.info:suzicebudo@webgmail.info",
    "check": false,
    "del": true
  },
  {
    "account": "tidal:nisozobeju@dc-business.com:nisozobeju@dc-business.com",
    "check": false,
    "del": true
  },
  {
    "account": "tidal:fexakego@dc-business.com:fexakego@dc-business.com",
    "check": false,
    "del": true
  },
  {
    "account": "tidal:hehexodi@business-agent.info:hehexodi@business-agent.info",
    "check": false,
    "del": true
  },
  {
    "account": "tidal:ciweyalade@webgmail.info:ciweyalade@webgmail.info",
    "check": false,
    "del": true
  },
  {
    "account": "tidal:sujarenupe@business-agent.info:sujarenupe@business-agent.info",
    "check": false,
    "del": true
  },
  {
    "account": "tidal:zowifuren@simpleemail.info:zowifuren@simpleemail.info",
    "check": false,
    "del": true
  },
  {
    "account": "tidal:humarapone@host-info.com:humarapone@host-info.com",
    "check": false,
    "del": true
  },
  {
    "account": "tidal:xizabilayi@email-wizard.com:xizabilayi@email-wizard.com",
    "check": false,
    "del": true
  },
  {
    "account": "amazon:ireland.abdurahman@e.mail.fr:ireland.abdurahman",
    "check": false,
    "del": false
  },
  {
    "account": "tidal:luzanagoz@planet-travel.club:luzanagoz@planet-travel.club",
    "check": false,
    "del": true
  },
  {
    "account": "tidal:jusabo@planet-travel.club:jusabo@planet-travel.club",
    "check": false,
    "del": false
  },
  {
    "account": "tidal:rizuwizek@skymailgroup.com:rizuwizek@skymailgroup.com",
    "check": false,
    "del": false
  },
  {
    "account": "tidal:nebuyopaxi@airsport.top:nebuyopaxi@airsport.top",
    "check": false,
    "del": true
  },
  {
    "account": "tidal:sasajuf@skymailgroup.com:sasajuf@skymailgroup.com",
    "check": false,
    "del": false
  },
  {
    "account": "tidal:megihek@skymailgroup.com:megihek@skymailgroup.com",
    "check": false,
    "del": false
  },
  {
    "account": "tidal:vupogoguhu@theskymail.com:vupogoguhu@theskymail.com",
    "check": false,
    "del": false
  },
  {
    "account": "tidal:lodugoyil@skymailapp.com:lodugoyil@skymailapp.com",
    "check": false,
    "del": false
  },
  {
    "account": "tidal:dosebijelo@bizsearch.info:dosebijelo@bizsearch.info",
    "check": false,
    "del": false
  },
  {
    "account": "tidal:zecudipe@skymailgroup.com:zecudipe@skymailgroup.com",
    "check": false,
    "del": false
  },
  {
    "account": "tidal:vayikab@planet-travel.club:vayikab@planet-travel.club",
    "check": false,
    "del": false
  },
  {
    "account": "napster:cujolos@bizsearch.info:20192019",
    "check": false,
    "del": false,
  },
  {
    "account": "napster:kejisagew@eaglemail.top:20192019",
    "check": false,
    "del": false,
  },
  {
    "account": "tidal:jecabova@skymailapp.com:jecabova@skymailapp.com",
    "check": false,
    "del": false,
  },
  {
    "account": "tidal:dadufo@bizsearch.info:dadufo@bizsearch.info",
    "check": false,
    "del": false,
  },
  {
    "account": "tidal:fobuyub@skymailapp.com:fobuyub@skymailapp.com",
    "check": false,
    "del": false,
  },
  {
    "account": "tidal:heripe@safe-planet.com:heripe@safe-planet.com",
    "check": false,
    "del": false,
  },
  {
    "account": "tidal:tuwelon@planet-travel.club:tuwelon@planet-travel.club",
    "check": false,
    "del": false,
  },
  {
    "account": "tidal:vufihi@fastair.info:vufihi@fastair.info",
    "check": false,
    "del": false,
  },
  {
    "account": "tidal:somicina@rockmailgroup.com:somicina@rockmailgroup.com",
    "check": false,
    "del": false,
  },
  {
    "account": "tidal:savifitupo@coin-link.com:savifitupo@coin-link.com",
    "check": false,
    "del": false,
  },
  {
    "account": "tidal:kayanem@rockmailgroup.com:kayanem@rockmailgroup.com",
    "check": false,
    "del": false,
  },
  {
    "account": "tidal:noha@geo-crypto.com:noha@geo-crypto.com",
    "check": false,
    "del": false,
  },
  {
    "account": "tidal:xiji@fastair.info:xiji@fastair.info",
    "check": false,
    "del": false,
  },
  {
    "account": "tidal:jiba@rockmailgroup.com:jiba@rockmailgroup.com",
    "check": false,
    "del": false,
  },
  {
    "account": "tidal:pohijom@top-mailer.net:pohijom@top-mailer.net",
    "check": false,
    "del": false,
  },
  {
    "account": "tidal:tawivohiyu@top-mailer.net:tawivohiyu@top-mailer.net",
    "check": false,
    "del": true,
  },
  {
    "account": "tidal:xidob@rockmail.top:xidob@rockmail.top",
    "check": false,
    "del": false,
  },
  {
    "account": "tidal:wakarakuyo@air-blog.com:wakarakuyo@air-blog.com",
    "check": false,
    "del": false,
  },
  {
    "account": "tidal:cihumacuj@skymailapp.com:cihumacuj@skymailapp.com",
    "check": false,
    "del": false,
  },
  {
    "account": "tidal:deyusayo@airsport.top:deyusayo@airsport.top",
    "check": false,
    "del": false,
  },
  {
    "account": "tidal:hofebow@theskymail.com:hofebow@theskymail.com",
    "check": false,
    "del": true,
  },
  {
    "account": "tidal:pomen@geo-crypto.com:pomen@geo-crypto.com",
    "check": false,
    "del": true,
  },
  {
    "account": "napster:podus@coin-link.com:20192019",
    "check": false,
    "del": false,
  },
  {
    "account": "napster:feco@coin-link.com:20192019",
    "check": false,
    "del": false,
  },
  {
    "account": "napster:wekey@rockmailapp.com:20192019",
    "check": false,
    "del": false,
  },
  {
    "account": "napster:carebivu@cryptonet.top:20192019",
    "check": false,
    "del": false,
  },
  {
    "account": "napster:zuguye@rockmail.top:20192019",
    "check": false,
    "del": false,
  },
  {
    "account": "napster:vuyepuj@top-mailer.net:20192019",
    "check": false,
    "del": false,
  },
  {
    "account": "napster:nirowig@rockmail.top:20192019",
    "check": false,
    "del": false,
  },
  {
    "account": "napster:hegetim@rockmailgroup.com:20192019",
    "check": false,
    "del": false,
  },
  {
    "account": "napster:nekiten@rockmail.top:20192019",
    "check": false,
    "del": false,
  },
  {
    "account": "spotify:adrenaline_airwave@aol.com:zelda561",
    "check": false,
    "del": false,
    "pause": true
  },
  {
    "account": "spotify:carmen@grooves.de:Tigerente",
    "check": false,
    "del": true,
    "pause": true
  },
  {
    "account": "spotify:allisonbuethe@gmail.com:allibee5",
    "check": false,
    "del": false,
    "pause": true
  },
  {
    "account": "spotify:wesley.scott42@gmail.com:mlb4life",
    "check": false,
    "del": false,
    "pause": true
  },
  {
    "account": "napster:latatagu@royalmarket.club:20192019",
    "check": false,
    "del": false,
  },
  {
    "account": "spotify:crystallouisesmith@outlook.com:crystal4",
    "check": false,
    "del": false,
    "pause": true
  },
  {
    "account": "spotify:daryllonglastname@yahoo.com:soccerlover",
    "check": false,
    "del": true,
    "pause": true
  },
  {
    "account": "spotify:roberto.gomes@yopmail.com:roberto.gomes",
    "check": false,
    "del": false,
    "pause": true
  },
  {
    "account": "spotify:bellacastellanos99@gmail.com:bubbadog1",
    "check": false,
    "del": true,
    "pause": true
  },
  {
    "account": "napster:sarabuh@uber-mail.com:20192019",
    "check": false,
    "del": false,
  },
  {
    "account": "tidal:limenihise@marketlink.info:limenihise@marketlink.info",
    "check": false,
    "del": false,
  },
  {
    "account": "tidal:genatig@marketlink.info:genatig@marketlink.info",
    "check": false,
    "del": true,
  },
  {
    "account": "tidal:walevebud@uber-mail.com:walevebud@uber-mail.com",
    "check": false,
    "del": false,
  },
  {
    "account": "tidal:toyesiyo@coinlink.club:toyesiyo@coinlink.club",
    "check": false,
    "del": true,
  },
  {
    "account": "tidal:geru@coinlink.club:geru@coinlink.club",
    "check": false,
    "del": false,
  },
  {
    "account": "tidal:limahuy@coinbroker.club:limahuy@coinbroker.club",
    "check": false,
    "del": false,
  },
  {
    "account": "tidal:rize@uber-mail.com:rize@uber-mail.com",
    "check": false,
    "del": false,
  },
  {
    "account": "tidal:beripepi@marketlink.info:beripepi@marketlink.info",
    "check": false,
    "del": false,
  },
  {
    "account": "tidal:matoj@royalmarket.club:matoj@royalmarket.club",
    "check": false,
    "del": false,
  },
  {
    "account": "tidal:lusiwi@uber-mail.com:lusiwi@uber-mail.com",
    "check": false,
    "del": false,
  },
  {
    "account": "tidal:solabose@daymailonline.com:solabose@daymailonline.com",
    "check": false,
    "del": false,
  },
  {
    "account": "tidal:cayapol@marketlink.info:cayapol@marketlink.info",
    "check": false,
    "del": false,
  },
  {
    "account": "tidal:ruxi@uber-mail.com:ruxi@uber-mail.com",
    "check": false,
    "del": false,
  },
  {
    "account": "tidal:safoxag@daymail.life:safoxag@daymail.life",
    "check": false,
    "del": false,
  },
  {
    "account": "tidal:lotit@royalmarket.club:lotit@royalmarket.club",
    "check": false,
    "del": true,
  },
  {
    "account": "tidal:kaxoyepoy@daymailonline.com:kaxoyepoy@daymailonline.com",
    "check": false,
    "del": false,
  },
  {
    "account": "tidal:bodijir@uber-mail.com:bodijir@uber-mail.com",
    "check": false,
    "del": false,
  },
  {
    "account": "tidal:xudanije@royalmarket.club:xudanije@royalmarket.club",
    "check": false,
    "del": false,
  },
  {
    "account": "tidal:fopejajoba@hostguru.top:fopejajoba@hostguru.top",
    "check": false,
    "del": false,
  },
  {
    "account": "tidal:gokemibema@royalmarket.club:gokemibema@royalmarket.club",
    "check": false,
    "del": false,
  },
  {
    "account": "tidal:zacewum@uber-mail.com:zacewum@uber-mail.com",
    "check": false,
    "del": true,
  },
  {
    "account": "napster:hibotev@daymailonline.com:20192019",
    "check": false,
    "del": false,
  },
  {
    "account": "napster:leliv@coinlink.club:20192019",
    "check": false,
    "del": false,
  },
  {
    "account": "napster:balijiwuz@daymail.life:20192019",
    "check": false,
    "del": false,
  },
  {
    "account": "napster:tayoveso@uber-mail.com:20192019",
    "check": false,
    "del": false,
  },
  {
    "account": "napster:rowufax@marketlink.info:20192019",
    "check": false,
    "del": false,
  },
  {
    "account": "napster:zonuhezof@marketlink.info:20192019",
    "check": false,
    "del": false,
  },
  {
    "account": "napster:bihogaleg@uber-mail.com:20192019",
    "check": false,
    "del": false,
  },
  {
    "account": "napster:manom@atnextmail.com:20192019",
    "check": false,
    "del": false,
  },
  {
    "account": "napster:bafodijeda@marketlink.info:20192019",
    "check": false,
    "del": false,
  },
  {
    "account": "napster:zecive@daymail.life:20192019",
    "check": false,
    "del": false,
  },
  {
    "account": "napster:xuzile@daymail.life:20192019",
    "check": false,
    "del": false,
  },
  {
    "account": "napster:finugefug@daymail.life:20192019",
    "check": false,
    "del": false,
  },
  {
    "account": "napster:rosehaduf@silvercoin.life:20192019",
    "check": false,
    "del": false,
  },
  {
    "account": "napster:pejelujik@mailsoul.com:20192019",
    "check": false,
    "del": false,
  },
  {
    "account": "napster:butezejido@emailate.com:20192019",
    "check": false,
    "del": false,
  },
  {
    "account": "napster:bewivo@eyeemail.com:20192019",
    "check": false,
    "del": false,
  },
  {
    "account": "napster:cocinu@2emailock.com:20192019",
    "check": false,
    "del": false,
  },
  {
    "account": "napster:kohogotu@emailate.com:20192019",
    "check": false,
    "del": false,
  },
  {
    "account": "napster:tufise@emailay.com:20192019",
    "check": false,
    "del": false,
  },
  {
    "account": "napster:vupekulam@2emailock.com:20192019",
    "check": false,
    "del": false,
  },
  {
    "account": "napster:cogak@emailay.com:20192019",
    "check": false,
    "del": false,
  },
  {
    "account": "napster:xepiza@mailmetal.com:20192019",
    "check": false,
    "del": false,
  },
  {
    "account": "napster:giburarek@2emailock.com:20192019",
    "check": false,
    "del": false,
  },
  {
    "account": "napster:rozezuf@eyeemail.com:20192019",
    "check": false,
    "del": false,
  },
  {
    "account": "napster:sebiki@emailay.com:20192019",
    "check": false,
    "del": false,
  },
  {
    "account": "napster:bekeva@mailsoul.com:20192019",
    "check": false,
    "del": false,
  },
  {
    "account": "tidal:racev@emailay.com:racev@emailay.com",
    "check": true,
    "del": false,
  }
]