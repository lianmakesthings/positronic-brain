var marketValueParser = require('./marketValueParser');
var matchParser = require('./getMatches');
var synaptic = require('synaptic');
var Trainer = synaptic.Trainer;
var Architect = synaptic.Architect;
var store = require('./dataStore');

//marketValueParser.run();
//matchParser.run();

var network = new Architect.Perceptron(2,3,3);
var trainer = new Trainer(network);

store.getAllDataSets().then(function (dataSets) {
    trainer.train(dataSets, {
        rate: .0003,
        schedule: {
            every: 1000,
            do: function (data) {
                store.getMissingScores().then(function(matches) {
                    matches.forEach(function (match) {
                        console.log(match.home.name, match.away.name, network.activate([
                            parseFloat(match.home.market_value.replace(',','.'), 10),
                            parseFloat(match.away.market_value.replace(',','.'), 10)
                        ]));
                    });
                    console.log("error", data.error, "iterations", data.iterations, "rate", data.rate);
                });
            }
        }
    })
});
