var studentInitialAlpha = 1;
var studentInitialBeta = 1;
var studentModelPrior = Beta({a: studentInitialAlpha, b: studentInitialBeta});

var students = null; //generateStudents

var teacher = function(target) {
  return Infer({method: 'enumerate'}, function() {
    var example = flip(0.5);
    
    var utility = learnerDist(studentInitialAlpha, studentInitialBeta, [example]);
    var utility2 = learnerDist(3, 1, [example]);
    
    factor(utility.score(target) + utility2.score(target));
    
    return example;
  });
};

var addTrues = function(total, test){
  return test ? total + 1 : total;
}

//Returns student posterior distribution
var learnerDist = function(priorAlpha, priorBeta, example){
  
  var numTrues = reduce(addTrues, 0, example);
  
  var postAlpha = priorAlpha + numTrues //Number of trues
  
  var postBeta = priorBeta + example.length - numTrues //Number of falses
  
  return Beta({a: postAlpha, b: postBeta})
}
//learner([true, true, true, true, true, true, true, true, true, true, true, true, true])

var inference = teacher(0.9);
viz(inference)