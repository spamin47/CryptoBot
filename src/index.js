
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
      headless: false, // Sets browser visibility 
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

  // await page.waitForTimeout(60000);
  //await page.waitForTimeout(1000);
  switchTab(page);

  //login to tradingview and navigate to chart
  // logInTradingView(page);

  await page.waitForSelector(".valueValue-2KhwsEwE");
  let element = await page.$('.valueValue-2KhwsEwE');
  let value = await page.evaluate(el => el.textContent, element);

  // start of data retrieval
  const promise = new Promise(() => {
    
    runBot(page);
    
  });
  await promise;
  await browser.close();
}

function runBot(oldPage){
    const page = oldPage;
    //locks
    var inTrade = false;
    var cRSI_Sell = true;
    var atr1x_Sell = true;
    var atr1dot5x_Sell = true;
    var atr2x_Sell = true;
    //take profit atr: variables used for saving atr's after receiving a buy signal
    var atr_1x_TP;
    var atr_1dot5x_TP
    var atr_2x_TP;

    setInterval(async () => {
      await page.mouse.move(650, 200);
      
      //collect data
      var now = new Date();
      var curMin = now.getMinutes();
      var curSec = now.getSeconds();
      const [buyOrSell_Signal] = await page.$x('/html/body/div[2]/div[1]/div[2]/div[1]/div/table/tr[1]/td[2]/div/div[1]/div[2]/div[2]/div[2]/div[2]/div/div[10]/div');
      const buyOrSell = 
        String(await page.evaluate(name => name.innerText, buyOrSell_Signal)).length; //buy or sell 1.00 = buy, -1.00 = sell; Buy: 4, Sell: 5;
      const [atr_take_profit_1x] = await page.$x('/html/body/div[2]/div[1]/div[2]/div[1]/div/table/tr[1]/td[2]/div/div[1]/div[2]/div[2]/div[2]/div[2]/div/div[5]/div');
      const atr_1x = parseFloat(await page.evaluate(name => name.innerText, atr_take_profit_1x));
      const [atr_take_profit_1dot5x] = await page.$x('/html/body/div[2]/div[1]/div[2]/div[1]/div/table/tr[1]/td[2]/div/div[1]/div[2]/div[2]/div[2]/div[2]/div/div[7]/div');
      const atr_1dot5x = parseFloat(await page.evaluate(name => name.innerText, atr_take_profit_1dot5x));
      const [atr_take_profit_2x] = await page.$x('/html/body/div[2]/div[1]/div[2]/div[1]/div/table/tr[1]/td[2]/div/div[1]/div[2]/div[2]/div[2]/div[2]/div/div[16]/div');
      const atr_2x = parseFloat(await page.evaluate(name => name.innerText, atr_take_profit_2x));
      const [closing_price] = await page.$x('/html/body/div[2]/div[1]/div[2]/div[1]/div/table/tr[1]/td[2]/div/div[1]/div[1]/div[1]/div[2]/div/div[5]/div[2]'); //closing price
      const price = parseFloat(await page.evaluate(name => name.innerText, closing_price));
      const [dynamic_overbought] = await page.$x('/html/body/div[2]/div[1]/div[2]/div[1]/div/table/tr[3]/td[2]/div/div[1]/div/div[2]/div[2]/div[2]/div/div[5]/div');
      const dynamicOverboughtValue = parseFloat(await page.evaluate(name => name.innerText, dynamic_overbought));
      const [crsi] = await page.$x('/html/body/div[2]/div[1]/div[2]/div[1]/div/table/tr[3]/td[2]/div/div[1]/div/div[2]/div[2]/div[2]/div/div[7]/div');
      const CRSIValue = parseFloat(await page.evaluate(name => name.innerText, crsi));
      const static_overbought = 70;

      //compress data in JSON format
      var data = new Object();
      data.buyOrSell = buyOrSell;
      data.price = price;
      data.atrValue_1x = atr_1x;
      data.atrValue_1dot5x = atr_1dot5x;
      data.atrValue_2x = atr_2x;
      data.dynamicOverboughtValue = dynamicOverboughtValue;
      data.CRSIValue = CRSIValue;
      data.minute = curMin;
      data.sec = curSec;

      var dataJSON = JSON.stringify(data);
      console.log("{data: " + dataJSON + " }");
      //console.log(String(buyOrSell) +" length: " + String(buyOrSell).length);
      if(curSec == 0){
        
        //buy
        if(buyOrSell == 4 && !inTrade){
          //unlocks take profit conditions
          inTrade = true;
          cRSI_Sell = true;
          atr1x_Sell = true;
          atr1dot5x_Sell = true;
          atr2x_Sell = true;
          //save atr for taking profits
          atr_1x_TP = atr_1x;
          atr_1dot5x_TP = atr_1dot5x;
          atr_2x_TP = atr_2x;

          if(CRSIValue >= dynamicOverboughtValue && CRSIValue >= static_overbought){
            cRSI_Sell = false;
          }
          console.log("buy at " + now.getHours() + ":" + curMin + ":" + curSec);
          // buy(page, value));
        }
          
        //sell
        if(inTrade){
          if(buyOrSell == 5 || (CRSIValue >= dynamicOverboughtValue && CRSIValue >= static_overbought && price >= atr_2x)){ //extreme sell signal: sell all
            inTrade = false;
            console.log("sell at " + now.getHours() + ":" + curMin + ":" + curSec);
            // sell(page, value));
          }else if(CRSIValue >= dynamicOverboughtValue && CRSIValue >= static_overbought && cRSI_Sell){//very hard sell signal
            cRSI_Sell = false;

          }else if(price >= atr_2x_TP && atr2x_Sell){//hard sell signal
            atr2x_Sell = false;
          }else if(price >= atr_1dot5x_TP && atr1dot5x_Sell){ //medium sell signal
            atr1dot5x_Sell = false;
          }else if(price >= atr_1x_TP && atr1x_Sell){ //light sell signal
            atr1x_Sell = false;
          }
        }
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