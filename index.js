const puppeteer = require('puppeteer')
const tesseract = require('node-tesseract')
const readFile = require('./readExcel')
const each = require('promise-each');
const fs = require('fs');

// getInput();
async function getInput() {
    let consumerList = await readFile();
    for (let c of consumerList) {
        const doneConsumer = await downloadBills(c.consumer, c.unit)
    }
}

async function init(){
    try {
        !fs.existsSync(`downloads`) && fs.mkdirSync(`downloads`);
        await downloadBills('028657911455', '0345', 'jan, feb');
    }
    catch (e) {
        console.log("inside catch block", e)
    }    
}

async function downloadBills(consumer, unit, months) {
    months = months.split(/\W+/);
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto('http://wss.mahadiscom.in/wss/wss_view_pay_bill.aspx');

    await page.on('dialog',  dialog => {
        console.log("inside dialog", dialog.message());
        //  dialog.dismiss();
        browser.close();
        return;
    });

    const consumerEl = await page.$('#consumerNo');
    consumerEl.focus();
    await page.keyboard.type('028657911455');

    const divEl = await page.$('#txtBUFilter');
    divEl.focus();
    await page.keyboard.type('0345');

    await page.keyboard.press('Tab');


    let captcha = await page.$('#captcha')
    await captcha.screenshot({ path: `${__dirname}/downloads/captcha.png` });
    const captcha_number = await readCaptchaNumber();
    console.log(`captcha number: ${captcha_number}`);
    let captchaField = await page.$('#txtInput')
    captchaField.focus();
    await page.keyboard.type(captcha_number);

    await page.click('#lblSubmit');
    
    await page.waitForSelector('#billing_detail')

    await page.click('#billing_detail');
    await page.waitForSelector('#grdCustBillingDetails')

    const img_ids = await page.evaluate((months) => {
        console.log("downloadBills -> months", months)
        let trs = Array.from(document.querySelectorAll('#grdCustBillingDetails tr'))
        const ids = []
        for (let m of months) {
            trs.map((tr) => {
                let td = tr.querySelectorAll('td')
                if (td.length && td[0].innerText.toLowerCase().indexOf(m) > -1) {
                    ids.push(`#${td[6].children[1].id}`);
                }
            })
        }
        return ids;
    }, months);
    console.log("downloadBills -> img_ids", img_ids)

    await Promise.resolve(await Promise.resolve(img_ids)
    .then(each(async (imgid) => {
       await downloadPdf(browser, page, imgid, consumer, unit);
    })));
}

function readCaptchaNumber() {
    return new Promise((resolve, reject) => {
        tesseract.process(`${__dirname}/downloads/captcha.png`, function (err, text) {
            if (err) {
                reject(err);
            } else {
                resolve(text.trim().substr(0, 4));
            }
        });
    })
}


async function downloadPdf(browser, page, imgid, consumer) {
    !fs.existsSync(`${__dirname}/downloads/${consumer}`) && fs.mkdirSync(`${__dirname}/downloads/${consumer}`);

    let downloadButton = await page.$(imgid);        

    await downloadButton.click();

    const pageTarget = await page.target(); //save this to know that this was the opener
    const newTarget = await browser.waitForTarget(target => {
        return target.opener() === pageTarget
    });

    const newPage = await newTarget.page(); 

    await newPage.waitForSelector("#billMonth"); //wait for page to be loaded
    let billMonth = await newPage.evaluate(() => {
        return document.getElementById('billMonth').innerText;
    })
    console.log('bill_month : ' + billMonth);
    const printButtonContainer = await newPage.$('.printButtonContainer button')
    await printButtonContainer.click();
    await newPage.emulateMedia('print');
    let pdfOptions = {
        path: `${__dirname + `/downloads/${consumer}/`}${billMonth}.pdf`, 
        format: 'A4', 
        displayHeaderFooter: true
    }
    await newPage.pdf(pdfOptions);
    await newPage.close();
    await setTimeout(async () => {
        console.log(`${billMonth} done !!!`);
    }, 10);
}

init();