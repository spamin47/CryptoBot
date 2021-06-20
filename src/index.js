
require('dotenv').config();
var Client = require('coinbase').Client;
const puppeteer = require('puppeteer-extra');
const AdblockerPlugin = require('puppeteer-extra-plugin-adblocker');
puppeteer.use(AdblockerPlugin());


var client = new Client({
                          'apiKey': 'API KEY',
                          'apiSecret': 'API SECRET',
                          strictSSL: false
                        });

client.getSpotPrice({'currencyPair': 'BTC-USD'}, function(err, data) {
  console.log(data);
});

var r_username = process.env.ROBBINHOOD_USER;
var r_pass = process.env.ROBBINHOOD_PASS;

var username = process.env.TRADINGVIEW_USER;
var password = process.env.TRADINGVIEW_PASS;

var wallet = 10; //cash
var amountTrading = 10; //amount to trade with


const scrape = async() => {
  //launch browser
  const browser = await puppeteer.launch({
      headless: true, // Sets browser visibility 
      //ignoreHTTPSErrors: true,
      userDataDir: "./user_data", //testing cookie save
      args: [`--window-size=${1280},${800}`] // new option
  });
  const page = await browser.newPage();
  //await page2.setViewport({ width: 800, height: 600 })
  await page.goto('https://www.tradingview.com/chart'); //goto url
  await page.waitForTimeout(2000);
  const page2 = await browser.newPage();        // open new tab
  
  //open Robinhood in new tab
  openRobinhood(page2);
  await page2.waitForTimeout(3000);

  
  // logInRobinhood(page2);
  // await page2.waitForTimeout(30000); //enough time to enter in sms verification code
  // await logPromise1;
  // await page2.waitForSelector('._2SOJcom0wr47t2LX78YQjj');

  // await page.waitForTimeout(60000);
  await page.waitForTimeout(3000);
  switchTab(page);
  await page.waitForTimeout(3000);

  //login to tradingview and navigate to chart
  // logInTradingView(page);

  // end of navigation
  // start of data retrieval

  // await page.waitForTimeout(3000);
  await page.waitForSelector(".valueValue-2KhwsEwE");
  let element = await page.$('.valueValue-2KhwsEwE');
  let value = await page.evaluate(el => el.textContent, element);

  const promise = new Promise(() => {
    
    runBot(page);
    
  });
  await promise;
  await browser.close();
}

function runBot(oldPage){
    const page = oldPage;
    setInterval(async () => {
      await page.mouse.move(320, 200);
      
      const [buyOrSell_Signal] = await page.$x('/html/body/div[2]/div[1]/div[2]/div[1]/div/table/tr[1]/td[2]/div/div[1]/div[2]/div[2]/div[2]/div[2]/div/div[10]/div');
      const value = await page.evaluate(name => name.innerText, buyOrSell_Signal); //buy or sell +1 = buy, -1 = sell
      const [atr_take_profit_1x] = await page.$x('/html/body/div[2]/div[1]/div[2]/div[1]/div/table/tr[1]/td[2]/div/div[1]/div[2]/div[2]/div[2]/div[2]/div/div[5]/div');
      const atr_1x = await page.evaluate(name => name.innerText, atr_take_profit_1x);
      const [atr_take_profit_1dot5x] = await page.$x('/html/body/div[2]/div[1]/div[2]/div[1]/div/table/tr[1]/td[2]/div/div[1]/div[2]/div[2]/div[2]/div[2]/div/div[7]/div');
      const atr_1dot5x = await page.evaluate(name => name.innerText, atr_take_profit_1dot5x);
      const [atr_take_profit_2x] = await page.$x('/html/body/div[2]/div[1]/div[2]/div[1]/div/table/tr[1]/td[2]/div/div[1]/div[2]/div[2]/div[2]/div[2]/div/div[16]/div');
      const atr_2x = await page.evaluate(name => name.innerText, atr_take_profit_2x);
      const [closing_price] = await page.$x('/html/body/div[2]/div[1]/div[2]/div[1]/div/table/tr[1]/td[2]/div/div[1]/div[1]/div[1]/div[2]/div/div[5]/div[2]'); //closing price
      const price = await page.evaluate(name => name.innerText, closing_price);
      const [dynamic_overbought] = await page.$x('/html/body/div[2]/div[1]/div[2]/div[1]/div/table/tr[3]/td[2]/div/div[1]/div/div[2]/div[2]/div[2]/div/div[5]/div');
      const dynamicOverboughtValue = await page.evaluate(name => name.innerText, dynamic_overbought);
      const [crsi] = await page.$x('/html/body/div[2]/div[1]/div[2]/div[1]/div/table/tr[3]/td[2]/div/div[1]/div/div[2]/div[2]/div[2]/div/div[7]/div');
      const CRSIValue = await page.evaluate(name => name.innerText, crsi);
      const static_overbought = 70;
      
      var now = new Date;
      var curMin = now.getMinutes();
      
      var data = new Object();
      data.value = value;
      data.price = price;
      data.atrValue_1x = atr_1x;
      data.atrValue_1dot5x = atr_1dot5x;
      data.atrValue_2x = atr_2x;
      data.dynamicOverboughtValue = dynamicOverboughtValue;
      data.CRSIValue = CRSIValue;
      data.minute = curMin;
      
      var dataJSON = JSON.stringify(data);
      console.log("{data: " + dataJSON + " }");

      if(value == 1){
        // buy(page, value));
      }else if(value == -1){
        // sell(page, value));
        const [amount] = await page.$x('/html/body/div[1]/main/div[3]/div/div/div/div/div/div/div/div[2]/div/div[1]/div[2]/form/div[1]/footer');
        //console.log(Date.getTime());
      }

    }, 1000);
}

