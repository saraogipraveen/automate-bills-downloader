const express = require('express');
const fs = require('fs');
const app = express();
const xlsxFile = require('read-excel-file/node');
const {init, initBrowser} = require('./index');

const PORT = 4600;

app.use(express.urlencoded({extended: true}))

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

app.post('/file', async (req, res) => {
  try {
    const rows = await xlsxFile(fs.createReadStream(__dirname + `/${req.body.excel}`))
    console.table(rows);
    let browser = await initBrowser();
    await init(rows, browser);
    res.end();
  }
  catch(error) {
    console.error(error.message);
    res.end();
  }
})

app.listen(PORT, () => console.log(`Server is running on port ${PORT}`)); 


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