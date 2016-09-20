var historicMatch = {
  'input' : [43.2, 54.2]
  'output' : [1, 0, 0]
};
var futureMatch = {
  'input' : [32.42, 634.4]
}
var network = new Architect.Perceptron(historicMatch.input.length, 6, 6, 3);
var trainer = new Trainer(network);

var trainingSet = [historicMatch];
var toBePredicted = [futureMatch];

var threshold = Math.round(trainingSet.length / 3 * 2);
var trainingSet = trainingSet.splice(0, threshold);
var crossValidationSet = dataSets;

trainer.train(trainingSet, {
  rate: .0003,
  iterations: 100000,
  schedule: {
    every: 10000,
    do: function(data) {
      var errors = 0;
      crossValidationSet.forEach(function(dataPoint) {
        var expected = classifyFromProbability(dataPoint.output);
        var prediction = network.activate(dataPoint.input);
        var predicted = classifyFromProbability(prediction);

        if (expected != predicted) errors++ ;
      });
      var errorRate = errors / crossValidationSet.length;
      console.log('iteration: ' + data.iterations, ' errorRate: ' + errorRate);
    }
  }
});
