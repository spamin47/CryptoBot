
require('dotenv').config();
const puppeteer = require('puppeteer-extra');
const AdblockerPlugin = require('puppeteer-extra-plugin-adblocker');
puppeteer.use(AdblockerPlugin());

var r_username = process.env.ROBBINHOOD_USER;
var r_pass = process.env.ROBBINHOOD_PASS;

var username = process.env.TRADINGVIEW_USER;
var password = process.env.TRADINGVIEW_PASS;

var wallet = 100.00; //cash in USD
var amountTrading = 10; //amount to trade with


const scrape = async() => {
  //launch browser
  console.log("Running...");
  console.log("Launching Browser Instance...");
  const browser = await puppeteer.launch({
      headless: false, // Sets browser visibility 
      //ignoreHTTPSErrors: true,
      userDataDir: "./user_data", //testing cookie save
      args: [`--window-size=${1280},${800}`] // new option
  });
  const page = await browser.newPage();
  //await page2.setViewport({ width: 800, height: 600 })
  console.log("Opening TradingView Window...");
  await page.goto('https://www.tradingview.com/chart'); //goto url
  await page.waitForTimeout(2000);
  const page2 = await browser.newPage();        // open new tab
  
  //open Robinhood in new tab
  console.log("Opening RobbinHood Window...");
  openRobinhood(page2);

  await page2.waitForTimeout(2000);
  // logInRobinhood(page2);
  // await page2.waitForTimeout(30000); //enough time to enter in sms verification code
  switchTab(page);

  //login to tradingview and navigate to chart
  // logInTradingew(page);
  console.log("Initializing Algorithm Bot...");
  await page.waitForSelector(".valueValue-2KhwsEwE");
  let element = await page.$('.valueValue-2KhwsEwE');
  let value = await page.evaluate(el => el.textContent, element);

  // start of data retrieval
  console.log("Bot running...");
  const promise = new Promise(() => {
    
    runBot(page, page2);
    
  });
  await promise;
  await browser.close();
}

