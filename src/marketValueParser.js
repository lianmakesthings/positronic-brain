var request = require('request');
var async = require('async');
var format = require('util').format;
var cheerio = require('cheerio');
var when = require('when');
var store = require('./dataStore');

var linkTemplate = 'http://www.transfermarkt.de/1-bundesliga/marktwerteverein/wettbewerb/L1/plus/?stichtag=%s';

var formatDate = function (date) {
    var parts = date.split('-');
    parts[2] = Math.min(1, Math.floor(parts[2] / 15)) * 14 + 1;
    parts[2] = parts[2] === 1 ? '01' : parts[2];
    date = parts.join('-');
    return date;
};

var getMarketValueFor = function (el) {
    return el.eq(2).text();
};



module.exports = {
    run : function() {
        var deferred = when.defer();
        store.getMissingMarketValues().then(function (data) {
            async.mapLimit(data, 3, function (dataPoint, next) {
                var date = formatDate(dataPoint.date);
                var url = format(linkTemplate, date);
	            var config = {
	            	url: url,
	            	headers: {
	            		'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/49.0.2623.110 Safari/537.36'
		            }
		        }

	            request(config, function (err, response, body) {
                    if (err) throw err;
                    var $ = cheerio.load(body);

                    var selector = '#yw1 tbody tr a[id=%d]';

                    var valueHome = getMarketValueFor($(format(selector, dataPoint.home.transfermarkt_id)));
                    var valueAway = getMarketValueFor($(format(selector, dataPoint.away.transfermarkt_id)));

                    if ('-' !== valueHome) {
                        dataPoint.home.market_value = valueHome;
                    };
                    if ('-' !== valueAway) {
                        dataPoint.away.market_value = valueAway;
                    };

                    store.save(dataPoint).then(function () {
                        next(null);
                    });
                });
            }, function (err) {
                if (err) throw err;
                console.log('Finished getting market values!');
                deferred.resolve();
            });
        });
        return deferred.promise;
    }
};
