var request = require('request');
var async = require('async');
var format = require('util').format;
var cheerio = require('cheerio');
var store = require('./dataStore');

var linkTemplate = 'http://www.transfermarkt.de/1-bundesliga/marktwerteverein/wettbewerb/L1/plus/?stichtag=%s';

function cartesianProduct(a) { // a = array of array
    var i, j, l, m, a1, o = [];
    if (!a || a.length == 0) return a;

    a1 = a.splice(0,1);
    a = cartesianProduct(a);
    for (i = 0, l = a1[0].length; i < l; i++) {
        if (a && a.length) for (j = 0, m = a.length; j < m; j++)
            o.push([a1[0][i]].concat(a[j]));
        else
            o.push([a1[0][i]]);
    }
    return o;
}

module.exports = {
    run : function() {
        var dates = [];

        var years = ['2014'];
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
