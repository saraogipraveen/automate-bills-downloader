const express = require('express');
const fs = require('fs');
const app = express();
const xlsxFile = require('read-excel-file/node');
const { init, downloadBills, initBrowser } = require('./index2');
const formidable = require('formidable');


const PORT = 4600;

app.use(express.urlencoded({ extended: true }))

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

app.post('/file', async (req, res) => {

  let form = new formidable.IncomingForm();
  form.parse(req, function (err, fields, files) {
    if (err) {
      // Check for and handle any errors here.
      console.error(err.message);
      return;
    }
    let excel = files.excel;
    console.log("excel", excel)
    let download_path = fields.downloadPath;
    xlsxFile(fs.createReadStream(__dirname + `/${excel.name}`))
      .then(async (rows) => {
        console.table(rows);
        // return;
        let browser = await initBrowser();
        await init(rows, browser, download_path);
        res.end();
      })
      .catch(error => {
        console.error(error.message);
        res.end();
      })
  })


})

app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));