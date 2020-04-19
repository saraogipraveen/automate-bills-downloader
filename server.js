const fs = require('fs');
let express = require('express');
const app = require('express')();
const http = require('http').createServer(app);
let io = require('socket.io')(http);
const xlsxFile = require('read-excel-file/node');
const { init, initBrowser } = require('./index');
const formidable = require('formidable')

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
  socketInstance.emit('perform-cleanup');
  socketInstance.emit('process-started');
  console.log(req.body);
  try {
    let form = new formidable.IncomingForm();
    form.parse(req, async function (err, fields, files) {
      if (err) {
        // Check for and handle any errors here.
        console.error(err.message);
        return;
      }
      let excel = files.excel;
      // let download_path = fields.downloadPath;

      if(!excel) {
        socketInstance.emit('file-error', 'Please provide the excel file.');
        socketInstance.emit('waiting-for-user');
        socketInstance.on('response-from-user', function(){
          socketInstance.emit('perform-cleanup');
        });
        res.end();
      }

      console.log("excel", excel)
      console.log("excel.name", excel.name)
      let rows = null;
      // fs.exists(__dirname + `/${excel.name}`, function (exists) {
      fs.exists(`${excel.name}`, async function (exists) {
        if (exists) {
          var obj = xlsx.parse(__dirname + `/${excel.name}`);
          rows = obj[0].data.filter(row => row.length >= 1);
          console.table(rows);
          let browser = await initBrowser();
          await init(rows, browser, io, socketInstance);
          await browser.close();
          io.emit('waiting-for-user');
          socketInstance.on('response-from-user', function(){
            socketInstance.emit('perform-cleanup');
          });
        }
        else {
          console.log(`file doesn't exist`);
        }
      })
      res.end();
    })
  }
  catch (error) {
    console.error('ERROR GEN : ', error.message);
    res.end();
  }
})

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