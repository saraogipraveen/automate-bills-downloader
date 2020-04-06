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

let errorOccured = false;
async function init(){
    try {
        !fs.existsSync(`downloads`) && fs.mkdirSync(`downloads`);
        const browser = await puppeteer.launch({ headless: true });
        await downloadBills(browser, '028657911455', '0345', 'jan, feb, mar, apr, may, jun, jul, aug, sep, oct, nov, dec');
    }
    catch (e) {
        console.log("inside catch block", e)
    }    
}

async function downloadBills(browser, consumer, unit, inputMonths) {
    try {
        months = inputMonths.split(/\W+/);
        console.log(months);
        const page = await browser.newPage();
        await page.goto('http://wss.mahadiscom.in/wss/wss_view_pay_bill.aspx');

        let output = await Promise.resolve([1])
        .then(each(async (temp) => {
            await page.on('dialog', async (dialog) => {
                console.log("inside dialog : ", dialog.message());
                res = await dialog.dismiss();
                throw Error('Invalid Captcha');
            });
            return temp;
        }));

        console.log(`output : ${output}`);

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
        // await page.keyboard.type('1234');

        await page.click('#lblSubmit');
        
        await page.waitForSelector('#billing_detail');

        await page.click('#billing_detail');
        
        await page.waitForSelector('#grdCustBillingDetails');

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

        let pages = [];
        let result = await Promise.resolve(await Promise.resolve(img_ids)
        .then(each(async (imgid) => {
            await downloadPdf(browser, page, imgid, consumer, pages);
            await pages[0].close();
            pages = [];
        })));

    } catch (error) {
        console.log(`error : ` , error.message, inputMonths);
        await downloadBills(browser, consumer, unit, inputMonths);
    }
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


async function downloadPdf(browser, page, imgid, consumer, pages) {
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
    // await newPage.close();
    pages.push(newPage);
}

init();