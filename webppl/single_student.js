var studentInitialAlpha = 1;
var studentInitialBeta = 1;
var studentModelPrior = Beta({a: studentInitialAlpha, b: studentInitialBeta});

var learner = function(observations) {
  return Infer({method: 'MCMC', samples: 1000, kernel: 'HMC'}, function() {
    var coin_weight = sample(studentModelPrior);
    var coin = Bernoulli({p: coin_weight});    
    condition(_.isEqual(observations, 
                        repeat(observations.length, function() {sample(coin)})));
    return coin_weight
  })
}

learner([true, true, true, true, true, true, true, true, true, true, true, true, true])