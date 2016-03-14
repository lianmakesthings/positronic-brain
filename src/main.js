var async = require('async');
var synaptic = require('synaptic');
var Trainer = synaptic.Trainer;
var Architect = synaptic.Architect;
var store = require('./dataStore');
var marketValueParser = require('./marketValueParser');
var matchParser = require('./matchParser');
var teamDataParser = require('./teamDataParser');
var dataStore = require('./dataStore');
var when = require('when');

matchParser.run().then(function () {
    teamDataParser.run().then(function () {
        marketValueParser.run().then(function () {
            store.getMissingScores().then(function (matches) {
                async.mapLimit(matches, 9, function (match, next) {
                    var home = when.defer();
                    var away = when.defer();
                    if (!match.home.market_value) {
                        dataStore.getLastCompletedMatchForTeam(match.home.transfermarkt_id).then(function (last_match) {
                            home.resolve(last_match.home.market_value);
                        });
                    } else {
                        home.resolve(match.home.market_value);
                    }
                    if (!match.away.market_value) {
                        dataStore.getLastCompletedMatchForTeam(match.away.transfermarkt_id).then(function (last_match) {
                            away.resolve(last_match.away.market_value);
                        });
                    } else {
                        away.resolve(match.away.market_value);
                    }

                    when.all([home.promise, away.promise]).then(function (mvs) {
                        match.home.market_value = mvs[0];
                        match.away.market_value = mvs[1];
                        next(null, match);
                    })
                }, function (err, missingScores) {
                    console.log('Training neural network...');
                    var network = new Architect.Perceptron(2, 3, 3);
                    var trainer = new Trainer(network);
                    store.getAllDataSets().then(function (dataSets) {
                        trainer.train(dataSets, {
                            rate: .0003,
                            iterations: 100000,
                            schedule: {
                                every: 10000,
                                do: function (data) {
                                    missingScores.forEach(function (match) {
                                        console.log(match.home.name, match.away.name, network.activate([
                                            parseFloat(match.home.market_value.replace(',', '.'), 10),
                                            parseFloat(match.away.market_value.replace(',', '.'), 10),
                                            parseInt(match.home.position),
                                            parseInt(match.away.position)
                                        ]));
                                    });
                                    console.log("error", data.error, "iterations", data.iterations, "rate", data.rate);
                                }
                            }
                        })
                    })
                });
            });
        })
    })
});

