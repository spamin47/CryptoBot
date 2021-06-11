var Client = require('coinbase').Client;
var client = new Client({
                          'apiKey': 'API KEY',
                          'apiSecret': 'API SECRET',
                          strictSSL: false
                        });

client.getSpotPrice({'currencyPair': 'BTC-USD'}, function(err, data) {
  console.log(data);
});