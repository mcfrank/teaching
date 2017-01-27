var teacher = function(target, students) {
  return Infer({method: 'enumerate'}, function() {
    var example = repeat(7, flip);
    
    //Closed form
    var learnerPosteriors = map2(function(priorAlpha, priorBeta){
      return learnerDist(priorAlpha, priorBeta, example);
    }, students.priorAlphas, students.priorBetas);
    
    
    //Stochastic form
    //map(function(learnerPost){ observe(learnerPost, target) }, learnerPosteriors)
    
    // observe(Dist, val) === factor(Dist.score(val))
    // condition(x === y) === factor( x === y ? 0 : -Infinity)
    
    var scores = map(function(currUtility){
      return currUtility.score(target);
    }, learnerPosteriors)
    
    factor(sum(scores));
    
    return sum(example);
  });
};

var addTrues = function(total, test){
  return test ? total + 1 : total;
}

//Recursive function to generate a sequence of student priorAlphas and priorBetas
var generateSequence = function(numStudents, min, max){
  return repeat(numStudents, function(){uniformDraw(_.range(1,10))})
  
  //*****
  //Non-functional programming approach
  //*****
  //
  //for(var i = 0; i < numStudents; i++){
  //  ground[priorAlphas][i] = Math.floor(Math.random() * 10) + 1 //Generate random int between 1 and 10 inclusive
  //}
}

//Wrapper function to return concatenated generated prior alphas and betas of students
var generateStudents = function(numStudents){
   return {priorAlphas: generateSequence(numStudents, 1, 10), priorBetas: generateSequence(numStudents, 1, 10)}; 
}

//Returns student posterior distribution
var learnerDist = function(priorAlpha, priorBeta, example){
  
  var numTrues = sum(example)//reduce(addTrues, 0, example);
  
  var postAlpha = priorAlpha + numTrues //Number of trues
  
  var postBeta = priorBeta + example.length - numTrues //Number of falses
  
  return Beta({a: postAlpha, b: postBeta})
}

var students = generateStudents(10);
viz(students.priorAlphas)
viz(students.priorBetas)
var inference = teacher(0.3, students);
viz(inference)