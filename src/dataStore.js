var when = require('when');
var nodeCouchDB = require("node-couchdb");
var couch = new nodeCouchDB("192.168.99.100", 5984);
var dbName = "positronic-couch";

var mergeDataPoints = function (savedData, newData) {
    var dataPoint = savedData;

    for (var property in newData) {
        if (newData[property] instanceof Object) {
            newData[property] = mergeDataPoints(savedData[property], newData[property]);
        }

        dataPoint[property] = newData[property];
    }

    return dataPoint;
};

module.exports = {
    save: function (dataPoint) {
        var deferred = when.defer();

        if (dataPoint.home && dataPoint.away) {
            var viewUrl = "_design/list/_view/match_by_date_and_teams";
            var queryOptions = {
                key: [dataPoint.date, dataPoint.home.transfermarkt_id, dataPoint.away.transfermarkt_id]
            };

            couch.get(dbName, viewUrl, queryOptions, function (err, resData) {
                if (err) { return console.error(err); }

                if (0 === resData.data.rows.length) {
                    couch.insert(dbName, dataPoint, function (err, resData) {
                        if (err) { return console.error(err); }
                        deferred.resolve();
                    });
                } else {
                    var doc = resData.data.rows[0].value;
                    dataPoint = mergeDataPoints(doc, dataPoint);

                    couch.update(dbName, dataPoint, function (err, resData) {
                        if (err) { return console.error(err); }
                        deferred.resolve();
                    });
                }
            });
        }
        return deferred.promise;
    },

    getMissingMarketValues: function () {
        var viewUrl = "_design/list/_view/matches_missing_market_values";
        var deferred = when.defer();

        couch.get(dbName, viewUrl, function (err, resData) {
            if (err) { deferred.reject(console.error(err)); }

             deferred.resolve(resData.data.rows.map(function (item) {
                return item.value;
            }));
        });

        return deferred.promise;
    },

    getAllDataSets: function () {
        var viewUrl = "_design/list/_view/match_data";
        var deferred = when.defer();

        couch.get(dbName, viewUrl, function (err, resData) {
            if (err) { deferred.reject(console.error(err)); }

            deferred.resolve(resData.data.rows.map(function (item) {
                return item.value;
            }));
        });

        return deferred.promise;
    },

    getMissingScores: function () {
        var viewUrl = "_design/list/_view/matches_missing_scores";
        var deferred = when.defer();

        couch.get(dbName, viewUrl, function (err, resData) {
            if (err) { deferred.reject(console.error(err)); }

            deferred.resolve(resData.data.rows.map(function (item) {
                return item.value;
            }));
        });

        return deferred.promise;
    },

    getMissingTeamData: function () {
        var viewUrl = "_design/list/_view/matches_missing_team_data";
        var deferred = when.defer();

        couch.get(dbName, viewUrl, function (err, resData) {
            if (err) { deferred.reject(console.error(err)); }

            deferred.resolve(resData.data.rows.map(function (item) {
                return item.value;
            }));
        });

        return deferred.promise;
    }
};
