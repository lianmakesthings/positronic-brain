var request = require('request');
var async = require('async');
var format = require('util').format;
var cheerio = require('cheerio');
var when = require('when');
var store = require('./dataStore');

var linkTemplate = 'http://www.transfermarkt.de/aktuell/waspassiertheute/aktuell/new/datum/%s';

module.exports = {
    run : function() {
        var deferred = when.defer();
        store.getMissingTeamData().then(function (data) {
            async.mapLimit(data, 5, function (dataPoint, next) {
                var url = format(linkTemplate, dataPoint.date);

                request(url, function (err, response, body) {
                    if (err) throw err;
                    var $ = cheerio.load(body);

                    var getPositionFor = function (id) {
                        return /\d+/.exec($('tbody tr a[id='+id+']').prev().text()) || /\d+/.exec($('tbody tr a[id='+id+']').next().text()) || [1]
                    };

                    dataPoint.home.position = getPositionFor(dataPoint.home.transfermarkt_id)[0];
                    dataPoint.away.position = getPositionFor(dataPoint.away.transfermarkt_id)[0];

                    store.save(dataPoint).then(function () {
                        next(null);
                    });
                });
            }, function (err) {
                if (err) throw err;
                console.log('Finished getting team data!');
                deferred.resolve();
            });
        });
        return deferred.promise;
    }
};
