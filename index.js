const puppeteer = require('puppeteer');

const inputData = [
    { cno: 170688856348, div: 4636 },
    { cno: 170688851621, div: 4636 },
    { cno: 170688861384, div: 4636 },
    { cno: 170688858995, div: 4636 },
    { cno: 170688852041, div: 4636 },
    { cno: 170688852075, div: 4636 },
    { cno: 170688859011, div: 4636 },
    { cno: 170675839380, div: 4636 },
    { cno: 170688851648, div: 4636 },
    { cno: 170688856313, div: 4636 },
    { cno: 170688859029, div: 4636 },
    { cno: 170688852059, div: 4636 }
]

async function getForm() {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    await page.goto('http://wss.mahadiscom.in/wss/wss_view_pay_bill.aspx');
    await page.waitFor(1000);
    await page.$eval('#consumerNo', el => el.value = 170688856348);
    const divEl = await page.$('#txtBUFilter');
    divEl.focus();
    await page.keyboard.type('4636');
    await page.keyboard.press('Tab');

    let captchaField = await page.$('#txtInput')
    captchaField.focus();




    // read captcha and enter type into the field

//     await page.waitForFunction('document.getElementById("txtInput").value.length == 4');

//     await page.click('#lblSubmit');
//     await page.click('#Img1');
//     await page.waitFor(1000);
//     await page.waitForSelector("#lbllTitle");
//     const label = await page.$("#lbllTitle")
//     const strong = (await label.$x('..'))[0]; // Element Parent
//     const anchor = (await strong.$x('..'))[0]; // Element Parent
//     anchor.click()

//     const pageTarget = page.target(); //save this to know that this was the opener
//     const newTarget = await browser.waitForTarget(target => {
//         return target.opener() === pageTarget
//     }); //check that you opened this page, rather than just checking the url
//     const newPage = await newTarget.page(); //get the page object
//     await newPage.waitForSelector("body"); //wait for page to be loaded
//     const btnContainer = await newPage.$('.printButtonContainer button')
//     btnContainer.click()
//     await newPage.pdf({path: 'page.pdf'});

//     // await browser.close();
}

getForm();


// var tesseract = require('node-tesseract');

// // Recognize text of any language in any format
// tesseract.process(__dirname + '/captcha.png',function(err, text) {
// 	if(err) {
// 		console.error(err);
// 	} else {
// 		console.log(text);
// 	}
// });

