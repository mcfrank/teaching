var studentInitialAlpha = 1;
var studentInitialBeta = 1;
var studentModelPrior = Beta({a: studentInitialAlpha, b: studentInitialBeta});

var teacher = function(target, students) {
  return Infer({method: 'enumerate'}, function() {
    var example = repeat(5, flip);
    
    //var utility = learnerDist(studentInitialAlpha, studentInitialBeta, [example]);
    //var utility2 = learnerDist(3, 1, [example]);
    
    var utilities = map2(function(priorAlpha, priorBeta){
      return learnerDist(priorAlpha, priorBeta, example);
    }, students.priorAlphas, students.priorBetas);
    
    var scores = map(function(currUtility){
      return currUtility.score(target);
    }, utilities)
    
    factor(sum(scores));
    
    return sum(example);
  });
};

var addTrues = function(total, test){
  return test ? total + 1 : total;
}

//Recursive function to generate a sequence of student priorAlphas and priorBetas
var generateSequence = function(numStudents, min, max){
  if(numStudents == 1){
    return [Math.floor(Math.random()*(max-min)) + min];
  }
  else{
    return [Math.floor(Math.random()*(max-min)) + min].concat(generateSequence(numStudents-1, min, max));
  }
  
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
  
  var numTrues = reduce(addTrues, 0, example);
  
  var postAlpha = priorAlpha + numTrues //Number of trues
  
  var postBeta = priorBeta + example.length - numTrues //Number of falses
  
  return Beta({a: postAlpha, b: postBeta})
}
//learner([true, true, true, true, true, true, true, true, true, true, true, true, true])

var students = generateStudents(10);
viz(students.priorAlphas)
viz(students.priorBetas)
var inference = teacher(0.3, students);
viz(inference)