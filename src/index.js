
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
      headless: false, // The browser is visible
      //ignoreHTTPSErrors: true,
      args: [`--window-size=${1280},${800}`] // new option
  });
  const page = await browser.newPage();
  //await page2.setViewport({ width: 800, height: 600 })
  await page.goto('https://www.tradingview.com/'); //goto url
  await page.waitForTimeout(2000);
  const page2 = await browser.newPage();        // open new tab
  
  //open Robinhood in new tab
  openRobinhood(page2);
  await page2.waitForTimeout(3000);

  
  logInRobinhood(page2);
  await page2.waitForTimeout(30000);
  // await logPromise1;
  await page2.waitForSelector('._2SOJcom0wr47t2LX78YQjj');

  buy(page2, 1.50);
  await page.waitForTimeout(1000000);
  switchTab(page);
  await page.waitForTimeout(2000);

  //login to tradingview and navigate to chart
  logInTradingView(page);

  // end of navigation
  // start of data retrieval
  
  await page.waitForTimeout(2000);
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
      await page.mouse.move(300,350);
      const [getXpath] = await page.$x('/html/body/div[2]/div[1]/div[2]/div[1]/div/table/tr[1]/td[2]/div/div[1]/div[2]/div[2]/div[2]/div[2]/div/div[10]/div');
      const value = await page.evaluate(name => name.innerText, getXpath); //buy or sell +1 = buy, -1 = sell
      console.log("value: " + value);
      if(value == 1){
        // buy(page, value));
      }else if(value == -1){
        // sell(page, value));
      }
      
    }, 15000);
}

function openRobinhood(oldPage)
{
  const page2 = oldPage; // open new tab
  (async function () {
    await page2.goto('https://robinhood.com/login');
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

function blockingWait(seconds){
  //simple blocking technique (wait...)
  var waitTill = new Date(new Date().getTime() + seconds * 1000);
  while(waitTill > new Date()){}
}

async function logInTradingView(oldPage){
  const page = oldPage;
  await page.click(".tv-header__device-signin-icon"); // goto signin icon
  await page.waitForTimeout(1000);
  await page.click(".icon-2IihgTnv"); // click on signin button
  await page.waitForTimeout(1000);
  await page.click(".i-clearfix"); //goto signIn by email
  await page.click(".tv-control-material-input__wrap"); //goto username
  await page.keyboard.type(username); //enter text
  await page.keyboard.press('Tab'); //goto password
  await page.keyboard.type(password); //enter text
  await page.keyboard.press('Enter');
  await page.waitForTimeout(2000);
  await page.goto('https://www.tradingview.com/chart'); //goto chart
}

async function logInRobinhood(oldPage){
  const page = oldPage;
  await page.click(".css-1pafvdo-InternalInput");
  await page.keyboard.type(r_username);
  await page.keyboard.press('Tab');
  await page.keyboard.type(r_pass);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(30000);
  await page.goto("https://robinhood.com/crypto/BTC");
  await page.waitForTimeout(2000);
}

async function buy(oldPage, amount){
  const page = oldPage;
  const thisAmount = amount;
  //click on "buy tab"
  const [button] = await page.$x("/html/body/div[1]/main/div[3]/div/div/div/div/div/div/div/div[2]/div/div[1]/div[2]/form/div[1]/header/div/div[1]/div/div[1]/div/h3/span/div");
  if (button) { 
    await button.click();
  }
  await page.click('._2SOJcom0wr47t2LX78YQjj');//_2SOJcom0wr47t2LX78YQjj
  await page.keyboard.type(amount.toString());
  
}
async function sell(oldPage, amount){
  const page = oldPage;
  const thisAmount = amount;
  //click on "sell tab"
  const [button] = await page.$x("/html/body/div[1]/main/div[3]/div/div/div/div/div/div/div/div[2]/div/div[1]/div[2]/form/div[1]/header/div/div[1]/div/div[2]/div/h3/span/div/span");
  if (button) { 
    await button.click();
  }
  await page.click('._2SOJcom0wr47t2LX78YQjj');//_2SOJcom0wr47t2LX78YQjj
  console.log(amount.toString());
  await page.keyboard.type(amount.toString());
  
}

scrape();