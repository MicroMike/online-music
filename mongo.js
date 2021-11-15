const mongoose = require('mongoose');
const fs = require('fs');

const rand = (max, min) => {
	return Math.floor(Math.random() * Math.floor(max) + (typeof min !== 'undefined' ? min : 0));
}

const SAccount = new mongoose.Schema({
	account: String,
	pending: Boolean,
	check: Boolean,
	pause: Boolean,
	del: Boolean,
	used: Boolean,
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

const SCard = new mongoose.Schema({
	cardNumber: Number,
	month: Number,
	year: Number,
	code: String,
});
const MCard = mongoose.model('Card', SCard, 'cards');

const getCheckAccounts = async (callback) => {
	return new Promise(res => {
		MAccount.find({ check: true, del: false }, function (err, Ra) {
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

			case 'useAccount': {
				if (params) {
					MAccount.findOne({ account: params }, (err, Ra) => {
						if (Ra) {
							Ra.used = true
							Ra.save()
						}
					})
				}
				break
			}

			case 'noUseAccount': {
				if (params) {
					MAccount.findOne({ account: params }, (err, Ra) => {
						if (Ra) {
							Ra.used = false
							Ra.save()
						}
					})
				}
				break
			}

			case 'gain':
				const date = new Date()
				const month = date.getMonth() + 1

				if (params) {
					const p = params.split('/')

					p[0] && p[1] && MGain.findOne({ month }, (err, Rg) => {
						if (err) return console.error(err);

						if (!Rg) {
							const r = new MGain({ plays: 0, nexts: 0, time: 0, month })
							r.save((err, g) => callback && callback({ new: true, g }))
						}
						else {
							Rg.plays += 1
							Rg.save((err, g) => callback && callback({ g }))
						}
					})
				}
				else {
					MGain.findOne({ month }, function (err, Rg) {
						if (err) return console.error(err);

						if (!Rg) {
							const r = new MGain({ plays: 0, nexts: 0, time: 0, month })
							r.save((err, g) => callback && callback({ new: true, g }))
						}
						else {
							callback && callback({ g: Rg })
						}
					})
				}
				break

			default:
				break
		}
	},
	handler: (req, res) => {
		const url = req.url.split('?')[0]
		const params = req.url.split('?')[1]

		// if (/chrome|napster/.test(url)) {
		//   res.setHeader('Content-Type', 'application/json');
		// }

		switch (url) {
			case '/clearUsed': {
				MAccount.find({ used: true }, (err, Ra) => {
					Ra && Ra.forEach(account => {
						account.used = false
						account.save()
					})
				})
				res.end(JSON.stringify({ ok: true }))
				break
			}

			case '/useAccount': {
				const isV2 = params === 'v2'
				const filter = params && params !== ''
					? isV2
						? { used: { $ne: true }, v2: true }
						: { account: params }
					: { check: { $ne: true }, used: { $ne: true }, del: { $ne: true }, pause: { $ne: true } }

				MAccount.find(filter, (err, Ra) => {
					const filter = rand(10);
					// const filter = 0;

					const randAccounts = Ra && Ra.filter(ra => filter !== 0 || /apple|spotify|amazon/.test(ra.account))

					if (!randAccounts) {
						res.end(JSON.stringify({ ok: true }))
					}

					const account = randAccounts.length > 0
						? randAccounts[rand(randAccounts.length)]
						: Ra[rand(Ra.length)]

					if (account) {
						account.used = true
						account.save(() => { res.end(JSON.stringify(account)) })
					}
				})
				break
			}

			case '/checkAccount': {
				MAccount.findOne({ check: true, del: { $ne: true } }, (err, Ra) => {
					if (Ra) {
						res.end(JSON.stringify(Ra))
					}
					else {
						res.end(JSON.stringify({ ok: false }))
					}
				})
				break
			}

			case '/noUseAccount': {
				MAccount.findOne({ account: params }, (err, Ra) => {
					if (Ra) {
						Ra.used = false
						Ra.save(() => { res.end(JSON.stringify(Ra)) })
					}
					else {
						res.end(JSON.stringify({ ok: true }))
					}
				})
				break
			}

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

			case '/delAccount': {
				const p = params && params.split('/')
				let accounts = {}
				p && p.forEach(a => {
					a && MAccount.deleteMany({ account: a }, (err, Ra) => { })
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

			case '/clear':
				MAccount.deleteMany({ del: true }, (err, Ra) => {
					res.end(JSON.stringify(Ra))
				})
				break

			case '/pause': {
				MAccount.find({ "account": { "$regex": "^" + params, "$options": "i" } }, (err, Ra) => {
					Ra.forEach(r => {
						r.pause = true
						r.save()
					})
				})
			}

			case '/unpause': {
				MAccount.find({ "account": { "$regex": "^" + params, "$options": "i" } }, (err, Ra) => {
					Ra.forEach(r => {
						r.pause = false
						r.save()
					})
				})
			}

			case '/uncheck': {
				MAccount.find({ check: true }, (err, Ra) => {
					Ra.forEach(r => {
						r.check = false
						r.save()
					})
				})
			}

			case '/card': {
				res.setHeader('Content-Type', 'application/json');

				// const p = params && params.split('/')
				// if (p) {
				// 	MCard.findOne({}, (err, old) => {
				// 		MCard.deleteMany({}, () => {
				// 			console.log(old)
				// 			const card = new MCard({ cardNumber: p[0], month: p[1] || old.month, year: p[2] || old.year, code: p[3] || old.code })
				// 			card.save((err, a) => { res.end(JSON.stringify(a)) })
				// 		})
				// 	})
				// }
				// else {
				// 	MCard.findOne({}, (err, Ra) => {
				// 		res.end(JSON.stringify(Ra))
				// 	})
				// }

				MCard.findOne({}, (err, Ra) => {
					res.end(JSON.stringify(Ra))
				})
				break
			}

			case '/cardForm': {
				fs.readFile(__dirname + '/card.html',
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

			case '/napster': {
				fs.readFile(__dirname + '/napster.html',
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
