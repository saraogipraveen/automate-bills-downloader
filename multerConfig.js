const multer = require("multer");
const path = require("path");

var storage = multer.diskStorage({
  // destination: "./uploads",
  destination: ".",
  filename: function (req, file, cb) {
    cb(null, `bills.${file.originalname.split('.')[1]}`);
    // cb(null, file.originalname);
  },
});

function fileFilter(req, file, cb) {

  console.log('multer file : ', file);

  // Allowed ext
  const filetypes = /xlsx|xls|xlsm/;

  // Check ext
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  // Check mime
  // const mimetype = filetypes.test(file.mimetype);

  // if (mimetype && extname) {
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
