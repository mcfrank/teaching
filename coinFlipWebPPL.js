var studentInitialAlpha = 1;
var studentInitialBeta = 1;
var studentModelPrior = Beta({a: studentInitialAlpha, b: studentInitialBeta});

var teacher = function(studentBelief, depth) {
  return Infer({method: 'enumerate'}, function() {
    var side = sample(studentModelPrior)
    condition(flip(sample(learner(side, depth))) == side)
    return side
  })
}

var learner = function(side) {
  return Infer({method: 'rejection'}, function() {
    var coin_weight = sample(studentModelPrior);
    var coin = Bernoulli({p: coin_weight});    
    condition(side == sample(coin));
    return coin
  })
}

viz.auto(learner('heads'))