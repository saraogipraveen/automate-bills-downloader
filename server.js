const fs = require('fs');
let express = require('express');
const app = require('express')();
const http = require('http').createServer(app);
let io = require('socket.io')(http);
const xlsxFile = require('read-excel-file/node');
const {init, initBrowser} = require('./index');


let xlsx = require('node-xlsx');

const PORT = 4600;

app.use(express.urlencoded({extended: true}))

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});
let socketInstance = null;

io.on('connection', socket => {
  socketInstance = socket;
  // socketInstance.emit('new-event', {new: 'new'});
  console.log('a user connected');
})



app.post('/file', async (req, res) => {
  try {
    let rows = null;
    fs.exists(__dirname + `/${req.body.excel}`, function(exists) {
      if(exists) {
        var obj = xlsx.parse(__dirname + `/${req.body.excel}`);
        rows = obj[0].data.filter(row => row.length >= 1);
        console.table(rows);
      }
      else {
        console.log(`file doesn't exist`);
      }
    })
    let browser = await initBrowser();
    await init(rows, browser, io, socketInstance);
    await browser.close();
    io.emit('waiting-for-user');
    res.end();
  }
  catch(error) {
    console.error(error.message);
    res.end();
  }
})

// app.listen(PORT, () => console.log(`Server is running on port ${PORT}`)); 
http.listen(PORT, () => console.log(`Server is running on port ${PORT}`)); 


/*

170688852041	4636	oct,nov
170688852075	4636	jan,mar
170688859011	4636	dec,feb
170675839380	4636	jan,nov
170688851648	4636	sep,may
170688856313	4636	may,apr
170688859029	4636	dec,mar
170688852059	4636	nov,aug

*/

module.exports = { io }