function runBot(chartPage, brokerPage){
    const page = chartPage;
    const page2 = brokerPage;
    
    //locks
    var inTrade = false;
    var inTrade_ATR = false;
    var cRSI_Sell = true;
    var atr1x_Sell = true;
    var atr1dot5x_Sell = true;
    var atr2x_Sell = true;
    var started_below_riskATR_Bottom_value = false;
    //take profit atr: variables used for saving atr's after receiving a buy signal
    var atr_1x_TP;
    var atr_1dot5x_TP
    var atr_2x_TP;
    // price target percentages
    var atr1x_percent = 0.40;
    var atr1dot5x_percent = 0.50;
    var atr2x_percent = 0.60;
    var CRSI_percent = 0.70;

    var botInterval = setInterval(async () => {
      await page.mouse.move(565, 200);

      //collect data
      var now = new Date();
      var curDay = now.getDay();
      var curHour = now.getHours();
      var curMin = now.getMinutes();
      var curSec = now.getSeconds();
      //var curMiliSec = now.getMilliseconds();
      var buyPrice = 0;

      if(curSec == 59){
        await page.waitForTimeout(700);
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
        const [riskATR_Top] = await page.$x('/html/body/div[2]/div[1]/div[2]/div[1]/div/table/tr[1]/td[2]/div/div[1]/div[2]/div[2]/div[2]/div[2]/div/div[2]/div');
        const riskATR_Top_Value = parseFloat(await page.evaluate(name => name.innerText, riskATR_Top));
        const [riskATR_Bottom] = await page.$x('/html/body/div[2]/div[1]/div[2]/div[1]/div/table/tr[1]/td[2]/div/div[1]/div[2]/div[2]/div[2]/div[2]/div/div[3]/div');
        const riskATR_Bottom_Value = parseFloat(await page.evaluate(name => name.innerText, riskATR_Bottom));
        const static_overbought = 70;
        await page.keyboard.press('ArrowLeft');
        const [prevBuyOrSell_Signal] = await page.$x('/html/body/div[2]/div[1]/div[2]/div[1]/div/table/tr[1]/td[2]/div/div[1]/div[2]/div[2]/div[2]/div[2]/div/div[10]/div');
        const prevBuyOrSell_Signal_Value = 
          String(await page.evaluate(name => name.innerText, prevBuyOrSell_Signal)).length;
        await page.keyboard.press('ArrowRight');
        
        
        //compress data in JSON format
        var data = new Object();
        data.buyOrSell = buyOrSell;
        data.prevBuyOrSell = prevBuyOrSell_Signal_Value;
        data.price = price;
        data.atrValue_1x = atr_1x;
        data.atrValue_1dot5x = atr_1dot5x;
        data.atrValue_2x = atr_2x;
        data.riskATR_T = riskATR_Top_Value;
        data.riskATR_B = riskATR_Bottom_Value;
        data.dynamicOverboughtValue = dynamicOverboughtValue;
        data.CRSIValue = CRSIValue;
        data.minute = curMin;
        data.sec = curSec;
        
        var dataJSON = JSON.stringify(data);
        console.log(`{data: ${dataJSON} }`);

        //buy
        if((buyOrSell == 4 || prevBuyOrSell_Signal_Value == 4) && !inTrade && !inTrade_ATR){ //if not any trade and given buy signal, buy
          switchTab(page2);
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

          //Overbought ATR trade: take profit as soon as possible
          if(price >= riskATR_Top_Value){
            console.log("Entering high risk trade (above ATR)...");
            inTrade = false;
            inTrade_ATR = true;
          }
          //bought below riskATR bottom value
          if(price <= riskATR_Bottom_Value){
            started_below_riskATR_Bottom_value = true;
          }
          else{
            started_below_riskATR_Bottom_value = false;
          }
          
          if(CRSIValue >= dynamicOverboughtValue && CRSIValue >= static_overbought){
            cRSI_Sell = false;
          }
          console.log("buy at " + now.getHours() + ":" + curMin + ":" + curSec);
          buyPrice = price;
          let buyingBoi = await buy(page2, 1, buyPrice);
          if(!buyingBoi){
            inTrade = false;
            inTrade_ATR = false;
          }else{
            console.log(`Bought: ${buyingBoi}`);
          }
          switchTab(page);
        }
          
        //sell
        if(inTrade){
          switchTab(page2);
          let crsiSellSignal = (CRSIValue >= dynamicOverboughtValue && CRSIValue >= static_overbought);

          if(buyOrSell == 5 || prevBuyOrSell_Signal_Value === 5 ||
            (crsiSellSignal && price >= atr_2x_TP)){ //extreme sell signal: sell all
            inTrade = false;
            console.log("sell all " + now.getHours() + ":" + curMin + ":" + curSec);
            let sellingBoi = await sell(page2, 1);
            console.log(`Sold: ${sellingBoi}`);
          }else if(price <= riskATR_Bottom_Value && !started_below_riskATR_Bottom_value){
            inTrade = false;
            console.log("sell all at " + now.getHours() + ":" + curMin + ":" + curSec + ", reason: below riskATR");
            let sellingBoi = await sell(page2, 1);
            console.log(`Sold: ${sellingBoi}`);
          }else if(crsiSellSignal && cRSI_Sell){//very hard sell signal
            cRSI_Sell = false;
            console.log("cRSI sell at " + now.getHours() + ":" + curMin + ":" + curSec);
            let sellingBoi = await sell(page2, CRSI_percent);
            console.log(`Sold: ${sellingBoi}`);
          }else if(price >= atr_2x_TP && atr2x_Sell){//hard sell signal
            atr2x_Sell = false;
            console.log("atr2x sell at " + now.getHours() + ":" + curMin + ":" + curSec);
            let sellingBoi = await sell(page2, atr2x_percent);
            console.log(`Sold: ${sellingBoi}`);
          }else if(price >= atr_1dot5x_TP && atr1dot5x_Sell){ //medium sell signal
            atr1dot5x_Sell = false;
            atr1x_Sell = false;
            console.log("atr1.5x sell at " + now.getHours() + ":" + curMin + ":" + curSec);
            let sellingBoi = await sell(page2, atr1dot5x_percent);
            console.log(`Sold: ${sellingBoi}`);
          }else if(price >= atr_1x_TP && atr1x_Sell){ //light sell signal
            atr1x_Sell = false;
            console.log("atr1x sell at " + now.getHours() + ":" + curMin + ":" + curSec);
            let sellingBoi = await sell(page2,atr1x_percent);
            console.log(`Sold: ${sellingBoi}`);
          }
          switchTab(page);
        }

        if(inTrade_ATR){
          switchTab(page2);
          let crsiSellSignal = (CRSIValue >= dynamicOverboughtValue && CRSIValue >= static_overbought);
          if(price > buyPrice){
            inTrade_ATR = false;
            inTrade = false;
            console.log("sell all " + now.getHours() + ":" + curMin + ":" + curSec);
            let sellingBoi = await sell(page2,1);
            console.log(`Sold: ${sellingBoi}`);
          }if(buyOrSell == 5 || prevBuyOrSell_Signal_Value === 5 ||
            (crsiSellSignal && price >= atr_2x_TP) ||price <= riskATR_Bottom_Value){ //extreme sell signal: sell all
            inTrade_ATR = false;
            inTrade = false;
            console.log("sell all " + now.getHours() + ":" + curMin + ":" + curSec);
            let sellingBoi = await sell(page2,1);
            console.log(`Sold: ${sellingBoi}`);
          }
          switchTab(page);
        }

      }

      //   clearInterval(botInterval);

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

async function percentDiff(valInitial, valFinal){
  return (100 * ((valFinal - valInitial)/ valInitial));
}

async function buy(oldPage, multiplier, tradingViewPrice){
  if(multiplier <= 1){
    const page = oldPage;
    const thisAmount = wallet * multiplier;

    console.log("Trying to buy: " + thisAmount);
    //click on "buy tab"
    await page.waitForTimeout(2000);
    const [button] = await page.$x("/html/body/div[1]/main/div[3]/div/div/div/div/div/div/div/div[2]/div/div[1]/div[2]/form/div[1]/header/div/div[1]/div/div[1]/div/h3/span/div");
    if (button) { 
      await button.click();
    }
    await page.waitForTimeout(2000);
    await page.click('._2SOJcom0wr47t2LX78YQjj');//q9sjVKdRjdz3ZNAJdN0uj text box with price
    await page.keyboard.type(thisAmount.toString());
    await page.waitForSelector('.css-1o0fjrg');
    await page.click('.css-1o0fjrg'); //review order

    const [robbinHood_price] = await page.$x('/html/body/div[1]/main/div[3]/div/div/div/div/div/div/div/div[1]/section[1]/header/div[1]/h1/span/span');
    const robbinHoodPrice_Value = await page.evaluate(name => name.innerText, robbinHood_price);
    let robbinHoodPrice_Value_Float = parseFloat(robbinHoodPrice_Value.substring(1,3) + robbinHoodPrice_Value.substring(4));
    console.log("Robinhood's price: " + robbinHoodPrice_Value_Float);
    let difference = await percentDiff(tradingViewPrice, robbinHoodPrice_Value_Float);
    console.log(difference);
    
    if(difference >= 0.1){
      await page.reload({ waitUntil: ["networkidle0", "domcontentloaded"] }); //reload page
      return false;
    }
  
    await page.click('.css-1o0fjrg'); //buy
    await page.waitForTimeout(3000);
    await page.click('.css-1o0fjrg'); //done
    await page.waitForTimeout(1000);
    await page.click('.css-1o0fjrg');
    await page.waitForTimeout(500);
    // await page.keyboard.type(r_pass);//verify
    // await page.waitForTimeout(500);
    // await page.keyboard.press('Enter');
    await page.reload({ waitUntil: ["networkidle0", "domcontentloaded"] }); //reload page
    wallet -= thisAmount; //subtract how much was bought
    return true;
    console.log("End of buy function.");
  }
  await page.reload({ waitUntil: ["networkidle0", "domcontentloaded"] }); //reload page
  return false;
  
}

async function sell(oldPage, percentage){
  const page = oldPage;
  if(percentage <= 1){
    const multiplier = percentage;
    await page.waitForTimeout(1000);
    //click on "sell tab"
    await page.waitForTimeout(500);
    const [button] = await page.$x("/html/body/div[1]/main/div[3]/div/div/div/div/div/div/div/div[2]/div/div[1]/div[2]/form/div[1]/header/div/div[1]/div/div[2]/div/h3/span/div/span");
    if (button) { 
      await button.click();
    }
    //grab amount available to sell
    const [amount] = await page.$x('/html/body/div[1]/main/div[3]/div/div/div/div/div/div/div/div[2]/div/div[1]/div[2]/form/div[1]/footer');
    const amountAvailable_Str = await page.evaluate(name => name.innerText, amount);
    let amountAvailable = parseFloat(amountAvailable_Str.substring(1));
    if(amountAvailable < 200){ //in case there's an error
      amountAvailable *= multiplier;
      console.log("selling: " + amountAvailable);
      await page.click('._2SOJcom0wr47t2LX78YQjj');//_2SOJcom0wr47t2LX78YQjj text box 
      await page.keyboard.type(amountAvailable.toString());
      await page.waitForSelector('.css-1o0fjrg');
      await page.click('.css-1o0fjrg'); //review order
      await page.waitForSelector('.css-1o0fjrg');
      await page.click('.css-1o0fjrg'); //sell
      await page.waitForSelector('.css-1o0fjrg');
      await page.click('.css-1o0fjrg');
      await page.waitForTimeout(2000);
      wallet += Math.floor(amountAvailable*100) * 0.01; // sets new wallet value
      console.log("Wallet amount: " + wallet);
      await page.waitForTimeout(2000);
      await page.click('.css-1o0fjrg'); //done
      await page.waitForTimeout(1000);
      await page.click('.css-1o0fjrg');
      await page.waitForTimeout(500);
      console.log("End of sell function.");
      await page.reload({ waitUntil: ["networkidle0", "domcontentloaded"] }); //reload page
      return true;
    }
    return false;
  }
  await page.reload({ waitUntil: ["networkidle0", "domcontentloaded"] }); //reload page
  return false;
  // await page.keyboard.type(r_pass);//verify
  // await page.waitForTimeout(500);
  // await page.keyboard.press('Enter');
}

scrape();


/**
 * 100 buy 
 * 1x atr 50% off the table
 * 1.5 atr 50%
 * 2x atr 100%
 * 
 * 101(went up 1%) reached 1x price target
 * var temp += 50.5 
 * 
 * 51 (went up 1%) reached 1.5x price target
 * var temp += 25.5;
 * 
 * 25 2x atr (-1.5%) never reached 2x, trigger hard sell
 * var temp += 25
 * 
 * final calculation:
 * 50.5 + 25.5 + 25 = 105.5
 * 
 * original buy price of 100
 * profitsandlosses += (105.5 - 100) / 100;
 */

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

// const [walletValue] = await page.$x('/html/body/div[1]/main/div[3]/div/div/div/div/div/div/div/div[2]/div/div[1]/div[2]/div/div/div[2]/div[2]/div[2]/span');
// const value = await page.evaluate(el => el.innerText, walletValue);
// console.log(`Sold: ${value}`);
// wallet += parseFloat(value.substring(1)); // sets new wallet value