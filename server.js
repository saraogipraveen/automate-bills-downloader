const express = require('express');
const fs = require('fs');
const app = express();
const xlsxFile = require('read-excel-file/node');
const {init, downloadBills, initBrowser} = require('./index2');

const PORT = 4600;

app.use(express.urlencoded({extended: true}))

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

app.post('/file', async (req, res) => {
  
  xlsxFile(fs.createReadStream(__dirname + `/${req.body.excel}`))
  .then(async (rows) => {
    console.table(rows);
    // return;
    let browser = await initBrowser();
    await init(rows, browser);
    res.end();
  })
  .catch(error => {
    console.error(error.message);
    res.end();
  })
})

app.listen(PORT, () => console.log(`Server is running on port ${PORT}`)); 