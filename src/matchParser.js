var request = require('request');
var async = require('async');
var format = require('util').format;
var cheerio = require('cheerio');
var when = require('when');
var store = require('./dataStore');
var cartesianProduct = require('./helpers').cartesianProduct;

var linkTemplate = 'http://www.transfermarkt.de/1-bundesliga/spieltagtabelle/wettbewerb/L1?saison_id=%s&spieltag=%s';

module.exports = {
    run : function() {
        console.log('Getting matches...');
        var deferred = when.defer();

        var dates = [];

        var seasons = ['2015'];
        var matchdays = [
//            '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13', '14', '15', '16', '17',
//            '18', '19', '20', '21', '22', '23', '24', '25', '26', '27', '28', '29', '30', '31', '32', '33', '34'
'28'
        ];

        dates.push.apply(dates, cartesianProduct([seasons, matchdays]));

        async.mapLimit(dates, 5, function (date, next) {
            var season = date[0];
            var matchday = date[1];
            var url = format(linkTemplate, season, matchday);

            request(url, function (err, response, body) {
                if (err) throw err;
                var $ = cheerio.load(body);
                var promises = $('tbody').eq(1).find('tr').filter(function() {
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
                    var dataPoint = {
                        date: date,
                        matchday: matchday,
                        home: {
                            transfermarkt_id: idHome,
                            name: nameHome
                        },
                        away : {
                            transfermarkt_id: idAway,
                            name: nameAway
                        }
                    };
                    if ('-' !== scoreHome) dataPoint.home.score = scoreHome;
                    if ('-' !== scoreAway) dataPoint.away.score = scoreAway;

                    return store.save(dataPoint)
                });
                when.all(promises).then(function () {
                    next(null);
                });
            });
        }, function (err) {
            if (err) throw err;
            console.log('Finished getting matches!');
            deferred.resolve();
        });
        return deferred.promise;
    }
};
