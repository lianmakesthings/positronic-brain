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
                    var homeMV = when.defer();
                    var awayMV = when.defer();
                    if (!match.home.market_value) {
                        dataStore.getLastCompletedMatchForTeam(match.home.transfermarkt_id).then(function (last_match) {
                            var mv;
                            if (match.home.transfermarkt_id === last_match.home.transfermarkt_id) {mv=last_match.home.market_value;};
                            if (match.home.transfermarkt_id === last_match.away.transfermarkt_id) {mv=last_match.away.market_value;};
                            homeMV.resolve(mv);
                        });
                    } else {
                        homeMV.resolve(match.home.market_value);
                    }
                    if (!match.away.market_value) {
                        dataStore.getLastCompletedMatchForTeam(match.away.transfermarkt_id).then(function (last_match) {
                            var mv;
                            if (match.away.transfermarkt_id === last_match.home.transfermarkt_id) {mv=last_match.home.market_value;};
                            if (match.away.transfermarkt_id === last_match.away.transfermarkt_id) {mv=last_match.away.market_value;};
                            awayMV.resolve(mv);
                        });
                    } else {
                        awayMV.resolve(match.away.market_value);
                    }

                    var homePosition = when.defer();
                    var awayPosition = when.defer();
                    if (!match.home.position) {
                        dataStore.getLastPositionForTeam(match.home.transfermarkt_id).then(function (last_position) {
                            homePosition.resolve(last_position);
                        });
                    } else {
                        homePosition.resolve(match.home.position);
                    }
                    if (!match.away.position) {
                        dataStore.getLastPositionForTeam(match.away.transfermarkt_id).then(function (last_position) {
                            awayPosition.resolve(last_position);
                        });
                    } else {
                        awayPosition.resolve(match.away.position);
                    }

                    when.all([homeMV.promise, awayMV.promise, homePosition.promise, awayPosition.promise]).then(function (values) {
                        match.home.market_value = values[0];
                        match.away.market_value = values[1];
                        match.home.position = values[2];
                        match.away.position = values[3];
                        next(null, match);
                    });
                }, function (err, missingScores) {
                    console.log('Training neural network...');
                    store.getAllDataSetsShuffled().then(function (dataSets) {
                        var threshold = Math.round(dataSets.length / 3 * 2);
                        var trainingSet = dataSets.splice(0, threshold);
                        var crossValidationSet = dataSets;
                        var network = new Architect.Perceptron(dataSets[0].input.length, 6, 6, 3);
                        var trainer = new Trainer(network);
                        trainer.train(trainingSet, {
                            rate: .0003,
                            iterations: 100000,
                            schedule: {
                                every: 10000,
                                do: function (data) {
                                    var errors = 0;
                                    crossValidationSet.forEach(function (dataPoint) {
                                        var expectedKey = dataPoint.output.indexOf(Math.max.apply(this,dataPoint.output));
                                        var prediction = network.activate(dataPoint.input);
                                        var actualKey = prediction.indexOf(Math.max.apply(this, prediction));
                                        if (expectedKey != actualKey) {
                                            errors++;
                                        }
                                    });

                                    var errorRate = errors / crossValidationSet.length;
                                    console.log('iteration: ' + data.iterations + ' errorRate: ' + errorRate);
                                }
                            }
                        });
                        missingScores.forEach(function (match) {
                            var activations = [
                                parseInt(match.matchday, 10),
                                parseFloat(match.home.market_value.replace(',', '.'), 10),
                                parseFloat(match.away.market_value.replace(',', '.'), 10),
                                parseInt(match.home.position, 10),
                                parseInt(match.away.position, 10)
                            ];
                            console.log(match.home.name +' - '+ match.away.name, activations, network.activate(activations));
                        });
                    });
                });
            });
        });
    });
});