const multer = require("multer");
const path = require("path");

var storage = multer.diskStorage({
  destination: ".",
  filename: function (req, file, cb) {
    cb(null, `generated_-_bills.${file.originalname.split('.')[1]}`);
  },
});

function fileFilter(req, file, cb) {

  // Allowed ext
  const filetypes = /xlsx/;

  // Check ext
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  
  /*
    .xslx -  application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
    .xls - application/vnd.ms-excel
    .xlsm - application/vnd.ms-excel.sheet.macroEnabled.12
  */

  if(extname) {
    return cb(null, true);
  } else {
    cb("Error: Excel Files Only!");
  }
}

let upload;

try {
  upload = multer({
    storage,
    fileFilter,
  }).single("excel");
}
catch(error) {
  console.log('multer config error', error);
}

module.exports = upload;
