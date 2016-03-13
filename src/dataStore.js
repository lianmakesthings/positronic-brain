var when = require('when');
var nodeCouchDB = require("node-couchdb");
var couch = new nodeCouchDB("192.168.99.100", 5984);
var dbName = "positronic-couch";

module.exports = {
    save: function (dataPoint) {
        if (dataPoint._id) {
            couch.update(dbName, dataPoint, function (err, resData) {
                if (err) { return console.error(err); }
            });
            return;
        }

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
                    });
                } else {
                    var doc = resData.data.rows[0].value;
                    dataPoint._id = doc._id;
                    dataPoint._rev = doc._rev;

                    couch.update(dbName, dataPoint, function (err, resData) {
                        if (err)
                            return console.error(err);
                    });
                }
            });
        }
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
    }
};
