var studentInitialAlpha = .5
var studentInitialBeta = .5
var studentCurrAlpha
var studentCurrBeta
var studentModelPrior = Beta(a: studentInitialAlpha, b: studentInitialBeta)
var trueBias = .7

var teacher = function(studentBelief, depth) {
  return Infer({method: 'enumerate'}, function() {
    var side = sample(studentModelPrior)
    condition(flip(sample(learner(side, depth))) == side)
    return side
  })
}

var learner = function(side, depth) {
  return Infer({method: 'enumerate'}, function(){
    if (depth == 0){
      studentCurrAlpha = studentInitialAlpha
      studentCurrBeta = studentInitialBeta
    }
    var distIfShownHeads = (alpha + 1) / (alpha + beta + 1)
    var distIfShownTails = alpha / (alpha + beta + 1)
    var coin = flip(.5) ? distIfShownHeads : distIfShownTails //Distribution about possible beliefs about the coin
        
    condition(depth == 0 ?
             side == sample(coin) :
             side == sample(teacher(alpha, beta, depth-1)))
    return coin
  })
}

viz.auto(learner('heads', 3))