var costPerTeacher = 5;

var admin = function(target, budget, students) {
  return Infer({method: 'enumerate'}, function(){
    // Draw a random number of teachers within the budget to simulate a school
    var numTeachers = uniformDraw(_.range(1,Math.floor(budget/costPerTeacher)));

    // Sort students by their prior beliefs' distributional means
    var sortedStudents = sortStudents(students);

    // Array of student distributed into subsets representing numTeachers classrooms
    var distributedStudents = distributeStudents(sortedStudents, numTeachers);

    return numTeachers
  })

}


// Helper function to sort students by prior distribution mean
var sortStudents = function(students) {

  var betaMeanFn = function(x){return x.priorAlpha / (x.priorAlpha + x.priorBeta + 0.0)};
  
  var sortedStudents = sortOn(students, betaMeanFn)
  
  return sortedStudents;
}

// Helper function to distribute students into N classrooms
var distributeStudents = function(students, N){
  if (N < 2) { return [students]; };

  var len = students.length;
  
  if (len % N === 0) {
    var size = Math.floor(len / N);
    return [students.slice(0, size)].concat(distributeStudents(students.slice(size), N-1))
  }

  else {
    var size = Math.ceil(len / N);
    return [students.slice(0, size)].concat(distributeStudents(students.slice(size), N-1))
  }

  // Non functional-programming approach
  // var len = students.length,
    // out = [],
    // i = 0,
    // size;


  // if (len % n === 0) {
  //   size = Math.floor(len / N);
  //   while (i < len) {
  //     out.push(students.slice(i, i += size));
  //   }
  // }

  // else {
  //   while (i < len) {x
  //     size = Math.ceil((len - i) / N--);
  //     out.push(students.slice(i, i += size));
  //   }
  // }

  //return out;
}

var teacher = function(target, students) {
  return Infer({method: 'enumerate'}, function() {
    var example = repeat(7, flip);
    
    //var utility = learnerDist(studentInitialAlpha, studentInitialBeta, [example]);
    //var utility2 = learnerDist(3, 1, [example]);
    
    var learnerPosteriors = map2(function(priorAlpha, priorBeta){
      return learnerDist(priorAlpha, priorBeta, example);
    }, students.priorAlphas, students.priorBetas);
    
    
    map(function(learnerPost){ observe(learnerPost, target) }, 
       learnerPosteriors)
    
    // observe(Dist, val) === factor(Dist.score(val))
    // condition(x === y) === factor( x === y ? 0 : -Infinity)
    
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
  return repeat(numStudents, function(){uniformDraw(_.range(1,10))})
  
  //*****
  //Non-functional programming approach
  //*****
  //
  //for(var i = 0; i < numStudents; i++){
  //  ground[priorAlphas][i] = Math.floor(Math.random() * 10) + 1 //Generate random int between 1 and 10 inclusive
  //}
}

//Wrapper function to return an array of objects, each that represent a student and contains priorAlpha and priorBeta properties
var generateStudentsArray = function(numStudents){
  var priorAlphas = generateSequence(numStudents, 1, 10);
  var priorBetas = generateSequence(numStudents, 1, 10);
  
  // Calculate the beliefs as a function of 
  var students = map2(function(priorAlpha, priorBeta){
    return {priorAlpha: priorAlpha, priorBeta: priorBeta}
  }, priorAlphas, priorBetas)

   return students; 
}

//Wrapper function to return a dictionary of arrays representing prior alphas and prior betas
var generateStudents = function(numStudents){
   return {priorAlphas: generateSequence(numStudents, 1, 10), priorBetas: generateSequence(numStudents, 1, 10)}; 
}

var generateStudents = function(numStudents){
  var priorAlphas = generateSequence(numStudents, 1, 10);
  var priorBetas = generateSequence(numStudents, 1, 10);
  
  // Calculate the beliefs as a function of 
  var students = map2(function(priorAlpha, priorBeta){
    return {priorAlpha: priorAlpha, priorBeta: priorBeta}
  }, priorAlphas, priorBetas)
  
   return {priorAlphas: generateSequence(numStudents, 1, 10), priorBetas: generateSequence(numStudents, 1, 10)}; 
}




//Returns student posterior distribution
var learnerDist = function(priorAlpha, priorBeta, example){
  
  var numTrues = sum(example)//reduce(addTrues, 0, example);
  
  var postAlpha = priorAlpha + numTrues //Number of trues
  
  var postBeta = priorBeta + example.length - numTrues //Number of falses
  
  return Beta({a: postAlpha, b: postBeta})
}

// var learnerDist = function(...){
//   return Infer({method: "rejection", samples:1000}, function(){
//     var coinWeight = beta(priorAlpha, priorBeta)
//     observe(Binomial({n:example.length, p : coinWeight}), numTrues)
//     return coinWeight
//      })
// }
//learner([true, true, true, true, true, true, true, true, true, true, true, true, true])

//var students = generateStudents(10);
//viz(students.priorAlphas)
//viz(students.priorBetas)
//var inference = teacher(0.3, students);
//viz(inference)

var studentsArray = generateStudentsArray(7);
var sortedStudents = sortStudents(studentsArray);

print(sortedStudents)

// Array of student distributed into subsets representing numTeachers classrooms
var distributedStudents = distributeStudents(sortedStudents, 3);
distributedStudents