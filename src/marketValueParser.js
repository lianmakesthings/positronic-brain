var request = require('request');
var async = require('async');
var format = require('util').format;
var cheerio = require('cheerio');
var store = require('./dataStore');
var cartesianProduct = require('./helpers').cartesianProduct;

var linkTemplate = 'http://www.transfermarkt.de/1-bundesliga/marktwerteverein/wettbewerb/L1/plus/?stichtag=%s';


module.exports = {
    run : function() {
        var dates = [];

        var years = ['2013'];
        var months = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
        var days = ['01', '15'];

        dates.push.apply(dates, cartesianProduct([years, months, days]));
        dates = dates.map(function(el) {
            return el.join('-');
        });

        async.map(dates, function (date, next) {
            var url = format(linkTemplate, date);
            request(url, function (err, response, body) {
                if (err) throw err;
                var $ = cheerio.load(body);
                $('#yw1 tbody tr').each(function() {
                    var el = $(this).find('td').eq(4).find('a');
                    var dataPoint = {
                        date: date,
                        team: el.attr('title'),
                        marketValue: parseFloat(el.text().replace(',', '.'), 10),
                        league: 1
                    };
                    store.save(dataPoint);
                });
                next(null);
            });
        }, function (err) {
            if (err) throw err;
        });
    }
};
