const fs = require("fs");
const path = require("path");
let express = require("express");
const app = express();
const http = require("http").createServer(app);
let io = require("socket.io")(http);
const formidable = require("formidable");
const { init, initBrowser, setupExcelError } = require("./index");
const zipFolder = require("zip-a-folder");
let excelErrorObj = {
  isErrorOccurred: false,
  data: `consumer\tunit\tmonths\n`
}

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
  try {
    upload(req, res, (error) => {
      if (error) {
        console.log("multer error : ", error);
        socketInstance.emit("file-error", "Please provide the excel file (with .xlsx extention only).");
        socketInstance.emit("wait-for-user");
      } 
    });
  } catch (e) {
    console.log("uploadFileHandler -> e", e);
  }
  next();
}

app.post("/file", uploadFileHandler, async (req, res) => {
  try {
    socketInstance.emit("process-started");
    deleteFile("./public/generated_-_bills.zip");
    socketInstance.on("response-from-user", function () {
      socketInstance.emit("perform-cleanup");
    });

    let form = new formidable.IncomingForm();
    form.parse(req, async function (err, fields, files) {
      if (err) {
        console.error(err.message);
        return;
      }
      let excel = files.excel;

      if (!excel) {
        socketInstance.emit("file-error", "Please select the input file.");
        socketInstance.emit("wait-for-user");
        return res.end();
      }

      let rows = null;

      fs.exists(__dirname + "/generated_-_bills.xlsx", async function (exists) {
        if (exists) {
          let obj = xlsx.parse(__dirname + "/generated_-_bills.xlsx");
          rows = obj[0].data.filter((row) => row.length >= 1);
          console.table(rows);
          let browser = await initBrowser();
          await setupExcelError(excelErrorObj);
          await init(rows, browser, io, socketInstance);
          await browser.close();
          console.log('data : ' , excelErrorObj.data);
          let writeStream = fs.createWriteStream('./downloads/failed_-_bills.xls');
          writeStream.write(excelErrorObj.data);
          writeStream.close();
          excelErrorObj.data = `consumer\tunit\tmonths\n`;
          deleteFile("generated_-_bills.xlsx");
          await generateZippedFolder();
          socketInstance.emit("wait-for-user", "Done! Download bills", excel.name.split('.')[0]);
          return res.end();
        } else {
          return res.end();
        }
      });
      return res.end();
    });
  } catch (error) {
    return res.end();
  }
});

function deleteFile(path) {
  if (fs.existsSync(path)) {
    fs.unlinkSync(path, (error) => {
      if (error) {
        console.log("unlink error : ", error);
      } else console.log("file deleted");
    });
  } else {
    console.log("File : " + path + " doesn't exists.");
  }
}

let generateZippedFolder = async () => {
  await zipFolder.zipFolder("./downloads", `./public/generated_-_bills.zip`, (err) => {
    if (err) {
      console.log("some error occurred : ", err.message);
      return;
    } else {
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
}

//Listen to the port
http.listen(process.env.PORT || 3000, function () {
  console.log(
    "Express server listening on port %d in %s mode",
    this.address().port,
    app.settings.env
  );
});

module.exports = { io };
