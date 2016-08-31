var historicMatch = {
  'input' : [43.2, 54.2]
  'output' : [1, 0, 0]
};
var futureMatch = {
  'input' : [32.42, 634.4]
}
var trainingSet = [historicMatch];
var toBePredicted = [futureMatch];

var network = new Architect.Perceptron(historicMatch.input.length, 6, 6, 3);
var trainer = new Trainer(network);

trainer.train(trainingSet, {
  rate : .0003,
  iterations: 100000,
});

toBePredicted.forEach(function(match) {
  var activations = match.input;
  console.log(activations, network.activate(activations));
})
