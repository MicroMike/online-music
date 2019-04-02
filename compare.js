let one = []
let two = []
let valid = []

const fs = require('fs');
let file = process.env.FILE || 'napsterAccount.txt'

fs.readFile(file, 'utf8', function (err, data) {
  if (err) return console.log(err);
  one = data.split(',')

  while (one.length) {
    let account = one.shift()
    if (one.indexOf(account) >= 0) {
      console.log(account)
    }
    else {
      valid.push(account)
    }
  }

  fs.readFile('napsterAccountDel.txt', 'utf8', function (err, data) {
    if (err) return console.log(err);
    two = data.split(',')
    const length = valid.length

    valid = valid.filter(account => two.indexOf(account) === -1)

    if (length !== valid.length) {
      console.log(two)
    }

    fs.writeFile(file, valid, function (err) {
      if (err) return console.log(err);
    });

    fs.writeFile('napsterAccountDel.txt', '', function (err) {
      if (err) return console.log(err);
    });
  })

});
