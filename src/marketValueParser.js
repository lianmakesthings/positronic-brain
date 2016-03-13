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

module.exports = {
    run : function() {
        var deferred = when.defer();
        store.getMissingMarketValues().then(function (data) {
            async.mapLimit(data, 50, function (dataPoint, next) {
                var date = formatDate(dataPoint.date);
                var url = format(linkTemplate, date);

                request(url, function (err, response, body) {
                    if (err) throw err;
                    var $ = cheerio.load(body);

                    var getMarketValueFor = function (id) {
                        return $('#yw1 tbody tr a[id='+id+']').eq(2).text();
                    };

                    dataPoint.home.market_value = getMarketValueFor(dataPoint.home.transfermarkt_id);
                    dataPoint.away.market_value = getMarketValueFor(dataPoint.away.transfermarkt_id);

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
