var when = require('when');
var nodeCouchDB = require("node-couchdb");
var couchConfig = require("../data/couchConfig.js");
var couch = new nodeCouchDB(couchConfig.host, couchConfig.port);
var dbName = "positronic-couch";

var pad = function(n, width, z) {
    z = z || '0';
    n = n + '';
    return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
};

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

function shuffle(a) {
    var j, x, i;
    for (i = a.length; i; i -= 1) {
        j = Math.floor(Math.random() * i);
        x = a[i - 1];
        a[i - 1] = a[j];
        a[j] = x;
    }

    return a;
}

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

    getLastCompletedMatchForTeam: function (teamId) {
        var deferred = when.defer();
        var viewUrl = "_design/list/_view/match_by_team_and_date";
        var d = new Date();
        var date = d.getFullYear()+'-'+pad(d.getMonth()+1, 2)+'-'+pad(d.getDate(), 2);
        var queryOptions = {
            startkey: [teamId, date],
            descending: true,
            limit: 1
        };

        couch.get(dbName, viewUrl, queryOptions, function (err, resData) {
            if (err) { return deferred.reject(err); }

            deferred.resolve(resData.data.rows[0].value);
        });

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

    getLastPositionForTeam: function (teamId) {
        var deferred = when.defer();
        var viewUrl = "_design/list/_view/position_by_team_and_date";
        var queryOptions = {
            startkey: [teamId, "9999-01-01"],
            descending: true,
            limit: 1
        };

        couch.get(dbName, viewUrl, queryOptions, function (err, resData) {
            if (err) { return deferred.reject(err); }

            deferred.resolve(resData.data.rows[0].value);
        });

        return deferred.promise;
    },

    getAllDataSets: function () {
        var viewUrl = "_design/list/_view/match_data";
        var deferred = when.defer();

        couch.get(dbName, viewUrl, function (err, resData) {
            if (err) { console.error(err);deferred.reject(err); }

            deferred.resolve(resData.data.rows.map(function (item) {
                return item.value;
            }));
        });

        return deferred.promise;
    },

    getAllDataSetsShuffled: function () {
        var deferred = when.defer();
        this.getAllDataSets().then(function (dataSets) {
            deferred.resolve(shuffle(dataSets));
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