function openRobinhood(oldPage)
{
  const page2 = oldPage; // open new tab
  (async function () {
    await page2.goto('https://robinhood.com/crypto/BTC');
    await page2.bringToFront(); 
    await page2.setViewport({ width: 1280, height: 800 })
  }());
  
}

//switch to tab
function switchTab(oldPage) {
  const page = oldPage;
  (async function () { 
    await page.bringToFront();
  }());
}

// async function logInTradingView(oldPage){
//   const page = oldPage;
//   await page.click(".tv-header__device-signin-icon"); // goto signin icon
//   await page.waitForTimeout(1000);
//   await page.click(".icon-2IihgTnv"); // click on signin button
//   await page.waitForTimeout(1000);
//   await page.click(".i-clearfix"); //goto signIn by email
//   await page.click(".tv-control-material-input__wrap"); //goto username
//   await page.keyboard.type(username); //enter text
//   await page.keyboard.press('Tab'); //goto password
//   await page.keyboard.type(password); //enter text
//   await page.keyboard.press('Enter');
//   await page.waitForTimeout(60000);
//   await page.goto('https://www.tradingview.com/chart'); //goto chart
// }

// async function logInRobinhood(oldPage){
//   const page = oldPage;
//   await page.waitForTimeout(1000);
//   await page.click(".css-1pafvdo-InternalInput");//css-1pafvdo-InternalInput
//   await page.keyboard.type(r_username);
//   await page.keyboard.press('Tab');
//   await page.keyboard.type(r_pass);
//   await page.keyboard.press('Enter');
//   await page.waitForTimeout(30000);
//   await page.goto("https://robinhood.com/crypto/BTC");
//   await page.waitForTimeout(2000);
// }

async function buy(oldPage, amount){
  const page = oldPage;
  const thisAmount = amount;
  //click on "buy tab"
  const [button] = await page.$x("/html/body/div[1]/main/div[3]/div/div/div/div/div/div/div/div[2]/div/div[1]/div[2]/form/div[1]/header/div/div[1]/div/div[1]/div/h3/span/div");
  if (button) { 
    await button.click();
  }
  await page.click('._2SOJcom0wr47t2LX78YQjj');//_2SOJcom0wr47t2LX78YQjj
  await page.keyboard.type(thisAmount.toString());
  
}
async function sell(oldPage){
  const page = oldPage;
  const thisAmount = amount;
  //click on "sell tab"
  const [button] = await page.$x("/html/body/div[1]/main/div[3]/div/div/div/div/div/div/div/div[2]/div/div[1]/div[2]/form/div[1]/header/div/div[1]/div/div[2]/div/h3/span/div/span");
  if (button) { 
    await button.click();
  }
  await page.click('._2SOJcom0wr47t2LX78YQjj');//_2SOJcom0wr47t2LX78YQjj
  console.log(thisAmount.toString());
  await page.keyboard.type(thisAmount.toString());
}

scrape();