var Client = require('coinbase').Client;
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

const cheerio = require('cheerio');
const request = require('request');

request('https://www.google.com', (error, response, html) => {
  if (!error && response.statusCode == 200) {
    //console.log(html);
    const $ = cheerio.load(html);

    const test = $('.MV3Tnb');
    console.log(test);
  }
});