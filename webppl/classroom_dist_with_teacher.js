var studentInitialAlpha = 1;
var studentInitialBeta = 1;
var studentModelPrior = Beta({a: studentInitialAlpha, b: studentInitialBeta});

var teacher = function(target, students) {
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

//Recursive function to generate a sequence of student priorAlphas and priorBetas
var generateSequence = function(numStudents){
  if(numStudents == 1){
    return [Math.floor(Math.random()*10) + 1];
  }
  else{
    return [Math.floor(Math.random()*10) + 1].concat(generateSequence(numStudents-1));
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
   return {priorAlphas: generateSequence(numStudents), priorBetas: generateSequence(numStudents)}; 
}




//Returns student posterior distribution
var learnerDist = function(priorAlpha, priorBeta, example){
  
  var numTrues = reduce(addTrues, 0, example);
  
  var postAlpha = priorAlpha + numTrues //Number of trues
  
  var postBeta = priorBeta + example.length - numTrues //Number of falses
  
  return Beta({a: postAlpha, b: postBeta})
}
//learner([true, true, true, true, true, true, true, true, true, true, true, true, true])

var students = generateStudents(1000);
viz(students.priorAlphas)
viz(students.priorBetas)
//var inference = teacher(0.9);
//viz(inference)