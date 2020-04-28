const puppeteer = require("puppeteer");
const tesseract = require("node-tesseract");
const each = require("promise-each");
const fs = require("fs");
let io = null;
let socket = null;
const EventEmitter = require("events");
let errorMessage = null;
let excelObj = null;
let myEventEmitter = new EventEmitter();
let currentMonth = null;

myEventEmitter.on("pdf-generated", (label, customer) => {
  console.info(`pdf generated for month ${label} for customer : ${customer}`);
});

async function setupExcelError(inputExcelObj){
  return new Promise((resolve,reject) => {
    excelObj = inputExcelObj;
    resolve();
  })
}

async function initBrowser() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox"],
  });
  browser.on("disconnected", initBrowser);
  return browser;
}

async function init(rows, browser, ioInstance, socketInstance) {
  try {
    io = ioInstance;
    socket = socketInstance;
    if (rows) {
      fs.mkdirSync("downloads", { recursive: true });
      rows.splice(0, 1);
      Promise.resolve(
        await Promise.resolve(rows).then(
          each(async (row) => {
            console.log(`for row: ${row}`);
            let [consumer, unit, inputMonths] = row;
            consumer = `${consumer}`;
            if (consumer.length == 11) consumer = `0${consumer}`;
            unit = `${unit}`;
            if (unit.length == 3) unit = `0${unit}`;
            if (!inputMonths) {
              excelObj.data = excelObj.data + `${consumer}\t${unit}\n`
              socket.emit(
                "pdf-error",
                `please provide months detail to download pdf for consumer ${consumer}`
              );
            } else await downloadBills(browser, consumer, unit, inputMonths);
          })
        )
      );
    }
    return new Promise((resolve, reject) => {
      resolve(1);
    });
  } catch (error) {}
}

async function enterUnit(page, unit) {
  return new Promise(async (resolve, reject) => {
    const divEl = await page.$("#txtBUFilter");
    divEl.focus();
    await page.keyboard.type(unit);
    resolve();
  });
}

function readCaptchaNumber() {
  return new Promise((resolve, reject) => {
    tesseract.process(`${__dirname}/captcha.png`, function (err, text) {
      if (err) {
        reject(err);
      } else {
        resolve(text.trim().substr(0, 4));
      }
    });
  });
}

async function downloadBills(browser, consumer, unit, inputMonths) {
  try {
    months = inputMonths.trim().split(/\W+/);
    months = months.map((month) => month.toLowerCase());
    const page = await browser.newPage();
    await page.goto("http://wss.mahadiscom.in/wss/wss_view_pay_bill.aspx", {
      waitUntil: "networkidle2",
    });

    await page.on("dialog", async (dialog) => {
      console.log("inside dialog : ", await dialog.message());
      errorMessage = await dialog.message().trim();
      await dialog.dismiss();
    });

    await page.evaluate((consumer) => {
      document.querySelector("#consumerNo").value = consumer;
    }, consumer);

    await enterUnit(page, unit);

    await page.keyboard.press("Tab");

    let captcha = await page.$("#captcha");
    await captcha.screenshot({ path: `${__dirname}/captcha.png` });
    const captcha_number = await readCaptchaNumber();

    await page.evaluate((captcha_number) => {
      document.querySelector("#txtInput").value = captcha_number;
    }, captcha_number);

    await page.click("#lblSubmit");

    await page.waitForSelector("#billing_detail");

    await page.click("#billing_detail");

    await page.waitForSelector("#grdCustBillingDetails");

    const output = await page.evaluate((months) => {
      let trs = Array.from(
        document.querySelectorAll("#grdCustBillingDetails tr")
      );
      const ids = [];
      const generatedMonths = [];
      for (let m of months) {
        trs.map((tr) => {
          let td = tr.querySelectorAll("td");
          if (td.length && td[0].innerText.toLowerCase().indexOf(m) > -1) {
            ids.push(`#${td[6].children[1].id}`);
            generatedMonths.push(m);
          }
        });
      }
      return [ids, generatedMonths];
    }, months);
    const [img_ids, outputMonths] = output;
    console.log(outputMonths);
    months.map((month) => {
      if (!outputMonths.includes(month))
      {
        excelObj.data = excelObj.data + `${consumer}\t${unit}\n`
        socket.emit(
          "pdf-error",
          `Record for ${month} doesn't exists for consumer ${consumer}`
        );
      }
    });
    await Promise.resolve(
      await Promise.resolve(img_ids).then(
        each(async (imgid, index) => {
          currentMonth = outputMonths[index];
          await downloadPdf(browser, page, imgid, consumer);
        })
      )
    );
  } catch (error) {
    console.log(`error occurred : `, error.message);
    if (
      errorMessage == "Error occured while getting Latest Bill Report" ||
      errorMessage == "Invalid Captcha" ||
      errorMessage == "Enter Captcha First"
    ) {
      errorMessage = null;
      await downloadBills(browser, consumer, unit, inputMonths);
    } else {
      excelObj.data = excelObj.data + `${consumer}\t${unit}\t${currentMonth}\n`
      currentMonth = null;
      socket.emit(
        "pdf-error",
        `some error occurred while downloading pdf for consumer ${consumer}`
      );
    }
  }
}

function readCaptchaNumber() {
  return new Promise((resolve, reject) => {
    tesseract.process(`${__dirname}/captcha.png`, function (err, text) {
      if (err) {
        reject(err);
      } else {
        resolve(text.trim().substr(0, 4));
      }
    });
  });
}

async function downloadPdf(browser, page, imgid, consumer) {
  let downloadButton = await page.$(imgid);

  await downloadButton.click();

  const pageTarget = await page.target(); //save this to know that this was the opener
  const newTarget = await browser.waitForTarget((target) => {
    return target.opener() === pageTarget;
  });

  const newPage = await newTarget.page();

  await newPage.waitForSelector("#billMonth"); //wait for page to be loaded
  let billMonth = await newPage.evaluate(() => {
    return document.getElementById("billMonth").innerText;
  });

  await newPage.$(".printButtonContainer button");

  await newPage.emulateMedia("print");
  let pdfOptions = {
    path: `${__dirname + `/downloads/${consumer}_`}${billMonth}.pdf`,
    format: "A4",
    displayHeaderFooter: true,
  };

  await newPage.waitFor(500);
  await newPage.pdf(pdfOptions);
  myEventEmitter.emit("pdf-generated", billMonth, consumer);
  socket.emit("pdf-generated", { billMonth, consumer });
  await newPage.close();
}

module.exports = { init, initBrowser, setupExcelError };
