const fs = require("fs");
const path = require('path');
let express = require("express");
const app = express();
const http = require("http").createServer(app);
let io = require("socket.io")(http);
const formidable = require("formidable");
const { init, initBrowser } = require("./index");
const zipFolder = require("zip-a-folder");

const upload = require("./multerConfig");
let xlsx = require("node-xlsx");
let socketInstance = null;
const PORT = 4600;

app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  // res.sendFile(__dirname + '/index.html');
});

io.on("connection", (socket) => {
  socketInstance = socket;
  console.log("a user connected");
});

function uploadFileHandler(req, res, next) {
  upload(req, res, (error) => {
    if (error) {
      // console.log("multer error : ", error);
      socketInstance.emit("file-error", "Please provide the excel file.");
      socketInstance.emit("waiting-for-user");
    } else {
      // console.log("uploaded successfully");
    }
  });
  next();
}

app.post("/file", uploadFileHandler, async (req, res) => {
  //console.log("host : ", req.headers.host);

  socketInstance.emit("process-started");
  socketInstance.on("response-from-user", function () {
    socketInstance.emit("perform-cleanup");
  });

  try {
    let form = new formidable.IncomingForm();
    form.parse(req, async function (err, fields, files) {
      if (err) {
        console.error(err.message);
        return;
      }
      let excel = files.excel;

      if (!excel) {
        socketInstance.emit("file-error", "Please select the input file.");
        socketInstance.emit("waiting-for-user");
        res.end();
      }

      let rows = null;

      fs.exists(__dirname + "/bills.xlsx", async function (exists) {
        if (exists) {
          let obj = xlsx.parse(__dirname + "/bills.xlsx");
          rows = obj[0].data.filter((row) => row.length >= 1);
          console.table(rows);
          let browser = await initBrowser();
          await init(rows, browser, io, socketInstance);
          await browser.close();
          deleteFile();
          await generateZippedFolder();
          // removeDir("./downloads");
          socketInstance.emit("wait-for-user", "Done! Download bills");
          res.end();
        } else {
          res.end();
          socketInstance.emit("wait-for-user");
        }
      });
      res.end();
      // socketInstance.emit("wait-for-user");
    });
  } catch (error) {
    res.end();
    socketInstance.emit("wait-for-user");
  }
});

function deleteFile() {
  fs.unlinkSync("bills.xlsx", (error) => {
    if (error) {
      console.log("unlink error : ", error);
    } else console.log("file deleted");
  });
}

let generateZippedFolder = async () => {
  await zipFolder.zipFolder("./downloads", "./public/bills.zip", (err) => {
    if (err) {
      console.log("some error occurred : ", err.message);
      return;
    } else {
      // console.log("success");
      removeDir("./downloads");
      return;
    }
  });
};


function removeDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
      return;
  }

  var list = fs.readdirSync(dirPath);
  for (var i = 0; i < list.length; i++) {
      var filename = path.join(dirPath, list[i]);
      var stat = fs.statSync(filename);

      if (filename == "." || filename == "..") {
          // do nothing for current and parent dir
      } else if (stat.isDirectory()) {
          removeDir(filename);
      } else {
          fs.unlinkSync(filename);
      }
  }

  fs.rmdirSync(dirPath);
};


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

module.exports = { io };
