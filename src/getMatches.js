var request = require('request');
var async = require('async');
var format = require('util').format;
var cheerio = require('cheerio');
var store = require('./dataStore');
var cartesianProduct = require('./helpers').cartesianProduct;

var linkTemplate = 'http://www.transfermarkt.de/1-bundesliga/spieltagtabelle/wettbewerb/L1?saison_id=%s&spieltag=%s';

module.exports = {
    run : function() {
        var dates = [];

        var seasons = ['2015'];
        var matchdays = ['26']//, '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];

        dates.push.apply(dates, cartesianProduct([seasons, matchdays]));

        async.map(dates, function (date, next) {
            var url = format(linkTemplate, date[0], date[1]);
            request(url, function (err, response, body) {
                if (err) throw err;
                var $ = cheerio.load(body);
                $('tbody').eq(1).find('tr').filter(function() {
                    return !$(this).attr('class');
                }).map(function(el, i, matches) {
                    var date = $(this).find('td').eq(0).find('a').map(function() {
                        return $(this).attr('href').split('/').pop();
                    }).get()[0];
                    var idHome = $(this).find('td').eq(4).find('a').attr('id');
                    var nameHome = $(this).find('td').eq(4).find('a').text().trim();
                    var idAway = $(this).find('td').eq(9).find('a').attr('id');
                    var nameAway = $(this).find('td').eq(9).find('a').text().trim();
                    var scoreHome = $(this).find('td').eq(6).find('a').text().trim().split(':')[0];
                    var scoreAway = $(this).find('td').eq(6).find('a').text().trim().split(':')[1];
                    var data = {
                        date: date,
                        home: idHome,
                        home_name: nameHome,
                        away: idAway,
                        away_name: nameAway,
                        type: 'match'
                    };
                    if ('-' !== scoreHome) data.home_score = scoreHome;
                    if ('-' !== scoreAway) data.away_score = scoreAway;

                    store.saveMatch(data);
                });
                next(null);
            });
        }, function (err) {
            if (err) throw err;
        });
    }
};
