const puppeteer = require('puppeteer')
const tesseract = require('node-tesseract')
const readFile = require('./readExcel')


// getInput();
async function getInput() {
    let consumerList = await readFile();
    for (let c of consumerList) {
        const doneConsumer = await downloadBills(c.consumer, c.unit)
    }
}
try {
    downloadBills('028657911455', '0345', 'apr,may')
    console.log('we are here')
}
catch (e) {
    console.log("inside catch block", e)
}

async function downloadBills(consumer, unit, months) {

    months = months.split(',')
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto('http://wss.mahadiscom.in/wss/wss_view_pay_bill.aspx');

    page.on('dialog',  dialog => {
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
    await captcha.screenshot({ path: 'cc.png' });
    const captcha_number = await readCaptchaNumber();
    let captchaField = await page.$('#txtInput')
    captchaField.focus();
    await page.keyboard.type('2434');

    await page.click('#lblSubmit');
    console.log('this should not execute')


    await page.waitForSelector('#billing_detail')

    // await page.click('#billing_detail');
    // await page.waitForSelector('#grdCustBillingDetails')

    // const img_ids = await page.evaluate((months) => {
    //     console.log("downloadBills -> months", months)
    //     let trs = Array.from(document.querySelectorAll('#grdCustBillingDetails tr'))
    //     const ids = []
    //     for (let m of months) {
    //         trs.map((tr) => {
    //             let td = tr.querySelectorAll('td')
    //             if (td.length && td[0].innerText.toLowerCase().indexOf(m) > -1) {
    //                 ids.push(td[6].children[0].id)
    //             }
    //         })
    //     }
    //     return ids;
    // }, months);
    // console.log("downloadBills -> img_ids", img_ids)



    // go to history
    // fetch mentioned month bills


    // await page.click('#Img1');

    // await page.waitForSelector("#lbllTitle");
    // const label = await page.$("#lbllTitle")
    // const strong = (await label.$x('..'))[0]; // Element Parent
    // const anchor = (await strong.$x('..'))[0]; // Element Parent
    // anchor.click()

    // const pageTarget = page.target(); //save this to know that this was the opener
    // const newTarget = await browser.waitForTarget(target => {
    //     return target.opener() === pageTarget
    // }); //check that you opened this page, rather than just checking the url

    // const newPage = await newTarget.page(); //get the page object
    // await newPage.waitForSelector("body"); //wait for page to be loaded
    // const btnContainer = await newPage.$('.printButtonContainer button')
    // btnContainer.click()
    // await newPage.emulateMedia('screen');
    // await newPage.pdf({ path: `${consumer}-${unit}.pdf` });
    await browser.close();


}

function readCaptchaNumber() {
    return new Promise((resolve, reject) => {
        tesseract.process(__dirname + '/cc.png', function (err, text) {
            if (err) {
                reject(err);
            } else {
                resolve(text.trim().substr(0, 4));
            }
        });
    })
}




