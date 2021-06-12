var Client = require('coinbase').Client;
const puppeteer = require('puppeteer');

var client = new Client({
                          'apiKey': 'API KEY',
                          'apiSecret': 'API SECRET',
                          strictSSL: false
                        });

client.getSpotPrice({'currencyPair': 'BTC-USD'}, function(err, data) {
  console.log(data);
});



// var test = a => a + 100 + 100; 
// var test2 = a => {
//   return(a+100+100);
// };
// console.log(test2(15));
// console.log(test(10));

const scrape = async() => {
  try{
    const browser = await puppeteer.launch({headless:true});
    const page =await browser.newPage();
    await page.goto('https://www.google.com/');
    await page.screenshot({path:'1.png'});
    
  }catch(error){
    console.error(error)
  }
  
}

scrape();