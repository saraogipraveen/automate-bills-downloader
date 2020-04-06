const express = require('express');
const fs = require('fs');
const app = express();
const xlsxFile = require('read-excel-file/node');
const {init, downloadBills} = require('./index');

const PORT = 4600;

app.use(express.urlencoded({extended: true}))

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

app.post('/file', async (req, res) => {
  
  xlsxFile(fs.createReadStream(__dirname + `/${req.body.excel}`))
  .then(async (rows) => {
    // console.table(rows);
    await init(rows);
    res.end();
  })
  .catch(error => {
    console.error(error.message);
    res.end();
  })
})

app.listen(PORT, () => console.log(`Server is running on port ${PORT}`)); 