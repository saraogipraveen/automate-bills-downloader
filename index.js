const puppeteer = require('puppeteer')
const tesseract = require('node-tesseract')
const readFile = require('./readExcel')
const each = require('promise-each');
const fs = require('fs');

async function init(rows){
    try {
        if(rows)
        {
            !fs.existsSync(`downloads`) && fs.mkdirSync(`downloads`);
            rows.splice(0,1);
            rows.map(async (row) => {
                const browser = await puppeteer.launch({ headless: true });
                let [ consumer, unit, inputMonths ] = row;
                consumer = `0${consumer}`;
                unit = `${unit}`;
                if(unit.length == 3)
                    unit = `0${unit}`;
                inputMonths = inputMonths || 'jan';
                await downloadBills(browser, consumer, unit, inputMonths);
            })
        }
        return new Promise((resolve, reject) => {
            resolve(1);
        })
    }
    catch (e) {
        console.log("inside catch block", e)
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

async function downloadBills(browser, consumer, unit, inputMonths) {
    try {
        months = inputMonths.split(/\W+/);
        
        const page = await browser.newPage();
        await page.goto('http://wss.mahadiscom.in/wss/wss_view_pay_bill.aspx');

        await Promise.resolve([1])
        .then(each(async (temp) => {
            await page.on('dialog', async (dialog) => {
                console.log("inside dialog : ", await dialog.message());
                res = await dialog.dismiss();
                throw Error('Invalid Captcha');
            });
            return temp;
        }));

        const consumerEl = await page.$('#consumerNo');
        consumerEl.focus();
        await page.keyboard.type(consumer);

        const divEl = await page.$('#txtBUFilter');
        divEl.focus();
        await page.keyboard.type(unit);

        await page.keyboard.press('Tab');


        let captcha = await page.$('#captcha')
        await captcha.screenshot({ path: `${__dirname}/downloads/captcha.png` });
        const captcha_number = await readCaptchaNumber();
        console.log(`captcha number: ${captcha_number} \t typeof captcha : ${typeof captcha_number}`);
        let captchaField = await page.$('#txtInput')
        captchaField.focus();
        await page.keyboard.type(captcha_number);
        
        await page.click('#lblSubmit');
        
        await page.waitForSelector('#billing_detail');

        await page.click('#billing_detail');
        
        await page.waitForSelector('#grdCustBillingDetails');

        const img_ids = await page.evaluate((months) => {
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
            await downloadPdf(browser, page, imgid, consumer);
        })));
        await browser.close();
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
    // await printButtonContainer.click();
    await newPage.emulateMedia('print');
    let pdfOptions = {
        path: `${__dirname + `/downloads/${consumer}/`}${billMonth}.pdf`, 
        format: 'A4', 
        displayHeaderFooter: true
    }
    await newPage.pdf(pdfOptions);
    await newPage.close();
    // pages.push(newPage);
}

module.exports = { init, downloadBills };