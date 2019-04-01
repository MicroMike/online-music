const fs = require('fs');
const server = require('http').createServer();
const io = require('socket.io')(server);

let accounts
let file = process.env.FILE || 'napsterAccount.txt'

const getFromFile = () => {
  fs.readFile(file, 'utf8', async (err, data) => {
    if (err) return console.log(err);

    fs.readFile('napsterAccountDel.txt', 'utf8', async (err2, dataDel) => {
      if (err2) return console.log(err2);

      accounts = data.split(',')

      dataDel = dataDel.split(',').filter(e => e)
      accounts = accounts.filter(e => dataDel.indexOf(e) < 0)

      if (process.env.TYPE) {
        accounts = accounts.filter(m => m.split(':')[0] === process.env.TYPE)
      }

      console.log(accounts.length)
    })
  });
}

getFromFile()

io.on('disconnect', () => {
  getFromFile()
});

io.on('connection', client => {
  console.log('connected', accounts.length)
  client.emit('done')

  client.on('getAccounts', () => {
    client.emit('accounts', accounts);

    client.on('usedAccount', account => {
      accounts = accounts.filter(a => a !== account)
      io.emit('updateAccounts', accounts)
    });

    client.on('unusedAccount', account => {
      accounts.push(account)
      io.emit('updateAccounts', accounts)
    });

    client.on('delete', account => {
      accounts.push(account)
      io.emit('updateAccounts', accounts)

      fs.readFile('napsterAccountDel.txt', 'utf8', function (err, data) {
        if (err) return console.log(err);
        data = data.split(',').filter(e => e)
        data = data.filter(a => a !== account)
        data.push(account)
        fs.writeFile('napsterAccountDel.txt', data.length === 1 ? data[0] : data.join(','), function (err) {
          if (err) return console.log(err);
        });
      });
    })
  })
});


server.listen(process.env.PORT || 3000);